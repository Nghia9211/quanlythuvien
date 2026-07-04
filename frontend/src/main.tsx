import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createServices } from "./composition/create-services";
import { App } from "./presentation/app/app";
import "./presentation/styles/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found");

createRoot(root).render(<StrictMode><App services={createServices()} /></StrictMode>);
