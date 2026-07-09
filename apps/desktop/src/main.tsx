import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./app/router.js";
import { RuntimeProvider } from "./app/platform/runtimeContext.js";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RuntimeProvider>
        <AppRouter />
      </RuntimeProvider>
    </React.StrictMode>
  );
}
