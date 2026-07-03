
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { LangProvider } from "./translations/LangProvider";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <LangProvider>
      <App />
    </LangProvider>
  );
  