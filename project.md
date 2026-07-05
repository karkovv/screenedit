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
├── logo.svg                 — логотип проекта
├── vercel.json              — сборка, реврайты SPA
├── public/
│   ├── favicon.ico          — копия logo.svg
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
- **Кроп изображения**: react-image-crop + превью в 0.5x scale для попадания в область
- **Undo/Redo** — для кропа, удаления и сброса настроек (Ctrl+Z / Ctrl+Shift+Z)
- Настройка фона: Solid / Gradient / None (прозрачный)
  - Gradient: два color picker'а From → To + **угол наклона** (слайдер + ручной ввод, 0–360°)
  - Визуальный индикатор угла (круг с вращающейся линией)
  - Плавное появление/скрытие через AnimatePresence
- Размер Canvas: W × H (дефолт 1920×1080), настраиваемые числовые поля
- Padding — отступ изображения от краёв фона
- Border Radius — отдельно для фона (Bg) и изображения (Image), до 100px
- Тень: **чекбокс вкл/выкл**, Offset X/Y, Blur, Spread, Opacity, Color
- **Кастомный Sketch-пикер цвета** — для всех 4 цветовых полей (bgColor, gradientFrom, gradientTo, shadow)
  - Popover с spring-анимацией, teal border, backdrop
- **Кнопки сброса** для каждой настройки (стрелка возврата к дефолту)
- **Переключатель языка**: EN / RU (через хедер), сохраняется в стейте
- **Удаление скрина**: кнопка X в зоне загрузки
- **Donation popup**: кнопка с сердечком → модалка с QR + ссылкой DonationAlerts
- **Privacy page**: отдельная страница /privacy (GDPR, Google Fonts, Vercel)
- Сброс всех настроек в дефолт
- Тёмная тема по умолчанию (`<html class="dark">`), переключается через хедер
- **Экспорт**: Download с выбором PNG / JPEG / WebP, Copy to clipboard
- Canvas рендеринг: clip по borderRadius → фон → shadow → изображение (нет белых углов)

## Ключевые особенности верстки
- `h-screen overflow-hidden` на root — страница не скроллится
- Flex цепочка: root → content → main → row → панели
- `min-h-0` на каждом flex-ребёнке — разрешает сжатие ниже контента
- Левая панель (настройки): `overflow-y-auto` — скролл если не влазит
- Правая панель (превью): обе панели stretch на всю высоту
- Превью в чекерборде (checkerboard)
- Left/горизонтальный сплит: 25% / 75%

## Мобильная вёрстка (< 1024px)
- **Лейаут**: превью сверху (flex-1), панель настроек снизу
- **Таб-бар**: 4 вкладки — Background (Palette), Canvas (Maximize2), Corners (Square), Shadow (Layers)
- **Анимация табов**: `AnimatePresence mode="wait" initial={false}`, fade + slide 4px, 150ms
- **Хедер**: компактные иконки, скрытый текст на donate, мелкие кнопки lang/theme
- **Дропзона**: интегрирована в область превью (dashed border overlay при отсутствии изображения)
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
- Экспорт через `toBlob` с качеством 1.0 для JPEG/WebP

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
