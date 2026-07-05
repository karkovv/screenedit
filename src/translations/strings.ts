export type Lang = "en" | "ru";

export type StringKey = keyof typeof strings;

export const strings = {
  // Header
  appTitle: { en: "ScreenEdit", ru: "ScreenEdit" },
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
  paddingVertical: { en: "Top / Bottom", ru: "Сверху / Снизу" },
  paddingHorizontal: { en: "Left / Right", ru: "Слева / Справа" },
  canvasSize: { en: "Canvas Size", ru: "Размер холста" },
  bgRadius: { en: "Bg Radius", ru: "Радиус фона" },
  imageRadius: { en: "Image Radius", ru: "Радиус изображения" },
  layout: { en: "Canvas Settings", ru: "Настройки Canvas" },
  corners: { en: "Corners", ru: "Углы" },
  shadow: { en: "Shadow", ru: "Тень" },
  offsetX: { en: "Offset X", ru: "Смещение X" },
  offsetY: { en: "Offset Y", ru: "Смещение Y" },
  blur: { en: "Blur", ru: "Размытие" },
  spread: { en: "Spread", ru: "Размах" },
  opacity: { en: "Opacity", ru: "Непрозрачность" },
  color: { en: "Color", ru: "Цвет" },
  resetToDefaults: { en: "Reset to defaults", ru: "Сбросить настройки" },
  remove: { en: "Remove image", ru: "Удалить" },
  cropImage: { en: "Crop image", ru: "Обрезать" },
  cropApply: { en: "Apply", ru: "Применить" },
  cropCancel: { en: "Cancel", ru: "Отмена" },

  // Right panel
  styledPreview: { en: "Styled preview", ru: "Стилизованный превью" },
  noImageYet: { en: "No image yet", ru: "Нет изображения" },
  uploadToSeePreview: { en: "Upload to see your preview", ru: "Загрузите, чтобы увидеть превью" },
  yourStyledScreenshot: { en: "Your styled screenshot will appear here", ru: "Ваш стилизованный скриншот появится здесь" },
  downloadStyledImage: { en: "Download styled image", ru: "Скачать изображение" },
  copyToClipboard: { en: "Copy to clipboard", ru: "Скопировать в буфер" },
  copied: { en: "Copied!", ru: "Скопировано!" },

  // Footer
  footerPrivacy: { en: "ScreenEdit runs entirely in your browser. We don't store, upload, or share your images.", ru: "ScreenEdit работает полностью в вашем браузере. Мы не храним, не загружаем и не передаём ваши изображения." },

  // Donation
  donate: { en: "Donate", ru: "Донат" },
  donateTitle: { en: "Support the project", ru: "Поддержать проект" },
  donateText: { en: "ScreenEdit is completely free and ad-free. If you like it and find it useful in your work, you can support me with a donation for tea :)", ru: "ScreenEdit полностью бесплатный и без рекламы. Если он вам нравится и полезен в работе, вы можете поддержать меня донатом на чай :)" },
  donateLink: { en: "Open DonationAlerts", ru: "Открыть DonationAlerts" },
  close: { en: "Close", ru: "Закрыть" },
};
