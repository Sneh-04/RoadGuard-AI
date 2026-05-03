import { useEffect, useRef, useState } from "react";
import { Text, View, Vibration, ToastAndroid } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";

export default function App() {
  const ws = useRef<WebSocket | null>(null);
  const buffer = useRef<number[][]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [lastAlert, setLastAlert] = useState<string | null>(null);

  // 🔌 Connect WebSocket
  useEffect(() => {
    ws.current = new WebSocket("wss://roadguard-ai-3.onrender.com/ws/live");

    ws.current.onopen = () => {
      console.log("Connected to backend");
      setStatus("Connected ✅");
    };

    ws.current.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      console.log("Result:", data);

      if (data.type === "hazard_alert" && data.hazard_detected) {
        const hazardType = data.hazard_type;
        setLastAlert(`${hazardType} (${new Date().toLocaleTimeString()})`);

        // Vibrate for 500ms
        Vibration.vibrate(500);

        // Show toast notification
        ToastAndroid.show(`⚠️ ${hazardType} detected!`, ToastAndroid.SHORT);
      } else if (data.type === "status") {
        console.log("Status:", data.message);
      }
    };

    ws.current.onerror = () => setStatus("Error ❌");

    return () => ws.current.close();
  }, []);

  // 📍 Get Location
  const getLocation = async () => {
    let loc = await Location.getCurrentPositionAsync({});
    return loc.coords;
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

        ws.current.send(
          JSON.stringify({
            sensor: buffer.current,
            location: {
              lat: location.latitude,
              lng: location.longitude,
            },
            speed: location.speed || 0,  // Add speed data
            mode: "sensor",
          })
        );

        buffer.current = [];
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>🚗 RoadGuard Mobile</Text>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>Status: {status}</Text>
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
