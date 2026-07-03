# Screenshot Styler

## Что это
Веб-приложение для стилизации скриншотов: загрузка → наложение фона, скруглений, тени → экспорт PNG.

## Стек
- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4 + `tw-animate-css`
- `motion` (framer-motion преемник) — анимации
- Lucide React — иконки
- MUI + Radix UI (установлены, не используются активно)
- Canvas API — рендеринг экспорта

## Структура
```
Screenshot Styler web app/
├── index.html              — favicon: /logo.svg
├── logo.svg                — логотип проекта
├── public/logo.svg         — копия для статики
├── src/
│   ├── main.tsx            — точка входа
│   ├── styles/
│   │   ├── index.css       — импорт fonts + tailwind + theme
│   │   ├── theme.css       — CSS-переменные, @layer base, темная тема
│   │   ├── tailwind.css    — @import 'tailwindcss'
│   │   └── fonts.css       — Inter Google Fonts
│   └── app/
│       └── App.tsx         — весь UI и логика в одном файле
```

## Основные фичи
- Drag & drop / click загрузка изображения
- Настройка фона: Solid / Gradient / None (прозрачный)
  - Gradient: два color picker'а From → To
- Размер Canvas: W × H (дефолт 1920×1080), настраиваемые числовые поля
- Padding — отступ изображения от краёв фона
- Border Radius — отдельно для фона (Bg) и изображения (Image)
- Тень: Offset X/Y, Blur, Spread, Opacity, Color
- Сброс настроек в дефолт
- Тёмная тема по умолчанию, переключается через хедер
- Экспорт: Download как PNG, Copy to clipboard
- Canvas рендеринг: фон → тень (opaque fill) → изображение (clipped)

## Ключевые особенности верстки
- `h-screen overflow-hidden` на root + `overflow: hidden` на `html, body` — страница не скроллится
- Flex цепочка: root → content → main → row → панели
- `min-h-0` на каждом flex-ребёнке — разрешает сжатие ниже контента
- Левая панель (настройки): `overflow-y-auto` — скролл если не влазит
- Правая панель (превью): обе панели stretch на всю высоту
- Превью в чекерборде: absolute-контейнер `inset: 32px`, внутри background div с JS-вычисленным `fitScale` (ResizeObserver), чтобы фон 1920×1080 вписывался в окно с сохранением пропорций
- Left/горизонтальный сплит: 30% / 70%

## Canvas экспорт (renderToCanvas)
- `Promise<void>` — асинхронный, ждёт загрузки `new Image()`
- Canvas размер = bgWidth × bgHeight (scale=1, полный размер)
- Изображение центрируется внутри canvas с учётом padding
- `img.onerror = () => resolve()` — не зависает при ошибке

## Известные баги / TODO
- [ ] Нет превью canvas (previewCanvasRef удалён)
- [ ] Нет обработки resize окна для canvas (export всегда полный размер, ок)
