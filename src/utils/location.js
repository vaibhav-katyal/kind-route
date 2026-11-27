/**
 * KindRoute Location Utility
 * Uses HTML5 Geolocation API and OpenStreetMap Nominatim for accurate reverse geocoding.
 */
export async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser."));
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocoding via OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};

            // Pick the most specific & clean local components
            const area =
              address.suburb ||
              address.neighbourhood ||
              address.residential ||
              address.road ||
              address.subdistrict;

            const city =
              address.city ||
              address.town ||
              address.city_district ||
              address.county ||
              address.state_district;

            const state = address.state;

            const parts = [area, city, state].filter(Boolean);
            const formatted =
              parts.length > 0
                ? parts.join(", ")
                : data.display_name?.split(",").slice(0, 3).join(",") ||
                  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            return resolve({
              formattedLocation: formatted,
              coordinates: [latitude, longitude],
              raw: data,
            });
          }
        } catch (fetchErr) {
          console.warn("Reverse geocode request failed:", fetchErr);
        }

        // Fallback with coordinates if Nominatim API is blocked or offline
        resolve({
          formattedLocation: `Location [${latitude.toFixed(3)}, ${longitude.toFixed(3)}]`,
          coordinates: [latitude, longitude],
        });
      },
      (error) => {
        let msg = "Unable to fetch location.";
        if (error.code === 1) {
          msg = "Location permission was denied. Please allow location access in your browser.";
        } else if (error.code === 2) {
          msg = "Location unavailable. Please check your network/GPS connection.";
        } else if (error.code === 3) {
          msg = "Location request timed out. Please try again.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  });
}

function formatNominatimResult(best, fallbackText) {
  const lat = parseFloat(best.lat);
  const lon = parseFloat(best.lon);
  const address = best.address || {};
  const area =
    address.suburb ||
    address.neighbourhood ||
    address.residential ||
    address.road ||
    address.subdistrict;
  const city =
    address.city ||
    address.town ||
    address.city_district ||
    address.county ||
    address.state_district;
  const state = address.state;
  const parts = [area, city, state].filter(Boolean);
  const formatted =
    parts.length > 0
      ? parts.join(", ")
      : best.display_name?.split(",").slice(0, 3).join(",") || fallbackText;

  return {
    formattedLocation: formatted,
    coordinates: [lat, lon],
    raw: best,
  };
}

async function queryNominatim(q) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`,
    {
      headers: {
        "Accept-Language": "en",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Location lookup service is currently unavailable.");
  }
  const results = await response.json();
  return Array.isArray(results) && results.length > 0 ? results[0] : null;
}

/**
 * Forward geocoding for manually entered location strings via OpenStreetMap Nominatim.
 * Verifies the location exists; if not, falls back to the closest possible matching location.
 */
export async function geocodeLocation(query) {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    throw new Error("Please enter a location to look up.");
  }

  // 1. Try exact query first
  const exact = await queryNominatim(trimmed);
  if (exact) {
    return {
      ...formatNominatimResult(exact, trimmed),
      isClosestMatch: false,
    };
  }

  // 2. Build candidate fallback queries (broader segments / cleaned terms) for closest possible match
  const candidates = [];
  const commaParts = trimmed
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (let i = 1; i < commaParts.length; i++) {
    candidates.push(commaParts.slice(i).join(", "));
  }
  for (const part of commaParts) {
    if (part.length >= 3) candidates.push(part);
  }

  const words = trimmed
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  for (let i = 1; i < words.length; i++) {
    candidates.push(words.slice(i).join(" "));
  }
  for (let i = words.length - 1; i >= 1; i--) {
    candidates.push(words.slice(0, i).join(" "));
  }
  for (const word of words) {
    candidates.push(word);
  }

  const seen = new Set([trimmed.toLowerCase()]);
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const match = await queryNominatim(candidate);
    if (match) {
      return {
        ...formatNominatimResult(match, candidate),
        isClosestMatch: true,
      };
    }
  }

  throw new Error("No matching location found. Please enter a valid city, area, or address.");
}
