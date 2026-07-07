# ScreenEdit

## Что это
Веб-приложение для редактирования и стилизации скриншотов и изображений: загрузка → кроп → наложение фона (solid/gradient/transparent), скруглений, тени, **текстовых оверлеев** → экспорт PNG/JPEG/WebP.

**→ https://screenedit.online**

## Стек
- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4 + `tw-animate-css`
- `motion` (framer-motion преемник) — анимации (AnimatePresence, motion.div)
- Lucide React — иконки
- Canvas API — рендеринг экспорта
- react-router v7 — роутинг (/ → App, /privacy → Privacy)
- react-image-crop v11 — кроп изображения
- @uiw/react-color-sketch — кастомный Sketch-пикер цвета
- **Google Fonts** — 13 шрифтов (Inter, Roboto, Montserrat, Open Sans, Lato, Nunito, Poppins, Ubuntu, Playfair Display, Fira Code, Space Grotesk, DM Sans, Bebas Neue)

## Структура
```
ScreenEdit web app/
├── ATTRIBUTIONS.md          — атрибуция (shadcn/ui, Unsplash, Google Fonts)
├── README.md                — описание проекта
├── project.md               — этот файл
├── heart-icon.svg           — иконка для кнопки доната
├── index.html               — SEO-метатеги (OG/Twitter/hreflang), CSP, favicon
├── logo.svg                 — логотип проекта (230×42, иконка + текст)
├── vercel.json              — сборка, реврайты SPA
├── public/
│   ├── favicon.ico / .svg / .png
│   ├── og-img.png           — OG-изображение 137KB
│   ├── qr-donate-donationalers.png — QR для донатов
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.tsx             — точка входа + инжект JSON-LD
│   ├── translations/
│   │   ├── strings.ts       — EN/RU строки интерфейса
│   │   ├── LangProvider.tsx — контекст, хук useLang(), авто-определение языка
│   │   └── index.ts
│   ├── styles/
│   │   ├── index.css        — импорт fonts + tailwind + theme
│   │   ├── theme.css        — CSS-переменные, @layer base, тёмная тема, слайдеры, ReactCrop
│   │   ├── tailwind.css     — @import 'tailwindcss'
│   │   └── fonts.css        — 13 Google Fonts (Inter, Roboto, Montserrat и др.)
│   └── app/
│       ├── App.tsx          — основной UI (все контролы + превью, mobile/desktop лейауты)
│       ├── Logo.tsx         — React-компонент SVG логотипа (inline, currentColor)
│       ├── useMediaQuery.ts — хук для определения ширины экрана
│       └── Privacy.tsx      — страница политики конфиденциальности
```

## SEO / Продвижение
- **Title**: «Редактирование и стилизация скриншотов и изображений онлайн | ScreenEdit»
- **Description**: Бесплатный онлайн-редактор для стилизации скриншотов и изображений
- **OG/Twitter**: заголовок, описание, изображение (og-img.png 1200×630)
- **Hreflang**: ru, en, x-default → https://screenedit.online/
- **JSON-LD** (инжектится через JS): SoftwareApplication, бесплатно, DesignApplication
- **Robots**: index, follow
- **Sitemap.xml**: / (1.0), /privacy (0.3)
- **CSP**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:`

## Домены
- **screenedit.online** — основной (Vercel DNS, NS: ns1/ns2.vercel-dns.com)
- **www.screenedit.online** — алиас
- **screenstyler.vercel.app** — старый проект

## Основные фичи

### Стилизация изображения
- Drag & drop / click / **Ctrl+V** загрузка изображения (лимит 50MB)
- Drag & drop на область превью (десктоп) — визуальный оверлей при перетаскивании
- **Кроп изображения**: react-image-crop + превью в 0.5x scale
- **Undo/Redo** — для кропа, текста, удаления и сброса настроек (Ctrl+Z / Ctrl+Shift+Z)
- Настройка фона: Solid / Gradient / None (прозрачный)
  - Gradient: два color picker'а From → To + угол наклона (слайдер 0–360°)
  - Визуальный индикатор угла с вращающейся линией
- Размер Canvas: W × H (дефолт 1920×1080)
- **Image Size** — слайдер 10–100%
- **Положение изображения**: сетка 3×3, 9 пресетов
- Border Radius — для фона и изображения (до 100px)
- Тень: чекбокс + Offset X/Y, Blur, Spread, Opacity, Color

### Текстовые оверлеи
- **Добавление текста** — кнопка в тулбаре, создаёт новый текстовый слой
- **Перетаскивание** мышью/пальцем — Pointer Events + direct DOM (без ререндеров через setState)
- **Ресайз** — 8 хендлов (4 угла + 4 грани), пропорциональное масштабирование
- **Поворот** — круглый хендл за пределами угла, курсор Lucide rotate-ccw
  - **Shift + 45° snap** — при зажатом Shift поворот кратен 45°
- **Shift + drag** — движение только по горизонтали/вертикали
- **21 шрифт**: Inter, Open Sans, Lato, Roboto, Montserrat, Nunito, Poppins, Ubuntu, Playfair Display, Fira Code, Space Grotesk, DM Sans, Bebas Neue + системные (Arial, Verdana, Georgia, Times New Roman, Courier New, Impact, Trebuchet MS, system-ui)
- **Weight (100–900)**, фильтруется по поддерживаемым font'ом
- **Italic** — переключатель
- **Размер шрифта**: 8–400 px (слайдер + хендлы)
- **Цвет текста**: Sketch-пикер с пресетами
- **Тень текста**: тоггл + Offset X/Y, Blur, Opacity, Color (как у тени скрина)
- **Удаление текста** — кнопка Trash2 в тулбаре (справа)
- **Клик вне текста** → сброс выделения + выход из режима
- **Escape** → выход из textMode
- **Автофокус** textarea при выборе текста
- Текст отображается через DOM overlay (canvas — только фон + скругления)

### Экспорт и UX
- **Экспорт**: Download (PNG / JPEG / WebP), Copy to clipboard (desktop)
  - На мобильных: Download на всю ширину, Copy скрыт
- **Язык**: EN / RU — автоопределение по `navigator.language`, ручное переключение в хедере
- **Тёмная тема**: по умолчанию (`<html class="dark">`), переключается в хедере
- **Donation popup**: сердечко → модалка с QR + DonationAlerts
- **Privacy page**: /privacy (GDPR, Google Fonts, Vercel)
- **Сброс всех настроек** в дефолт

## Canvas рендеринг

### Экспорт (renderToCanvas)
- `Promise<void>`
- Canvas размер = bgWidth × bgHeight (scale=1, полный размер)
- Весь контент обрезается по borderRadius фона через `ctx.clip()`
- Градиент с углом наклона через `getGradientCoords()`
- Позиция изображения: `(bw - dispW) * fx`
- **Текст отрисовывается** на полном разрешении (шрифты, вес, курсив, поворот, тень)
- Экспорт через `toBlob` с качеством 1.0 для JPEG/WebP
- Все canvas dimensions защищены `Math.max(1, Math.ceil(...))`

### Preview (превью в браузере)
- Оффскрин-канвас в 0.5x scale — **без текста**
- `cancelAnimationFrame` + `requestAnimationFrame` + stale render guard
- `renderVersion` ref — отмена устаревших рендеров
- Текст отображается DOM overlay-ями (точное позиционирование, клик/тач)
- ImageBitmap кеш + temp canvas reuse

## Оптимизации
- **ImageBitmap кеш** — изображение декодируется один раз
- **`bitmapVersion` state** — триггерит ре-рендер после загрузки ImageBitmap
- **Temp canvas reuse** — один временный canvas через ref для shadow/rounded image
- **Прямой DOM** при drag текста — без setState, без ререндеров (smooth 60fps)
- `imageSmoothingQuality: "high"`

## Безопасность
- **CSP** в index.html: `default-src 'self'`, `script-src 'self'`
- Файлы: `accept="image/*"` + MIME-проверка, лимит 50MB
- `rel="noopener noreferrer"` на внешних ссылках
- Все изображения — data URL, не покидают браузер
- Google Fonts загружаются напрямую с fonts.googleapis.com

## Зависимости (6 runtime)
```
@uiw/react-color-sketch  lucide-react  motion  react-image-crop  react-router  tw-animate-css
```

## Мобильная вёрстка (< 1024px)
- **Лейаут**: превью сверху (flex-1), панель настроек снизу
- **Таб-бар**: 5 вкладок — Background, Canvas, Corners, Shadow, Text
- **Хедер**: компактные иконки
- **Дропзона**: интегрирована в превью (`<label htmlFor>` для iOS Safari)
- **Текст**: таб "Text" с полным редактором (шрифт, вес, размер, цвет, тень, поворот)

## Известные баги / TODO
- [ ] Нет английской версии OG-изображения (сейчас только RU)
- [ ] Copy to clipboard не работает на мобильных (iOS Safari) — скрыт
- [ ] При drag текста в textMode — canvas-превью не обновляется до pointerup (фича для производительности, ghost на старой позиции)
