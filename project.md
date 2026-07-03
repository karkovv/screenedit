# ScreenStyler

## Что это
Веб-приложение для стилизации скриншотов: загрузка → наложение фона, скруглений, тени → экспорт PNG.

## Стек
- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4 + `tw-animate-css`
- `motion` (framer-motion преемник) — анимации (AnimatePresence, motion.div)
- Lucide React — иконки (Upload, Download, Clipboard, X, Sun, Moon, RotateCcw, Image)
- Canvas API — рендеринг экспорта

## Структура
```
ScreenStyler web app/
├── index.html              — favicon: /logo.svg
├── logo.svg                — логотип проекта
├── public/logo.svg         — копия для статики
├── src/
│   ├── main.tsx            — точка входа (LangProvider → App)
│   ├── translations/
│   │   ├── strings.ts      — EN/RU строки интерфейса
│   │   ├── LangProvider.tsx — контекст и хук useLang()
│   │   └── index.ts
│   ├── styles/
│   │   ├── index.css       — импорт fonts + tailwind + theme
│   │   ├── theme.css       — CSS-переменные, @layer base, темная тема
│   │   ├── tailwind.css    — @import 'tailwindcss'
│   │   └── fonts.css       — Inter Google Fonts
│   └── app/
│       └── App.tsx         — весь UI и логика в одном файле
```

## Основные фичи
- Drag & drop / click / **Ctrl+V** загрузка изображения
- Настройка фона: Solid / Gradient / None (прозрачный)
  - Gradient: два color picker'а From → To + **угол наклона** (слайдер + ручной ввод, 0–360°)
  - Визуальный индикатор угла (круг с вращающейся линией)
- Размер Canvas: W × H (дефолт 1920×1080), настраиваемые числовые поля
- Padding — отступ изображения от краёв фона
- Border Radius — отдельно для фона (Bg) и изображения (Image)
- Тень: Offset X/Y, Blur, Spread, Opacity, Color
- **Переключатель языка**: EN / RU (через хедер)
- **Удаление скрина**: кнопка X в зоне загрузки (SES-безопасный сброс)
- Сброс всех настроек в дефолт
- Тёмная тема по умолчанию, переключается через хедер
- Экспорт: Download как PNG, Copy to clipboard
- Canvas рендеринг: фон → тень (opaque fill) → изображение (clipped)

## Ключевые особенности верстки
- `h-screen overflow-hidden` на root + `overflow: hidden` на `html, body` — страница не скроллится
- Flex цепочка: root → content → main → row → панели
- `min-h-0` на каждом flex-ребёнке — разрешает сжатие ниже контента
- Левая панель (настройки): `overflow-y-auto` — скролл если не влазит
- Правая панель (превью): обе панели stretch на всю высоту
- Превью в чекерборде
- Left/горизонтальный сплит: 30% / 70%

## Превью (reactive rAF batching)
- Рендерится в оффскрин-канвас в **0.5x scale** для производительности
- `cancelAnimationFrame` + `requestAnimationFrame` — избегает дублирующих рендеров
- `renderVersion` ref — отменяет устаревшие рендеры (stale render guard)
- Результат: `<img src={dataURL} />` — plain img swap

## Canvas экспорт (renderToCanvas)
- `Promise<void>` — асинхронный, ждёт загрузки `new Image()`
- Canvas размер = bgWidth × bgHeight (scale=1, полный размер)
- Изображение центрируется внутри canvas с учётом padding
- Градиент поддерживает угол наклона через `getGradientCoords()` (тригонометрия от центра)
- `img.onerror = () => resolve()` — не зависает при ошибке

## Удалённые компоненты (Figma-шаблон)
- Все shadcn/ui компоненты (`src/app/components/ui/`) — не использовались
- `src/app/components/figma/ImageWithFallback.tsx` — не использовался
- `figmaAssetResolver` плагин в vite.config.ts — ни один импорт не использовал `figma:asset/`
- `default_shadcn_theme.css` — не импортировался
- `src/styles/globals.css` — не импортировался

## Известные баги / TODO
- [ ] Нет обработки resize окна для canvas (export всегда полный размер, ок)
