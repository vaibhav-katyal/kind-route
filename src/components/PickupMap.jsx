import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper to calculate real distance in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function PickupMap({
  donorCoordinates = [28.627, 77.371],
  ngoCoordinates = [28.635, 77.38],
  donorLocation = "Donor pickup location",
  ngoLocation = "NGO facility",
  donorName = "Donor",
  ngoName = "NGO Partner",
  status = "In transit",
  compact = false,
}) {
  const container = useRef(null);
  const map = useRef(null);

  const donorCoord =
    donorCoordinates && donorCoordinates.length === 2 && !isNaN(donorCoordinates[0])
      ? donorCoordinates
      : [28.627, 77.371];

  const ngoCoord =
    ngoCoordinates && ngoCoordinates.length === 2 && !isNaN(ngoCoordinates[0])
      ? ngoCoordinates
      : [donorCoord[0] + 0.015, donorCoord[1] + 0.012];

  const distanceKm = calculateDistanceKm(
    donorCoord[0],
    donorCoord[1],
    ngoCoord[0],
    ngoCoord[1]
  );

  useEffect(() => {
    if (!container.current) return;

    // Initialize map
    const instance = L.map(container.current, {
      zoomControl: !compact,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    map.current = instance;

    // OpenStreetMap Tiles
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(instance);

    // Custom Div Icons for real locations
    const createCustomIcon = (label, bgClass, symbol) =>
      L.divIcon({
        className: "custom-map-marker",
        html: `
          <div style="
            background: ${bgClass};
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            border: 2px solid white;
            white-space: nowrap;
          ">
            <span>${symbol}</span>
            <span>${label}</span>
          </div>
        `,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      });

    // Donor Marker (Origin)
    L.marker(donorCoord, {
      icon: createCustomIcon("Donor Location", "#214c35", "📍"),
    })
      .addTo(instance)
      .bindPopup(
        `<strong>Donor: ${donorName}</strong><br/>${donorLocation}`
      );

    // NGO Marker (Destination)
    L.marker(ngoCoord, {
      icon: createCustomIcon(ngoName, "#1e3a8a", "🏢"),
    })
      .addTo(instance)
      .bindPopup(
        `<strong>NGO: ${ngoName}</strong><br/>${ngoLocation}`
      );

    // Direct Route Polyline connecting real donor to real NGO
    const routeCoords = [donorCoord, ngoCoord];
    L.polyline(routeCoords, {
      color: "#214c35",
      weight: 4,
      opacity: 0.85,
      dashArray: "8, 8",
    }).addTo(instance);

    // Fit map bounds to show both points with comfort padding
    const bounds = L.latLngBounds(routeCoords);
    instance.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });

    const timer = setTimeout(() => instance.invalidateSize(), 250);

    return () => {
      clearTimeout(timer);
      instance.remove();
    };
  }, [
    donorCoord[0],
    donorCoord[1],
    ngoCoord[0],
    ngoCoord[1],
    compact,
    ngoName,
    donorName,
  ]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span className="flex items-center gap-1.5 font-medium text-ink">
          <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
          Active Route: {donorLocation.split(",")[0]} ➔ {ngoName}
        </span>
        <span className="font-semibold text-forest bg-forest/10 px-2 py-0.5 rounded">
          {distanceKm} km apart
        </span>
      </div>
      <div
        ref={container}
        className={`w-full rounded-xl overflow-hidden border border-line ${
          compact ? "h-48" : "h-72"
        }`}
        aria-label="Real Leaflet route map from donor location to NGO location"
      />
    </div>
  );
}
