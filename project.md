# ScreenEdit

## Что это
Веб-приложение для редактирования и стилизации скриншотов и изображений: загрузка → кроп → наложение фона (solid/gradient/transparent), скруглений, тени → экспорт PNG/JPEG/WebP.

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

## Структура
```
ScreenEdit web app/
├── heart-icon.svg           — иконка для кнопки доната
├── index.html               — SEO-метатеги (OG/Twitter/hreflang), CSP, favicon
├── logo.svg                 — логотип проекта (230×42, иконка + текст)
├── favicon.png              — PNG фавикон (54×54)
├── fav.svg                  — SVG фавикон (512×512)
├── vercel.json              — сборка, реврайты SPA
├── public/
│   ├── favicon.ico          — старый .ico
│   ├── favicon.svg          — копия fav.svg
│   ├── favicon.png          — копия favicon.png
│   ├── fav.png              — копия fav.png
│   ├── fav.svg              — копия fav.svg
│   ├── logo.svg             — копия для статики
│   ├── og-img.png           — OG-изображение 137KB
│   ├── qr-donate-donationalers.png — QR для донатов
│   ├── robots.txt           — Allow: /, sitemap
│   └── sitemap.xml          — / + /privacy
├── src/
│   ├── main.tsx             — точка входа + инжект JSON-LD
│   ├── translations/
│   │   ├── strings.ts       — EN/RU строки интерфейса
│   │   ├── LangProvider.tsx — контекст и хук useLang()
│   │   └── index.ts
│   ├── styles/
│   │   ├── index.css        — импорт fonts + tailwind + theme
│   │   ├── theme.css        — CSS-переменные, @layer base, тёмная тема, слайдеры, ReactCrop
│   │   ├── tailwind.css     — @import 'tailwindcss'
│   │   └── fonts.css        — Inter Google Fonts
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
- Drag & drop / click / **Ctrl+V** загрузка изображения (лимит 50MB)
- Drag & drop на область превью (десктоп) — визуальный оверлей при перетаскивании
- **Кроп изображения**: react-image-crop + превью в 0.5x scale для попадания в область
- **Undo/Redo** — для кропа, удаления и сброса настроек (Ctrl+Z / Ctrl+Shift+Z)
- Настройка фона: Solid / Gradient / None (прозрачный)
  - Gradient: два color picker'а From → To + **угол наклона** (слайдер + ручной ввод, 0–360°)
  - Визуальный индикатор угла (круг с вращающейся линией)
  - Плавное появление/скрытие через AnimatePresence
- Размер Canvas: W × H (дефолт 1920×1080), настраиваемые числовые поля
- **Image Size** — слайдер 10–100%: масштаб изображения относительно холста (дефолт 75%)
- **Положение изображения**: визуальная сетка 3×3 с 9 пресетами (центр, углы, края)
- Border Radius — отдельно для фона (Bg) и изображения (Image), до 100px
- Тень: **чекбокс вкл/выкл**, Offset X/Y, Blur, Spread, Opacity, Color
- **Кастомный Sketch-пикер цвета** — для цветовых полей (bgColor, gradientFrom, gradientTo, shadow)
  - Popover с spring-анимацией, teal border, backdrop
  - **Preset-сваты** (14 цветов) для bgColor и shadow — быстрый выбор без открытия пикера
- **Кнопки сброса** для каждой настройки (стрелка возврата к дефолту)
- **Переключатель языка**: EN / RU (через хедер), сохраняется в стейте
- **Удаление скрина**: кнопка X в зоне загрузки
- **Donation popup**: кнопка с сердечком → модалка с QR + ссылкой DonationAlerts
- **Privacy page**: отдельная страница /privacy (GDPR, Google Fonts, Vercel)
- Сброс всех настроек в дефолт
- Тёмная тема по умолчанию (`<html class="dark">`), переключается через хедер
- Логотип: инлайновый SVG компонент, текст адаптируется к теме (currentColor)
- **Экспорт**: Download с выбором PNG / JPEG / WebP, Copy to clipboard
  - На мобильных: Download на всю ширину, Copy скрыт
- Canvas рендеринг: clip по borderRadius → фон → shadow → изображение (нет белых углов)
- **Безопасность canvas**: `Math.max(1, Math.ceil(...))` на все canvas dimensions — предотвращает ошибки drawImage при 0×0

## Ключевые особенности верстки
- `h-screen overflow-hidden` на root — страница не скроллится
- Flex цепочка: root → content → main → row → панели
- `min-h-0` на каждом flex-ребёнке — разрешает сжатие ниже контента
- Левая панель (настройки): `overflow-y-auto` — скролл если не влазит
- Левая панель: `lg:pl-0 lg:pt-0` — на десктопе без левого/верхнего паддинга
- Правая панель (превью): обе панели stretch на всю высоту
- Превью в чекерборде (checkerboard)
- Left/горизонтальный сплит: 25% / 75%

## Мобильная вёрстка (< 1024px)
- **Лейаут**: превью сверху (flex-1), панель настроек снизу
- **Порядок**: контент настройки (scrollable) → таб-бар (снизу)
- **Таб-бар**: 4 вкладки — Background (Palette), Canvas (Maximize2), Corners (Square), Shadow (Layers)
- **Анимация табов**: `AnimatePresence mode="wait" initial={false}`, fade + slide 4px, 150ms
- **Хедер**: компактные иконки, скрытый текст на donate, мелкие кнопки lang/theme
- **Дропзона**: интегрирована в область превью (`<label htmlFor>` для iOS Safari) при отсутствии изображения
- **Хит-области**: табы ≥ 44px ширины, все кнопки `active:scale-[0.96]`
- **Высота панели**: `max-h[35vh]`, overflow-y-auto
- **Адаптив**: `useMediaQuery("(min-width: 1024px)")` хук, условный рендеринг desktop/mobile лейаутов
- **Ресет-кнопка**: в таб-баре справа, применяет `DEFAULT_SETTINGS`

## Превью (reactive rAF batching)
- Рендерится в оффскрин-канвас в **0.5x scale** для производительности
- `cancelAnimationFrame` + `requestAnimationFrame` — избегает дублирующих рендеров
- `renderVersion` ref — отменяет устаревшие рендеры (stale render guard)
- Результат: `<img src={dataURL} />` — plain img swap

## Оптимизация Canvas рендеринга
- **ImageBitmap кеш** — изображение декодируется один раз при загрузке, переиспользуется на всех перерисовках (слайдеры, настройки)
- **`bitmapVersion` state** — триггерит ре-рендер превью после загрузки ImageBitmap (фикс race condition)
- **Temp canvas reuse** — временный canvas для shadow/rounded image создаётся один раз через ref, не аллоцируется заново
- `imageSmoothingQuality: "high"` — качественный рендер при масштабировании
- `settings.shadowEnabled` — отключение тени пропускает shadow-блок полностью

## Canvas экспорт (renderToCanvas)
- `Promise<void>` — синхронный (ImageBitmap кеширован, нет ожидания загрузки)
- Canvas размер = bgWidth × bgHeight (scale=1, полный размер)
- Весь контент обрезается по borderRadius фона через `ctx.clip()` — ни пустых углов
- Градиент поддерживает угол наклона через `getGradientCoords()` (тригонометрия от центра)
- Позиция изображения: 9 пресетов (центр/углы/края), вычисляется как `(bw - dispW) * fx`
- Экспорт через `toBlob` с качеством 1.0 для JPEG/WebP
- Все canvas dimensions защищены `Math.max(1, Math.ceil(...))` — guard от 0×0 при дробных значениях

## Безопасность
- **CSP** в index.html: `default-src 'self'`, `script-src 'self'` (без unsafe-inline)
- Файлы загружаются только через `accept="image/*"` + MIME-проверка
- Лимит размера файла: 50MB
- `rel="noopener noreferrer"` на внешних ссылках
- Все изображения — data URL, не покидают браузер

## Зависимости (6 runtime)
```
@uiw/react-color-sketch  lucide-react  motion  react-image-crop  react-router  tw-animate-css
```
(очищено от ~40 неиспользуемых: MUI, Radix, recharts и др.)

## Известные баги / TODO
- [ ] Нет обработки resize окна для canvas (export всегда полный размер, ок)
- [ ] Нет английской версии OG-изображения (сейчас только RU)
- [ ] Copy to clipboard не работает на мобильных (iOS Safari не даёт вставить вне браузера) — скрыт на mobile layout
