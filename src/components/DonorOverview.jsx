import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  Package,
  Truck,
} from "lucide-react";
import Badge from "./Badge";

function AnimatedCount({ value, duration = 1000 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = performance.now();
    const startVal = 0;
    const endVal = value;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      if (ref.current) ref.current.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <span ref={ref}>{value}</span>;
}

export default function DonorOverview({
  donations,
  onViewAll,
  onDetails,
  onTrack,
  onDonate,
}) {
  const active = donations.filter((item) => item.status !== "Delivered");
  const delivered = donations.filter((item) => item.status === "Delivered");
  const pickup = donations.find((item) => item.status === "Pickup scheduled");

  return (
    <div className="donor-overview">
      <section className="donor-summary-line" aria-label="Donation summary">
        <div>
          <span>Donations shared</span>
          <strong><AnimatedCount value={donations.length} /></strong>
        </div>
        <div>
          <span>In progress</span>
          <strong><AnimatedCount value={active.length} duration={700} /></strong>
        </div>
        <div>
          <span>Delivered</span>
          <strong><AnimatedCount value={delivered.length} duration={900} /></strong>
        </div>
      </section>

      {pickup && (
        <section className="donor-pickup-notice" aria-label="Next pickup">
          <span className="donor-pickup-icon">
            <Truck size={22} />
          </span>
          <div>
            <span className="donor-notice-label">NEXT PICKUP</span>
            <h2 style={{ fontSize: "15px", fontWeight: 600, marginTop: "4px", letterSpacing: "-0.2px" }}>
              {pickup.title}
            </h2>
            <p style={{ fontSize: "13px", marginTop: "4px", color: "#6B7A70" }}>
              {pickup.ngo} <span style={{ padding: "0 5px", opacity: 0.5 }}>·</span> {pickup.date}
            </p>
          </div>
          <button className="button-outline" onClick={() => onTrack(pickup)} style={{ marginLeft: "auto", flexShrink: 0 }}>
            Track pickup <ArrowUpRight size={15} />
          </button>
        </section>
      )}

      <section className="donor-activity">
        <div className="donor-activity-heading">
          <h2>Your recent donations</h2>
          {donations.length > 0 && (
            <button onClick={onViewAll}>
              View all <ArrowRight size={14} />
            </button>
          )}
        </div>
        {donations.length > 0 ? (
          <div className="donor-activity-list">
            {donations.slice(0, 5).map((item) => (
              <article className="donor-activity-row" key={item.id}>
                <button
                  className="donor-row-image"
                  onClick={() => onDetails(item)}
                  aria-label={`View ${item.title}`}
                >
                  <img src={item.image} alt={item.category} />
                </button>
                <div className="donor-row-name">
                  <h3>{item.title}</h3>
                  <p>{item.quantity}</p>
                </div>
                <div className="donor-row-status">
                  <Badge status={item.status} />
                </div>
                <button
                  className="donor-row-action"
                  onClick={() =>
                    item.status === "Pickup scheduled"
                      ? onTrack(item)
                      : onDetails(item)
                  }
                >
                  {item.status === "Pickup scheduled" ? "Track" : "Details"}
                  <ArrowUpRight size={13} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="donor-first-donation">
            <HeartHandshake size={36} />
            <h3>A little extra can mean a lot.</h3>
            <p>Your first donation will show up here.</p>
            <button className="button-outline" onClick={onDonate}>
              Share something good <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>

      <p className="donor-overview-footnote">
        <Package size={13} />
        Add an item. An NGO reserves it. You follow the pickup.
      </p>
    </div>
  );
}
