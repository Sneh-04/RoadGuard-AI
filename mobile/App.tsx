import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";

export default function App() {
  const ws = useRef(null);
  const buffer = useRef([]);
  const [status, setStatus] = useState("Connecting...");
  const [lastAlert, setLastAlert] = useState(null);

  // 🔌 Connect WebSocket
  useEffect(() => {
    ws.current = new WebSocket("ws://YOUR-IP:8000/ws/live");

    ws.current.onopen = () => {
      console.log("Connected to backend");
      setStatus("Connected ✅");
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("Result:", data);

      if (data.hazard_detected) {
        setLastAlert(data.hazard_type);
        alert(`⚠️ ${data.hazard_type} detected!`);
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
            mode: "sensor",
          })
        );

        buffer.current = [];
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>🚗 RoadGuard Mobile</Text>
      <Text>Status: {status}</Text>
      {lastAlert && <Text>⚠️ Last Alert: {lastAlert}</Text>}
    </View>
  );
}
