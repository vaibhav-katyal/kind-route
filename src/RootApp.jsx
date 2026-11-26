import { useEffect, useState } from "react";
import App from "./App";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import api, { getToken, removeToken } from "./api";

export default function RootApp() {
  // Screen can be: 'landing' | 'auth' | 'dashboard'
  const [screen, setScreen] = useState("landing");
  const [authConfig, setAuthConfig] = useState({
    mode: "login",
    role: "donor",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Check login on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
            setScreen("dashboard");
            location.hash = "dashboard";
            setInitializing(false);
            return;
          }
        } catch {
          removeToken();
        }
      }
      // If not logged in, user strictly sees landing page
      setCurrentUser(null);
      setScreen("landing");
      if (location.hash === "#dashboard") {
        location.hash = "";
      }
      setInitializing(false);
    };

    checkAuth();

    const handleNavigation = () => {
      if (location.hash === "#dashboard" && !getToken()) {
        location.hash = "";
        setScreen("landing");
      }
    };

    window.addEventListener("hashchange", handleNavigation);
    return () => window.removeEventListener("hashchange", handleNavigation);
  }, []);

  // When clicking login or CTA on landing page
  const handleOpenAuth = (role = "donor", register = false) => {
    setAuthConfig({
      mode: register ? "register" : "login",
      role: role || "donor",
    });
    setScreen("auth");
    window.scrollTo(0, 0);
  };

  // Auth succeeded
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setScreen("dashboard");
    location.hash = "dashboard";
    window.scrollTo(0, 0);
  };

  // Logout
  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    setScreen("landing");
    location.hash = "";
    window.scrollTo(0, 0);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-pulse text-muted text-sm font-medium">
          Loading KindRoute…
        </div>
      </div>
    );
  }

  if (screen === "auth") {
    return (
      <AuthPage
        initialMode={authConfig.mode}
        initialRole={authConfig.role}
        onSuccess={handleAuthSuccess}
        onBack={() => {
          setScreen("landing");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (screen === "dashboard" && currentUser) {
    return (
      <App
        currentUser={currentUser}
        onLogout={handleLogout}
        onHome={() => {
          setScreen("landing");
          location.hash = "";
        }}
      />
    );
  }

  // First-time or not logged in: strictly landing page
  return <LandingPage onEnter={handleOpenAuth} />;
}
