import { useEffect, useState } from "react";
import App from "./App";
import LandingPage from "./components/LandingPage";

export default function RootApp() {
  const [dashboard, setDashboard] = useState(
    location.hash.startsWith("#dashboard"),
  );
  const [entry, setEntry] = useState({});

  useEffect(() => {
    const handleNavigation = () => {
      const nextDashboard = location.hash.startsWith("#dashboard");
      setDashboard(nextDashboard);
      if (nextDashboard || !location.hash) window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handleNavigation);
    return () => window.removeEventListener("hashchange", handleNavigation);
  }, []);

  function enterWorkspace(role, register = false) {
    setEntry({ initialRole: role, initialRegistration: register });
    location.hash = "dashboard";
    window.scrollTo(0, 0);
  }

  return dashboard ? (
    <App
      {...entry}
      onHome={() => {
        location.hash = "";
      }}
    />
  ) : (
    <LandingPage onEnter={enterWorkspace} />
  );
}
