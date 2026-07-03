export type Lang = "en" | "ru";

export type StringKey = keyof typeof strings;

export const strings = {
  // Header
  appTitle: { en: "ScreenStyler", ru: "ScreenStyler" },
  toggleDark: { en: "Toggle dark mode", ru: "Переключить тему" },
  lightMode: { en: "Light mode", ru: "Светлая тема" },
  darkMode: { en: "Dark mode", ru: "Тёмная тема" },

  // Left panel
  uploadAndSettings: { en: "Upload & Settings", ru: "Загрузка и настройки" },
  imageLoaded: { en: "Image loaded", ru: "Изображение загружено" },
  clickToReplace: { en: "Click or drag to replace", ru: "Нажмите или перетащите, чтобы заменить" },
  dropScreenshot: { en: "Drop your screenshot or", ru: "Перетащите скриншот или" },
  clickToBrowse: { en: "click to browse", ru: "нажмите для выбора" },
  anySize: { en: "PNG, JPG, WebP — any size", ru: "PNG, JPG, WebP — любой размер" },
  stylingControls: { en: "Styling Controls", ru: "Настройки стиля" },
  background: { en: "Background", ru: "Фон" },
  solid: { en: "Solid", ru: "Заливка" },
  gradient: { en: "Gradient", ru: "Градиент" },
  none: { en: "None", ru: "Нет" },
  from: { en: "From", ru: "От" },
  to: { en: "To", ru: "До" },
  gradientAngle: { en: "Angle", ru: "Угол" },
  padding: { en: "Padding", ru: "Отступ" },
  canvasSize: { en: "Canvas Size", ru: "Размер холста" },
  bgRadius: { en: "Bg Radius", ru: "Радиус фона" },
  imageRadius: { en: "Image Radius", ru: "Радиус изображения" },
  shadow: { en: "Shadow", ru: "Тень" },
  offsetX: { en: "Offset X", ru: "Смещение X" },
  offsetY: { en: "Offset Y", ru: "Смещение Y" },
  blur: { en: "Blur", ru: "Размытие" },
  spread: { en: "Spread", ru: "Размах" },
  opacity: { en: "Opacity", ru: "Непрозрачность" },
  color: { en: "Color", ru: "Цвет" },
  resetToDefaults: { en: "Reset to defaults", ru: "Сбросить настройки" },
  remove: { en: "Remove image", ru: "Удалить" },

  // Right panel
  styledPreview: { en: "Styled preview", ru: "Стилизованный превью" },
  noImageYet: { en: "No image yet", ru: "Нет изображения" },
  uploadToSeePreview: { en: "Upload to see your preview", ru: "Загрузите, чтобы увидеть превью" },
  yourStyledScreenshot: { en: "Your styled screenshot will appear here", ru: "Ваш стилизованный скриншот появится здесь" },
  downloadStyledImage: { en: "Download styled image", ru: "Скачать изображение" },
  copyToClipboard: { en: "Copy to clipboard", ru: "Скопировать в буфер" },
  copied: { en: "Copied!", ru: "Скопировано!" },
};
