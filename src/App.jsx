import React, { useEffect, useRef, useState } from "react";
import { animate, stagger } from "motion";
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
  LogOut,
  MapPin,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  Sprout,
  Truck,
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
      (profile.demo && item.owner === "demo-donor"),
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
  const reserve = (item) => {
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
  const completePickup = () => {
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

  function saveDonation(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categoryValue = form.get("category");
    const reference = initialDonations.find(
      (item) => item.category === categoryValue,
    );
    const newItem = {
      id: `KR-${Date.now().toString().slice(-6)}`,
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
    setDonations((items) => [newItem, ...items]);
    setModal(null);
    setView("My donations");
    setCategory("All items");
    notify("Your donation is live. A little kindness is on its way!");
  }

  function saveProfile(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfile({
      name: form.get("name").trim(),
      email: form.get("email"),
      role: form.get("role"),
      location: form.get("location").trim(),
      demo: false,
    });
    setView("Overview");
    setModal(null);
    notify("Your local profile is ready. Welcome to KindRoute!");
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

  // Animate sidebar nav items on mount
  const sidebarRef = useRef(null);
  useEffect(() => {
    if (!sidebarRef.current) return;
    const items = sidebarRef.current.querySelectorAll(".nav-item");
    animate(
      items,
      { opacity: [0, 1], x: [-12, 0] },
      { duration: 0.4, delay: stagger(0.06, { start: 0.1 }), easing: [0.16, 1, 0.3, 1] },
    );
  }, [isNgo]);

  // Animate main content on view change
  const mainRef = useRef(null);
  useEffect(() => {
    if (!mainRef.current) return;
    animate(
      mainRef.current,
      { opacity: [0, 1], y: [10, 0] },
      { duration: 0.4, easing: [0.16, 1, 0.3, 1] },
    );
  }, [view]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {isNgo ? (
        <NgoDashboard
          profile={profile}
          donations={donations}
          onHome={onHome}
          onAccount={() => setModal("register")}
          onSettings={() => setModal("settings")}
          onDetails={(item) => {
            setSelected(item);
            setModal("detail");
          }}
          onTrack={openTrack}
          onRelease={(item) => {
            setDonations((items) =>
              items.map((entry) =>
                entry.id === item.id && entry.ngo === profile.name
                  ? { ...entry, status: "Available", ngo: "" }
                  : entry,
              ),
            );
            notify("Reservation released. The donation is available again.");
          }}
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
            ref={sidebarRef}
          >
            <div className="px-7 pt-8 pb-8">
              <button onClick={onHome} aria-label="Back to KindRoute home" className="transition-opacity hover:opacity-75">
                <Brand />
              </button>
            </div>
            <div className="px-5 mb-1">
              <div className="workspace-switch">
                <span className="rounded-lg bg-forest/10 p-2 text-sage">
                  <Heart size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <strong className="block text-xs font-semibold text-ink truncate">
                    {isNgo ? "NGO workspace" : "Donor workspace"}
                  </strong>
                  <span className="text-[12px] text-muted">
                    A space for your kindness
                  </span>
                </div>
                <ChevronDown size={13} className="text-muted flex-shrink-0" />
              </div>
            </div>
            <p className="px-7 mt-6 mb-2 text-[10.5px] font-semibold tracking-[1.8px] text-muted-lt uppercase">Your Workspace</p>
            <nav className="space-y-0.5 px-3">
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
            <div className="sidebar-bottom px-3">
              <div className="kindness-note mb-4">
                <p className="text-xs font-medium text-forest mb-1">Small acts add up.</p>
                <p className="text-[11.5px] text-muted leading-5">Every donation you share makes a difference in someone's day.</p>
              </div>
              <button
                className="nav-item"
                onClick={() => setModal("help")}
              >
                <CircleHelp size={17} strokeWidth={1.7} />
                Help & getting started
              </button>
              <button className="nav-item" onClick={() => setModal("settings")}>
                <Settings size={17} strokeWidth={1.7} />
                Settings
              </button>
              <div className="mt-4 border-t border-line pt-4 flex items-center gap-3 px-2">
                <span className="avatar">
                  {profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="flex-1 min-w-0">
                  <strong className="block truncate text-xs font-semibold text-ink">
                    {profile.name}
                  </strong>
                  <span className="text-[11.5px] text-muted">
                    {isNgo ? "Community partner" : "Kindness champion"}
                  </span>
                </div>
                <button
                  title="Switch account"
                  className="text-muted hover:text-forest transition-colors p-1"
                  onClick={() => setModal("register")}
                >
                  <LogOut size={15} />
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
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setModal("settings")}
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

            <main ref={mainRef} className="mx-auto max-w-[1500px] px-5 py-7 sm:px-9 xl:px-11">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[1.6px] text-sage mb-2 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                    DONOR WORKSPACE
                  </div>
                  <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-[-1.2px] text-ink">
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
                  <p className="mt-2 text-[13.5px] text-muted">
                    {view === "Overview"
                      ? "Your donations, from shared to received."
                      : "Small acts add up. Make your next one count."}
                  </p>
                </div>
                <button
                  className="button-primary"
                  onClick={() => setModal("donate")}
                >
                  <Plus size={16} />
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
                      size={44}
                      strokeWidth={1.3}
                      className="text-amber"
                    />
                    <p className="text-xs tracking-widest text-muted mt-6 font-semibold uppercase">
                      Your Kindness Balance
                    </p>
                    <h2 className="text-6xl font-semibold tracking-tight mt-3 text-ink">
                      {points.toLocaleString()}
                      <span className="text-base text-muted ml-3 font-normal">points</span>
                    </h2>
                    <p className="text-sm text-muted mt-3 leading-6">
                      Every verified donation earns 120 points.
                    </p>
                    <div className="mt-7 bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-amber-lt/50">
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-muted">Next milestone: Heart of Gold</span>
                        <strong className="text-ink">{Math.min(1500, points).toLocaleString()} / 1,500</strong>
                      </div>
                      <div className="h-2 mt-3 rounded-full bg-amber-lt/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${Math.min(100, (points / 1500) * 100)}%`,
                            background: "linear-gradient(to right, #C67B30, #E09A55)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6 flex-wrap">
                      <button
                        className="button-primary"
                        disabled={!delivered.length}
                        onClick={downloadCertificate}
                      >
                        <Download size={15} />
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
                    <p className="text-[12px] text-muted mt-4 leading-5">
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
            modal === "settings"
              ? "Your KindRoute profile"
              : "There’s a place for you here"
          }
          onClose={() => setModal(null)}
        >
          <p className="text-xs text-muted mb-5">
            Create a browser-local profile, or switch workspaces to explore.
          </p>
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="grid grid-cols-2 gap-3">
              {["donor", "ngo"].map((role) => (
                <label key={`${profile.role}-${role}`} className="role-choice">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    defaultChecked={profile.role === role}
                  />
                  <span>
                    {role === "donor" ? (
                      <HeartHandshake size={25} />
                    ) : (
                      <Users size={25} />
                    )}
                    <strong>
                      {role === "donor"
                        ? "I want to give"
                        : "I represent an NGO"}
                    </strong>
                    <small>
                      {role === "donor"
                        ? "Share something good"
                        : "Connect it to a need"}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <label className="field">
              Your name / organisation
              <input
                name="name"
                required
                defaultValue={profile.demo ? "" : profile.name}
                placeholder="Your name or NGO name"
                maxLength={60}
              />
            </label>
            <label className="field">
              Email
              <input
                name="email"
                type="email"
                required
                defaultValue={profile.email || ""}
                placeholder="you@example.com"
              />
            </label>
            <label className="field">
              Your city / area
              <input
                name="location"
                required
                defaultValue={profile.location}
                maxLength={120}
              />
            </label>
            <button className="button-primary w-full justify-center">
              {modal === "settings" ? "Save profile" : "Create local profile"}
              <ArrowRight size={15} />
            </button>
            <p className="text-center text-[13px] text-muted">
              Local demo only. No account is created on a server.
              <br />
              NGO verification and authentication require a backend.
            </p>
          </form>
          <button
            className="mt-5 text-xs text-forest underline underline-offset-4"
            onClick={() => {
              setProfile({
                name: isNgo ? "Alex Morgan" : "Robin Hood Army",
                role: isNgo ? "donor" : "ngo",
                location: "Noida, Uttar Pradesh",
                demo: true,
              });
              setModal(null);
              setView("Overview");
              notify("Demo workspace switched.");
            }}
          >
            Try the {isNgo ? "donor" : "NGO"} demo instead
          </button>
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
