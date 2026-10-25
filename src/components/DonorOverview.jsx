import {
  ArrowRight,
  ArrowUpRight,
  HeartHandshake,
  Package,
  Truck,
} from "lucide-react";
import Badge from "./Badge";

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
          <strong>{donations.length}</strong>
        </div>
        <div>
          <span>In progress</span>
          <strong>{active.length}</strong>
        </div>
        <div>
          <span>Delivered</span>
          <strong>{delivered.length}</strong>
        </div>
      </section>

      {pickup && (
        <section className="donor-pickup-notice" aria-label="Next pickup">
          <span className="donor-pickup-icon">
            <Truck size={23} />
          </span>
          <div>
            <span className="donor-notice-label">NEXT PICKUP</span>
            <h2>{pickup.title}</h2>
            <p>
              {pickup.ngo} <span>·</span> {pickup.date}
            </p>
          </div>
          <button className="button-outline" onClick={() => onTrack(pickup)}>
            Track pickup <ArrowUpRight size={16} />
          </button>
        </section>
      )}

      <section className="donor-activity">
        <div className="donor-activity-heading">
          <h2>Your recent donations</h2>
          {donations.length > 0 && (
            <button onClick={onViewAll}>
              View all <ArrowRight size={15} />
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
                  <ArrowUpRight size={15} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="donor-first-donation">
            <HeartHandshake size={35} />
            <h3>A little extra can mean a lot.</h3>
            <p>Your first donation will show up here.</p>
            <button className="button-outline" onClick={onDonate}>
              Share something good <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>

      <p className="donor-overview-footnote">
        <Package size={14} />
        Add an item. An NGO reserves it. You follow the pickup.
      </p>
    </div>
  );
}
