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
