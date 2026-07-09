import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./app/router.js";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}
