import { useEffect, useState } from "react";
import MapView from "../components/MapView";

export default function MapPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch((err) => console.error("Failed to fetch events:", err));
  }, []);

  return <MapView events={events} />;
}
