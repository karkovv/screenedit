import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import Privacy from "./app/Privacy.tsx";
import { LangProvider } from "./translations/LangProvider";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <LangProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </BrowserRouter>
  </LangProvider>
);
