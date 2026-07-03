import { Link } from "react-router";
import { useLang } from "../translations/LangProvider";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const { lang } = useLang();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: July 2026",
      summary: "ScreenStyler is a fully client-side tool. Nothing leaves your browser except standard web requests described below.",
      sections: [
        {
          title: "1. What we process",
          items: [
            "The image you upload is processed entirely in your browser using the Canvas API. It is never sent to any server.",
            "All style settings (background color, shadow, border radius, etc.) stay in your browser's memory and are discarded when you close the page.",
          ],
        },
        {
          title: "2. External services",
          items: [
            "Google Fonts — the Inter font is loaded from fonts.googleapis.com and fonts.gstatic.com. Your browser sends your IP address and User-Agent to Google as part of a standard font request. See Google's privacy policy for details.",
            "Vercel — the app is hosted on Vercel. Vercel collects standard server logs (IP address, request timestamp, requested URL, User-Agent) for operational purposes. See Vercel's Data Processing Agreement.",
          ],
        },
        {
          title: "3. Cookies and tracking",
          items: [
            "No cookies are used.",
            "No analytics, trackers, or fingerprinting scripts are loaded.",
            "No localStorage or sessionStorage is used.",
          ],
        },
        {
          title: "4. Data storage",
          items: [
            "We do not store, upload, or share your images or any other personal data.",
            "No user accounts, no registration, no forms.",
          ],
        },
        {
          title: "5. Your rights",
          items: [
            "Since we collect no personal data, there is nothing to access, correct, or delete.",
            "For questions, contact: dev.karkovv@proton.me",
          ],
        },
      ],
      back: "Back to app",
    },
    ru: {
      title: "Политика конфиденциальности",
      lastUpdated: "Обновлено: июль 2026",
      summary: "ScreenStyler — полностью клиентский инструмент. Никакие данные не покидают ваш браузер, кроме стандартных запросов, описанных ниже.",
      sections: [
        {
          title: "1. Что мы обрабатываем",
          items: [
            "Загруженное изображение обрабатывается целиком в вашем браузере через Canvas API. Оно никогда не отправляется на сервер.",
            "Все настройки стиля (фон, тень, радиус и т.д.) остаются в памяти браузера и удаляются при закрытии страницы.",
          ],
        },
        {
          title: "2. Внешние сервисы",
          items: [
            "Google Fonts — шрифт Inter загружается с fonts.googleapis.com и fonts.gstatic.com. Браузер передаёт IP-адрес и User-Agent на серверы Google в рамках стандартного запроса шрифта. Подробнее — в политике конфиденциальности Google.",
            "Vercel — приложение размещено на Vercel. Vercel собирает стандартные серверные логи (IP-адрес, время запроса, URL, User-Agent) в целях эксплуатации. Подробнее — в соглашении об обработке данных Vercel.",
          ],
        },
        {
          title: "3. Куки и отслеживание",
          items: [
            "Файлы cookie не используются.",
            "Аналитика, трекеры и скрипты снятия отпечатков не загружаются.",
            "localStorage и sessionStorage не используются.",
          ],
        },
        {
          title: "4. Хранение данных",
          items: [
            "Мы не храним, не загружаем и не передаём ваши изображения или любые другие персональные данные.",
            "Нет учётных записей, регистрации и форм.",
          ],
        },
        {
          title: "5. Ваши права",
          items: [
            "Поскольку мы не собираем персональные данные, доступ к ним, их исправление или удаление невозможны — их просто нет.",
            "По вопросам: dev.karkovv@proton.me",
          ],
        },
      ],
      back: "На главную",
    },
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#49c5b6] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {c.back}
        </Link>

        <h1 className="text-2xl font-bold mb-1">{c.title}</h1>
        <p className="text-xs text-muted-foreground mb-6">{c.lastUpdated}</p>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{c.summary}</p>

        <div className="space-y-8">
          {c.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-base font-semibold mb-3">{s.title}</h2>
              <ul className="space-y-2">
                {s.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed pl-4 relative">
                    <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-[#49c5b6] opacity-60" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
