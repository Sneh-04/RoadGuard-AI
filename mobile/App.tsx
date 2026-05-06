import { useEffect, useRef, useState } from "react";
import { Text, View, Vibration, ToastAndroid } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";

export default function App() {
  const ws = useRef<WebSocket | null>(null);
  const buffer = useRef<number[][]>([]);
  const [connected, setConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const WS_URL = "wss://roadguard-ai-3.onrender.com/ws/live";

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log("Connected to backend");
        setConnected(true);
      };

      ws.current.onmessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        console.log("Result:", data);

        if (data.type === "hazard_alert" && data.hazard_detected) {
          const hazardType = data.hazard_type;
          setLastAlert(`${hazardType} (${new Date().toLocaleTimeString()})`);

          let alertMessage = "";
          if (hazardType === "pothole") {
            alertMessage = "⚠️ Pothole detected!";
          } else if (hazardType === "speed_bump") {
            alertMessage = "🚧 Speed bump ahead";
          } else if (hazardType === "rough_road") {
            alertMessage = "⚠️ Rough road";
          } else {
            alertMessage = `⚠️ ${hazardType} detected!`;
          }

          // Vibrate for 500ms
          Vibration.vibrate(500);

          // Show toast notification
          ToastAndroid.show(alertMessage, ToastAndroid.SHORT);
        } else if (data.type === "status") {
          console.log("Status:", data.message);
        }
      };

      ws.current.onerror = () => {
        console.log("WS failed, continuing offline");
        setConnected(true);
      };

      ws.current.onclose = () => {
        console.log("WS closed");
        setConnected(true);
        console.log("WebSocket disconnected. Reconnecting in 3 seconds...");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), 3000);
      };

      setTimeout(() => {
        setConnected(true);
      }, 3000);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnected(true);
    }
  };

  // 🔌 Connect WebSocket
  useEffect(() => {
    console.log("App mounted: connecting WebSocket...");
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // 📍 Get Location
  const getLocation = async () => {
    try {
      let loc = await Location.getCurrentPositionAsync({});
      return loc.coords;
    } catch (error) {
      console.warn("Unable to get current location", error);
      return { latitude: null, longitude: null, speed: 0 };
    }
  };

  // 🔐 Request Permissions
  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  // 📡 Accelerometer + Buffer
  useEffect(() => {
    Accelerometer.setUpdateInterval(200);

    const sub = Accelerometer.addListener(async ({ x, y, z }) => {
      buffer.current.push([x, y, z]);

      if (buffer.current.length === 100) {
        const location = await getLocation();

        if (!location?.latitude || !location?.longitude) {
          console.warn("Skipping sensor send because location is unavailable", location);
        } else if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
          console.log("WebSocket is not open, skipping sensor send", ws.current?.readyState);
        } else {
          console.log("Sending sensor packet", {
            sensorCount: buffer.current.length,
            speed: location.speed || 0,
          });
          ws.current.send(
            JSON.stringify({
              sensor: buffer.current,
              location: {
                lat: location.latitude,
                lng: location.longitude,
              },
              speed: location.speed || 0,
              mode: "sensor",
            })
          );
        }

        buffer.current = [];
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>🚗 RoadGuard Mobile</Text>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        {connected ? "Live Detection Active" : "Connecting..."}
      </Text>
      {lastAlert && (
        <View style={{
          backgroundColor: '#ffebee',
          padding: 15,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#f44336',
          marginTop: 20,
          width: '100%'
        }}>
          <Text style={{ fontSize: 16, color: '#d32f2f', textAlign: 'center' }}>
            ⚠️ Last Alert: {lastAlert}
          </Text>
        </View>
      )}
    </View>
  );
}
