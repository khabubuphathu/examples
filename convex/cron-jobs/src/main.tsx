import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { App } from "./app";

const address = import.meta.env.VITE_CONVEX_URL;

const convex = new ConvexReactClient(address);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);