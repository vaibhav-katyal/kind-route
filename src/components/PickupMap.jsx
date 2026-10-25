import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function PickupMap({
  progress = 0,
  coordinates = [28.627, 77.371],
  compact = false,
}) {
  const container = useRef(null);
  const map = useRef(null);
  const driver = useRef(null);
  const start = [coordinates[0] - 0.014, coordinates[1] - 0.022];
  const route = [
    start,
    [coordinates[0] - 0.014, coordinates[1] - 0.009],
    [coordinates[0] - 0.004, coordinates[1] - 0.009],
    [coordinates[0] - 0.004, coordinates[1]],
    coordinates,
  ];
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, {
      zoomControl: !compact,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView(coordinates, 13);
    map.current = instance;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(instance);
    L.polyline(route, {
      color: "#30724f",
      weight: 5,
      opacity: 0.8,
      dashArray: "7 7",
      lineJoin: "round",
    }).addTo(instance);
    const pin = (html, className) =>
      L.divIcon({ html, className, iconSize: [32, 32], iconAnchor: [16, 16] });
    L.marker(coordinates, { icon: pin("♥", "map-pin destination-pin") })
      .addTo(instance)
      .bindPopup("Donation pickup location");
    driver.current = L.marker(start, { icon: pin("➜", "map-pin driver-pin") })
      .addTo(instance)
      .bindPopup("Arjun · Collection volunteer");
    instance.fitBounds(L.latLngBounds(route), { padding: [35, 35] });
    const timer = setTimeout(() => instance.invalidateSize(), 200);
    return () => {
      clearTimeout(timer);
      instance.remove();
    };
  }, [coordinates[0], coordinates[1], compact]);
  useEffect(() => {
    const position = Math.min(progress, 0.999) * (route.length - 1);
    const index = Math.floor(position);
    const fraction = position - index;
    const from = route[index];
    const to = route[Math.min(index + 1, route.length - 1)];
    driver.current?.setLatLng([
      from[0] + (to[0] - from[0]) * fraction,
      from[1] + (to[1] - from[1]) * fraction,
    ]);
  }, [progress]);
  return (
    <div
      ref={container}
      className={`map-container ${compact ? "h-44" : "h-72"}`}
      aria-label="Interactive OpenStreetMap showing the donation pickup route"
    />
  );
}
