import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  ChevronDown,
  Clock3,
  HeartHandshake,
  LayoutDashboard,
  Loader2,
  MapPin,
  Menu,
  MessageSquareQuote,
  Package,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import { categories } from "../data";
import Brand from "./Brand";
import Badge from "./Badge";
import PickupMap from "./PickupMap";
import LocationPicker from "./LocationPicker";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Explore donations", icon: Search },
  { name: "Requested & Approved", icon: Truck },
  { name: "Collection history", icon: CheckCheck },
  { name: "Our requirements", icon: HeartHandshake },
];

const pageCopy = {
  Overview: [
    "Your collection desk.",
    "Find useful donations. Keep every collection moving.",
  ],
  "Explore donations": [
    "Find what your community can use.",
    "Browse available community donations and request items your non-profit needs.",
  ],
  "Requested & Approved": [
    "Requested & Approved Collections",
    "Coordinate collections, confirm deliveries, and track live routes to your centre.",
  ],
  "Collection history": [
    "Collected, confirmed, recorded.",
    "A clear record of your organisation’s completed deliveries and sent appreciation notes.",
  ],
  "Our requirements": [
    "Community Requirements",
    "Requirements posted by your organisation. Visible to community donors to fulfill directly.",
  ],
};

export default function NgoDashboard({
  profile,
  donations,
  needs = [],
  onHome,
  onAccount,
  onSettings,
  onDetails,
  onTrack,
  onRequestDonation,
  onStartDelivery,
  onAcknowledge,
  onCreateNeed,
  onDeleteNeed,
}) {
  const [view, setView] = useState("Overview");
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Modal states for NGO actions
  const [activeModal, setActiveModal] = useState(null); // 'request', 'acknowledge', 'post-need', 'track'
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [thanksNote, setThanksNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Need posting state
  const [needTitle, setNeedTitle] = useState("");
  const [needCategory, setNeedCategory] = useState("Food");
  const [needAmount, setNeedAmount] = useState("");
  const [needDetail, setNeedDetail] = useState("");
  const [needLocation, setNeedLocation] = useState(profile.location || "");
  const [needCoordinates, setNeedCoordinates] = useState([28.627, 77.371]);

  // Categorize donations
  const available = donations.filter(
    (item) => item.status === "Available" || (item.status === "Requested" && item.ngo !== profile.name)
  );

  const requestedByUs = donations.filter(
    (item) =>
      item.requests?.some(
        (r) => r.ngoName?.toLowerCase() === profile.name?.toLowerCase() && r.status === "pending"
      ) && item.status !== "Approved" && item.status !== "In transit" && item.status !== "Delivered"
  );

  const approvedForUs = donations.filter(
    (item) =>
      (item.status === "Approved" ||
        item.status === "Pickup scheduled" ||
        item.status === "In transit") &&
      item.ngo?.toLowerCase() === profile.name?.toLowerCase()
  );

  const collected = donations.filter(
    (item) => item.status === "Delivered" && item.ngo?.toLowerCase() === profile.name?.toLowerCase()
  );

  const ourNeeds = needs.filter(
    (n) => n.name?.toLowerCase() === profile.name?.toLowerCase()
  );

  const source =
    view === "Requested & Approved"
      ? [...approvedForUs, ...requestedByUs]
      : view === "Collection history"
        ? collected
        : view === "Our requirements"
          ? ourNeeds
          : available;

  const filtered = source.filter((item) => {
    if (view === "Our requirements") {
      return (
        (category === "All items" || item.category === category) &&
        `${item.title} ${item.detail} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    }
    return (
      (category === "All items" || item.category === category) &&
      `${item.title} ${item.location} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });

  const nextPickup = approvedForUs[0];

  function navigate(nextView) {
    setView(nextView);
    setCategory("All items");
    setQuery("");
    setMenuOpen(false);
  }

  // Handle Request Submission
  const handleOpenRequest = (item) => {
    setSelectedDonation(item);
    setRequestMessage(
      `Hello! We would love to collect these ${item.quantity} for beneficiaries in our local centre.`
    );
    setActiveModal("request");
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedDonation || !requestMessage.trim()) return;
    setSubmitting(true);
    try {
      if (onRequestDonation) {
        await onRequestDonation(selectedDonation, requestMessage.trim());
      }
      setActiveModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Acknowledge & Thanks Note Submission
  const handleOpenAcknowledge = (item) => {
    setSelectedDonation(item);
    setThanksNote(
      `Thank you so much for your generosity! Your donation has reached our community centre and will directly support families in need.`
    );
    setActiveModal("acknowledge");
  };

  const handleSubmitAcknowledge = async (e) => {
    e.preventDefault();
    if (!selectedDonation || !thanksNote.trim()) return;
    setSubmitting(true);
    try {
      if (onAcknowledge) {
        await onAcknowledge(selectedDonation, thanksNote.trim());
      }
      setActiveModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Post Need Submission
  const handlePostNeed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onCreateNeed) {
        await onCreateNeed({
          title: needTitle.trim(),
          category: needCategory,
          amount: needAmount.trim(),
          detail: needDetail.trim(),
          location: needLocation.trim() || profile.location,
          coordinates: needCoordinates,
        });
      }
      setNeedTitle("");
      setNeedAmount("");
      setNeedDetail("");
      setActiveModal(null);
      navigate("Our requirements");
    } finally {
      setSubmitting(false);
    }
  };

  const hasRequested = (item) => {
    return item.requests?.some(
      (r) => r.ngoName?.toLowerCase() === profile.name?.toLowerCase()
    );
  };

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

        <p className="ngo-nav-label">COLLECTIONS & NEEDS</p>
        <nav aria-label="NGO workspace navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`ngo-nav-item ${view === name ? "is-active" : ""}`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Requested & Approved" && (approvedForUs.length > 0 || requestedByUs.length > 0) && (
                <small>{approvedForUs.length + requestedByUs.length}</small>
              )}
              {name === "Our requirements" && ourNeeds.length > 0 && (
                <small>{ourNeeds.length}</small>
              )}
            </button>
          ))}
        </nav>

        <div className="ngo-sidebar-bottom">
          <button
            className="w-full py-2.5 px-3 mb-4 rounded-lg bg-forest hover:bg-[#204a33] text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            onClick={() => setActiveModal("post-need")}
          >
            <Plus size={15} />
            Post a Requirement
          </button>

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
              <small>{profile.location ? profile.location.split(",")[0] : "NGO Partner"}</small>
            </span>
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
          <div className="flex items-center gap-3">
            <button
              className="button-primary text-xs py-2 px-3.5 cursor-pointer flex items-center gap-1.5"
              onClick={() => setActiveModal("post-need")}
            >
              <Plus size={15} />
              Post a Need
            </button>
            <button onClick={onSettings} className="cursor-pointer flex items-center gap-1.5 text-muted hover:text-ink">
              <MapPin size={15} className="text-forest" />
              <span>{profile.location ? profile.location.split(",")[0] : "Set location"}</span>
            </button>
          </div>
        </header>

        <main className="ngo-content">
          {/* PAGE HEADING FOR VIEWS OTHER THAN OVERVIEW */}
          {view !== "Overview" && (
            <div className="ngo-page-heading">
              <div>
                <span className="ngo-eyebrow">
                  <span className="ngo-status-dot" />
                  NGO COLLECTION WORKSPACE
                </span>
                <h1>{pageCopy[view][0]}</h1>
                <p>{pageCopy[view][1]}</p>
              </div>
              {view === "Our requirements" && (
                <button
                  className="button-primary cursor-pointer flex items-center gap-1.5"
                  onClick={() => setActiveModal("post-need")}
                >
                  <Plus size={16} /> Post Requirement
                </button>
              )}
            </div>
          )}

          {/* VIEW 1: OVERVIEW */}
          {view === "Overview" && (
            <>
              {/* TOP SUMMARY STATS CARDS */}
              <section className="ngo-summary">
                {[
                  [
                    "Available donations",
                    available.length,
                    "Ready to request",
                    Package,
                    "Explore donations",
                  ],
                  [
                    "Approved & In Transit",
                    approvedForUs.length,
                    "Coordinated collections",
                    Truck,
                    "Requested & Approved",
                  ],
                  [
                    "Completed collections",
                    collected.length,
                    "Delivered & acknowledged",
                    CheckCheck,
                    "Collection history",
                  ],
                ].map(([label, value, detail, Icon, destination]) => (
                  <button key={label} onClick={() => navigate(destination)} className="cursor-pointer">
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

              {/* ACTIVE COLLECTION ROUTE SECTION */}
              <div className="ngo-section-title">
                <div>
                  <h2>Active collection route</h2>
                  <p>Your approved pickup route from donor to your organisation.</p>
                </div>
                <button onClick={() => navigate("Requested & Approved")} className="cursor-pointer">
                  View all collections <ArrowRight size={15} />
                </button>
              </div>

              <section className="ngo-collection-queue">
                {nextPickup ? (
                  <>
                    <div className="ngo-queue-details">
                      <span className="ngo-eyebrow">
                        <span className="ngo-status-dot" />
                        {nextPickup.status === "In transit" ? "DELIVERY IN TRANSIT" : "APPROVED BY DONOR"}
                      </span>
                      <h3>{nextPickup.title}</h3>
                      <p>{nextPickup.quantity} · Shared by <strong>{nextPickup.owner}</strong></p>
                      <div className="ngo-detail-line">
                        <MapPin size={16} />
                        From: {nextPickup.location}
                      </div>
                      <div className="ngo-detail-line">
                        <Clock3 size={16} />
                        {nextPickup.date}
                      </div>
                      <div className="ngo-queue-actions">
                        {nextPickup.status === "In transit" && (
                          <button
                            className="button-primary cursor-pointer"
                            onClick={() => handleOpenAcknowledge(nextPickup)}
                          >
                            <CheckCheck size={16} />
                            Confirm Received & Note
                          </button>
                        )}
                        <button
                          className="button-outline cursor-pointer"
                          onClick={() => onDetails(nextPickup)}
                        >
                          View details
                        </button>
                      </div>
                    </div>
                    <div className="ngo-queue-map">
                      <PickupMap
                        donorCoordinates={nextPickup.coordinates || [28.6139, 77.209]}
                        ngoCoordinates={profile.coordinates || [28.632, 77.218]}
                        donorLocation={nextPickup.location}
                        ngoLocation={profile.location}
                        donorName={nextPickup.owner}
                        ngoName={profile.name}
                        compact
                      />
                    </div>
                  </>
                ) : (
                  <div className="ngo-queue-empty">
                    <span className="ngo-summary-icon">
                      <Truck size={25} />
                    </span>
                    <div>
                      <h3>No collections currently scheduled.</h3>
                      <p>
                        Browse community donations and request items your non-profit needs.
                      </p>
                    </div>
                    <button
                      className="button-outline cursor-pointer"
                      onClick={() => navigate("Explore donations")}
                    >
                      Browse available donations <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {/* VIEW: OUR REQUIREMENTS */}
          {view === "Our requirements" ? (
            <section className="ngo-donations-section">
              <div className="ngo-section-title">
                <div>
                  <h2>Requirements posted by your NGO <span>{ourNeeds.length}</span></h2>
                  <p>Visible to donors across the community to fulfill.</p>
                </div>
              </div>

              {ourNeeds.length > 0 ? (
                <div className="ngo-need-grid">
                  {ourNeeds.map((need) => (
                    <article key={need._id || need.title} className="ngo-need-card">
                      <div className="ngo-need-header">
                        <span className="ngo-need-category">
                          {need.category}
                        </span>
                        <span className="ngo-need-amount">{need.amount}</span>
                      </div>
                      <h3>{need.title}</h3>
                      <p>{need.detail}</p>
                      <div className="ngo-need-footer">
                        <span className="ngo-need-location">
                          <MapPin size={13} className="text-forest" />
                          {need.location}
                        </span>
                        {onDeleteNeed && (
                          <button
                            onClick={() => onDeleteNeed(need._id)}
                            className="ngo-need-delete"
                            title="Remove requirement"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="ngo-empty-state">
                  <HeartHandshake size={34} />
                  <h3>No requirements posted yet</h3>
                  <p>Tell the community what essential goods your organisation needs right now.</p>
                  <button
                    className="button-primary cursor-pointer"
                    onClick={() => setActiveModal("post-need")}
                  >
                    <Plus size={15} /> Post a Requirement
                  </button>
                </div>
              )}
            </section>
          ) : (
            /* VIEW: DONATIONS LIST (Overview Preview, Explore, Requested & Approved, History) */
            <section className="ngo-donations-section">
              <div className="ngo-section-title">
                <div>
                  <h2>
                    {view === "Overview" ? "Available to request" : view}{" "}
                    <span>{source.length}</span>
                  </h2>
                  {view === "Overview" && (
                    <p>Useful items shared by community donors.</p>
                  )}
                </div>
                {view === "Overview" && (
                  <button onClick={() => navigate("Explore donations")} className="cursor-pointer">
                    See all donations <ArrowRight size={15} />
                  </button>
                )}
              </div>

              {/* FILTERS & SEARCH */}
              <div className="ngo-filters">
                <div className="ngo-category-tabs">
                  {categories.map((item) => (
                    <button
                      key={item}
                      className={category === item ? "is-active cursor-pointer" : "cursor-pointer"}
                      onClick={() => setCategory(item)}
                    >
                      {item}
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
                  {query && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                      className="cursor-pointer text-muted hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
              </div>

              {/* DONATIONS GRID */}
              <div className="ngo-donation-grid">
                {(view === "Overview" ? filtered.slice(0, 3) : filtered).map((item) => {
                  const requested = hasRequested(item);
                  const isApprovedForUs =
                    item.ngo?.toLowerCase() === profile.name?.toLowerCase() &&
                    (item.status === "Approved" || item.status === "Pickup scheduled");
                  const isInTransit =
                    item.ngo?.toLowerCase() === profile.name?.toLowerCase() &&
                    item.status === "In transit";
                  const isDelivered = item.status === "Delivered";

                  return (
                    <article key={item.id} className="ngo-donation-card">
                      <button
                        className="ngo-card-photo cursor-pointer"
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

                        {/* THANKS NOTE IF DELIVERED */}
                        {isDelivered && item.thanksNote && (
                          <div className="ngo-thanks-box">
                            <strong>Your gratitude note:</strong>
                            <p>"{item.thanksNote}"</p>
                          </div>
                        )}

                        <div className="ngo-card-bottom">
                          <span>Donor: {item.owner || "Community donor"}</span>

                          {/* ACTION BUTTONS BASED ON WORKFLOW */}
                          {item.status === "Available" && !requested && (
                            <button
                              className="card-action cursor-pointer font-semibold"
                              onClick={() => handleOpenRequest(item)}
                            >
                              Request item <ArrowUpRight size={15} />
                            </button>
                          )}

                          {requested && item.status !== "Approved" && item.status !== "In transit" && item.status !== "Delivered" && (
                            <span className="ngo-pending-badge">
                              <Clock3 size={12} /> Pending Approval
                            </span>
                          )}

                          {isInTransit && (
                            <div className="flex items-center gap-2">
                              <button
                                className="button-primary text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1"
                                onClick={() => handleOpenAcknowledge(item)}
                              >
                                <CheckCheck size={14} /> Confirm Received
                              </button>
                            </div>
                          )}

                          {isDelivered && (
                            <button
                              className="card-action cursor-pointer"
                              onClick={() => onDetails(item)}
                            >
                              View record <ArrowUpRight size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="ngo-empty-state">
                  <Package size={34} />
                  <h3>
                    {query || category !== "All items"
                      ? "No matching donations."
                      : view === "Requested & Approved"
                        ? "No requested or approved pickups yet."
                        : view === "Collection history"
                          ? "Your completed collections will appear here."
                          : "No available donations right now."}
                  </h3>
                  <p>
                    {query || category !== "All items"
                      ? "Try a different category or search term."
                      : "Browse available donations to plan your next collection."}
                  </p>
                  {(query || category !== "All items") && (
                    <button
                      className="button-outline cursor-pointer"
                      onClick={() => {
                        setQuery("");
                        setCategory("All items");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <footer className="ngo-footer">
            <span>KindRoute · NGO collection workspace</span>
            <span>Real-time verified community network</span>
          </footer>
        </main>
      </div>

      {/* MODAL 1: REQUEST DONATION */}
      {activeModal === "request" && selectedDonation && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-7 py-5">
              <h2 className="text-xl font-semibold text-ink">Request this Donation</h2>
              <button className="icon-button cursor-pointer" onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="p-7 space-y-4">
              <div className="p-3 bg-canvas rounded-xl text-xs space-y-1">
                <h4 className="font-semibold text-sm text-ink">{selectedDonation.title}</h4>
                <p className="text-muted">{selectedDonation.quantity} · {selectedDonation.location}</p>
                <p className="text-muted">Shared by: <strong>{selectedDonation.owner}</strong></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Message / Pickup details for the donor
                </label>
                <textarea
                  required
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell the donor how this will help and your pickup availability…"
                  className="w-full p-3 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted">
                <Sparkles size={14} className="text-forest" />
                <span>The donor will receive this request and approve the pickup.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="button-primary w-full justify-center cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting request…
                  </>
                ) : (
                  <>
                    <Send size={15} /> Send Request to Donor
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM RECEIVED & WRITE THANKS NOTE */}
      {activeModal === "acknowledge" && selectedDonation && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-7 py-5">
              <h2 className="text-xl font-semibold text-ink">Acknowledge Receipt & Send Thanks</h2>
              <button className="icon-button cursor-pointer" onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitAcknowledge} className="p-7 space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <span className="font-bold block">✓ Confirm Delivery Received</span>
                <p>
                  Acknowledging will mark this delivery as completed and reward <strong>+120 kindness points</strong> to {selectedDonation.owner}!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Write a heartfelt gratitude note to {selectedDonation.owner}
                </label>
                <textarea
                  required
                  rows={4}
                  value={thanksNote}
                  onChange={(e) => setThanksNote(e.target.value)}
                  placeholder="Express your gratitude and mention who will benefit from this kindness…"
                  className="w-full p-3 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="button-primary w-full justify-center cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Confirming…
                  </>
                ) : (
                  <>
                    <CheckCheck size={16} /> Confirm Received & Send Note
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: POST A REQUIREMENT / NEED */}
      {activeModal === "post-need" && (
        <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-7 py-5">
              <h2 className="text-xl font-semibold text-ink">Post a Community Requirement</h2>
              <button className="icon-button cursor-pointer" onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePostNeed} className="p-7 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Requirement title
                </label>
                <input
                  required
                  value={needTitle}
                  onChange={(e) => setNeedTitle(e.target.value)}
                  placeholder="e.g. 50 warm meal packets for evening distribution"
                  className="w-full p-2.5 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Category
                  </label>
                  <select
                    value={needCategory}
                    onChange={(e) => setNeedCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest bg-white"
                  >
                    {categories.slice(1).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Quantity needed
                  </label>
                  <input
                    required
                    value={needAmount}
                    onChange={(e) => setNeedAmount(e.target.value)}
                    placeholder="e.g. 50 meals / 30 jackets"
                    className="w-full p-2.5 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Details & who will benefit
                </label>
                <textarea
                  required
                  rows={3}
                  value={needDetail}
                  onChange={(e) => setNeedDetail(e.target.value)}
                  placeholder="Describe where and how these items will be used to help community members…"
                  className="w-full p-2.5 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-ink">
                    NGO Location
                  </label>
                  <span className="text-xs text-muted">Accurate pickup/delivery point</span>
                </div>
                <LocationPicker
                  location={needLocation}
                  onLocationChange={setNeedLocation}
                  onCoordinatesChange={setNeedCoordinates}
                  detectButtonLabel="Use NGO current location"
                  redetectButtonLabel="Re-detect NGO location"
                  statusLabel="Location"
                  compact
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="button-primary w-full justify-center cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Posting requirement…
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Post Requirement to Network
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
