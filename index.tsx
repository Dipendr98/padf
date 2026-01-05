/**
 * Client entry point
 *
 * Renders the App component. Do not modify this file.
 * Update App.tsx to build your application UI.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
