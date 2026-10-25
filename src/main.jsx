import React from "react";
import { createRoot } from "react-dom/client";
import RootApp from "./RootApp";
import "./styles.css";
import "./landing.css";
import "./ngo.css";
import "./donor.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
