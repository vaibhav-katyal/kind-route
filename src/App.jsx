import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  Gift,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  Leaf,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  Sprout,
  Truck,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { categories, initialDonations, needs } from "./data";
import Brand from "./components/Brand";
import Badge from "./components/Badge";
import Modal from "./components/Modal";
import PickupMap from "./components/PickupMap";
import usePersistentState from "./hooks/usePersistentState";
import NgoDashboard from "./components/NgoDashboard";
import DonorOverview from "./components/DonorOverview";
import api from "./api";
import { getCurrentLocation } from "./utils/location";

const icons = {
  Food: Utensils,
  Clothing: Shirt,
  Books: BookOpen,
  Electronics: Gift,
  Furniture: Package,
  Essentials: Heart,
};
const imageFallback =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=700&q=85";

export default function App({ currentUser, onLogout, onHome }) {
  const [profile, setProfile] = useState(currentUser);
  const [donations, setDonations] = usePersistentState(
    "kindroute-donations",
    initialDonations,
  );
  const [view, setView] = useState("Overview");
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [ngos] = usePersistentState("kindroute-needs", needs);

  // Location detection states for modal
  const [donateLocation, setDonateLocation] = useState(currentUser?.location || "");
  const [donateCoords, setDonateCoords] = useState([28.627, 77.371]);
  const [locatingDonate, setLocatingDonate] = useState(false);
  const [donateLocError, setDonateLocError] = useState("");

  const [settingsLocation, setSettingsLocation] = useState(currentUser?.location || "");
  const [locatingSettings, setLocatingSettings] = useState(false);
  const [settingsLocError, setSettingsLocError] = useState("");

  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
      setDonateLocation(currentUser.location || "");
      setSettingsLocation(currentUser.location || "");
    }
  }, [currentUser]);

  const syncBackend = async () => {
    try {
      const donRes = await api.getDonations();
      if (donRes.success && donRes.donations && donRes.donations.length > 0) {
        setDonations(donRes.donations);
      }
    } catch (err) {
      console.warn("Backend sync note:", err.message);
    }
  };

  useEffect(() => {
    syncBackend();
  }, []);

  const isNgo = profile?.role === "ngo";

  // Filter donor's own donations
  const donorDonations = donations.filter(
    (item) =>
      item.owner === profile.name ||
      (profile.id && item.donor === profile.id) ||
      (profile._id && item.donor === profile._id),
  );

  const delivered = donorDonations.filter(
    (item) => item.status === "Delivered",
  );

  // Kindness points: 120 points per verified delivery
  const points = delivered.length * 120;
  const total = donorDonations.length;

  const notify = (message) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!simulating) return;
    const timer = setInterval(
      () =>
        setProgress((value) => {
          if (value >= 1) {
            setSimulating(false);
            return 1;
          }
          return Math.min(1, value + 0.025);
        }),
      500,
    );
    return () => clearInterval(timer);
  }, [simulating]);

  const openTrack = (item) => {
    setSelected(item);
    setProgress(0);
    setSimulating(false);
    setModal("tracking");
  };

  const reserve = async (item) => {
    try {
      await api.reserveDonation(item.id, profile.name);
    } catch (err) {
      console.warn("Reserve notice:", err.message);
    }
    setDonations((items) =>
      items.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "Pickup scheduled", ngo: profile.name }
          : entry,
      ),
    );
    notify("Donation reserved. Your pickup is ready to coordinate.");
    setModal(null);
  };

  const completePickup = async () => {
    try {
      if (selected) {
        await api.completeDonation(selected.id);
      }
    } catch (err) {
      console.warn("Complete pickup notice:", err.message);
    }
    setDonations((items) =>
      items.map((item) =>
        item.id === selected.id ? { ...item, status: "Delivered" } : item,
      ),
    );
    setModal(null);
    notify(
      isNgo
        ? "Delivery confirmed. Added to your collection history."
        : "Delivery verified! 120 kindness points added to your account.",
    );
  };

  const handleRelease = async (item) => {
    try {
      await api.releaseDonation(item.id);
    } catch (err) {
      console.warn("Release notice:", err.message);
    }
    setDonations((items) =>
      items.map((entry) =>
        entry.id === item.id && entry.ngo === profile.name
          ? { ...entry, status: "Available", ngo: "" }
          : entry,
      ),
    );
    notify("Reservation released. The donation is available again.");
  };

  // Nav Items for Donor Workspace
  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "My donations", icon: HeartHandshake },
    { name: "Pickup tracking", icon: MapPin },
    { name: "NGO community", icon: Users },
    { name: "Rewards & impact", icon: Award },
  ];

  const filtered = donorDonations.filter(
    (item) =>
      (category === "All items" || item.category === category) &&
      `${item.title} ${item.category} ${item.location} ${item.ngo}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  const cards =
    view === "Pickup tracking"
      ? filtered.filter((item) => item.status === "Pickup scheduled")
      : filtered;

  const activePickup = donorDonations.find(
    (item) => item.status === "Pickup scheduled",
  );

  async function saveDonation(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categoryValue = form.get("category");
    const reference = initialDonations.find(
      (item) => item.category === categoryValue,
    );

    const finalLocation = donateLocation.trim() || profile.location;

    const newItem = {
      title: form.get("title").trim(),
      category: categoryValue,
      quantity: form.get("quantity").trim(),
      location: finalLocation,
      description: form.get("description").trim(),
      date: new Date(form.get("date")).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      status: "Available",
      ngo: "",
      distance: "Nearby",
      coordinates: donateCoords,
      image: reference?.image || imageFallback,
      owner: profile.name,
    };

    try {
      const res = await api.createDonation(newItem);
      if (res.success && res.donation) {
        setDonations((items) => [res.donation, ...items]);
        notify("Donation posted! A little kindness is on its way.");
      } else {
        setDonations((items) => [
          { id: `KR-${Date.now().toString().slice(-6)}`, ...newItem },
          ...items,
        ]);
        notify("Your donation is live.");
      }
    } catch {
      setDonations((items) => [
        { id: `KR-${Date.now().toString().slice(-6)}`, ...newItem },
        ...items,
      ]);
      notify("Your donation is live.");
    }

    setModal(null);
    setView("My donations");
    setCategory("All items");
  }

  async function saveProfile(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name").trim();
    const phone = form.get("phone")?.trim();
    const finalLocation = settingsLocation.trim() || profile.location;

    try {
      const res = await api.updateProfile({
        name,
        phone,
        location: finalLocation,
      });
      if (res.success && res.user) {
        setProfile((curr) => ({ ...curr, ...res.user }));
      } else {
        setProfile((curr) => ({
          ...curr,
          name,
          phone,
          location: finalLocation,
        }));
      }
      notify("Profile updated successfully.");
    } catch {
      setProfile((curr) => ({
        ...curr,
        name,
        phone,
        location: finalLocation,
      }));
      notify("Profile updated.");
    }
    setModal(null);
  }

  function downloadCertificate() {
    const safeName = profile.name.replace(/[<>&"']/g, "");
    const content = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850"><rect width="1200" height="850" fill="#f8faf5"/><rect x="35" y="35" width="1130" height="780" fill="none" stroke="#2b6046" stroke-width="3"/><g text-anchor="middle" font-family="Georgia" fill="#214d38"><text x="600" y="150" font-size="36">KindRoute</text><text x="600" y="265" font-size="52">Certificate of Kindness</text><text x="600" y="350" font-size="22">Presented with gratitude to</text><text x="600" y="440" font-size="56">${safeName}</text><text x="600" y="525" font-size="24">For ${delivered.length} verified donation${delivered.length === 1 ? "" : "s"} and a generous spirit.</text><text x="600" y="590" font-size="20">A little kindness goes a long way.</text><text x="600" y="720" font-size="18">KindRoute Verified · ${new Date().toLocaleDateString("en-IN")}</text></g></svg>`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "image/svg+xml" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "KindRoute-certificate.svg";
    link.click();
    URL.revokeObjectURL(url);
    notify("Your certificate has been downloaded.");
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {isNgo ? (
        <NgoDashboard
          profile={profile}
          donations={donations}
          onHome={onHome}
          onAccount={() => setModal("settings")}
          onSettings={() => setModal("settings")}
          onDetails={(item) => {
            setSelected(item);
            setModal("detail");
          }}
          onTrack={openTrack}
          onRelease={handleRelease}
        />
      ) : (
        <>
          {menu && (
            <div
              className="fixed inset-0 z-30 bg-black/20 lg:hidden"
              onClick={() => setMenu(false)}
            />
          )}
          <aside
            className={`sidebar ${menu ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          >
            <div className="px-7 pt-9 pb-8">
              <button onClick={onHome} aria-label="Back to KindRoute home">
                <Brand />
              </button>
            </div>

            {/* Static Donor Profile Badge (No switch workspace) */}
            <div className="px-6">
              <div className="flex items-center gap-3 p-3 bg-forest/5 rounded-xl border border-line">
                <span className="rounded-lg bg-white p-2 text-forest shadow-xs">
                  <Heart size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <strong className="block text-xs font-semibold truncate text-ink">
                    {profile.name}
                  </strong>
                  <span className="text-[12px] text-muted">
                    Donor Workspace
                  </span>
                </div>
              </div>
            </div>

            <p className="px-8 mt-8 mb-3 text-[12px] font-semibold tracking-[1.7px] text-muted">
              YOUR WORKSPACE
            </p>
            <nav className="space-y-1 px-4">
              {navItems.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={`nav-item ${view === name ? "nav-active" : ""}`}
                  onClick={() => {
                    setView(name);
                    setMenu(false);
                    setQuery("");
                    setCategory("All items");
                  }}
                >
                  <Icon size={18} strokeWidth={1.65} />
                  <span>{name}</span>
                  {name === "My donations" && (
                    <span className="nav-count">{total}</span>
                  )}
                  {name === "Pickup tracking" && activePickup && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sage" />
                  )}
                </button>
              ))}
            </nav>

            <div className="sidebar-bottom">
              <button
                className="nav-item mt-5"
                onClick={() => setModal("help")}
              >
                <CircleHelp size={18} />
                Help & getting started
              </button>
              <button
                className="nav-item"
                onClick={() => {
                  setSettingsLocation(profile.location || "");
                  setModal("settings");
                }}
              >
                <Settings size={18} />
                Account Settings
              </button>
              <div className="mt-5 border-t border-line pt-5 flex items-center gap-3 px-2">
                <span className="avatar">
                  {profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="flex-1 min-w-0">
                  <strong className="block truncate text-xs">
                    {profile.name}
                  </strong>
                  <span className="text-[13px] text-muted truncate block">
                    {profile.email || "Active donor"}
                  </span>
                </div>
                <button
                  title="Log Out"
                  className="text-muted hover:text-red-600 transition-colors cursor-pointer"
                  onClick={onLogout}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:ml-[244px]">
            <header className="topbar">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden icon-button"
                  aria-label="Open menu"
                  onClick={() => setMenu(true)}
                >
                  <Menu size={21} />
                </button>
                <span className="text-sm font-medium">{view}</span>
                <span className="hidden sm:inline text-line mx-3">/</span>
                <span className="hidden sm:inline text-xs text-muted">
                  A little kindness, every day
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setSettingsLocation(profile.location || "");
                    setModal("settings");
                  }}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  <MapPin size={14} className="text-forest" />
                  <span className="max-w-[150px] truncate">
                    {profile.location ? profile.location.split(",")[0] : "Set location"}
                  </span>
                </button>

                <div className="relative">
                  <button
                    aria-label="Notifications"
                    className="relative icon-button"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell size={19} />
                    <i className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#d99b5d] border border-white" />
                  </button>
                  {showNotifications && (
                    <div className="notification-panel">
                      <strong className="text-sm">
                        You’re making good things happen
                      </strong>
                      <p className="mt-3 text-xs text-muted leading-6">
                        {activePickup
                          ? `${activePickup.ngo} is preparing to collect your donation.`
                          : "You’re all caught up. Add a donation to get started."}
                      </p>
                      <button
                        className="text-xs text-forest mt-3 cursor-pointer"
                        onClick={() => {
                          setView("Pickup tracking");
                          setShowNotifications(false);
                        }}
                      >
                        View pickups →
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="avatar h-8 w-8 text-[13px] cursor-pointer"
                  aria-label="Edit profile"
                  onClick={() => {
                    setSettingsLocation(profile.location || "");
                    setModal("settings");
                  }}
                >
                  {profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </button>
              </div>
            </header>

            <main className="p-4 sm:p-7 md:p-9 max-w-6xl mx-auto space-y-9">
              {view === "Overview" && (
                <DonorOverview
                  profile={profile}
                  donations={donorDonations}
                  points={points}
                  onAddDonation={() => {
                    setDonateLocation(profile.location || "");
                    setModal("donate");
                  }}
                  onViewTracking={() => setView("Pickup tracking")}
                  onViewDonations={() => setView("My donations")}
                  onDetails={(item) => {
                    setSelected(item);
                    setModal("detail");
                  }}
                  onDownloadCertificate={downloadCertificate}
                />
              )}

              {view === "My donations" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold">Your donations</h2>
                      <p className="text-sm text-muted mt-1">
                        Keep track of everything you’ve shared and scheduled.
                      </p>
                    </div>
                    <button
                      className="button-primary cursor-pointer"
                      onClick={() => {
                        setDonateLocation(profile.location || "");
                        setModal("donate");
                      }}
                    >
                      <Plus size={16} />
                      Share a new item
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                          category === cat
                            ? "bg-forest text-white border-forest"
                            : "bg-white text-muted border-line hover:border-gray-300"
                        }`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filtered.map((item) => {
                        const Icon = icons[item.category] || Heart;
                        return (
                          <article key={item.id} className="card">
                            <div className="relative h-44 overflow-hidden rounded-t-xl">
                              <img
                                src={item.image || imageFallback}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-3 left-3">
                                <Badge status={item.status} />
                              </div>
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-2 text-xs text-muted">
                                <Icon size={14} />
                                <span>{item.category}</span>
                                <span>•</span>
                                <span>{item.quantity}</span>
                              </div>
                              <h3 className="font-semibold text-ink line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                {item.description || "Fresh & usable items ready for pickup."}
                              </p>
                              <div className="pt-2 border-t border-line flex items-center justify-between">
                                <span className="text-xs text-muted flex items-center gap-1">
                                  <MapPin size={12} />
                                  <span className="truncate max-w-[130px]">{item.location}</span>
                                </span>
                                <button
                                  className="text-xs text-forest font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                                  onClick={() => {
                                    setSelected(item);
                                    setModal("detail");
                                  }}
                                >
                                  View details <ArrowRight size={13} />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <HeartHandshake size={32} />
                      <h3>No donations in this view</h3>
                      <p>Share something good from your pantry, closet or home.</p>
                      <button
                        className="button-primary mt-4 cursor-pointer"
                        onClick={() => {
                          setDonateLocation(profile.location || "");
                          setModal("donate");
                        }}
                      >
                        <Plus size={16} /> Share an item
                      </button>
                    </div>
                  )}
                </div>
              )}

              {view === "Pickup tracking" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Pickup tracking</h2>
                    <p className="text-sm text-muted mt-1">
                      Live status of scheduled collections by NGO partners.
                    </p>
                  </div>

                  {cards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {cards.map((item) => (
                        <div key={item.id} className="card p-5 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge status={item.status} />
                              <h3 className="font-semibold text-lg mt-2">{item.title}</h3>
                              <p className="text-xs text-muted mt-0.5">
                                Coordinating with: <strong>{item.ngo || "NGO Partner"}</strong>
                              </p>
                            </div>
                            <span className="text-xs font-mono text-muted bg-canvas px-2.5 py-1 rounded">
                              {item.id}
                            </span>
                          </div>
                          <div className="p-3 bg-canvas rounded-lg text-xs space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-muted">Location:</span>
                              <strong>{item.location}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Pickup window:</span>
                              <strong>{item.date}</strong>
                            </div>
                          </div>
                          <button
                            className="button-primary w-full justify-center cursor-pointer"
                            onClick={() => openTrack(item)}
                          >
                            <Truck size={15} />
                            Track live collection
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Truck size={32} />
                      <h3>No active pickups scheduled</h3>
                      <p>When an NGO reserves your donation, collection details will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {view === "NGO community" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold">NGO Community Needs</h2>
                    <p className="text-sm text-muted mt-1">
                      See current high-priority requirements from verified local non-profits.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {ngos.map((need, idx) => (
                      <div key={idx} className="need-card space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest/10 text-forest">
                            {need.category}
                          </span>
                          <span className="text-xs text-muted font-medium">{need.amount}</span>
                        </div>
                        <h3 className="font-semibold text-ink text-base">{need.title}</h3>
                        <p className="text-xs text-muted leading-relaxed">{need.detail}</p>
                        <div className="pt-3 border-t border-line flex items-center justify-between">
                          <strong className="text-xs text-ink">{need.name}</strong>
                          <button
                            className="text-xs text-forest font-semibold hover:underline cursor-pointer"
                            onClick={() => {
                              setDonateLocation(profile.location || "");
                              setModal("donate");
                            }}
                          >
                            Help fulfill →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {view === "Rewards & impact" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold">Rewards & Community Impact</h2>
                    <p className="text-sm text-muted mt-1">
                      Every verified donation builds verified kindness points.
                    </p>
                  </div>

                  <div className="reward-feature">
                    <div className="max-w-xl space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-forest">
                        YOUR KINDNESS CERTIFICATE
                      </span>
                      <h3 className="text-2xl font-serif text-ink">
                        Official Recognition of Giving
                      </h3>
                      <p className="text-sm text-muted leading-relaxed">
                        Earned through verified collections. You have delivered {delivered.length} verified donations and gathered {points} kindness points.
                      </p>
                      <button
                        onClick={downloadCertificate}
                        className="button-primary mt-2 cursor-pointer"
                      >
                        <Download size={16} />
                        Download Certificate (SVG)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div role="status" className="toast">
          <span className="rounded-full bg-[#e1eddb] p-1 text-forest">
            <Check size={16} />
          </span>
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast("")} className="cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* MODAL 1: DONATE FORM (WITH CURRENT LOCATION PICKER) */}
      {modal === "donate" && (
        <Modal
          title="Give something a new beginning"
          onClose={() => setModal(null)}
        >
          <p className="text-xs text-muted mb-6">
            A few details help your donation reach the right hands safely.
          </p>
          <form onSubmit={saveDonation} className="space-y-4">
            <label className="field">
              What would you like to share?
              <input
                required
                name="title"
                placeholder="e.g. Fresh vegetarian meals"
                maxLength={70}
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="field">
                Category
                <select
                  name="category"
                  defaultValue={category === "All items" ? "Food" : category}
                >
                  {categories.slice(1).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Quantity
                <input
                  required
                  name="quantity"
                  placeholder="e.g. 25 meal boxes"
                  maxLength={60}
                />
              </label>
            </div>

            {/* PICKUP ADDRESS WITH WORKING CURRENT LOCATION BUTTON */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink">
                  Pickup address
                </label>
                <span className="text-xs text-muted">Accurate pickup location</span>
              </div>

              <div className="p-3 rounded-lg border border-line bg-white space-y-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    setLocatingDonate(true);
                    setDonateLocError("");
                    try {
                      const loc = await getCurrentLocation();
                      setDonateLocation(loc.formattedLocation);
                      if (loc.coordinates) setDonateCoords(loc.coordinates);
                    } catch (err) {
                      setDonateLocError(err.message || "Failed to detect location.");
                    } finally {
                      setLocatingDonate(false);
                    }
                  }}
                  disabled={locatingDonate}
                  className="w-full py-2.5 px-3.5 rounded-md bg-[#eef4ea] hover:bg-[#e2edd9] text-forest border border-[#cadbc1] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {locatingDonate ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-forest" />
                      Detecting current location…
                    </>
                  ) : (
                    <>
                      <MapPin size={15} className="text-forest" />
                      {donateLocation ? "Re-detect current pickup location" : "Use current location"}
                    </>
                  )}
                </button>

                {donateLocation && (
                  <div className="flex items-start gap-2 pt-1 text-xs text-forest bg-forest/5 p-2.5 rounded border border-forest/15">
                    <Check size={14} className="shrink-0 mt-0.5 text-forest" />
                    <div>
                      <strong className="block text-ink">Pickup Location:</strong>
                      <span className="text-muted leading-relaxed">{donateLocation}</span>
                    </div>
                  </div>
                )}

                {donateLocError && (
                  <p className="text-xs text-red-600 pt-1">{donateLocError}</p>
                )}
              </div>
            </div>

            <label className="field">
              Available for pickup
              <input
                type="datetime-local"
                name="date"
                required
                min={new Date(
                  Date.now() - new Date().getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
              />
            </label>
            <label className="field">
              A little more about it
              <textarea
                required
                name="description"
                rows={3}
                placeholder="Condition, food preparation time, dietary details, or anything helpful…"
                maxLength={500}
              />
            </label>
            <p className="flex gap-2 text-[13px] text-muted leading-5">
              <ShieldCheck size={17} className="shrink-0 text-forest" />
              Please share safe, usable items. Food should be fresh, hygienically packed, and within its consumption window.
            </p>
            <button
              className="button-primary w-full justify-center cursor-pointer"
              type="submit"
            >
              Make it available
              <ArrowRight size={16} />
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 2: ACCOUNT SETTINGS (NO SWITCH WORKSPACE) */}
      {modal === "settings" && (
        <Modal
          title="Account Settings"
          onClose={() => setModal(null)}
        >
          <form className="space-y-4" onSubmit={saveProfile}>
            <label className="field">
              {isNgo ? "NGO Name" : "Full Name"}
              <input
                name="name"
                required
                defaultValue={profile.name}
                maxLength={60}
              />
            </label>

            <label className="field">
              Mobile phone number
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone || ""}
                placeholder="+91 98765 43210"
              />
            </label>

            {/* LOCATION WITH CURRENT LOCATION BUTTON */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink">
                  {isNgo ? "NGO Location" : "Your city / location"}
                </label>
                <span className="text-xs text-muted">Auto-detected via GPS</span>
              </div>

              <div className="p-3 rounded-lg border border-line bg-white space-y-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    setLocatingSettings(true);
                    setSettingsLocError("");
                    try {
                      const loc = await getCurrentLocation();
                      setSettingsLocation(loc.formattedLocation);
                    } catch (err) {
                      setSettingsLocError(err.message || "Failed to detect location.");
                    } finally {
                      setLocatingSettings(false);
                    }
                  }}
                  disabled={locatingSettings}
                  className="w-full py-2.5 px-3.5 rounded-md bg-[#eef4ea] hover:bg-[#e2edd9] text-forest border border-[#cadbc1] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {locatingSettings ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-forest" />
                      Detecting current location…
                    </>
                  ) : (
                    <>
                      <MapPin size={15} className="text-forest" />
                      {settingsLocation ? "Re-detect current location" : "Use current location"}
                    </>
                  )}
                </button>

                {settingsLocation && (
                  <div className="flex items-start gap-2 pt-1 text-xs text-forest bg-forest/5 p-2.5 rounded border border-forest/15">
                    <Check size={14} className="shrink-0 mt-0.5 text-forest" />
                    <div>
                      <strong className="block text-ink">Registered Location:</strong>
                      <span className="text-muted leading-relaxed">{settingsLocation}</span>
                    </div>
                  </div>
                )}

                {settingsLocError && (
                  <p className="text-xs text-red-600 pt-1">{settingsLocError}</p>
                )}
              </div>
            </div>

            <button className="button-primary w-full justify-center cursor-pointer mt-2">
              Save Profile Changes
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line flex items-center justify-between">
            <span className="text-xs text-muted">
              Signed in as <strong>{profile.email}</strong> ({isNgo ? "NGO Account" : "Donor Account"})
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-red-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={13} />
              Log Out
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL 3: TRACKING MODAL */}
      {modal === "tracking" && selected && (
        <Modal
          title="A little good is on its way"
          wide
          onClose={() => setModal(null)}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">{selected.title}</h3>
              <p className="text-xs text-muted mt-1">
                {selected.id} · {selected.ngo || "Assigned NGO"}
              </p>
            </div>
            <Badge
              status={progress >= 1 ? "At pickup location" : "Pickup scheduled"}
            />
          </div>
          <PickupMap progress={progress} coordinates={selected.coordinates} />
          <div className="flex items-center gap-3 mt-5">
            <span className="avatar">AK</span>
            <div className="flex-1">
              <strong className="text-sm">Arjun Kumar</strong>
              <p className="text-xs text-muted">
                Collection volunteer · Live dispatch
              </p>
            </div>
            <span className="text-xs text-forest font-semibold">
              {progress >= 1
                ? "Arrived"
                : `${Math.max(1, Math.ceil((1 - progress) * 12))} min away`}
            </span>
          </div>
          <div className="grid grid-cols-3 mt-6 gap-2">
            {["On the way", "At pickup", "Verified delivery"].map(
              (label, index) => (
                <div className="text-[13px] text-muted" key={label}>
                  <div
                    className={`h-1.5 rounded-full mb-2 ${index === 0 || (index === 1 && progress >= 1) ? "bg-forest" : "bg-line"}`}
                  />
                  {label}
                </div>
              ),
            )}
          </div>
          <div className="flex gap-3 mt-6 flex-wrap">
            <button
              className="button-primary cursor-pointer"
              disabled={simulating || progress >= 1}
              onClick={() => setSimulating(true)}
            >
              <Truck size={15} />
              {simulating
                ? "Driver moving…"
                : progress >= 1
                  ? "Driver arrived"
                  : "Dispatch live pickup"}
            </button>
            <button
              className="button-outline cursor-pointer"
              disabled={progress < 1}
              onClick={completePickup}
            >
              <CheckCheck size={16} />
              Verify delivered
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL 4: DETAIL MODAL */}
      {modal === "detail" && selected && (
        <Modal
          title="Donation Details"
          onClose={() => setModal(null)}
        >
          <img
            src={selected.image || imageFallback}
            alt={selected.category}
            className="w-full h-48 object-cover rounded-xl mb-5"
          />
          <Badge status={selected.status} />
          <h3 className="text-xl font-semibold mt-3">{selected.title}</h3>
          <p className="text-sm text-muted mt-3 leading-6">
            {selected.description}
          </p>
          <div className="grid grid-cols-2 gap-4 bg-canvas p-4 rounded-xl mt-5 text-xs">
            <div>
              <span className="text-muted block mb-1">Quantity</span>
              {selected.quantity}
            </div>
            <div>
              <span className="text-muted block mb-1">Pickup location</span>
              {selected.location}
            </div>
            <div>
              <span className="text-muted block mb-1">Pickup window</span>
              {selected.date}
            </div>
            <div>
              <span className="text-muted block mb-1">NGO partner</span>
              {selected.ngo || "Awaiting NGO reservation"}
            </div>
          </div>
          {selected.status === "Available" && isNgo && (
            <button
              className="button-primary mt-5 w-full justify-center cursor-pointer"
              onClick={() => reserve(selected)}
            >
              Reserve & schedule pickup
              <ArrowRight size={15} />
            </button>
          )}
          {selected.status === "Available" && !isNgo && (
            <p className="text-xs text-muted mt-5">
              Your donation is live on the network. A nearby verified NGO will reserve it for pickup.
            </p>
          )}
          {selected.status === "Pickup scheduled" && (
            <button
              className="button-primary mt-5 w-full justify-center cursor-pointer"
              onClick={() => openTrack(selected)}
            >
              Track pickup
              <Truck size={16} />
            </button>
          )}
          {selected.status === "Delivered" && (
            <div className="mt-5 flex items-center gap-3 text-forest bg-[#eff5ed] rounded-xl p-4">
              <CheckCheck size={25} />
              <div>
                <strong className="text-sm">Collection completed</strong>
                <p className="text-xs mt-1">
                  Verified delivery · {selected.ngo || "NGO"} · {selected.id}
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL 5: HELP MODAL */}
      {modal === "help" && (
        <Modal
          title="A little kindness goes a long way"
          onClose={() => setModal(null)}
        >
          <div className="space-y-6">
            {[
              [
                HeartHandshake,
                "01 · Share what you can",
                "List fresh food, clothing or usable goods with accurate quantity and location details.",
              ],
              [
                Users,
                "02 · Find the right hands",
                "Verified non-profit organisations browse nearby donations and schedule doorstep collections.",
              ],
              [
                Truck,
                "03 · Follow the route",
                "Track the collection dispatch in real-time as volunteers navigate to pickup items.",
              ],
              [
                Award,
                "04 · Verified community impact",
                "Earn 120 kindness points for each completed delivery and download your verification certificate.",
              ],
            ].map(([Icon, title, text]) => (
              <div key={title} className="flex gap-4">
                <span className="stat-icon tone-green shrink-0">
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="text-xs text-muted mt-2 leading-6">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-muted mt-7 border-t border-line pt-4">
            KindRoute is a community donation and collection network. Connect surplus resources with local non-profit partners.
          </p>
        </Modal>
      )}
    </div>
  );
}
