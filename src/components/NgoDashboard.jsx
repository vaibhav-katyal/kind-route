import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  Truck,
  X,
} from "lucide-react";
import { categories } from "../data";
import Brand from "./Brand";
import Badge from "./Badge";
import PickupMap from "./PickupMap";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Explore donations", icon: Search },
  { name: "Reserved pickups", icon: Truck },
  { name: "Collection history", icon: CheckCheck },
];

const pageCopy = {
  Overview: [
    "Your collection desk.",
    "Find useful donations. Keep every collection moving.",
  ],
  "Explore donations": [
    "Find what your community can use.",
    "Browse available items and reserve a pickup.",
  ],
  "Reserved pickups": [
    "Reserved. Ready for the next step.",
    "Coordinate and track your organisation’s collections.",
  ],
  "Collection history": [
    "Collected, confirmed, recorded.",
    "A clear record of your organisation’s completed deliveries.",
  ],
};

export default function NgoDashboard({
  profile,
  donations,
  onHome,
  onAccount,
  onSettings,
  onDetails,
  onTrack,
  onRelease,
}) {
  const [view, setView] = useState("Overview");
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const available = donations.filter((item) => item.status === "Available");
  const reserved = donations.filter(
    (item) => item.status === "Pickup scheduled" && item.ngo === profile.name,
  );
  const collected = donations.filter(
    (item) => item.status === "Delivered" && item.ngo === profile.name,
  );
  const source =
    view === "Reserved pickups"
      ? reserved
      : view === "Collection history"
        ? collected
        : available;
  const filtered = source.filter(
    (item) =>
      (category === "All items" || item.category === category) &&
      `${item.title} ${item.location} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const nextPickup = reserved[0];

  function navigate(nextView) {
    setView(nextView);
    setCategory("All items");
    setQuery("");
    setMenuOpen(false);
  }

  return (
    <div className="ngo-workspace">
      {menuOpen && (
        <button
          className="ngo-menu-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`ngo-sidebar ${menuOpen ? "is-open" : ""}`}>
        <button
          className="ngo-brand"
          onClick={onHome}
          aria-label="Back to KindRoute home"
        >
          <Brand />
        </button>
        <div className="ngo-organisation">
          <span className="ngo-org-symbol">
            <Package size={23} />
          </span>
          <div>
            <strong>{profile.name}</strong>
            <span>NGO workspace</span>
          </div>
        </div>
        <p className="ngo-nav-label">COLLECTIONS</p>
        <nav aria-label="NGO workspace navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`ngo-nav-item ${view === name ? "is-active" : ""}`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Reserved pickups" && reserved.length > 0 && (
                <small>{reserved.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="ngo-sidebar-bottom">
          <div className="ngo-sidebar-note">
            <Truck size={23} />
            <strong>One place for your pickups.</strong>
            <p>Reserve, coordinate, and confirm every collection.</p>
          </div>
          <button className="ngo-nav-item" onClick={onSettings}>
            <Settings size={18} />
            Organisation settings
          </button>
          <button className="ngo-account" onClick={onAccount}>
            <span className="avatar">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <strong>{profile.name}</strong>
              <small>Switch workspace</small>
            </span>
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>

      <div className="ngo-main">
        <header className="ngo-topbar">
          <div>
            <button
              className="ngo-mobile-menu"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span>NGO workspace</span>
            <span className="ngo-topbar-divider">/</span>
            <strong>{view}</strong>
          </div>
          <button onClick={onSettings}>
            <MapPin size={15} />
            {profile.location}
            <ChevronDown size={14} />
          </button>
        </header>
        <main className="ngo-content">
          <div className="ngo-page-heading">
            <div>
              <p className="ngo-eyebrow">RESOURCE COLLECTION & COORDINATION</p>
              <h1>{pageCopy[view][0]}</h1>
              <p>{pageCopy[view][1]}</p>
            </div>
            {view !== "Explore donations" && (
              <button
                className="button-primary"
                onClick={() => navigate("Explore donations")}
              >
                <Search size={17} />
                Find donations
              </button>
            )}
          </div>

          {view === "Overview" && (
            <>
              <section className="ngo-summary" aria-label="Collection summary">
                {[
                  [
                    "Available donations",
                    available.length,
                    "Ready to reserve",
                    Package,
                    "Explore donations",
                  ],
                  [
                    "Reserved pickups",
                    reserved.length,
                    "Awaiting collection",
                    Truck,
                    "Reserved pickups",
                  ],
                  [
                    "Completed collections",
                    collected.length,
                    "Delivery confirmed",
                    CheckCheck,
                    "Collection history",
                  ],
                ].map(([label, value, detail, Icon, destination]) => (
                  <button key={label} onClick={() => navigate(destination)}>
                    <div>
                      <span>{label}</span>
                      <strong>{value}</strong>
                      <small>{detail}</small>
                    </div>
                    <span className="ngo-summary-icon">
                      <Icon size={23} />
                    </span>
                    <ArrowUpRight size={17} className="ngo-summary-arrow" />
                  </button>
                ))}
              </section>
              <div className="ngo-section-title">
                <div>
                  <h2>Collection queue</h2>
                  <p>Your organisation’s next steps, at a glance.</p>
                </div>
                <button onClick={() => navigate("Reserved pickups")}>
                  All reserved pickups <ArrowRight size={15} />
                </button>
              </div>
              <section className="ngo-collection-queue">
                {nextPickup ? (
                  <>
                    <div className="ngo-queue-details">
                      <span className="ngo-eyebrow">
                        <span className="ngo-status-dot" />
                        NEXT COLLECTION
                      </span>
                      <h3>{nextPickup.title}</h3>
                      <p>{nextPickup.quantity}</p>
                      <div className="ngo-detail-line">
                        <MapPin size={16} />
                        {nextPickup.location}
                      </div>
                      <div className="ngo-detail-line">
                        <Clock3 size={16} />
                        {nextPickup.date}
                      </div>
                      <div className="ngo-queue-actions">
                        <button
                          className="button-primary"
                          onClick={() => onTrack(nextPickup)}
                        >
                          Track pickup <ArrowUpRight size={16} />
                        </button>
                        <button
                          className="button-outline"
                          onClick={() => onDetails(nextPickup)}
                        >
                          Pickup details
                        </button>
                      </div>
                      <small>Demo pickup · simulated driver location</small>
                    </div>
                    <div className="ngo-queue-map">
                      <PickupMap coordinates={nextPickup.coordinates} />
                    </div>
                  </>
                ) : (
                  <div className="ngo-queue-empty">
                    <span className="ngo-summary-icon">
                      <Truck size={25} />
                    </span>
                    <div>
                      <h3>Your queue is clear.</h3>
                      <p>
                        Reserve an available donation to organise your next
                        collection.
                      </p>
                    </div>
                    <button
                      className="button-outline"
                      onClick={() => navigate("Explore donations")}
                    >
                      Browse donations <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          <section className="ngo-donations-section">
            <div className="ngo-section-title">
              <div>
                <h2>
                  {view === "Overview" ? "Available to collect" : view}{" "}
                  <span>{source.length}</span>
                </h2>
                {view === "Overview" && (
                  <p>Useful items shared by donors in the community.</p>
                )}
              </div>
              {view === "Overview" && (
                <button onClick={() => navigate("Explore donations")}>
                  See all donations <ArrowRight size={15} />
                </button>
              )}
            </div>
            <div className="ngo-filters">
              <div
                className="ngo-category-tabs"
                role="group"
                aria-label="Donation categories"
              >
                {categories.map((name) => (
                  <button
                    key={name}
                    className={category === name ? "is-active" : ""}
                    aria-pressed={category === name}
                    onClick={() => setCategory(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <label className="ngo-search">
                <Search size={17} />
                <input
                  aria-label="Search donations"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search items or location"
                />
              </label>
            </div>
            <div className="ngo-donation-grid">
              {filtered
                .slice(0, view === "Overview" ? 3 : undefined)
                .map((item) => (
                  <article className="ngo-donation-card" key={item.id}>
                    <button
                      className="ngo-card-photo"
                      onClick={() => onDetails(item)}
                      aria-label={`View ${item.title}`}
                    >
                      <img src={item.image} alt={item.category} />
                      <span>{item.category}</span>
                    </button>
                    <div className="ngo-card-content">
                      <Badge status={item.status} />
                      <h3>{item.title}</h3>
                      <p>{item.quantity}</p>
                      <div className="ngo-detail-line">
                        <MapPin size={15} />
                        {item.location}
                      </div>
                      <div className="ngo-detail-line">
                        <Clock3 size={15} />
                        {item.date}
                      </div>
                      <div className="ngo-card-bottom">
                        <span>
                          {item.owner === "demo-donor"
                            ? "Community donor"
                            : item.owner}
                        </span>
                        <button
                          className="card-action"
                          onClick={() =>
                            item.status === "Pickup scheduled"
                              ? onTrack(item)
                              : onDetails(item)
                          }
                        >
                          {item.status === "Available"
                            ? "Reserve"
                            : item.status === "Delivered"
                              ? "View record"
                              : "Track pickup"}
                          <ArrowUpRight size={15} />
                        </button>
                      </div>
                      {item.status === "Pickup scheduled" && (
                        <button
                          className="ngo-release-button"
                          onClick={() => onRelease(item)}
                        >
                          <X size={13} />
                          Release reservation
                        </button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
            {filtered.length === 0 && (
              <div className="ngo-empty-state">
                <Package size={32} />
                <h3>
                  {query || category !== "All items"
                    ? "No matching donations."
                    : view === "Reserved pickups"
                      ? "No reserved pickups yet."
                      : view === "Collection history"
                        ? "Your first collection starts a record."
                        : "No available donations right now."}
                </h3>
                <p>
                  {query || category !== "All items"
                    ? "Try a different category or search."
                    : "Browse available donations to plan your next collection."}
                </p>
                {query || category !== "All items" ? (
                  <button
                    className="button-outline"
                    onClick={() => {
                      setQuery("");
                      setCategory("All items");
                    }}
                  >
                    Clear filters
                  </button>
                ) : (
                  view !== "Explore donations" && (
                    <button
                      className="button-outline"
                      onClick={() => navigate("Explore donations")}
                    >
                      Explore donations <ArrowRight size={15} />
                    </button>
                  )
                )}
              </div>
            )}
          </section>
          <footer className="ngo-footer">
            <span>KindRoute · NGO collection workspace</span>
            <span>Browser demo · shared local donation data</span>
            <button onClick={onAccount}>
              Switch to donor workspace <ArrowUpRight size={14} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
