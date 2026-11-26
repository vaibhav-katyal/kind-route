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
  Database,
  Download,
  Gift,
  Heart,
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  Leaf,
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
  UserCheck,
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
import api, { getToken, setToken, removeToken } from "./api";

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

export default function App({
  initialRole,
  initialRegistration = false,
  onHome,
}) {
  const [profile, setProfile] = usePersistentState("kindroute-profile", {
    name: "Alex Morgan",
    role: "donor",
    location: "Noida, Uttar Pradesh",
    demo: true,
  });
  const [donations, setDonations] = usePersistentState(
    "kindroute-donations",
    initialDonations,
  );
  const [view, setView] = useState("Overview");
  const [category, setCategory] = useState("All items");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(initialRegistration ? "register" : null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [ngos] = usePersistentState("kindroute-needs", needs);

  // Backend & MongoDB state
  const [backendStatus, setBackendStatus] = useState("connecting");
  const [authTab, setAuthTab] = useState(initialRegistration ? "register" : "login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginCreds, setLoginCreds] = useState({ email: "", password: "" });

  const syncBackend = async () => {
    try {
      const healthy = await api.checkHealth();
      if (!healthy) {
        setBackendStatus("offline");
        return;
      }
      setBackendStatus("connected");

      // Sync authenticated user profile
      const token = getToken();
      if (token) {
        try {
          const userRes = await api.getMe();
          if (userRes.success && userRes.user) {
            setProfile((current) => ({
              ...current,
              ...userRes.user,
              demo: false,
            }));
          }
        } catch {
          removeToken();
        }
      }

      // Fetch live donations from MongoDB
      try {
        const donRes = await api.getDonations();
        if (donRes.success && donRes.donations && donRes.donations.length > 0) {
          setDonations(donRes.donations);
        }
      } catch (err) {
        console.warn("Donation sync error:", err.message);
      }
    } catch {
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    syncBackend();
  }, []);

  useEffect(() => {
    if (!initialRole) return;
    setProfile((current) => ({
      ...current,
      role: initialRole,
      name: current.demo
        ? initialRole === "ngo"
          ? "Robin Hood Army"
          : "Alex Morgan"
        : current.name,
    }));
  }, [initialRole]);
  const isNgo = profile.role === "ngo";
  const donorDonations = donations.filter(
    (item) =>
      item.owner === profile.name ||
      (profile.demo && item.owner === "demo-donor") ||
      (profile.demo && item.owner === "Alex Morgan"),
  );
  const delivered = donorDonations.filter(
    (item) => item.status === "Delivered",
  );
  const points = delivered.length * 120 + (profile.demo ? 1120 : 0);
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
      if (backendStatus === "connected") {
        await api.reserveDonation(item.id, profile.name);
      }
    } catch (err) {
      console.warn("Reserve error:", err.message);
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
      if (backendStatus === "connected" && selected) {
        await api.completeDonation(selected.id);
      }
    } catch (err) {
      console.warn("Complete pickup error:", err.message);
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
        : "Delivery verified! 120 kindness points added to the donor.",
    );
  };
  const handleRelease = async (item) => {
    try {
      if (backendStatus === "connected") {
        await api.releaseDonation(item.id);
      }
    } catch (err) {
      console.warn("Release error:", err.message);
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

  const handleSwitchWorkspace = async (targetRole) => {
    const nextRole = targetRole || (isNgo ? "donor" : "ngo");
    try {
      if (backendStatus === "connected" && getToken()) {
        const res = await api.switchRole(nextRole);
        if (res.success && res.user) {
          setProfile((curr) => ({
            ...curr,
            role: res.user.role,
            name: res.user.name,
          }));
        }
      } else {
        setProfile((current) => ({
          ...current,
          role: nextRole,
          name: current.demo
            ? nextRole === "ngo"
              ? "Robin Hood Army"
              : "Alex Morgan"
            : current.name,
        }));
      }
      notify(`Switched to ${nextRole === "ngo" ? "NGO" : "Donor"} workspace.`);
    } catch {
      setProfile((current) => ({
        ...current,
        role: nextRole,
      }));
      notify(`Switched to ${nextRole === "ngo" ? "NGO" : "Donor"} workspace.`);
    }
    setView("Overview");
  };

  async function handleLogin(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    try {
      if (backendStatus !== "connected") {
        throw new Error(
          "Backend server is offline. Please run 'npm run backend' to connect with MongoDB.",
        );
      }
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        setToken(res.token);
        setProfile({
          ...res.user,
          demo: false,
        });
        setModal(null);
        notify(res.message || `Welcome back, ${res.user.name}!`);
        syncBackend();
      } else {
        setAuthError(res.message || "Failed to log in.");
      }
    } catch (err) {
      setAuthError(err.message || "Invalid email or password.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const name = form.get("name").trim();
    const email = form.get("email").trim();
    const password = form.get("password");
    const role = form.get("role") || "donor";
    const location = form.get("location").trim();

    try {
      if (backendStatus !== "connected") {
        setProfile({
          name,
          email,
          role,
          location,
          demo: false,
        });
        setModal(null);
        notify("Local profile created. (Start backend server to sync to MongoDB)");
        return;
      }
      const res = await api.register({
        name,
        email,
        password,
        role,
        location,
      });
      if (res.success && res.token) {
        setToken(res.token);
        setProfile({
          ...res.user,
          demo: false,
        });
        setModal(null);
        notify(res.message || "Account registered in MongoDB!");
        syncBackend();
      } else {
        setAuthError(res.message || "Failed to create account.");
      }
    } catch (err) {
      setAuthError(err.message || "Failed to create account.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    removeToken();
    setProfile({
      name: "Alex Morgan",
      role: "donor",
      location: "Noida, Uttar Pradesh",
      demo: true,
    });
    setModal(null);
    notify("Logged out successfully.");
  }
  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    {
      name: isNgo ? "Explore donations" : "My donations",
      icon: HeartHandshake,
    },
    { name: "Pickup tracking", icon: MapPin },
    { name: isNgo ? "My requirements" : "NGO community", icon: Users },
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
    const newItem = {
      title: form.get("title").trim(),
      category: categoryValue,
      quantity: form.get("quantity").trim(),
      location: form.get("location").trim(),
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
      coordinates: [28.627, 77.371],
      image: reference?.image || imageFallback,
      owner: profile.name,
    };

    try {
      if (backendStatus === "connected") {
        const res = await api.createDonation(newItem);
        if (res.success && res.donation) {
          setDonations((items) => [res.donation, ...items]);
          notify("Donation posted to MongoDB! A little kindness is on its way.");
        } else {
          setDonations((items) => [
            { id: `KR-${Date.now().toString().slice(-6)}`, ...newItem },
            ...items,
          ]);
          notify("Your donation is live.");
        }
      } else {
        setDonations((items) => [
          { id: `KR-${Date.now().toString().slice(-6)}`, ...newItem },
          ...items,
        ]);
        notify("Your donation is live.");
      }
    } catch (err) {
      console.warn("Save donation error:", err.message);
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
    const email = form.get("email")?.trim();
    const role = form.get("role");
    const location = form.get("location").trim();

    try {
      if (backendStatus === "connected" && getToken()) {
        const res = await api.updateProfile({ name, location, role });
        if (res.success && res.user) {
          setProfile((curr) => ({ ...curr, ...res.user }));
        }
      } else {
        setProfile({
          name,
          email,
          role,
          location,
          demo: false,
        });
      }
      notify("Profile updated successfully.");
    } catch {
      notify("Profile updated.");
    }
    setModal(null);
  }

  function downloadCertificate() {
    const safeName = profile.name.replace(/[<>&"']/g, "");
    const content = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850"><rect width="1200" height="850" fill="#f8faf5"/><rect x="35" y="35" width="1130" height="780" fill="none" stroke="#2b6046" stroke-width="3"/><g text-anchor="middle" font-family="Georgia" fill="#214d38"><text x="600" y="150" font-size="36">KindRoute</text><text x="600" y="265" font-size="52">Certificate of Kindness</text><text x="600" y="350" font-size="22">Presented with gratitude to</text><text x="600" y="440" font-size="56">${safeName}</text><text x="600" y="525" font-size="24">For ${delivered.length} verified donation${delivered.length === 1 ? "" : "s"} and a generous spirit.</text><text x="600" y="590" font-size="20">A little kindness goes a long way.</text><text x="600" y="720" font-size="18">Browser demo · ${new Date().toLocaleDateString("en-IN")}</text></g></svg>`;
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
          onAccount={() => {
            setAuthTab("settings");
            setModal("register");
          }}
          onSettings={() => {
            setAuthTab("settings");
            setModal("settings");
          }}
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
            <div className="px-7 pt-9 pb-10">
              <button onClick={onHome} aria-label="Back to KindRoute home">
                <Brand />
              </button>
            </div>
            <div className="px-6">
              <div
                className="workspace-switch cursor-pointer hover:bg-forest/5 transition-colors"
                title="Click to switch workspace"
                onClick={() => handleSwitchWorkspace()}
              >
                <span className="rounded-lg bg-white p-2 text-forest">
                  <Heart size={17} />
                </span>
                <div className="flex-1">
                  <strong className="block text-xs font-semibold">
                    {isNgo ? "NGO workspace" : "Donor workspace"}
                  </strong>
                  <span className="text-[13px] text-muted">
                    Click to switch workspace
                  </span>
                </div>
                <ChevronDown size={14} />
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
                  setAuthTab("settings");
                  setModal("settings");
                }}
              >
                <Settings size={18} />
                Settings & Switch
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
                  <span className="text-[13px] text-muted">
                    {isNgo ? "Community partner" : "Kindness champion"}
                  </span>
                </div>
                <button
                  title={getToken() ? "Settings & Logout" : "Sign In / Register"}
                  className="text-muted hover:text-ink transition-colors"
                  onClick={() => {
                    setAuthTab(getToken() ? "settings" : "login");
                    setModal("register");
                  }}
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
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setAuthTab(getToken() ? "settings" : "login");
                    setModal("register");
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    backendStatus === "connected"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                  title={
                    backendStatus === "connected"
                      ? "MongoDB Backend is connected!"
                      : "Backend offline. Click to view status or sign in."
                  }
                >
                  <Database size={12} />
                  <span>
                    {backendStatus === "connected"
                      ? "MongoDB Live"
                      : "Backend Offline"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setAuthTab("settings");
                    setModal("settings");
                  }}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-muted"
                >
                  <MapPin size={14} />
                  <span>{profile.location.split(",")[0]}, India</span>
                  <ChevronDown size={12} />
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
                        className="text-xs text-forest mt-3"
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
                  className="avatar h-8 w-8 text-[13px]"
                  aria-label="Edit profile"
                  onClick={() => setModal("settings")}
                >
                  {profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </button>
              </div>
            </header>

            <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-9 xl:px-11">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
                <div>
                  <div className="flex items-center gap-2 text-[14px] text-muted mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                    DONOR WORKSPACE
                  </div>
                  <h1 className="text-[30px] sm:text-[32px] font-semibold tracking-[-1.1px]">
                    {view === "Overview"
                      ? `Good to see you, ${profile.name.split(" ")[0]}.`
                      : view === "Rewards & impact"
                        ? "Your kindness, making a difference."
                        : view === "NGO community"
                          ? "Good people. A shared purpose."
                          : view === "My requirements"
                            ? "Tell the community what you need."
                            : view === "Pickup tracking"
                              ? "Follow the good you put in motion."
                              : isNgo
                                ? "Find a little of what your community needs."
                                : "Every donation has a story."}
                  </h1>
                  <p className="mt-2 text-xs sm:text-[15px] text-muted">
                    {view === "Overview"
                      ? "Your donations, from shared to received."
                      : "Small acts add up. Make your next one count."}
                  </p>
                </div>
                <button
                  className="button-primary"
                  onClick={() => setModal("donate")}
                >
                  <Plus size={17} />
                  Make a donation
                </button>
              </div>

              {view === "Overview" && (
                <DonorOverview
                  donations={donorDonations}
                  onViewAll={() => setView("My donations")}
                  onDetails={(item) => {
                    setSelected(item);
                    setModal("detail");
                  }}
                  onTrack={openTrack}
                  onDonate={() => setModal("donate")}
                />
              )}

              {(view === "My donations" ||
                view === "Explore donations" ||
                view === "Pickup tracking") && (
                <div className="grid gap-7">
                  <section className="min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[19px] font-semibold tracking-[-0.4px]">
                          {view === "Pickup tracking"
                            ? "Your scheduled pickups"
                            : isNgo
                              ? "Good things nearby"
                              : "Your recent donations"}
                        </h2>
                        <span className="count-chip">{cards.length}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      {categories.map((item) => {
                        const Icon = icons[item];
                        return (
                          <button
                            key={item}
                            onClick={() => setCategory(item)}
                            className={`category-tab ${category === item ? "category-active" : ""}`}
                          >
                            {Icon && <Icon size={13} />}
                            {item}
                          </button>
                        );
                      })}
                      <div className="search-box ml-auto">
                        <Search size={14} />
                        <input
                          aria-label="Search donations"
                          placeholder="Search donations"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {cards.map((item) => (
                        <article key={item.id} className="donation-card group">
                          <button
                            className="donation-image"
                            onClick={() => {
                              setSelected(item);
                              setModal("detail");
                            }}
                          >
                            <img
                              src={item.image}
                              alt={
                                item.category === "Food"
                                  ? "Fresh food prepared for donation"
                                  : `${item.category} ready for a new home`
                              }
                              className="transition-transform duration-500 group-hover:scale-105"
                            />
                            <span className="image-category">
                              {React.createElement(
                                icons[item.category] || Package,
                                { size: 12 },
                              )}
                              {item.category}
                            </span>
                            {item.status === "Delivered" && (
                              <span className="image-check">
                                <Check size={13} />
                              </span>
                            )}
                          </button>
                          <div className="p-4">
                            <div className="mb-3">
                              <Badge status={item.status} />
                            </div>
                            <h3 className="font-semibold text-[15px] tracking-[-0.2px] leading-5">
                              {item.title}
                            </h3>
                            <p className="text-[14px] text-muted mt-1">
                              {item.quantity}
                            </p>
                            <div className="flex items-center gap-1 mt-3 text-[13px] text-muted">
                              <MapPin size={12} />
                              {item.location}
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-[13px] text-muted">
                              <Clock3 size={12} />
                              {item.date}
                            </div>
                            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                              <span className="text-[13px] text-muted truncate">
                                {item.ngo || "Waiting for a kind connection"}
                              </span>
                              <button
                                className="card-action"
                                onClick={() => {
                                  if (item.status === "Pickup scheduled")
                                    openTrack(item);
                                  else {
                                    setSelected(item);
                                    setModal("detail");
                                  }
                                }}
                              >
                                {item.status === "Pickup scheduled"
                                  ? "Track pickup"
                                  : item.status === "Delivered"
                                    ? "View impact"
                                    : isNgo
                                      ? "Reserve"
                                      : "View details"}
                                <ArrowUpRight size={12} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    {cards.length === 0 && (
                      <div className="empty-state">
                        <Package size={32} />
                        <h3>No donations here just yet.</h3>
                        <p>Try another category, or start something good.</p>
                        <button
                          className="button-primary mt-4"
                          onClick={() => {
                            setQuery("");
                            setCategory("All items");
                          }}
                        >
                          Show all donations
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {view === "NGO community" && (
                <section className="mt-8">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <h2 className="text-[19px] font-semibold tracking-[-0.4px]">
                        {view === "My requirements"
                          ? "Community requirements"
                          : "A little help, where it’s needed"}
                      </h2>
                      <p className="text-[14px] text-muted mt-1">
                        Real needs. Nearby communities. Your chance to make a
                        difference.
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {ngos.map((need, index) => {
                      const Icon = icons[need.category] || Heart;
                      return (
                        <article
                          className="need-card"
                          key={`${need.name}-${index}`}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <span
                              className={`need-icon tone-${need.color || "green"}`}
                            >
                              <Icon size={17} />
                            </span>
                            <span className="font-semibold text-[14px]">
                              {need.name}
                            </span>
                            <ShieldCheck
                              size={13}
                              className="text-sage ml-auto"
                              title="Demo NGO partner"
                            />
                          </div>
                          <h3 className="text-[15px] font-semibold">
                            {need.title}
                          </h3>
                          <p className="mt-1.5 text-[13px] text-muted">
                            {need.detail}
                          </p>
                          <div className="flex justify-between items-center mt-5">
                            <span className="text-[12px] text-muted bg-canvas rounded px-2 py-1.5">
                              {need.amount}
                            </span>
                            <button
                              className="text-[13px] text-forest font-semibold flex gap-1 items-center"
                              onClick={() => {
                                setCategory(need.category);
                                setSelected(need);
                                setModal(isNgo ? "need-detail" : "donate");
                              }}
                            >
                              {" "}
                              {isNgo ? "View need" : "Lend a hand"}
                              <ArrowUpRight size={12} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {view === "Rewards & impact" && (
                <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
                  <div className="reward-feature">
                    <Award
                      size={48}
                      strokeWidth={1.3}
                      className="text-[#a28b52]"
                    />
                    <p className="text-xs tracking-widest text-muted mt-7">
                      YOUR KINDNESS BALANCE
                    </p>
                    <h2 className="text-6xl font-semibold tracking-tight mt-3">
                      {points.toLocaleString()}
                      <span className="text-base text-muted ml-3">points</span>
                    </h2>
                    <p className="text-sm text-muted mt-4">
                      Every verified donation earns 120 points.
                    </p>
                    <div className="mt-8 bg-white/70 rounded-2xl p-5">
                      <div className="flex justify-between text-xs">
                        <span>Next milestone: Heart of Gold</span>
                        <strong>{Math.min(1500, points)} / 1,500</strong>
                      </div>
                      <div className="h-2 mt-4 rounded-full bg-[#e7dfc8]">
                        <div
                          className="h-full rounded-full bg-[#ad945b]"
                          style={{
                            width: `${Math.min(100, (points / 1500) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-7 flex-wrap">
                      <button
                        className="button-primary"
                        disabled={!delivered.length}
                        onClick={downloadCertificate}
                      >
                        <Download size={16} />
                        Download certificate
                      </button>
                      <button
                        className="button-outline"
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
                    <p className="text-[13px] text-muted mt-4">
                      Demo totals include sample activity. Certificates reflect
                      verified donations here.
                    </p>
                  </div>
                  <div className="space-y-5">
                    <div className="panel p-7">
                      <h3 className="text-lg font-semibold mb-5">
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
                          className="flex gap-4 py-5 border-b last:border-0 border-line"
                          key={label}
                        >
                          <span className="stat-icon tone-green">
                            <Icon size={22} />
                          </span>
                          <div>
                            <strong className="text-2xl">{value}</strong>
                            <p className="text-xs text-muted mt-1">{label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="panel p-7">
                      <h3 className="font-semibold mb-5">
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
                            className={`text-center flex-1 ${earned ? "" : "opacity-35"}`}
                          >
                            <span className="mx-auto flex h-16 w-16 rounded-full bg-[#eff1e6] items-center justify-center text-forest">
                              <Icon size={28} />
                            </span>
                            <p className="text-xs mt-3">{label}</p>
                            <p className="text-[12px] text-muted mt-1">
                              {earned ? "Unlocked" : "Keep giving"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <footer className="mt-9 pt-5 border-t border-line flex flex-wrap justify-between gap-3 text-[13px] text-muted">
                <span>Made for a world with a little more kindness.</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-sage" />
                  KindRoute · Frontend demo<span className="mx-2">/</span>
                  <button
                    onClick={() => setModal("register")}
                    className="hover:text-forest"
                  >
                    Switch to {isNgo ? "donor" : "NGO"} workspace{" "}
                    <ArrowUpRight size={10} className="inline" />
                  </button>
                </span>
              </footer>
            </main>
          </div>
        </>
      )}

      {toast && (
        <div role="status" className="toast">
          <span className="rounded-full bg-[#e1eddb] p-1 text-forest">
            <Check size={16} />
          </span>
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {modal === "donate" && (
        <Modal
          title="Give something a new beginning"
          onClose={() => setModal(null)}
        >
          <p className="text-xs text-muted mb-6">
            A few details help your donation reach the right hands.
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
            <label className="field">
              Pickup address
              <input
                required
                name="location"
                defaultValue={profile.location}
                maxLength={150}
              />
            </label>
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
              Please share safe, usable items. Food should be fresh,
              hygienically packed, and within its consumption window.
            </p>
            <button
              className="button-primary w-full justify-center"
              type="submit"
            >
              Make it available
              <ArrowRight size={16} />
            </button>
            <p className="text-[13px] text-muted text-center">
              Saved in this browser · Images are category illustrations
            </p>
          </form>
        </Modal>
      )}

      {(modal === "register" || modal === "settings") && (
        <Modal
          title={
            authTab === "login"
              ? "Sign in to KindRoute"
              : authTab === "register"
                ? "Join the KindRoute Network"
                : "Profile & Workspace"
          }
          onClose={() => {
            setModal(null);
            setAuthError("");
          }}
        >
          {/* Tabs header */}
          <div className="flex border-b border-line mb-5 -mt-2">
            <button
              type="button"
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all ${
                authTab === "login"
                  ? "border-forest text-forest"
                  : "border-transparent text-muted hover:text-ink"
              }`}
              onClick={() => {
                setAuthTab("login");
                setAuthError("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all ${
                authTab === "register"
                  ? "border-forest text-forest"
                  : "border-transparent text-muted hover:text-ink"
              }`}
              onClick={() => {
                setAuthTab("register");
                setAuthError("");
              }}
            >
              Create Account
            </button>
            <button
              type="button"
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all ${
                authTab === "settings"
                  ? "border-forest text-forest"
                  : "border-transparent text-muted hover:text-ink"
              }`}
              onClick={() => {
                setAuthTab("settings");
                setAuthError("");
              }}
            >
              Workspace & Switch
            </button>
          </div>

          {/* Backend Status banner */}
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between mb-4 ${
              backendStatus === "connected"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === "connected"
                    ? "bg-emerald-600 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span>
                {backendStatus === "connected"
                  ? "MongoDB Backend is connected & live"
                  : "Backend offline (Run 'npm run backend' to connect MongoDB)"}
              </span>
            </div>
            <button
              type="button"
              onClick={syncBackend}
              className="underline text-xs flex items-center gap-1 hover:opacity-80"
              title="Refresh connection status"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>

          {authError && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {authError}
            </div>
          )}

          {/* Tab 1: Login */}
          {authTab === "login" && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <p className="text-xs text-muted mb-2">
                Log in with your registered MongoDB account to sync your donations and collections.
              </p>
              <label className="field">
                Email Address
                <input
                  name="email"
                  type="email"
                  required
                  value={loginCreds.email}
                  onChange={(e) =>
                    setLoginCreds({ ...loginCreds, email: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>
              <label className="field">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  value={loginCreds.password}
                  onChange={(e) =>
                    setLoginCreds({ ...loginCreds, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </label>
              <button
                type="submit"
                disabled={authLoading}
                className="button-primary w-full justify-center"
              >
                {authLoading ? "Logging in..." : "Sign In to Account"}
                <ArrowRight size={15} />
              </button>

              <div className="pt-3 border-t border-line text-xs text-muted">
                <span className="block mb-2 font-medium text-ink">
                  Or quick sign-in with seeded demo accounts:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="p-2 border border-line rounded text-left hover:bg-forest/5 text-ink transition-colors"
                    onClick={() =>
                      setLoginCreds({
                        email: "alex@kindroute.org",
                        password: "password123",
                      })
                    }
                  >
                    <strong>Alex Morgan</strong>
                    <span className="block text-[11px] text-muted">
                      Donor Workspace
                    </span>
                  </button>
                  <button
                    type="button"
                    className="p-2 border border-line rounded text-left hover:bg-forest/5 text-ink transition-colors"
                    onClick={() =>
                      setLoginCreds({
                        email: "robinhood@kindroute.org",
                        password: "password123",
                      })
                    }
                  >
                    <strong>Robin Hood Army</strong>
                    <span className="block text-[11px] text-muted">
                      NGO Workspace
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Create Account / Register */}
          {authTab === "register" && (
            <form className="space-y-4" onSubmit={handleRegister}>
              <p className="text-xs text-muted mb-2">
                Choose your role and register an account in MongoDB.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["donor", "ngo"].map((role) => (
                  <label
                    key={`reg-${role}`}
                    className="role-choice cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      defaultChecked={role === "donor"}
                    />
                    <span>
                      {role === "donor" ? (
                        <HeartHandshake size={23} />
                      ) : (
                        <Users size={23} />
                      )}
                      <strong>
                        {role === "donor"
                          ? "I want to give"
                          : "I represent an NGO"}
                      </strong>
                      <small>
                        {role === "donor"
                          ? "Donor workspace"
                          : "NGO collection desk"}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              <label className="field">
                Full Name / NGO Organization Name
                <input
                  name="name"
                  required
                  placeholder="e.g. Hope Foundation or Sarah Jenkins"
                  maxLength={60}
                />
              </label>
              <label className="field">
                Email Address
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@domain.com"
                />
              </label>
              <label className="field">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </label>
              <label className="field">
                City / Area Location
                <input
                  name="location"
                  required
                  defaultValue={profile.location || "Noida, Uttar Pradesh"}
                  placeholder="e.g. Sector 62, Noida"
                  maxLength={120}
                />
              </label>
              <button
                type="submit"
                disabled={authLoading}
                className="button-primary w-full justify-center"
              >
                {authLoading ? "Creating account..." : "Create MongoDB Account"}
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Tab 3: Settings & Workspace Switch */}
          {authTab === "settings" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-forest/5 border border-forest/15">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                      Active Workspace
                    </span>
                    <h4 className="text-base font-semibold text-ink mt-0.5">
                      {isNgo ? "NGO Workspace" : "Donor Workspace"}
                    </h4>
                    <p className="text-xs text-muted mt-1">
                      {isNgo
                        ? "Currently exploring available donations and scheduling pickups."
                        : "Currently listing donations and tracking deliveries."}
                    </p>
                  </div>
                  <span className="p-3 bg-white rounded-lg text-forest shadow-sm">
                    {isNgo ? <Users size={22} /> : <HeartHandshake size={22} />}
                  </span>
                </div>
                <button
                  type="button"
                  className="button-primary mt-4 w-full justify-center"
                  onClick={() => {
                    handleSwitchWorkspace();
                    setModal(null);
                  }}
                >
                  <RefreshCw size={15} />
                  Switch to {isNgo ? "Donor Workspace" : "NGO Workspace"}
                </button>
              </div>

              <form className="space-y-4 pt-1" onSubmit={saveProfile}>
                <h4 className="text-sm font-semibold text-ink">
                  Update Profile Details
                </h4>
                <label className="field">
                  Name / Organisation Name
                  <input
                    name="name"
                    required
                    defaultValue={profile.name}
                    maxLength={60}
                  />
                </label>
                <label className="field">
                  Location
                  <input
                    name="location"
                    required
                    defaultValue={profile.location}
                    maxLength={120}
                  />
                </label>
                <input type="hidden" name="role" value={profile.role} />
                <button
                  type="submit"
                  className="button-outline w-full justify-center"
                >
                  Save Profile Changes
                </button>
              </form>

              {getToken() && (
                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <span className="text-xs text-muted">
                    Signed in as {profile.email || profile.name}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium"
                    onClick={handleLogout}
                  >
                    <LogOut size={13} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

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
                {selected.id} · {selected.ngo}
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
                Collection volunteer · Demo driver
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
              className="button-primary"
              disabled={simulating || progress >= 1}
              onClick={() => setSimulating(true)}
            >
              <Truck size={15} />
              {simulating
                ? "Driver is moving…"
                : progress >= 1
                  ? "Driver arrived"
                  : "Simulate live pickup"}
            </button>
            <button
              className="button-outline"
              disabled={progress < 1}
              onClick={completePickup}
            >
              <CheckCheck size={16} />
              Verify delivered
            </button>
            <button
              className="button-outline ml-auto"
              onClick={() => {
                if (!navigator.geolocation)
                  return notify("Geolocation is unavailable in this browser.");
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setSelected((item) => ({
                      ...item,
                      coordinates: [
                        position.coords.latitude,
                        position.coords.longitude,
                      ],
                    }));
                    setProgress(0);
                    setSimulating(false);
                    notify("Map updated to your GPS location.");
                  },
                  () =>
                    notify(
                      "Location unavailable. Enable browser location access to use GPS.",
                    ),
                  { timeout: 10000 },
                );
              }}
            >
              <MapPin size={15} />
              Use my GPS
            </button>
          </div>
          <p className="text-[13px] mt-4 text-muted leading-5">
            Simulated driver movement on a real map. GPS uses your browser’s
            location permission. Actual driver tracking, route optimisation and
            verification require a backend.
          </p>
        </Modal>
      )}

      {modal === "detail" && selected && (
        <Modal
          title="Every donation has a story"
          onClose={() => setModal(null)}
        >
          <img
            src={selected.image}
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
              <span className="text-muted block mb-1">Sharing</span>
              {selected.quantity}
            </div>
            <div>
              <span className="text-muted block mb-1">Location</span>
              {selected.location}
            </div>
            <div>
              <span className="text-muted block mb-1">Pickup window</span>
              {selected.date}
            </div>
            <div>
              <span className="text-muted block mb-1">NGO partner</span>
              {selected.ngo || "Not reserved yet"}
            </div>
          </div>
          {selected.status === "Available" && isNgo && (
            <button
              className="button-primary mt-5 w-full justify-center"
              onClick={() => reserve(selected)}
            >
              Reserve & schedule pickup
              <ArrowRight size={15} />
            </button>
          )}
          {selected.status === "Available" && !isNgo && (
            <p className="text-xs text-muted mt-5">
              Your donation is visible in the NGO workspace. Switch workspaces
              to try reserving it.
            </p>
          )}
          {selected.status === "Pickup scheduled" && (
            <button
              className="button-primary mt-5 w-full justify-center"
              onClick={() => openTrack(selected)}
            >
              Track pickup
              <Truck size={16} />
            </button>
          )}
          {selected.status === "Delivered" && !isNgo && (
            <div className="mt-5 flex items-center gap-3 text-forest bg-[#eff5ed] rounded-xl p-4">
              <Award size={25} />
              <div>
                <strong className="text-sm">
                  Kindness delivered. +120 points.
                </strong>
                <p className="text-xs mt-1">
                  A new beginning, made possible by you.
                </p>
              </div>
            </div>
          )}
          {selected.status === "Delivered" && isNgo && (
            <div className="mt-5 flex items-center gap-3 text-forest bg-[#eff5ed] rounded-xl p-4">
              <CheckCheck size={25} />
              <div>
                <strong className="text-sm">Collection completed</strong>
                <p className="text-xs mt-1">
                  Received by {selected.ngo} · {selected.id}
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}

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
                "Create a donor profile and list fresh food or usable goods with quantity, condition and pickup details.",
              ],
              [
                Users,
                "02 · Find the right hands",
                "NGOs browse nearby donations by category and reserve what their community needs.",
              ],
              [
                Truck,
                "03 · Follow the good",
                "Simulate the collection route on a real map, then verify the delivery on arrival.",
              ],
              [
                Award,
                "04 · Keep the kindness going",
                "Earn 120 points for a verified delivery and download your certificate.",
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
            This is a frontend prototype. Data stays in this browser. Sample
            partners, impact estimates and routes are for demonstration. Map
            tiles require an internet connection.
          </p>
        </Modal>
      )}
    </div>
  );
}
