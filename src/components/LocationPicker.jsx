import { useEffect, useState } from "react";
import { Check, Loader2, MapPin, Search } from "lucide-react";
import { geocodeLocation, getCurrentLocation } from "../utils/location";

/**
 * Shared location input supporting browser GPS detection and verified manual address entry.
 * Manual entries are validated against Nominatim; if not found, they are replaced with the
 * closest possible matching location rather than accepting arbitrary unverified text.
 */
export default function LocationPicker({
  location,
  onLocationChange,
  onCoordinatesChange,
  detectButtonLabel = "Use current location",
  redetectButtonLabel = "Re-detect current location",
  manualPlaceholder = "Or enter area, city, or address…",
  statusLabel = "Location",
  compact = false,
}) {
  const [manualInput, setManualInput] = useState(location || "");
  const [locating, setLocating] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setManualInput(location || "");
  }, [location]);

  async function handleDetect() {
    setLocating(true);
    setError("");
    setNotice("");
    try {
      const loc = await getCurrentLocation();
      setManualInput(loc.formattedLocation);
      onLocationChange(loc.formattedLocation);
      if (loc.coordinates && onCoordinatesChange) {
        onCoordinatesChange(loc.coordinates);
      }
    } catch (err) {
      setError(err.message || "Failed to detect location.");
    } finally {
      setLocating(false);
    }
  }

  async function verifyAndApplyManual() {
    const trimmed = manualInput.trim();
    if (!trimmed) {
      onLocationChange("");
      setError("");
      setNotice("");
      return;
    }

    // Already matches the verified location
    if (trimmed === location) return;

    setLookingUp(true);
    setError("");
    setNotice("");
    try {
      const loc = await geocodeLocation(trimmed);
      setManualInput(loc.formattedLocation);
      onLocationChange(loc.formattedLocation);
      if (loc.coordinates && onCoordinatesChange) {
        onCoordinatesChange(loc.coordinates);
      }
      if (loc.isClosestMatch || loc.formattedLocation.toLowerCase() !== trimmed.toLowerCase()) {
        setNotice(`Updated to closest matching location: ${loc.formattedLocation}`);
      }
    } catch (err) {
      // Do not allow unverified location to be committed
      onLocationChange("");
      setError(err.message || "Location not found. Please enter a valid location.");
    } finally {
      setLookingUp(false);
    }
  }

  const busy = locating || lookingUp;
  const hasUnverifiedEdits = manualInput.trim() !== "" && manualInput.trim() !== location;

  return (
    <div className={`p-3 rounded-lg border border-line bg-white ${compact ? "space-y-2" : "space-y-2.5"}`}>
      <button
        type="button"
        onClick={handleDetect}
        disabled={busy}
        className={`w-full rounded-md bg-[#eef4ea] hover:bg-[#e2edd9] text-forest border border-[#cadbc1] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 ${
          compact ? "py-2 px-3" : "py-2.5 px-3.5"
        }`}
      >
        {locating ? (
          <>
            <Loader2 size={14} className="animate-spin text-forest" />
            Detecting current location…
          </>
        ) : (
          <>
            <MapPin size={15} className="text-forest" />
            {location ? redetectButtonLabel : detectButtonLabel}
          </>
        )}
      </button>

      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => {
            const val = e.target.value;
            setManualInput(val);
            setError("");
            setNotice("");
            if (!val.trim()) {
              onLocationChange("");
            } else if (val.trim() !== location && location) {
              // Invalidate previously committed location until the new input is verified
              onLocationChange("");
            }
          }}
          onBlur={verifyAndApplyManual}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              verifyAndApplyManual();
            }
          }}
          placeholder={manualPlaceholder}
          className="flex-1 min-w-0 px-2.5 py-2 rounded-md border border-line text-xs text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
        />
        <button
          type="button"
          onClick={verifyAndApplyManual}
          disabled={busy || !manualInput.trim()}
          title="Verify location"
          className="shrink-0 px-2.5 py-2 rounded-md border border-line bg-canvas hover:bg-forest/5 text-ink text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
        >
          {lookingUp ? (
            <Loader2 size={13} className="animate-spin text-forest" />
          ) : (
            <Search size={13} className="text-forest" />
          )}
          <span>Verify</span>
        </button>
      </div>

      {hasUnverifiedEdits && !lookingUp && !error && (
        <p className="text-[11px] text-amber-700">
          Press Enter, click Verify, or leave field to check this location.
        </p>
      )}

      {notice && (
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          {notice}
        </p>
      )}

      {location && (
        <div className="flex items-start gap-2 pt-1 text-xs text-forest bg-forest/5 p-2 rounded border border-forest/15">
          <Check size={14} className="shrink-0 mt-0.5 text-forest" />
          <div className="min-w-0">
            <strong className="block text-ink">{statusLabel}:</strong>
            <span className="text-muted leading-relaxed break-words">{location}</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 pt-0.5">{error}</p>}
    </div>
  );
}
