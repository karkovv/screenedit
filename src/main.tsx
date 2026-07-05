import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import Privacy from "./app/Privacy.tsx";
import { LangProvider } from "./translations/LangProvider";
import "./styles/index.css";

const script = document.createElement("script");
script.type = "application/ld+json";
script.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ScreenStyler",
  "description": "Бесплатный онлайн-редактор для стилизации скриншотов и изображений. Обрезка, фон, градиенты, тени, скругления. Без рекламы и регистрации.",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "url": "https://screenstyler.vercel.app/",
});
document.head.appendChild(script);

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
