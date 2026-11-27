import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  Gift,
  Heart,
  HeartHandshake,
  Inbox,
  LayoutDashboard,
  Leaf,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquareQuote,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Shirt,
  Sparkles,
  Sprout,
  Trash2,
  Truck,
  User,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { categories, initialDonations } from "./data";
import Brand from "./components/Brand";
import Badge from "./components/Badge";
import Modal from "./components/Modal";
import PickupMap from "./components/PickupMap";
import usePersistentState from "./hooks/usePersistentState";
import NgoDashboard from "./components/NgoDashboard";
import DonorOverview from "./components/DonorOverview";
import api from "./api";
import LocationPicker from "./components/LocationPicker";

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
  const [needs, setNeeds] = useState([]);
  const [view, setView] = useState("Overview");
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // 'donate', 'settings', 'tracking', 'detail', 'help', 'requests', 'fulfill-need'
  const [selected, setSelected] = useState(null);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Location detection states for modal
  const [donateLocation, setDonateLocation] = useState(currentUser?.location || "");
  const [donateCoords, setDonateCoords] = useState([28.627, 77.371]);

  const [settingsLocation, setSettingsLocation] = useState(currentUser?.location || "");

  // Fulfill Need Modal States
  const [fulfillPercent, setFulfillPercent] = useState(100);
  const [fulfillAmount, setFulfillAmount] = useState("");
  const [fulfillTitle, setFulfillTitle] = useState("");
  const [fulfillLocation, setFulfillLocation] = useState(currentUser?.location || "");
  const [fulfillCoords, setFulfillCoords] = useState([28.627, 77.371]);
  const [fulfillDescription, setFulfillDescription] = useState("");
  const [submittingFulfill, setSubmittingFulfill] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
      setDonateLocation(currentUser.location || "");
      setSettingsLocation(currentUser.location || "");
      setFulfillLocation(currentUser.location || "");
    }
  }, [currentUser]);

  // Synchronize with MongoDB Backend
  const syncBackend = async () => {
    try {
      const donRes = await api.getDonations();
      if (donRes.success && donRes.donations) {
        setDonations(donRes.donations);
      }
    } catch (err) {
      console.warn("Backend donation sync note:", err.message);
    }

    try {
      const needRes = await api.getNeeds();
      if (needRes.success && needRes.needs) {
        setNeeds(needRes.needs);
      }
    } catch (err) {
      console.warn("Backend needs sync note:", err.message);
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

  const openTrack = (item) => {
    setSelected(item);
    setModal("tracking");
  };

  // NGO Requests donation
  const handleRequestDonation = async (item, message) => {
    try {
      const res = await api.requestDonation(item.id, {
        ngoName: profile.name,
        ngoLocation: profile.location,
        phone: profile.phone,
        message,
      });
      if (res.success && res.donation) {
        setDonations((prev) =>
          prev.map((d) => (d.id === item.id ? res.donation : d))
        );
      }
      notify(`Request sent to ${item.owner}! Waiting for donor approval.`);
    } catch (err) {
      notify(err.message || "Failed to send request.");
    }
  };

  // Donor Approves NGO Request
  const handleApproveRequest = async (item, requestId, ngoName) => {
    try {
      const res = await api.approveDonationRequest(item.id, {
        requestId,
        ngoName,
      });
      if (res.success && res.donation) {
        setDonations((prev) =>
          prev.map((d) => (d.id === item.id ? res.donation : d))
        );
      }
      setModal(null);
      notify(`Request approved for ${ngoName}! You can now start delivery.`);
    } catch (err) {
      notify(err.message || "Failed to approve request.");
    }
  };

  // Donor or NGO starts delivery
  const handleStartDelivery = async (item) => {
    try {
      const res = await api.startDelivery(item.id);
      if (res.success && res.donation) {
        setDonations((prev) =>
          prev.map((d) => (d.id === item.id ? res.donation : d))
        );
        setSelected(res.donation);
      }
      notify("Delivery started! Real-time route map is active.");
      setModal("tracking");
    } catch (err) {
      notify(err.message || "Failed to start delivery.");
    }
  };

  // NGO acknowledges receipt and writes thanks note
  const handleAcknowledge = async (item, thanksNoteText) => {
    try {
      const res = await api.acknowledgeReceipt(item.id, {
        thanksNote: thanksNoteText,
      });
      if (res.success && res.donation) {
        setDonations((prev) =>
          prev.map((d) => (d.id === item.id ? res.donation : d))
        );
      }
      notify("Receipt confirmed! Gratitude note sent to the donor.");
    } catch (err) {
      notify(err.message || "Failed to acknowledge receipt.");
    }
  };

  // NGO posts a new requirement
  const handleCreateNeed = async (needData) => {
    try {
      const res = await api.createNeed({
        ...needData,
        name: profile.name,
      });
      if (res.success && res.need) {
        setNeeds((prev) => [res.need, ...prev]);
      }
      notify("Requirement posted successfully to the community network!");
    } catch (err) {
      notify(err.message || "Failed to post requirement.");
    }
  };

  // NGO deletes a requirement
  const handleDeleteNeed = async (needId) => {
    try {
      await api.deleteNeed(needId);
      setNeeds((prev) => prev.filter((n) => n._id !== needId));
      notify("Requirement removed.");
    } catch (err) {
      notify(err.message || "Failed to delete requirement.");
    }
  };

  // Donor clicks "Fulfill this need"
  const handleOpenFulfillNeed = (need) => {
    setSelectedNeed(need);
    setFulfillPercent(100);
    setFulfillAmount(need.amount);
    setFulfillTitle(`Sharing ${need.category.toLowerCase()} for ${need.name}`);
    setFulfillDescription(`Fulfilling requirement: "${need.title}" - ${need.detail}`);
    setModal("fulfill-need");
  };

  const handleSubmitFulfillNeed = async (e) => {
    e.preventDefault();
    if (!selectedNeed) return;
    setSubmittingFulfill(true);

    try {
      const res = await api.createDonation({
        title: fulfillTitle.trim(),
        category: selectedNeed.category,
        quantity: fulfillAmount.trim(),
        location: fulfillLocation.trim() || profile.location,
        coordinates: fulfillCoords,
        description: fulfillDescription.trim(),
        owner: profile.name,
        targetNgo: selectedNeed.name,
        targetNgoLocation: selectedNeed.location,
        targetNgoCoordinates: selectedNeed.coordinates,
      });

      if (res.success && res.donation) {
        setDonations((prev) => [res.donation, ...prev]);
        notify(`Donation scheduled with ${selectedNeed.name}! You can now start delivery.`);
      }
      setModal(null);
      setView("My donations");
    } catch (err) {
      notify(err.message || "Failed to schedule donation.");
    } finally {
      setSubmittingFulfill(false);
    }
  };

  // Navigation Items for Donor Workspace
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

  const trackingCards = donorDonations.filter(
    (item) => item.status === "Approved" || item.status === "In transit" || item.status === "Pickup scheduled"
  );

  const activePickup = donorDonations.find(
    (item) => item.status === "In transit" || item.status === "Approved"
  );

  // Donor posts a donation
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
      requests: [],
    };

    try {
      const res = await api.createDonation(newItem);
      if (res.success && res.donation) {
        setDonations((items) => [res.donation, ...items]);
        notify("Donation posted! All verified NGOs can now view and request it.");
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
          needs={needs}
          onHome={onHome}
          onAccount={() => setModal("settings")}
          onSettings={() => setModal("settings")}
          onDetails={(item) => {
            setSelected(item);
            setModal("detail");
          }}
          onTrack={openTrack}
          onRequestDonation={handleRequestDonation}
          onStartDelivery={handleStartDelivery}
          onAcknowledge={handleAcknowledge}
          onCreateNeed={handleCreateNeed}
          onDeleteNeed={handleDeleteNeed}
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

            {/* Static Donor Profile Badge */}
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
                  className={`nav-item cursor-pointer ${view === name ? "nav-active" : ""}`}
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
                  {name === "Pickup tracking" && trackingCards.length > 0 && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-forest" />
                  )}
                </button>
              ))}
            </nav>

            <div className="sidebar-bottom">
              <button
                className="nav-item mt-5 cursor-pointer"
                onClick={() => setModal("help")}
              >
                <CircleHelp size={18} />
                Help & getting started
              </button>
              <button
                className="nav-item cursor-pointer"
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
                    {activePickup && (
                      <i className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-forest border border-white" />
                    )}
                  </button>
                  {showNotifications && (
                    <div className="notification-panel">
                      <strong className="text-sm">
                        You’re making good things happen
                      </strong>
                      <p className="mt-3 text-xs text-muted leading-6">
                        {activePickup
                          ? `${activePickup.ngo} has coordinated with your donation!`
                          : "You’re all caught up. Post a donation or fulfill an NGO need."}
                      </p>
                      <button
                        className="text-xs text-forest mt-3 cursor-pointer"
                        onClick={() => {
                          setView("Pickup tracking");
                          setShowNotifications(false);
                        }}
                      >
                        View tracking →
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
              {/* VIEW: OVERVIEW */}
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

              {/* VIEW: MY DONATIONS */}
              {view === "My donations" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold">Your donations</h2>
                      <p className="text-sm text-muted mt-1">
                        Review incoming NGO requests, approve collections, and start deliveries.
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
                        const pendingReqs = item.requests?.filter((r) => r.status === "pending") || [];
                        const isApproved = item.status === "Approved" || item.status === "Pickup scheduled";
                        const isInTransit = item.status === "In transit";
                        const isDelivered = item.status === "Delivered";

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
                                {item.description || "Fresh & usable items ready for collection."}
                              </p>

                              {/* INCOMING REQUESTS NOTIFICATION CARD */}
                              {pendingReqs.length > 0 && item.status !== "Approved" && item.status !== "In transit" && (
                                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="flex items-center gap-1">
                                      <Inbox size={13} /> {pendingReqs.length} NGO Request{pendingReqs.length > 1 ? "s" : ""}
                                    </span>
                                    <button
                                      className="text-forest hover:underline font-bold cursor-pointer"
                                      onClick={() => {
                                        setSelected(item);
                                        setModal("requests");
                                      }}
                                    >
                                      Review & Approve →
                                    </button>
                                  </div>
                                  <p className="text-muted text-[11px] truncate">
                                    Latest from: <strong>{pendingReqs[0].ngoName}</strong>
                                  </p>
                                </div>
                              )}

                              {/* APPROVED / IN TRANSIT ACTION */}
                              {isApproved && (
                                <div className="p-2.5 rounded-lg bg-forest/5 border border-forest/15 text-xs text-forest space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span>Approved for: <strong>{item.ngo}</strong></span>
                                  </div>
                                  <button
                                    className="w-full py-1.5 px-3 rounded bg-forest text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#204a33]"
                                    onClick={() => handleStartDelivery(item)}
                                  >
                                    <Truck size={14} /> Start Delivery / Dispatch
                                  </button>
                                </div>
                              )}

                              {/* IN TRANSIT ACTION */}
                              {isInTransit && (
                                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span>In Transit to {item.ngo}</span>
                                    <button
                                      className="text-blue-800 underline font-bold cursor-pointer"
                                      onClick={() => openTrack(item)}
                                    >
                                      View Map →
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* DELIVERED THANKS NOTE DISPLAY */}
                              {isDelivered && item.thanksNote && (
                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                                  <span className="font-semibold flex items-center gap-1 text-forest">
                                    <MessageSquareQuote size={13} /> Message from {item.ngo || "NGO"}:
                                  </span>
                                  <p className="italic text-muted line-clamp-2">
                                    "{item.thanksNote}"
                                  </p>
                                </div>
                              )}

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

              {/* VIEW: PICKUP TRACKING */}
              {view === "Pickup tracking" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Pickup tracking</h2>
                    <p className="text-sm text-muted mt-1">
                      Active collection routes connecting you directly to verified NGO locations.
                    </p>
                  </div>

                  {trackingCards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {trackingCards.map((item) => (
                        <div key={item.id} className="card p-5 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge status={item.status} />
                              <h3 className="font-semibold text-lg mt-2">{item.title}</h3>
                              <p className="text-xs text-muted mt-0.5">
                                Coordinating with: <strong>{item.ngo || "Assigned NGO"}</strong>
                              </p>
                            </div>
                            <span className="text-xs font-mono text-muted bg-canvas px-2.5 py-1 rounded">
                              {item.id}
                            </span>
                          </div>

                          {/* REAL ROUTE MAP */}
                          <PickupMap
                            donorCoordinates={item.coordinates}
                            ngoCoordinates={item.ngoCoordinates || [28.635, 77.38]}
                            donorLocation={item.location}
                            ngoLocation={item.ngoLocation || item.ngo}
                            donorName={item.owner}
                            ngoName={item.ngo || "NGO"}
                            status={item.status}
                            compact
                          />

                          <div className="flex gap-3 pt-2">
                            {item.status === "Approved" && (
                              <button
                                className="button-primary w-full justify-center cursor-pointer"
                                onClick={() => handleStartDelivery(item)}
                              >
                                <Truck size={15} />
                                Start Delivery
                              </button>
                            )}
                            {item.status === "In transit" && (
                              <div className="w-full text-center py-2 px-3 bg-forest/10 text-forest font-semibold text-xs rounded-lg">
                                🚚 Delivery In Transit · Awaiting NGO Arrival & Confirmation
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Truck size={32} />
                      <h3>No active routes scheduled</h3>
                      <p>When you approve an NGO's request or start a delivery, the live map route will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: NGO COMMUNITY (REAL NEEDS FROM MONGODB) */}
              {view === "NGO community" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold">Community Requirements</h2>
                      <p className="text-sm text-muted mt-1">
                        Urgent needs posted by verified non-profits. Select a need to fulfill it partially or fully.
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
                      General donation
                    </button>
                  </div>

                  {needs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {needs.map((need, idx) => (
                        <div key={need._id || idx} className="need-card space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest/10 text-forest">
                              {need.category}
                            </span>
                            <span className="text-xs text-ink font-bold bg-canvas px-2.5 py-1 rounded">
                              {need.amount}
                            </span>
                          </div>
                          <h3 className="font-semibold text-ink text-base">{need.title}</h3>
                          <p className="text-xs text-muted leading-relaxed line-clamp-3">{need.detail}</p>
                          <div className="pt-3 border-t border-line flex items-center justify-between">
                            <div>
                              <strong className="block text-xs text-ink">{need.name}</strong>
                              <span className="text-[11px] text-muted flex items-center gap-1">
                                <MapPin size={11} /> {need.location?.split(",")[0] || "Noida"}
                              </span>
                            </div>
                            <button
                              className="button-primary text-xs py-1.5 px-3 cursor-pointer"
                              onClick={() => handleOpenFulfillNeed(need)}
                            >
                              Fulfill this need
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <HeartHandshake size={32} />
                      <h3>No urgent requirements right now</h3>
                      <p>Verified NGOs post urgent needs here as they arise. You can always share general donations!</p>
                      <button
                        className="button-primary mt-4 cursor-pointer"
                        onClick={() => {
                          setDonateLocation(profile.location || "");
                          setModal("donate");
                        }}
                      >
                        <Plus size={16} /> Make a donation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: REWARDS & IMPACT (ORIGINAL BEAUTIFUL 2-COLUMN UI RESTORED) */}
              {view === "Rewards & impact" && (
                <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
                  {/* Left Column: Kindness Balance & Certificate */}
                  <div className="reward-feature">
                    <Award
                      size={48}
                      strokeWidth={1.3}
                      className="text-[#a28b52]"
                    />
                    <p className="text-xs tracking-widest text-muted mt-7 uppercase font-semibold">
                      YOUR KINDNESS BALANCE
                    </p>
                    <h2 className="text-6xl font-semibold tracking-tight mt-3 text-ink">
                      {points.toLocaleString()}
                      <span className="text-base text-muted ml-3 font-normal">points</span>
                    </h2>
                    <p className="text-sm text-muted mt-4">
                      Every verified donation earns 120 kindness points.
                    </p>
                    <div className="mt-8 bg-white/70 rounded-2xl p-5 border border-[#e7dfc8]">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Next milestone: Heart of Gold</span>
                        <strong>{Math.min(1500, points)} / 1,500</strong>
                      </div>
                      <div className="h-2.5 mt-3 rounded-full bg-[#e7dfc8] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#ad945b] transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (points / 1500) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-7 flex-wrap">
                      <button
                        className="button-primary cursor-pointer disabled:opacity-50"
                        disabled={!delivered.length}
                        onClick={downloadCertificate}
                      >
                        <Download size={16} />
                        Download certificate
                      </button>
                      <button
                        className="button-outline cursor-pointer"
                        onClick={() => {
                          if (points < 1500)
                            notify(
                              `Just ${1500 - points} more points to unlock the Heart of Gold badge.`,
                            );
                          else
                            notify(
                              "Heart of Gold badge unlocked. Thank you for making a difference!",
                            );
                        }}
                      >
                        View milestone
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Real Numbers & Badges */}
                  <div className="space-y-5">
                    <div className="panel p-7">
                      <h3 className="text-lg font-semibold mb-5 text-ink">
                        Good, in real numbers.
                      </h3>
                      {[
                        [
                          HeartHandshake,
                          `${delivered.length}`,
                          "Donations delivered",
                        ],
                        [
                          Users,
                          `${delivered.length * 25}`,
                          "Estimated people supported",
                        ],
                        [
                          Leaf,
                          `${delivered.length * 5} kg`,
                          "Estimated waste diverted",
                        ],
                      ].map(([Icon, value, label]) => (
                        <div
                          className="flex gap-4 py-4 border-b last:border-0 border-line"
                          key={label}
                        >
                          <span className="stat-icon tone-green shrink-0">
                            <Icon size={22} />
                          </span>
                          <div>
                            <strong className="text-2xl text-ink font-semibold">{value}</strong>
                            <p className="text-xs text-muted mt-0.5">{label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="panel p-7">
                      <h3 className="font-semibold mb-5 text-ink">
                        Your collection of kindness
                      </h3>
                      <div className="flex gap-5">
                        {[
                          [Sprout, "First step", true],
                          [Heart, "Kind heart", delivered.length >= 3],
                          [Award, "Heart of gold", points >= 1500],
                        ].map(([Icon, label, earned]) => (
                          <div
                            key={label}
                            className={`text-center flex-1 transition-opacity ${earned ? "" : "opacity-35"}`}
                          >
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-forest mb-2 shadow-xs">
                              <Icon size={24} />
                            </div>
                            <span className="text-xs font-semibold block text-ink">{label}</span>
                            <span className="text-[10px] text-muted block mt-0.5">
                              {earned ? "Unlocked" : "Locked"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
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

      {/* MODAL 1: DONATE FORM (WITH WORKING GPS LOCATION PICKER) */}
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
                placeholder="e.g. Fresh vegetarian meal boxes"
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

              <LocationPicker
                location={donateLocation}
                onLocationChange={setDonateLocation}
                onCoordinatesChange={setDonateCoords}
                redetectButtonLabel="Re-detect current pickup location"
                statusLabel="Pickup Location"
              />
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
              Make it available for NGOs
              <ArrowRight size={16} />
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 2: INCOMING NGO REQUESTS REVIEW & APPROVAL */}
      {modal === "requests" && selected && (
        <Modal
          title="Review NGO Requests"
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-canvas rounded-xl text-xs space-y-1">
              <h4 className="font-semibold text-sm text-ink">{selected.title}</h4>
              <p className="text-muted">{selected.quantity} · {selected.location}</p>
            </div>

            <h4 className="text-sm font-semibold text-ink pt-1">
              NGOs requesting this donation ({selected.requests?.filter((r) => r.status === "pending").length || 0}):
            </h4>

            {selected.requests && selected.requests.filter((r) => r.status === "pending").length > 0 ? (
              <div className="space-y-3">
                {selected.requests
                  .filter((r) => r.status === "pending")
                  .map((req) => (
                    <div
                      key={req._id}
                      className="p-4 rounded-xl border border-line bg-white space-y-3 hover:border-forest/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="block text-sm text-ink">{req.ngoName}</strong>
                          <span className="text-xs text-muted flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> {req.ngoLocation || "Noida"}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted bg-canvas px-2 py-0.5 rounded">
                          {new Date(req.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {req.message && (
                        <p className="text-xs text-ink/80 bg-forest/5 p-2.5 rounded-lg border border-forest/10 italic">
                          "{req.message}"
                        </p>
                      )}

                      <button
                        className="button-primary w-full justify-center text-xs py-2 cursor-pointer"
                        onClick={() => handleApproveRequest(selected, req._id, req.ngoName)}
                      >
                        <Check size={14} /> Approve & Schedule with {req.ngoName}
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-muted text-center py-4">
                No pending requests. As soon as an NGO submits a request, it will appear here.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 3: FULFILL NGO REQUIREMENT / NEED */}
      {modal === "fulfill-need" && selectedNeed && (
        <Modal
          title={`Fulfill Need: ${selectedNeed.name}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmitFulfillNeed} className="space-y-4">
            <div className="p-3.5 bg-forest/5 border border-forest/15 rounded-xl space-y-1.5 text-xs">
              <span className="font-semibold text-forest uppercase tracking-wider block">
                {selectedNeed.category} Requirement
              </span>
              <h4 className="font-semibold text-sm text-ink">{selectedNeed.title}</h4>
              <p className="text-muted leading-relaxed">{selectedNeed.detail}</p>
              <div className="flex justify-between pt-1 font-semibold text-ink">
                <span>Total needed: <strong>{selectedNeed.amount}</strong></span>
                <span>Location: {selectedNeed.location}</span>
              </div>
            </div>

            {/* FULFILLMENT PERCENTAGE / QUANTITY SELECTOR */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                How much can you share?
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2.5">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setFulfillPercent(pct);
                      setFulfillAmount(`${pct}% of required (${selectedNeed.amount})`);
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      fulfillPercent === pct
                        ? "bg-forest text-white border-forest shadow-xs"
                        : "bg-white text-muted border-line hover:border-gray-300"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <input
                required
                value={fulfillAmount}
                onChange={(e) => {
                  setFulfillPercent(null);
                  setFulfillAmount(e.target.value);
                }}
                placeholder="Or specify exact quantity (e.g. 25 meal boxes)"
                className="w-full p-2.5 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>

            {/* LOCATION WITH WORKING CURRENT LOCATION BUTTON */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink">
                  Pickup address
                </label>
                <span className="text-xs text-muted">Where should items be collected?</span>
              </div>
              <LocationPicker
                location={fulfillLocation}
                onLocationChange={setFulfillLocation}
                onCoordinatesChange={setFulfillCoords}
                detectButtonLabel="Use my current location"
                redetectButtonLabel="Re-detect current location"
                statusLabel="Pickup Location"
                compact
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Notes for {selectedNeed.name}
              </label>
              <textarea
                rows={2}
                value={fulfillDescription}
                onChange={(e) => setFulfillDescription(e.target.value)}
                placeholder="Condition, packed details, or pickup timing instructions…"
                className="w-full p-2.5 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>

            <button
              type="submit"
              disabled={submittingFulfill}
              className="button-primary w-full justify-center cursor-pointer"
            >
              {submittingFulfill ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Scheduling with {selectedNeed.name}…
                </>
              ) : (
                <>
                  <HeartHandshake size={16} /> Confirm & Schedule with {selectedNeed.name}
                </>
              )}
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL 4: REAL MAP ROUTE TRACKING (NO MOCK DRIVER ANIMATION) */}
      {modal === "tracking" && selected && (
        <Modal
          title="Active Collection Route"
          wide
          onClose={() => setModal(null)}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{selected.title}</h3>
              <p className="text-xs text-muted mt-1">
                {selected.id} · Origin: <strong>{selected.owner}</strong> ➔ Non-profit: <strong>{selected.ngo || "Assigned NGO"}</strong>
              </p>
            </div>
            <Badge status={selected.status} />
          </div>

          {/* REAL LEAFLET POLYLINE ROUTE MAP */}
          <PickupMap
            donorCoordinates={selected.coordinates}
            ngoCoordinates={selected.ngoCoordinates || [28.635, 77.38]}
            donorLocation={selected.location}
            ngoLocation={selected.ngoLocation || selected.ngo}
            donorName={selected.owner}
            ngoName={selected.ngo || "NGO"}
            status={selected.status}
          />

          <div className="grid grid-cols-3 mt-6 gap-2 pt-2 border-t border-line text-center text-xs">
            <div className={`p-2.5 rounded-lg border ${selected.status ? "bg-forest/10 border-forest font-semibold text-forest" : "bg-canvas text-muted border-line"}`}>
              1. Request Approved
            </div>
            <div className={`p-2.5 rounded-lg border ${selected.status === "In transit" || selected.status === "Delivered" ? "bg-forest/10 border-forest font-semibold text-forest" : "bg-canvas text-muted border-line"}`}>
              2. Delivery in Transit
            </div>
            <div className={`p-2.5 rounded-lg border ${selected.status === "Delivered" ? "bg-forest/10 border-forest font-semibold text-forest" : "bg-canvas text-muted border-line"}`}>
              3. Received & Confirmed
            </div>
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            {!isNgo && selected.status === "Approved" && (
              <button
                className="button-primary cursor-pointer w-full justify-center"
                onClick={() => handleStartDelivery(selected)}
              >
                <Truck size={15} />
                Start Delivery / Dispatch
              </button>
            )}

            {selected.status === "In transit" && (
              <div className="w-full text-center py-2.5 px-3 bg-forest/10 text-forest font-semibold text-xs rounded-lg">
                🚚 Delivery In Transit · Follow the real route to the NGO location above
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL 5: DETAIL MODAL */}
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
            {selected.description || "Shared with kindness for community members."}
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
              <span className="text-muted block mb-1">Coordinating NGO</span>
              {selected.ngo || "Visible to all NGOs"}
            </div>
          </div>

          {/* DELIVERED THANKS NOTE DISPLAY */}
          {selected.status === "Delivered" && selected.thanksNote && (
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-forest text-sm">
                <MessageSquareQuote size={17} /> Gratitude Note from {selected.ngo}:
              </span>
              <p className="italic text-ink/80 text-xs leading-relaxed">
                "{selected.thanksNote}"
              </p>
            </div>
          )}

          {!isNgo && selected.status === "Approved" && (
            <button
              className="button-primary mt-5 w-full justify-center cursor-pointer"
              onClick={() => handleStartDelivery(selected)}
            >
              <Truck size={16} /> Start Delivery
            </button>
          )}

          {selected.status === "In transit" && (
            <button
              className="button-primary mt-5 w-full justify-center cursor-pointer"
              onClick={() => openTrack(selected)}
            >
              <MapPin size={16} /> Track Real Route
            </button>
          )}
        </Modal>
      )}

      {/* MODAL 6: ACCOUNT SETTINGS */}
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
                <span className="text-xs text-muted">GPS or manual entry</span>
              </div>

              <LocationPicker
                location={settingsLocation}
                onLocationChange={setSettingsLocation}
                statusLabel="Registered Location"
              />
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

      {/* MODAL 7: HELP MODAL */}
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
                "02 · Verified NGO Requests",
                "Verified non-profit organisations browse nearby donations and submit collection requests.",
              ],
              [
                Truck,
                "03 · Approve & Follow the route",
                "Approve an NGO's request, start delivery, and track the real map route from your location to the NGO.",
              ],
              [
                Award,
                "04 · Gratitude note & Points",
                "The NGO acknowledges receipt with a personalized thanks note, and your kindness points increase!",
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
