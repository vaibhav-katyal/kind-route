import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HeartHandshake,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Brand from "./Brand";
import api, { setToken } from "../api";
import LocationPicker from "./LocationPicker";

export default function AuthPage({
  initialMode = "login",
  initialRole = "donor",
  onSuccess,
  onBack,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [role, setRole] = useState(initialRole); // 'donor' or 'ngo'

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState([28.627, 77.371]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        setToken(res.token);
        if (onSuccess) {
          onSuccess(res.user);
        }
      } else {
        setError(res.message || "Invalid credentials.");
      }
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!location && role === "ngo") {
      setError("Please click 'Get NGO Current Location' to register your NGO's location.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim(),
        location: location.trim() || "India",
        orgName: role === "ngo" ? name.trim() : "",
      });

      if (res.success && res.token) {
        setToken(res.token);
        if (onSuccess) {
          onSuccess(res.user);
        }
      } else {
        setError(res.message || "Registration failed.");
      }
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-canvas text-ink font-sans">
      {/* Left visual column */}
      <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-forest text-white select-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#152e22] via-[#214935]/70 to-[#1b3d2c]/90" />

        <div className="relative z-10">
          <div className="inline-block bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 mb-6 text-xs tracking-wider uppercase font-semibold">
            KindRoute Platform
          </div>
          <div className="[&_strong]:text-white [&_span]:text-emerald-200">
            <Brand />
          </div>
        </div>

        <div className="relative z-10 space-y-6 my-auto max-w-md">
          <h2 className="text-3xl xl:text-4xl font-serif font-normal leading-tight text-white">
            Good things deserve <span className="italic font-light text-emerald-200">another</span> beginning.
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            KindRoute bridges everyday surplus food, clothing, books, and household goods with local verified NGOs. Real people, verified collections, genuine community impact.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="block text-xl font-bold text-emerald-300">100%</span>
              <span className="text-xs text-white/70">Verified NGO routing</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="block text-xl font-bold text-emerald-300">Direct</span>
              <span className="text-xs text-white/70">Doorstep pickup coordination</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
          <span>Safe · Hygienic · Accountable</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-300" /> Community Verified
          </span>
        </div>
      </div>

      {/* Right form column */}
      <div className="lg:col-span-7 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-10 overflow-y-auto">
        <header className="flex items-center justify-between pb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
        </header>

        <div className="max-w-md w-full mx-auto my-auto py-6">
          {/* LOGIN FORM */}
          {mode === "login" && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-ink">
                  Log in to your account
                </h1>
                <p className="text-sm text-muted mt-2">
                  Enter your email and password to access your KindRoute workspace.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                  <span className="text-red-500 font-bold">!</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <Mail size={17} />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <Lock size={17} />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg bg-forest hover:bg-[#204a33] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Log in
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-line text-center">
                <p className="text-sm text-muted">
                  Don’t have an account yet?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="mt-3 w-full py-2.5 px-4 rounded-lg border border-forest text-forest hover:bg-forest/5 font-medium text-sm transition-colors cursor-pointer"
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-ink">
                  Create your account
                </h1>
                <p className="text-sm text-muted mt-2">
                  First choose whether you are a Donor or an NGO.
                </p>
              </div>

              {/* Step 1: NGO or Donor selector */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("donor")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      role === "donor"
                        ? "border-forest bg-forest/5 ring-2 ring-forest/20"
                        : "border-line bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`p-2 rounded-lg ${
                          role === "donor" ? "bg-forest text-white" : "bg-gray-100 text-muted"
                        }`}
                      >
                        <HeartHandshake size={20} />
                      </span>
                      {role === "donor" && <Check size={16} className="text-forest" />}
                    </div>
                    <strong className="block text-sm font-semibold text-ink">
                      Donor
                    </strong>
                    <span className="text-xs text-muted block mt-0.5">
                      I want to share goods
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ngo")}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      role === "ngo"
                        ? "border-forest bg-forest/5 ring-2 ring-forest/20"
                        : "border-line bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`p-2 rounded-lg ${
                          role === "ngo" ? "bg-forest text-white" : "bg-gray-100 text-muted"
                        }`}
                      >
                        <Users size={20} />
                      </span>
                      {role === "ngo" && <Check size={16} className="text-forest" />}
                    </div>
                    <strong className="block text-sm font-semibold text-ink">
                      NGO
                    </strong>
                    <span className="text-xs text-muted block mt-0.5">
                      I represent an NGO
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                  <span className="text-red-500 font-bold">!</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Step 2: Form fields */}
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {role === "donor" ? (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                        <User size={17} />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aditi Sharma"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      NGO name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                        <Users size={17} />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Robin Hood Army Noida Chapter"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <Mail size={17} />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <Lock size={17} />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Mobile number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <Phone size={17} />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
                    />
                  </div>
                </div>

                {/* Location with Current Location Button */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-ink">
                      {role === "ngo" ? "Location of NGO" : "Your city / location"}
                    </label>
                    <span className="text-xs text-muted">
                      {role === "ngo" ? "Required for pickups" : "Optional"}
                    </span>
                  </div>

                  <LocationPicker
                    location={location}
                    onLocationChange={setLocation}
                    onCoordinatesChange={setCoordinates}
                    statusLabel="Selected Location"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-lg bg-forest hover:bg-[#204a33] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      {role === "ngo" ? "Create NGO account" : "Create Donor account"}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-line text-center">
                <p className="text-sm text-muted">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="mt-2 text-sm text-forest font-semibold hover:underline cursor-pointer"
                >
                  Log in instead
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-xs text-muted pt-6">
          KindRoute · A space for community kindness and verified giving
        </footer>
      </div>
    </div>
  );
}
