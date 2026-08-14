// ============================================================
//  ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP
// ============================================================

// tg — глобальный объект SDK, подключённого в index.html
const tg = window.Telegram.WebApp;

tg.ready();      // сообщаем Telegram, что интерфейс готов к показу
tg.expand();      // разворачиваем мини-приложение на весь экран
tg.setHeaderColor("#F2F3F5"); // цвет шапки Telegram под цвет рабочего стола

// ============================================================
//  СПИСОК "ПРЕДУСТАНОВЛЕННЫХ" ПРИЛОЖЕНИЙ ОС
// ============================================================
// Каждое приложение — объект: id, имя, иконка (эмодзи-заглушка) и функция рендера содержимого окна.
const APPS = [
  {
    id: "settings",
    name: "Настройки",
    icon: "⚙️",
    inDock: true,
    render: renderSettingsApp,
  },
  {
    id: "store",
    name: "Магазин",
    icon: "🛒",
    inDock: true,
    render: renderStoreApp,
  },
  {
    id: "chrome",
    name: "Chrome",
    icon: "🌐",
    inDock: true,
    render: (c) => renderBrowserApp(c, "https://www.google.com"),
  },
  {
    id: "notes",
    name: "Заметки",
    icon: "📝",
    inDock: false,
    render: renderNotesApp,
  },
  {
    id: "about",
    name: "О системе",
    icon: "ℹ️",
    inDock: false,
    render: renderAboutApp,
  },
  {
    id: "myfiles",
    name: "Мои файлы",
    icon: "📁",
    inDock: false,
    render: renderMyFilesApp,
  },
  {
    id: "google",
    name: "Google",
    icon: "🔍",
    inDock: false,
    render: (c) => renderBrowserApp(c, "https://www.google.com/search?q="),
  },
  {
    id: "device",
    name: "О телефоне",
    icon: "📱",
    inDock: false,
    render: renderDeviceInfoApp,
  },
  { id: "phone", name: "Телефон", icon: "📞", inDock: true, render: renderPhoneApp },
  { id: "messages", name: "Сообщения", icon: "💬", inDock: false, render: renderMessagesApp },
  { id: "camera", name: "Камера", icon: "📷", inDock: false, render: renderCameraApp },
  { id: "gallery", name: "Галерея", icon: "🌸", inDock: false, render: renderGalleryApp },
  { id: "contacts", name: "Контакты", icon: "👤", inDock: false, render: renderContactsApp },
  { id: "calendar", name: "Календарь", icon: "📅", inDock: false, render: renderCalendarApp },
  { id: "spotify", name: "Spotify", icon: "🎧", inDock: false, render: (c) => renderExternalApp(c, "Spotify", "https://open.spotify.com") },
  { id: "ytmusic", name: "YT Music", icon: "▶️", inDock: false, render: (c) => renderExternalApp(c, "YT Music", "https://music.youtube.com") },
  { id: "facebook", name: "Facebook", icon: "📘", inDock: false, render: (c) => renderExternalApp(c, "Facebook", "https://facebook.com") },
  { id: "gemini", name: "Gemini", icon: "✨", inDock: false, render: (c) => renderExternalApp(c, "Gemini", "https://gemini.google.com") },
  { id: "gplay", name: "Google Play", icon: "▶️", inDock: false, render: (c) => renderExternalApp(c, "Google Play", "https://play.google.com") },
];

// Приложения из магазина, которые уже стоят "из коробки" при первом запуске —
// как бывает, когда покупаешь новый телефон и часть софта Samsung уже установлена.
const DEFAULT_PREINSTALLED_APPS = ["calc", "weather"];

// ============================================================
//  ИКОНКИ ПРИЛОЖЕНИЙ — ПОЛНОСТЬЮ ВСТРОЕННЫЕ SVG (без внешнего CDN)
// ============================================================
// Раньше иконки грузились с внешнего CDN (unpkg/jsdelivr) — из-за политики безопасности
// внутри WebView Telegram inline-обработчик onerror мог блокироваться, и вместо отката
// на эмодзи оставалась "битая картинка". Теперь SVG лежат прямо в коде: сети не нужно,
// значит и ломаться нечему. Каждая запись — минимальный набор фигур в духе line-иконок.
const ICON_PATHS = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z"/>',
  cart: '<circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M3 4h2l2.4 11.4a1.9 1.9 0 0 0 1.9 1.6h7.4a1.9 1.9 0 0 0 1.9-1.6L21 8H6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  notes: '<path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6z"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/>',
  mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  phone: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  message: '<path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/>',
  camera: '<path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="14" r="3.5"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="14" width="5" height="7" rx="1.5"/><rect x="17" y="14" width="5" height="7" rx="1.5"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 9l6 3-6 3z"/>',
  facebook: '<path d="M15 4h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z"/>',
  sparkles: '<path d="M12 3l1.6 4.8L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.2z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h1M12 18h1M16 18h1"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-1-7.9 5 5 0 0 1 9.6-2A4.5 4.5 0 0 1 17 18z"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6z"/>',
  ruler: '<path d="M4 15l5-5 3 3 8-8"/><path d="M15 4l2.5 2.5M18 7l2 2"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3M4 12h16"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  qr: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h-3zM20 17v3h-3M17 20h-3"/>',
  checklist: '<path d="M4 6h9M4 12h9M4 18h6"/><path d="M16 6l2 2 3-3M16 16l2 2 3-3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 12h18"/>',
  language: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h6M7 12h10M7 16h10"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  movie: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14M3 10h5M16 10h5M3 15h5M16 15h5"/>',
  gamepad: '<path d="M6 9h4M8 7v4"/><circle cx="15.5" cy="8.5" r="1"/><circle cx="18" cy="11" r="1"/><path d="M6 9a4 4 0 0 0-4 4l1 5a2 2 0 0 0 3.6 1.1L9 16h6l2.4 3.1A2 2 0 0 0 21 18l1-5a4 4 0 0 0-4-4z"/>',
  radio: '<circle cx="12" cy="14" r="5"/><path d="M12 14v.01M4 9l16-5M2 9h20v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>',
  heart: '<path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11z"/>',
  run: '<circle cx="15" cy="5" r="2"/><path d="M11 21l2-6 2 2 3 1M9 15l2-4-2-3-4 1M9 8l4 1 3-3"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1.2"/><circle cx="12" cy="8" r="1.2"/><circle cx="15.5" cy="10.5" r="1.2"/><path d="M12 21a3 3 0 0 1-3-3c0-1 .5-1.5 1-2h4c.5.5 1 1 1 2a3 3 0 0 1-3 3z"/>',
  aperture: '<circle cx="12" cy="12" r="9"/><path d="M12 3v6M8 19l3-5M16 19l-3-5M4 8l6 2M20 8l-6 2"/>',
  brand_google: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 12h-8"/>',
};

// id приложения → ключ в ICON_PATHS
const APP_ICON_SLUGS = {
  settings: "settings", store: "cart", chrome: "globe", notes: "notes",
  about: "info", myfiles: "folder", google: "search", device: "mobile",
  phone: "phone", messages: "message", camera: "camera", gallery: "photo",
  contacts: "user", calendar: "calendar", spotify: "headphones", ytmusic: "play",
  facebook: "facebook", gemini: "sparkles", gplay: "play",
  calc: "calculator", weather: "cloud", flashlight: "bulb", compass: "compass",
  converter: "ruler", scanner: "scan", recorder: "mic", qr: "qr",
  todo: "checklist", cloud: "cloud", mail: "mail", office: "briefcase",
  translator: "language", chat: "message", video: "video", social: "news",
  music: "music", "video-player": "movie", games: "gamepad", podcast: "headphones",
  radio: "radio", health: "heart", fitness: "run", sleep: "moon",
  editor: "palette", "camera-pro": "aperture",
};

// Возвращает готовый HTML для иконки: встроенный SVG, если он есть в карте, иначе эмодзи-заглушка.
// Никаких сетевых запросов — значит, иконка физически не может оказаться "битой картинкой".
function iconMarkup(app) {
  const key = APP_ICON_SLUGS[app.id];
  const path = key && ICON_PATHS[key];
  if (path) {
    return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }
  return app.icon; // запасной вариант — эмодзи, если для этого id иконки ещё нет в карте
}

// ============================================================
//  ХРАНИЛИЩЕ НАСТРОЕК (localStorage — простая "сохранка" на клиенте)
// ============================================================
const STORAGE_KEY = "oneui_os_state_v1";

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* повреждённые данные — игнорируем */ }
  }
  // состояние по умолчанию, если сохранки ещё нет — как при первой настройке нового Samsung,
  // часть приложений из магазина уже "предустановлена" из коробки
  return {
    darkMode: false,
    themeMode: "day",  // "day" | "night" | "auto" — управляется в Настройках
    wallpaper: "wp1",  // id текущих обоев, см. WALLPAPERS
    installedApps: [...DEFAULT_PREINSTALLED_APPS],
    currentPage: 0,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// ============================================================
//  ОБОИ РАБОЧЕГО СТОЛА
// ============================================================
// Каждые обои — CSS-градиент на весь экран (не внешние фото — не нужен хостинг картинок
// и нет вопросов авторства). Хотите свои фото — замените css на url('ваша_картинка.jpg').
const WALLPAPERS = [
  { id: "wp1", name: "Океан",     css: "linear-gradient(160deg, #2E6BE6 0%, #4FC3F7 55%, #B3E5FC 100%)" },
  { id: "wp2", name: "Закат",     css: "linear-gradient(160deg, #FF7E5F 0%, #FEB47B 55%, #FFD3A5 100%)" },
  { id: "wp3", name: "Аврора",    css: "linear-gradient(160deg, #0F2027 0%, #2C5364 55%, #00C9A7 100%)" },
  { id: "wp4", name: "Лаванда",   css: "linear-gradient(160deg, #654EA3 0%, #A084DC 55%, #EAAFC8 100%)" },
  { id: "wp5", name: "Лес",       css: "linear-gradient(160deg, #134E5E 0%, #2E8B57 55%, #71B280 100%)" },
  { id: "wp6", name: "Полночь",   css: "linear-gradient(160deg, #0F0F1A 0%, #23234A 55%, #3A3A7A 100%)" },
  { id: "wp7", name: "Персик",    css: "linear-gradient(160deg, #FFAFBD 0%, #FFC3A0 100%)" },
  { id: "wp8", name: "Минимал",   css: "linear-gradient(160deg, #E8EAF0 0%, #C9CEDB 100%)" },
];

function applyWallpaper() {
  const wp = WALLPAPERS.find((w) => w.id === state.wallpaper) || WALLPAPERS[0];
  document.getElementById("wallpaper-layer").style.background = wp.css;
  const lockWp = document.getElementById("lock-wallpaper");
  if (lockWp) lockWp.style.background = wp.css; // те же обои и на экране блокировки, как на настоящем телефоне
}

// ============================================================
//  ТЕМА: ДЕНЬ / НОЧЬ / АВТО
// ============================================================
function applyTheme() {
  let isDark;
  if (state.themeMode === "auto") {
    const hour = new Date().getHours();
    isDark = hour >= 20 || hour < 7; // с 20:00 до 7:00 — тёмное время суток
  } else {
    isDark = state.themeMode === "night";
  }
  document.body.classList.toggle("dark", isDark);
}

// ============================================================
//  ЧАСЫ И ДАТА НА РАБОЧЕМ СТОЛЕ
// ============================================================
const WEEKDAYS = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

function tickClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  document.getElementById("status-time").textContent = timeStr;
  document.getElementById("widget-time").textContent = timeStr;
  document.getElementById("widget-date").textContent =
    `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}
tickClock();
setInterval(tickClock, 1000 * 30); // обновляем раз в 30 секунд — часам точность до минуты не нужна чаще

// ============================================================
//  РЕНДЕР СТРАНИЦ РАБОЧЕГО СТОЛА, ТОЧЕК И ДОКА
// ============================================================
const ICONS_PER_PAGE = 8; // 2 ряда по 4 иконки — как обычно помещается на один экран Samsung

function iconButton(app) {
  const btn = document.createElement("button");
  btn.className = "app-icon";
  btn.innerHTML = `
    <span class="icon-glyph">${iconMarkup(app)}</span>
    <span class="icon-label">${app.name}</span>
  `;
  btn.addEventListener("click", () => openWindow(app.id));
  return btn;
}

function renderDesktop() {
  const track = document.getElementById("pages-track");
  const dots = document.getElementById("page-dots");
  const dock = document.getElementById("dock");
  track.innerHTML = "";
  dots.innerHTML = "";
  dock.innerHTML = "";

  // Собираем полный список иконок для рабочего стола (без тех, что закреплены в доке)
  const desktopApps = [];
  APPS.forEach((app) => {
    if (app.inDock) {
      dock.appendChild(iconButton(app));
    } else {
      desktopApps.push(app);
    }
  });
  // Плюс приложения, "установленные" из магазина
  state.installedApps.forEach((appId) => {
    const shopApp = STORE_CATALOG.find((a) => a.id === appId);
    if (shopApp) desktopApps.push(shopApp);
  });

  // Разбиваем на страницы по ICONS_PER_PAGE штук — как реальные экраны Samsung
  const pageCount = Math.max(1, Math.ceil(desktopApps.length / ICONS_PER_PAGE));
  for (let p = 0; p < pageCount; p++) {
    const page = document.createElement("div");
    page.className = "app-grid";
    desktopApps.slice(p * ICONS_PER_PAGE, (p + 1) * ICONS_PER_PAGE).forEach((app) => {
      page.appendChild(iconButton(app));
    });
    track.appendChild(page);

    const dot = document.createElement("span");
    dot.className = "page-dot";
    dots.appendChild(dot);
  }

  // Если сохранённая страница больше не существует (удалили приложения) — откатываемся на последнюю
  if (state.currentPage >= pageCount) state.currentPage = pageCount - 1;
  goToPage(state.currentPage, false);
}

function goToPage(index, animate = true) {
  const track = document.getElementById("pages-track");
  const pageCount = track.children.length;
  index = Math.max(0, Math.min(index, pageCount - 1));

  track.style.transition = animate ? "" : "none"; // отключаем анимацию при первой отрисовке
  track.style.transform = `translateX(-${index * 100}%)`;

  document.querySelectorAll(".page-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  state.currentPage = index;
  saveState();
}

// ---- Свайп влево/вправо между страницами, как на самом Samsung ----
function setupSwipeGestures() {
  const viewport = document.getElementById("pages-viewport");
  let startX = 0;
  let startY = 0;
  let dragging = false;

  viewport.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });

  viewport.addEventListener("touchend", (e) => {
    if (!dragging) return;
    dragging = false;

    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    // игнорируем в основном вертикальные жесты (скролл) — свайп страницы должен быть горизонтальным
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    tg.HapticFeedback.impactOccurred("light"); // тактильный отклик, как при смене экрана на телефоне

    if (dx < 0) {
      goToPage(state.currentPage + 1); // свайп влево — следующая страница
    } else {
      goToPage(state.currentPage - 1); // свайп вправо — предыдущая страница
    }
  }, { passive: true });
}

// ============================================================
//  ОТКРЫТИЕ / ЗАКРЫТИЕ ОКОН ПРИЛОЖЕНИЙ
// ============================================================
function findAppById(id) {
  return APPS.find((a) => a.id === id) || STORE_CATALOG.find((a) => a.id === id);
}

function openWindow(appId) {
  const app = findAppById(appId);
  if (!app) return;

  // сообщаем Telegram лёгкой тактильной отдачей, что произошло действие
  tg.HapticFeedback.impactOccurred("light");

  const container = document.getElementById("windows-container");

  // подложка позади окна — своя для каждого открытого окна, чтобы уходила вместе с ним при закрытии
  const backdrop = document.createElement("div");
  backdrop.className = "window-backdrop";
  container.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add("visible")); // в следующий кадр — чтобы transition сработал

  const template = document.getElementById("window-template");
  const node = template.content.firstElementChild.cloneNode(true);

  node.dataset.appId = appId;
  node.querySelector(".window-title").textContent = app.name;
  node.querySelector(".window-close").addEventListener("click", () => closeWindow(node));

  const body = node.querySelector(".window-body");
  app.render(body); // каждое приложение само наполняет своё окно содержимым

  node._backdrop = backdrop; // запоминаем связку окно↔подложка, чтобы убрать обе разом при закрытии
  container.appendChild(node);
}

function closeWindow(node) {
  // проигрываем анимацию закрытия (scale-down + fade) и только ПОСЛЕ неё убираем элемент из DOM —
  // без этого получится не анимация, а мгновенное исчезновение
  node.classList.add("closing");
  node._backdrop?.classList.remove("visible");

  const cleanup = () => {
    node.remove();
    node._backdrop?.remove();
  };
  node.addEventListener("animationend", cleanup, { once: true });
  setTimeout(cleanup, 350); // подстраховка на случай, если animationend почему-то не сработает
}

// ============================================================
//  СИСТЕМНАЯ НАВИГАЦИЯ: ДОМОЙ / НАЗАД / ПОСЛЕДНИЕ (recents)
// ============================================================
function getOpenWindows() {
  return Array.from(document.querySelectorAll("#windows-container .app-window:not(.closing)"));
}

function goHome() {
  // кнопка "Домой" — закрывает все окна (с той же анимацией) и прячет обзор последних приложений
  closeRecents();
  getOpenWindows().forEach((w) => closeWindow(w));
}

function goBack() {
  // кнопка "Назад" — сначала прячет recents, если он открыт, иначе закрывает верхнее окно
  const recents = document.getElementById("recents-screen");
  if (recents.classList.contains("active")) {
    closeRecents();
    return;
  }
  const windows = getOpenWindows();
  if (windows.length > 0) {
    closeWindow(windows[windows.length - 1]); // закрываем последнее открытое (самое верхнее) окно
  }
}

function renderRecents() {
  const grid = document.getElementById("recents-grid");
  const empty = document.getElementById("recents-empty");
  grid.innerHTML = "";

  const windows = getOpenWindows();
  empty.style.display = windows.length ? "none" : "block";

  windows.forEach((win) => {
    const app = findAppById(win.dataset.appId);
    if (!app) return;

    const card = document.createElement("div");
    card.className = "recents-card";
    card.innerHTML = `
      <button class="recents-card-close">✕</button>
      <span class="icon-glyph">${iconMarkup(app)}</span>
      <span>${app.name}</span>
    `;

    // тап по карточке — открыть это приложение и закрыть обзор
    card.addEventListener("click", () => {
      closeRecents();
      win.scrollIntoView?.();
    });
    // отдельная кнопка "✕" — закрыть именно это приложение, не открывая его
    card.querySelector(".recents-card-close").addEventListener("click", (e) => {
      e.stopPropagation();
      win.remove();
      renderRecents(); // перерисовываем список после закрытия карточки
    });

    grid.appendChild(card);
  });
}

function openRecents() {
  renderRecents();
  document.getElementById("recents-screen").classList.add("active");
}

function closeRecents() {
  document.getElementById("recents-screen").classList.remove("active");
}

function setupNavBar() {
  document.getElementById("nav-home").addEventListener("click", () => {
    tg.HapticFeedback.impactOccurred("light");
    goHome();
  });
  document.getElementById("nav-back").addEventListener("click", () => {
    tg.HapticFeedback.impactOccurred("light");
    goBack();
  });
  document.getElementById("nav-recents").addEventListener("click", () => {
    tg.HapticFeedback.impactOccurred("light");
    const recents = document.getElementById("recents-screen");
    recents.classList.contains("active") ? closeRecents() : openRecents();
  });
  document.getElementById("recents-close").addEventListener("click", closeRecents);
}

// ============================================================
//  ПРИЛОЖЕНИЕ: НАСТРОЙКИ
// ============================================================
function renderSettingsApp(container) {
  container.innerHTML = `
    <p class="store-category">Тема</p>
    <div class="theme-segment" id="theme-segment">
      <button data-mode="day">☀️ День</button>
      <button data-mode="night">🌙 Ночь</button>
      <button data-mode="auto">🕒 Авто</button>
    </div>

    <p class="store-category">Обои</p>
    <div class="wallpaper-grid" id="wallpaper-grid"></div>

    <p class="store-category">Об устройстве</p>
    <div class="settings-row">
      <span>Установлено приложений</span>
      <span>${state.installedApps.length}</span>
    </div>
    <div class="settings-row">
      <span>Пользователь Telegram</span>
      <span>${tg.initDataUnsafe?.user?.first_name || "Гость"}</span>
    </div>
  `;

  // ---- переключатель темы ----
  const segment = container.querySelector("#theme-segment");
  segment.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === state.themeMode);
    btn.addEventListener("click", () => {
      state.themeMode = btn.dataset.mode;
      saveState();
      applyTheme();
      segment.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // ---- сетка обоев ----
  const grid = container.querySelector("#wallpaper-grid");
  WALLPAPERS.forEach((wp) => {
    const thumb = document.createElement("button");
    thumb.className = "wallpaper-thumb" + (wp.id === state.wallpaper ? " active" : "");
    thumb.style.background = wp.css;
    thumb.title = wp.name;
    thumb.addEventListener("click", () => {
      state.wallpaper = wp.id;
      saveState();
      applyWallpaper();
      grid.querySelectorAll(".wallpaper-thumb").forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
    grid.appendChild(thumb);
  });
}

// Примечание: applyTheme() теперь определена выше — она также умеет учитывать "авто" режим.

// ============================================================
//  ПРИЛОЖЕНИЕ: МАГАЗИН
// ============================================================
// Каталог "загружаемых" утилит. В реальном проекте эти данные стоит
// получать с бэкенда (см. bot.py + отдельный API), здесь — заглушка.
// Каждая запись — как карточка реального Google Play: рейтинг, число оценок, размер файла.
// Реальные иконки/данные из настоящего Play Маркета получить нельзя — у Google нет публичного
// API для стороннего каталога, поэтому здесь пример-заглушка в том же визуальном стиле.
//
// У большинства приложений ниже render — это renderPlaceholderApp (заглушка "скоро здесь будет функционал").
// Замените поле render на свою функцию, когда будете подключать реальную логику —
// сигнатура та же, что и у остальных: function(container) { ... }.
function renderPlaceholderApp(container) {
  container.innerHTML = `<p style="color:var(--oneui-text-sub);font-size:14px;">
    Заглушка приложения. Подключите свою функцию рендера в script.js (см. поле "render" в STORE_CATALOG).
  </p>`;
}

// Компактный конструктор записи каталога — чтобы не дублировать одинаковые поля вручную
function shopApp(id, name, icon, category, rating, size, render) {
  return { id, name, icon, category, desc: category, rating, votes: `${(1 + Math.random() * 40).toFixed(1)}К`, size, render: render || renderPlaceholderApp };
}

const STORE_CATALOG = [
  // ---- Инструменты ----
  shopApp("calc", "Калькулятор", "🧮", "Инструменты", 4.6, "1.2 МБ", renderCalcApp),
  shopApp("weather", "Погода", "☀️", "Инструменты", 4.4, "3.4 МБ", renderWeatherApp),
  shopApp("flashlight", "Фонарик", "🔦", "Инструменты", 4.2, "0.8 МБ", renderFlashlightApp),
  shopApp("compass", "Компас", "🧭", "Инструменты", 4.0, "1.5 МБ", renderCompassApp),
  shopApp("converter", "Конвертер единиц", "📐", "Инструменты", 4.3, "2.1 МБ", renderConverterApp),
  shopApp("scanner", "Сканер документов", "📄", "Инструменты", 4.5, "12 МБ", renderCameraApp),
  shopApp("recorder", "Диктофон", "🎙️", "Инструменты", 4.1, "3.9 МБ", renderRecorderApp),
  shopApp("qr", "QR-сканер", "🔳", "Инструменты", 4.4, "4.2 МБ", renderQrApp),

  // ---- Продуктивность ----
  shopApp("cal-app", "Календарь Pro", "📅", "Продуктивность", 4.5, "9 МБ", renderCalendarApp),
  shopApp("todo", "Задачи", "✅", "Продуктивность", 4.6, "6 МБ", renderTodoApp),
  shopApp("cloud", "Облако", "☁️", "Продуктивность", 4.3, "15 МБ", renderCloudApp),
  shopApp("mail", "Почта", "📧", "Продуктивность", 4.2, "22 МБ", renderMailApp),
  shopApp("office", "Офисный пакет", "📊", "Продуктивность", 4.4, "45 МБ", renderOfficeApp),
  shopApp("translator", "Переводчик", "🌍", "Продуктивность", 4.5, "18 МБ", renderTranslatorApp),

  // ---- Общение ----
  shopApp("chat", "Мессенджер", "💬", "Общение", 4.3, "28 МБ", renderChatApp),
  shopApp("video", "Видеозвонки", "📹", "Общение", 4.2, "31 МБ", renderVideoCallApp),
  shopApp("social", "Лента новостей", "📰", "Общение", 4.0, "26 МБ", renderSocialApp),

  // ---- Развлечения ----
  shopApp("music", "Музыка", "🎵", "Развлечения", 4.6, "19 МБ", makeLocalPlayerApp("audio/*")),
  shopApp("video-player", "Видеоплеер", "🎬", "Развлечения", 4.4, "24 МБ", makeLocalPlayerApp("video/*")),
  shopApp("games", "Игровой центр", "🎮", "Развлечения", 4.5, "40 МБ", renderGamesApp),
  shopApp("podcast", "Подкасты", "🎧", "Развлечения", 4.3, "14 МБ",
    makeStreamPlayerApp("https://ice1.somafm.com/groovesalad-128-mp3", "SomaFM · Groove Salad")),
  shopApp("radio", "Радио", "📻", "Развлечения", 4.1, "8 МБ",
    makeStreamPlayerApp("https://ice1.somafm.com/defcon-128-mp3", "SomaFM · DEF CON Radio")),

  // ---- Здоровье ----
  shopApp("health", "Здоровье", "❤️", "Здоровье", 4.4, "16 МБ", makeTrackerApp("oneui_health", "мл воды", "Учёт воды")),
  shopApp("fitness", "Фитнес-трекер", "🏃", "Здоровье", 4.3, "20 МБ", makeTrackerApp("oneui_fitness", "шагов", "Шаги")),
  shopApp("sleep", "Сон", "😴", "Здоровье", 4.2, "9 МБ", makeTrackerApp("oneui_sleep", "часов", "Сон")),

  // ---- Фото ----
  shopApp("gallery-plus", "Галерея Плюс", "🖼️", "Фото", 4.5, "17 МБ", renderGalleryApp),
  shopApp("editor", "Фоторедактор", "🎨", "Фото", 4.4, "33 МБ", renderEditorApp),
  shopApp("camera-pro", "Камера Pro", "📷", "Фото", 4.6, "27 МБ", renderCameraApp),
];

function starRating(rating) {
  // рисует рейтинг звёздочкой + числом, как в карточке Play Маркета
  return `<span class="stars">★</span> ${rating.toFixed(1)}`;
}

function renderStoreApp(container) {
  container.innerHTML = `
    <div class="store-search">🔍 <span>Поиск игр и приложений</span></div>
    <div class="store-tabs">
      <span class="store-tab active">Для вас</span>
      <span class="store-tab">Топ чарты</span>
      <span class="store-tab">Категории</span>
    </div>
    <div id="store-list"></div>
  `;

  const list = container.querySelector("#store-list");

  // Группируем каталог по полю category — так длинный список не превращается в стену карточек
  const categories = [...new Set(STORE_CATALOG.map((a) => a.category))];

  categories.forEach((category) => {
    const heading = document.createElement("p");
    heading.className = "store-category";
    heading.textContent = category;
    list.appendChild(heading);

    STORE_CATALOG.filter((a) => a.category === category).forEach((item) => {
      const installed = state.installedApps.includes(item.id);

      const row = document.createElement("div");
      row.className = "store-item";
      row.innerHTML = `
        <div class="icon-glyph">${iconMarkup(item)}</div>
        <div class="store-item-info">
          <div class="store-item-title">${item.name}</div>
          <div class="store-item-meta">${starRating(item.rating)} · ${item.votes} отзывов · ${item.size}</div>
        </div>
        <button class="btn-install ${installed ? "installed" : ""}">
          ${installed ? "Открыть" : "Установить"}
        </button>
      `;

      row.querySelector(".btn-install").addEventListener("click", () => {
        if (state.installedApps.includes(item.id)) {
          openWindow(item.id); // уже установлено — просто открываем
        } else {
          state.installedApps.push(item.id); // "устанавливаем" — сохраняем id в state
          saveState();
          renderDesktop();     // обновляем сетку иконок на рабочем столе
          renderStoreApp(container); // перерисовываем список магазина (кнопка станет "Открыть")
        }
      });

      list.appendChild(row);
    });
  });
}

// ---- Настоящий рабочий калькулятор (не заглушка) ----
function renderCalcApp(container) {
  let expr = ""; // строка текущего выражения, например "12+7"

  container.innerHTML = `
    <div id="calc-display" style="background:var(--oneui-bg);border-radius:16px;padding:20px;
      text-align:right;font-size:32px;font-weight:300;margin-bottom:12px;min-height:44px;word-break:break-all;">0</div>
    <div id="calc-keys" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;"></div>
  `;

  const display = container.querySelector("#calc-display");
  const keys = container.querySelector("#calc-keys");

  // Раскладка клавиш калькулятора: значение и что при нажатии делать
  const buttons = [
    "C", "⌫", "%", "÷",
    "7", "8", "9", "×",
    "4", "5", "6", "−",
    "1", "2", "3", "+",
    "0", ".", "=",
  ];

  buttons.forEach((label) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    // "0" делаем на всю ширину двух ячеек, остальное — обычные квадратные кнопки
    btn.style.cssText = `
      padding:16px 0; border:none; border-radius:14px; font-size:18px; font-weight:600;
      background:${"C⌫%÷×−+=".includes(label) ? "var(--oneui-accent)" : "var(--oneui-card)"};
      color:${"C⌫%÷×−+=".includes(label) ? "#fff" : "var(--oneui-text-main)"};
      box-shadow: var(--oneui-shadow);
      ${label === "0" ? "grid-column: span 2;" : ""}
    `;

    btn.addEventListener("click", () => {
      if (label === "C") {
        expr = ""; // сброс
      } else if (label === "⌫") {
        expr = expr.slice(0, -1); // стереть последний символ
      } else if (label === "=") {
        try {
          // переводим удобные для глаза символы в JS-операторы перед вычислением
          const jsExpr = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/%/g, "/100");
          // eslint-disable-next-line no-new-func — безопасно: строка состоит только из цифр/операторов, набранных кнопками
          const result = Function(`"use strict"; return (${jsExpr})`)();
          expr = String(Number.isFinite(result) ? +result.toFixed(8) : "Ошибка");
        } catch (e) {
          expr = "Ошибка";
        }
      } else {
        expr += label; // цифра или знак операции — просто дописываем
      }
      display.textContent = expr || "0";
    });

    keys.appendChild(btn);
  });
}

// ---- Пример: заглушка приложения "Погода" ----
function renderWeatherApp(container) {
  container.innerHTML = `<p>☀️ +24°C — данные-заглушка. Подключите реальный API погоды на бэкенде.</p>`;
}

// ============================================================
//  ПРИЛОЖЕНИЕ: ЗАМЕТКИ (пример работы с localStorage)
// ============================================================
function renderNotesApp(container) {
  const notes = localStorage.getItem("oneui_notes") || "";
  container.innerHTML = `
    <textarea id="notes-area" style="width:100%;height:200px;border:none;
      background:var(--oneui-bg);border-radius:16px;padding:12px;font-size:14px;"
      placeholder="Пишите здесь...">${notes}</textarea>
  `;
  container.querySelector("#notes-area").addEventListener("input", (e) => {
    localStorage.setItem("oneui_notes", e.target.value); // сохраняем при каждом вводе
  });
}

// ============================================================
//  ПРИЛОЖЕНИЕ: О ТЕЛЕФОНЕ
// ============================================================
function renderDeviceInfoApp(container) {
  // Реальные данные, доступные браузеру — без доступа к настоящему железу телефона,
  // но это честная информация о самом устройстве/браузере, а не выдумка
  const ua = navigator.userAgent;
  const platform = navigator.userAgentData?.platform || navigator.platform || "неизвестно";
  const lang = navigator.language || "неизвестно";
  const screenRes = `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio || 1}x`;
  const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} ядер` : "неизвестно";
  const memory = navigator.deviceMemory ? `${navigator.deviceMemory} ГБ` : "неизвестно";
  const connection = navigator.connection?.effectiveType?.toUpperCase() || "неизвестно";
  const user = tg.initDataUnsafe?.user;

  container.innerHTML = `
    <p class="store-category">Устройство</p>
    <div class="info-row"><span>Платформа</span><span>${platform}</span></div>
    <div class="info-row"><span>Разрешение экрана</span><span>${screenRes}</span></div>
    <div class="info-row"><span>Процессор</span><span>${cores}</span></div>
    <div class="info-row"><span>Память (приблизительно)</span><span>${memory}</span></div>
    <div class="info-row"><span>Сеть</span><span>${connection}</span></div>
    <div class="info-row"><span>Язык системы</span><span>${lang}</span></div>

    <p class="store-category">Telegram</p>
    <div class="info-row"><span>Пользователь</span><span>${user ? (user.first_name + (user.last_name ? " " + user.last_name : "")) : "Гость"}</span></div>
    <div class="info-row"><span>Username</span><span>${user?.username ? "@" + user.username : "—"}</span></div>
    <div class="info-row"><span>Версия Telegram WebApp</span><span>${tg.version || "неизвестно"}</span></div>
    <div class="info-row"><span>Платформа Telegram</span><span>${tg.platform || "неизвестно"}</span></div>

    <p class="store-category">Браузер</p>
    <div class="info-row" style="display:block;">
      <span style="display:block;margin-bottom:4px;">User-Agent</span>
      <span style="display:block;text-align:left;font-weight:400;font-size:12px;word-break:break-all;color:var(--oneui-text-sub);">${ua}</span>
    </div>
  `;
}

// ============================================================
//  ПРИЛОЖЕНИЕ: МОИ ФАЙЛЫ
// ============================================================
function renderMyFilesApp(container) {
  // Пример структуры "файлов" — замените на реальные данные с вашего бэкенда,
  // когда будете подключать хранилище файлов пользователя
  const folders = [
    { icon: "📥", name: "Загрузки", meta: "12 файлов · 340 МБ" },
    { icon: "🖼️", name: "Изображения", meta: "58 файлов · 1.1 ГБ" },
    { icon: "🎵", name: "Музыка", meta: "24 файла · 210 МБ" },
    { icon: "📄", name: "Документы", meta: "9 файлов · 40 МБ" },
    { icon: "🎬", name: "Видео", meta: "6 файлов · 780 МБ" },
    { icon: "🖌️", name: "Обои", meta: `${WALLPAPERS.length} файлов · 4 МБ` },
  ];

  container.innerHTML = "";
  folders.forEach((f) => {
    const row = document.createElement("div");
    row.className = "folder-row";
    row.innerHTML = `
      <div class="icon-glyph">${f.icon}</div>
      <div>
        <div class="folder-row-title">${f.name}</div>
        <div class="folder-row-meta">${f.meta}</div>
      </div>
    `;
    // тап пока просто заглушка — подключите открытие реального списка файлов на свой вкус
    row.addEventListener("click", () => alert(`Открыть папку "${f.name}" — подключите свою логику`));
    container.appendChild(row);
  });
}

// ============================================================
//  ПРИЛОЖЕНИЕ: МИНИ-БРАУЗЕР (используется для Chrome и Google)
// ============================================================
function renderBrowserApp(container, prefillUrl) {
  // Встроить чужой сайт через <iframe> почти всегда не получится — большинство сайтов
  // (включая сам Google) запрещают встраивание себя в чужие страницы (заголовок X-Frame-Options).
  // Поэтому переход происходит через tg.openLink() — Telegram открывает системный браузер поверх мини-приложения.
  container.innerHTML = `
    <div class="browser-bar">
      <input id="browser-url" type="text" value="${prefillUrl}" placeholder="Введите адрес или запрос" />
      <button id="browser-go">Перейти</button>
    </div>
    <p class="browser-hint">
      Большинство сайтов запрещают открываться внутри чужих страниц, поэтому ссылка откроется
      в системном браузере поверх мини-приложения — это ограничение самих сайтов, а не бота.
    </p>
  `;

  container.querySelector("#browser-go").addEventListener("click", () => {
    let value = container.querySelector("#browser-url").value.trim();
    if (!value) return;

    // если это похоже на поисковый запрос, а не адрес сайта — оборачиваем в поиск Google
    const looksLikeUrl = /^https?:\/\//i.test(value) || value.includes(".");
    const url = looksLikeUrl
      ? (value.startsWith("http") ? value : `https://${value}`)
      : `https://www.google.com/search?q=${encodeURIComponent(value)}`;

    tg.openLink(url); // именно этот метод SDK открывает внешние ссылки из Mini App
  });
}

// ============================================================
//  ПРИЛОЖЕНИЕ: ТЕЛЕФОН (реальный звонок через системный диалер)
// ============================================================
function renderPhoneApp(container) {
  container.innerHTML = `
    <div id="phone-display" style="background:var(--oneui-bg);border-radius:16px;padding:18px;
      text-align:right;font-size:26px;margin-bottom:12px;min-height:36px;">Введите номер</div>
    <div id="phone-keys" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;"></div>
    <button id="phone-call" style="width:100%;border:none;background:#2E9E5B;color:#fff;
      padding:14px;border-radius:999px;font-size:15px;font-weight:700;">📞 Позвонить</button>
  `;
  let number = "";
  const display = container.querySelector("#phone-display");
  const keys = container.querySelector("#phone-keys");

  "123456789*0#".split("").forEach((d) => {
    const btn = document.createElement("button");
    btn.textContent = d;
    btn.style.cssText = "padding:16px 0;border:none;border-radius:14px;font-size:20px;background:var(--oneui-card);box-shadow:var(--oneui-shadow);color:var(--oneui-text-main);";
    btn.addEventListener("click", () => {
      number += d;
      display.textContent = number;
    });
    keys.appendChild(btn);
  });

  // tel: — открывает НАСТОЯЩИЙ звонилку телефона с этим номером, это реальная функция, а не заглушка
  container.querySelector("#phone-call").addEventListener("click", () => {
    if (!number) return;
    tg.openLink?.(`tel:${number}`) || (window.location.href = `tel:${number}`);
  });
}

// ============================================================
//  ПРИЛОЖЕНИЕ: СООБЩЕНИЯ (реальная SMS через системное приложение)
// ============================================================
function renderMessagesApp(container) {
  container.innerHTML = `
    <input id="sms-to" type="text" placeholder="Номер получателя" style="width:100%;border:none;
      background:var(--oneui-bg);border-radius:12px;padding:12px;margin-bottom:8px;font-size:14px;color:var(--oneui-text-main);" />
    <textarea id="sms-text" placeholder="Текст сообщения" style="width:100%;height:100px;border:none;
      background:var(--oneui-bg);border-radius:12px;padding:12px;font-size:14px;color:var(--oneui-text-main);"></textarea>
    <button id="sms-send" style="width:100%;margin-top:10px;border:none;background:var(--oneui-accent);
      color:#fff;padding:14px;border-radius:999px;font-weight:700;">Открыть в Сообщениях</button>
  `;
  container.querySelector("#sms-send").addEventListener("click", () => {
    const to = container.querySelector("#sms-to").value.trim();
    const body = encodeURIComponent(container.querySelector("#sms-text").value);
    // sms: — тоже реальная ссылка, открывает настоящее приложение сообщений с заполненным текстом
    window.location.href = `sms:${to}?body=${body}`;
  });
}

// ============================================================
//  ПРИЛОЖЕНИЕ: КАМЕРА (настоящий доступ к камере устройства)
// ============================================================
function renderCameraApp(container) {
  container.innerHTML = `
    <video id="camera-preview" autoplay playsinline style="width:100%;border-radius:16px;background:#000;"></video>
    <p id="camera-error" style="color:#E5484D;font-size:13px;margin-top:8px;"></p>
    <button id="camera-shot" style="width:100%;margin-top:12px;border:none;background:var(--oneui-accent);
      color:#fff;padding:14px;border-radius:999px;font-weight:700;">📸 Снять фото</button>
  `;
  const video = container.querySelector("#camera-preview");
  const errorBox = container.querySelector("#camera-error");

  // Запрашиваем доступ к настоящей камере телефона — это реальный API браузера, не имитация
  navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => { video.srcObject = stream; })
    .catch(() => {
      errorBox.textContent = "Нет доступа к камере (разрешите доступ в браузере) или камера недоступна в этом окружении.";
    });

  container.querySelector("#camera-shot").addEventListener("click", () => {
    if (!video.srcObject) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const photoDataUrl = canvas.toDataURL("image/jpeg", 0.85);

    // сохраняем снимок в "Галерею" через localStorage — реально сохраняется между сессиями
    const gallery = JSON.parse(localStorage.getItem("oneui_gallery") || "[]");
    gallery.unshift(photoDataUrl);
    localStorage.setItem("oneui_gallery", JSON.stringify(gallery.slice(0, 30))); // храним последние 30 фото
    tg.HapticFeedback.notificationOccurred("success");
  });
}

// ============================================================
//  ПРИЛОЖЕНИЕ: ГАЛЕРЕЯ (показывает то, что реально снято Камерой)
// ============================================================
function renderGalleryApp(container) {
  const photos = JSON.parse(localStorage.getItem("oneui_gallery") || "[]");
  if (!photos.length) {
    container.innerHTML = `<p style="color:var(--oneui-text-sub);font-size:14px;">
      Пока нет фото. Снимите что-нибудь в приложении «Камера» — оно появится здесь.</p>`;
    return;
  }
  container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>`;
  const grid = container.firstElementChild;
  photos.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.style.cssText = "width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;";
    grid.appendChild(img);
  });
}

// ============================================================
//  ПРИЛОЖЕНИЕ: КОНТАКТЫ (реальное сохранение своих контактов)
// ============================================================
function renderContactsApp(container) {
  const load = () => JSON.parse(localStorage.getItem("oneui_contacts") || "[]");
  const save = (list) => localStorage.setItem("oneui_contacts", JSON.stringify(list));

  function draw() {
    const contacts = load();
    container.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <input id="ct-name" placeholder="Имя" style="flex:1;border:none;background:var(--oneui-bg);
          border-radius:12px;padding:10px;font-size:14px;color:var(--oneui-text-main);" />
        <input id="ct-phone" placeholder="Номер" style="flex:1;border:none;background:var(--oneui-bg);
          border-radius:12px;padding:10px;font-size:14px;color:var(--oneui-text-main);" />
        <button id="ct-add" style="border:none;background:var(--oneui-accent);color:#fff;
          width:40px;border-radius:12px;font-size:18px;">+</button>
      </div>
      <div id="ct-list"></div>
    `;
    const list = container.querySelector("#ct-list");
    contacts.forEach((c, i) => {
      const row = document.createElement("div");
      row.className = "folder-row";
      row.innerHTML = `
        <div class="icon-glyph">👤</div>
        <div style="flex:1;"><div class="folder-row-title">${c.name}</div><div class="folder-row-meta">${c.phone}</div></div>
        <button data-i="${i}" style="border:none;background:none;color:var(--oneui-text-sub);font-size:16px;">✕</button>
      `;
      row.querySelector("button").addEventListener("click", () => {
        const updated = load(); updated.splice(i, 1); save(updated); draw();
      });
      list.appendChild(row);
    });

    container.querySelector("#ct-add").addEventListener("click", () => {
      const name = container.querySelector("#ct-name").value.trim();
      const phone = container.querySelector("#ct-phone").value.trim();
      if (!name || !phone) return;
      const updated = load(); updated.push({ name, phone }); save(updated); draw();
    });
  }

  draw();
}

// ============================================================
//  ПРИЛОЖЕНИЕ: КАЛЕНДАРЬ (настоящий текущий месяц)
// ============================================================
function renderCalendarApp(container) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // в JS воскресенье = 0, а нам нужно, чтобы неделя начиналась с понедельника
  const startOffset = (firstDay.getDay() + 6) % 7;

  let cells = "";
  for (let i = 0; i < startOffset; i++) cells += `<div></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate();
    cells += `<div style="text-align:center;padding:8px 0;border-radius:10px;font-size:13px;
      ${isToday ? "background:var(--oneui-accent);color:#fff;font-weight:700;" : "color:var(--oneui-text-main);"}">${d}</div>`;
  }

  container.innerHTML = `
    <p style="font-weight:700;font-size:16px;margin-bottom:12px;text-transform:capitalize;">
      ${now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
    </p>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:11px;color:var(--oneui-text-sub);margin-bottom:6px;">
      ${["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => `<div style="text-align:center;">${d}</div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">${cells}</div>
  `;
}

// ============================================================
//  ЛАУНЧЕР ВНЕШНИХ СЕРВИСОВ (Spotify / YT Music / Facebook / Gemini / Google Play)
// ============================================================
// Настоящие эти сервисы работают только под своим аккаунтом — встроить их внутрь чужого
// мини-приложения технически нельзя (X-Frame-Options), поэтому кнопка открывает
// настоящий сайт/приложение через tg.openLink(), как и Chrome/Google выше.
function renderExternalApp(container, name, url) {
  container.innerHTML = `
    <p style="font-size:14px;color:var(--oneui-text-sub);margin-bottom:14px;">
      ${name} откроется в отдельном окне — как настоящее приложение, установленное на телефоне.
    </p>
    <button id="ext-open" style="width:100%;border:none;background:var(--oneui-accent);color:#fff;
      padding:14px;border-radius:999px;font-weight:700;">Открыть ${name}</button>
  `;
  container.querySelector("#ext-open").addEventListener("click", () => tg.openLink(url));
}

// ============================================================
//  ФОНАРИК (реальное включение вспышки камеры устройства)
// ============================================================
function renderFlashlightApp(container) {
  container.innerHTML = `
    <p style="color:var(--oneui-text-sub);font-size:13px;margin-bottom:14px;">
      Использует заднюю камеру телефона со вспышкой. Если кнопка не сработала — у устройства/браузера нет доступа к "torch".
    </p>
    <button id="flash-toggle" style="width:100%;border:none;background:var(--oneui-accent);color:#fff;
      padding:16px;border-radius:999px;font-weight:700;">🔦 Включить</button>
    <p id="flash-error" style="color:#E5484D;font-size:13px;margin-top:10px;"></p>
  `;
  let stream = null, on = false;
  const btn = container.querySelector("#flash-toggle");
  const err = container.querySelector("#flash-error");

  btn.addEventListener("click", async () => {
    try {
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      }
      const track = stream.getVideoTracks()[0];
      on = !on;
      await track.applyConstraints({ advanced: [{ torch: on }] }); // "torch" — реальный стандартный constraint для вспышки
      btn.textContent = on ? "🔦 Выключить" : "🔦 Включить";
    } catch (e) {
      err.textContent = "Вспышка недоступна на этом устройстве/браузере: " + e.message;
    }
  });
}

// ============================================================
//  КОМПАС (реальные данные с датчика ориентации телефона)
// ============================================================
function renderCompassApp(container) {
  container.innerHTML = `
    <div style="text-align:center;">
      <div id="compass-needle" style="font-size:64px;transition:transform 0.15s linear;display:inline-block;">🧭</div>
      <p id="compass-heading" style="font-size:22px;font-weight:700;margin-top:10px;">—°</p>
      <p style="color:var(--oneui-text-sub);font-size:13px;margin-top:6px;">
        Поверните телефон — стрелка использует реальный магнитометр устройства.
      </p>
      <button id="compass-enable" style="margin-top:14px;border:none;background:var(--oneui-accent);
        color:#fff;padding:12px 20px;border-radius:999px;font-weight:700;">Разрешить доступ к датчику</button>
    </div>
  `;
  const needle = container.querySelector("#compass-needle");
  const headingText = container.querySelector("#compass-heading");

  function handleOrientation(e) {
    // webkitCompassHeading — точный компас на iOS; alpha — стандартное поле на Android
    const heading = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null);
    if (heading == null) return;
    needle.style.transform = `rotate(${-heading}deg)`;
    headingText.textContent = `${Math.round(heading)}°`;
  }

  container.querySelector("#compass-enable").addEventListener("click", async () => {
    // на iOS нужно явное разрешение пользователя на датчики движения — обязательный шаг
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      try { await DeviceOrientationEvent.requestPermission(); } catch (e) { return; }
    }
    window.addEventListener("deviceorientation", handleOrientation);
  });
}

// ============================================================
//  КОНВЕРТЕР ЕДИНИЦ (настоящая математика, не заглушка)
// ============================================================
function renderConverterApp(container) {
  const UNITS = {
    length: { m: 1, km: 1000, cm: 0.01, mile: 1609.34, ft: 0.3048 },
    weight: { kg: 1, g: 0.001, lb: 0.453592, oz: 0.0283495 },
  };
  container.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <input id="conv-value" type="number" value="1" style="flex:1;border:none;background:var(--oneui-bg);
        border-radius:12px;padding:10px;font-size:14px;color:var(--oneui-text-main);" />
      <select id="conv-from" style="border:none;background:var(--oneui-bg);border-radius:12px;padding:10px;"></select>
      <select id="conv-to" style="border:none;background:var(--oneui-bg);border-radius:12px;padding:10px;"></select>
    </div>
    <p id="conv-result" style="font-size:28px;font-weight:300;text-align:center;"></p>
  `;
  const fromSel = container.querySelector("#conv-from");
  const toSel = container.querySelector("#conv-to");
  const allUnits = { ...UNITS.length, ...UNITS.weight };
  Object.keys(allUnits).forEach((u) => {
    fromSel.innerHTML += `<option value="${u}">${u}</option>`;
    toSel.innerHTML += `<option value="${u}">${u}</option>`;
  });
  toSel.value = "km";

  function recalc() {
    const value = parseFloat(container.querySelector("#conv-value").value) || 0;
    const from = fromSel.value, to = toSel.value;
    const inLength = from in UNITS.length && to in UNITS.length;
    const inWeight = from in UNITS.weight && to in UNITS.weight;
    const table = inLength ? UNITS.length : inWeight ? UNITS.weight : null;
    const result = table ? (value * table[from]) / table[to] : null;
    container.querySelector("#conv-result").textContent =
      result === null ? "Единицы из разных категорий" : `${value} ${from} = ${(+result.toFixed(6))} ${to}`;
  }
  container.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", recalc));
  recalc();
}

// ============================================================
//  ДИКТОФОН (реальная запись звука с микрофона)
// ============================================================
function renderRecorderApp(container) {
  container.innerHTML = `
    <button id="rec-toggle" style="width:100%;border:none;background:#E5484D;color:#fff;
      padding:16px;border-radius:999px;font-weight:700;">⏺ Начать запись</button>
    <p id="rec-status" style="text-align:center;color:var(--oneui-text-sub);font-size:13px;margin-top:10px;"></p>
    <div id="rec-list" style="margin-top:16px;"></div>
  `;
  let mediaRecorder, chunks = [], recordings = [];
  const btn = container.querySelector("#rec-toggle");
  const status = container.querySelector("#rec-status");
  const list = container.querySelector("#rec-list");

  btn.addEventListener("click", async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: "audio/webm" }));
        recordings.unshift(url);
        stream.getTracks().forEach((t) => t.stop()); // отпускаем микрофон после записи
        renderList();
        btn.textContent = "⏺ Начать запись";
        status.textContent = "";
      };
      mediaRecorder.start();
      btn.textContent = "⏹ Остановить";
      status.textContent = "Идёт запись...";
    } catch (e) {
      status.textContent = "Нет доступа к микрофону: " + e.message;
    }
  });

  function renderList() {
    list.innerHTML = "";
    recordings.forEach((url, i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:10px;padding:8px 0;";
      row.innerHTML = `<span style="font-size:13px;">Запись ${recordings.length - i}</span>`;
      const audio = document.createElement("audio");
      audio.src = url; audio.controls = true; audio.style.flex = "1"; audio.style.height = "32px";
      row.appendChild(audio);
      list.appendChild(row);
    });
  }
}

// ============================================================
//  QR-СКАНЕР (реальное распознавание через камеру, если браузер поддерживает BarcodeDetector)
// ============================================================
function renderQrApp(container) {
  if (!("BarcodeDetector" in window)) {
    container.innerHTML = `<p style="color:var(--oneui-text-sub);font-size:14px;">
      Этот браузер не поддерживает встроенный BarcodeDetector API — сканирование QR недоступно без сторонней библиотеки.</p>`;
    return;
  }
  container.innerHTML = `
    <video id="qr-video" autoplay playsinline style="width:100%;border-radius:16px;background:#000;"></video>
    <p id="qr-result" style="margin-top:12px;font-size:15px;font-weight:600;word-break:break-all;"></p>
  `;
  const video = container.querySelector("#qr-video");
  const result = container.querySelector("#qr-result");
  const detector = new BarcodeDetector({ formats: ["qr_code"] });

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
    video.srcObject = stream;
    const scan = async () => {
      try {
        const codes = await detector.detect(video);
        if (codes.length) result.textContent = "Найдено: " + codes[0].rawValue;
      } catch (e) { /* кадр мог быть ещё не готов — просто пробуем на следующем кадре */ }
      requestAnimationFrame(scan);
    };
    scan();
  }).catch((e) => { result.textContent = "Нет доступа к камере: " + e.message; });
}

// ============================================================
//  ЗАДАЧИ (реальный CRUD-список, аналогично Контактам)
// ============================================================
function renderTodoApp(container) {
  const load = () => JSON.parse(localStorage.getItem("oneui_todos") || "[]");
  const save = (list) => localStorage.setItem("oneui_todos", JSON.stringify(list));

  function draw() {
    const todos = load();
    container.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <input id="todo-text" placeholder="Новая задача" style="flex:1;border:none;background:var(--oneui-bg);
          border-radius:12px;padding:10px;font-size:14px;color:var(--oneui-text-main);" />
        <button id="todo-add" style="border:none;background:var(--oneui-accent);color:#fff;
          width:40px;border-radius:12px;font-size:18px;">+</button>
      </div>
      <div id="todo-list"></div>
    `;
    const list = container.querySelector("#todo-list");
    todos.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "settings-row";
      row.innerHTML = `
        <span style="${t.done ? "text-decoration:line-through;color:var(--oneui-text-sub);" : ""}">${t.text}</span>
        <div style="display:flex;gap:10px;">
          <button data-done="${i}" style="border:none;background:none;font-size:16px;">${t.done ? "↩️" : "✅"}</button>
          <button data-del="${i}" style="border:none;background:none;font-size:16px;">✕</button>
        </div>
      `;
      row.querySelector("[data-done]").addEventListener("click", () => {
        const updated = load(); updated[i].done = !updated[i].done; save(updated); draw();
      });
      row.querySelector("[data-del]").addEventListener("click", () => {
        const updated = load(); updated.splice(i, 1); save(updated); draw();
      });
      list.appendChild(row);
    });

    container.querySelector("#todo-add").addEventListener("click", () => {
      const text = container.querySelector("#todo-text").value.trim();
      if (!text) return;
      const updated = load(); updated.push({ text, done: false }); save(updated); draw();
    });
  }
  draw();
}

// ============================================================
//  ОБЛАКО (реальное чтение метаданных файлов с телефона — без загрузки на сервер)
// ============================================================
function renderCloudApp(container) {
  container.innerHTML = `
    <p style="color:var(--oneui-text-sub);font-size:13px;margin-bottom:12px;">
      Здесь нет настоящего сервера для хранения — но выбор файлов и их реальный размер/тип показаны честно.
    </p>
    <input id="cloud-input" type="file" multiple style="margin-bottom:14px;" />
    <div id="cloud-list"></div>
  `;
  container.querySelector("#cloud-input").addEventListener("change", (e) => {
    const list = container.querySelector("#cloud-list");
    list.innerHTML = "";
    Array.from(e.target.files).forEach((f) => {
      const row = document.createElement("div");
      row.className = "folder-row";
      row.innerHTML = `<div class="icon-glyph">📄</div>
        <div><div class="folder-row-title">${f.name}</div>
        <div class="folder-row-meta">${(f.size / 1024).toFixed(1)} КБ · ${f.type || "неизвестный тип"}</div></div>`;
      list.appendChild(row);
    });
  });
}

// ============================================================
//  ПОЧТА (реальный mailto: — открывает настоящее приложение почты)
// ============================================================
function renderMailApp(container) {
  container.innerHTML = `
    <input id="mail-to" placeholder="Кому" style="width:100%;border:none;background:var(--oneui-bg);
      border-radius:12px;padding:10px;margin-bottom:8px;font-size:14px;color:var(--oneui-text-main);" />
    <input id="mail-subject" placeholder="Тема" style="width:100%;border:none;background:var(--oneui-bg);
      border-radius:12px;padding:10px;margin-bottom:8px;font-size:14px;color:var(--oneui-text-main);" />
    <textarea id="mail-body" placeholder="Текст письма" style="width:100%;height:100px;border:none;
      background:var(--oneui-bg);border-radius:12px;padding:10px;font-size:14px;color:var(--oneui-text-main);"></textarea>
    <button id="mail-send" style="width:100%;margin-top:10px;border:none;background:var(--oneui-accent);
      color:#fff;padding:14px;border-radius:999px;font-weight:700;">Открыть в Почте</button>
  `;
  container.querySelector("#mail-send").addEventListener("click", () => {
    const to = container.querySelector("#mail-to").value.trim();
    const subject = encodeURIComponent(container.querySelector("#mail-subject").value);
    const body = encodeURIComponent(container.querySelector("#mail-body").value);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
}

// ============================================================
//  ОФИСНЫЙ ПАКЕТ (реальный текстовый редактор с сохранением)
// ============================================================
function renderOfficeApp(container) {
  const saved = localStorage.getItem("oneui_document") || "";
  container.innerHTML = `
    <div contenteditable="true" id="doc-editor" style="min-height:220px;background:var(--oneui-bg);
      border-radius:14px;padding:14px;font-size:14px;line-height:1.5;outline:none;">${saved}</div>
    <p id="doc-status" style="font-size:12px;color:var(--oneui-text-sub);margin-top:8px;">Сохраняется автоматически</p>
  `;
  const editor = container.querySelector("#doc-editor");
  editor.addEventListener("input", () => {
    localStorage.setItem("oneui_document", editor.innerHTML); // реально сохраняется между открытиями
  });
}

// ============================================================
//  ПЕРЕВОДЧИК (реальный перевод через бесплатный публичный API MyMemory, без ключа)
// ============================================================
function renderTranslatorApp(container) {
  container.innerHTML = `
    <textarea id="tr-input" placeholder="Введите текст" style="width:100%;height:80px;border:none;
      background:var(--oneui-bg);border-radius:12px;padding:10px;font-size:14px;color:var(--oneui-text-main);"></textarea>
    <div style="display:flex;gap:8px;margin:10px 0;">
      <select id="tr-from" style="flex:1;border:none;background:var(--oneui-bg);border-radius:12px;padding:8px;">
        <option value="ru">Русский</option><option value="en">English</option><option value="es">Español</option>
      </select>
      <select id="tr-to" style="flex:1;border:none;background:var(--oneui-bg);border-radius:12px;padding:8px;">
        <option value="en">English</option><option value="ru">Русский</option><option value="es">Español</option>
      </select>
    </div>
    <button id="tr-go" style="width:100%;border:none;background:var(--oneui-accent);color:#fff;
      padding:12px;border-radius:999px;font-weight:700;">Перевести</button>
    <p id="tr-result" style="margin-top:12px;font-size:15px;"></p>
  `;
  container.querySelector("#tr-go").addEventListener("click", async () => {
    const text = container.querySelector("#tr-input").value.trim();
    const from = container.querySelector("#tr-from").value;
    const to = container.querySelector("#tr-to").value;
    const resultEl = container.querySelector("#tr-result");
    if (!text) return;
    resultEl.textContent = "Перевожу...";
    try {
      // MyMemory — бесплатный публичный API перевода, ключ не требуется
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
      const data = await res.json();
      resultEl.textContent = data.responseData?.translatedText || "Не удалось перевести";
    } catch (e) {
      resultEl.textContent = "Ошибка сети при обращении к сервису перевода";
    }
  });
}

// ============================================================
//  МЕССЕНДЖЕР (реально открывает сам Telegram)
// ============================================================
function renderChatApp(container) {
  container.innerHTML = `<p style="font-size:14px;color:var(--oneui-text-sub);margin-bottom:14px;">
    У вас уже есть настоящий мессенджер — сам Telegram. Кнопка открывает его список чатов.</p>
    <button id="chat-open" style="width:100%;border:none;background:var(--oneui-accent);color:#fff;
      padding:14px;border-radius:999px;font-weight:700;">Открыть Telegram</button>`;
  container.querySelector("#chat-open").addEventListener("click", () => {
    // openTelegramLink — родной метод SDK именно для ссылок вида t.me
    (tg.openTelegramLink || tg.openLink).call(tg, "https://t.me");
  });
}

// ============================================================
//  ВИДЕОЗВОНКИ (реальный предпросмотр своей камеры+микрофона — как перед звонком)
// ============================================================
function renderVideoCallApp(container) {
  container.innerHTML = `
    <video id="call-preview" autoplay playsinline muted style="width:100%;border-radius:16px;background:#000;"></video>
    <p style="font-size:12px;color:var(--oneui-text-sub);margin-top:8px;">
      Это честный предпросмотр вашей камеры и микрофона — без сервера подключение к другому человеку невозможно.
    </p>
  `;
  navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
    .then((stream) => { container.querySelector("#call-preview").srcObject = stream; })
    .catch((e) => { container.innerHTML += `<p style="color:#E5484D;font-size:13px;">${e.message}</p>`; });
}

// ============================================================
//  ЛЕНТА НОВОСТЕЙ (реальные live-новости с открытого Hacker News API, без ключа)
// ============================================================
async function renderSocialApp(container) {
  container.innerHTML = `<p style="color:var(--oneui-text-sub);font-size:13px;">Загружаю ленту...</p>`;
  try {
    const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const ids = (await idsRes.json()).slice(0, 10);
    const items = await Promise.all(
      ids.map((id) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json()))
    );
    container.innerHTML = "";
    items.forEach((item) => {
      const row = document.createElement("div");
      row.style.cssText = "padding:12px 0;border-bottom:1px solid #F1F2F4;";
      row.innerHTML = `<div style="font-weight:600;font-size:14px;">${item.title}</div>
        <div style="font-size:12px;color:var(--oneui-text-sub);margin-top:2px;">${item.score} баллов · ${item.by}</div>`;
      row.addEventListener("click", () => item.url && tg.openLink(item.url));
      container.appendChild(row);
    });
  } catch (e) {
    container.innerHTML = `<p style="color:#E5484D;font-size:13px;">Не удалось загрузить ленту: ${e.message}</p>`;
  }
}

// ============================================================
//  МУЗЫКА / ВИДЕОПЛЕЕР (реальное воспроизведение СВОИХ файлов с телефона)
// ============================================================
function makeLocalPlayerApp(accept) {
  return function (container) {
    container.innerHTML = `
      <input id="player-input" type="file" accept="${accept}" style="margin-bottom:14px;" />
      <div id="player-area"></div>
    `;
    container.querySelector("#player-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const tag = accept.startsWith("audio") ? "audio" : "video";
      container.querySelector("#player-area").innerHTML =
        `<${tag} src="${url}" controls style="width:100%;border-radius:12px;"></${tag}>`;
    });
  };
}

// ============================================================
//  ИГРОВОЙ ЦЕНТР (реальная мини-игра "Крестики-нолики", полностью играбельная)
// ============================================================
function renderGamesApp(container) {
  let board = Array(9).fill(null);
  let turn = "X";

  function checkWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    return board.every(Boolean) ? "Ничья" : null;
  }

  function draw() {
    container.innerHTML = `
      <p style="text-align:center;font-weight:700;margin-bottom:12px;">Крестики-нолики · ход: ${turn}</p>
      <div id="ttt-board" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:240px;margin:0 auto;"></div>
      <button id="ttt-reset" style="display:block;margin:16px auto 0;border:none;background:var(--oneui-bg);
        padding:10px 20px;border-radius:999px;font-size:13px;">Сбросить</button>
    `;
    const grid = container.querySelector("#ttt-board");
    board.forEach((cell, i) => {
      const btn = document.createElement("button");
      btn.textContent = cell || "";
      btn.style.cssText = "aspect-ratio:1;font-size:28px;font-weight:700;border:none;background:var(--oneui-card);border-radius:12px;box-shadow:var(--oneui-shadow);";
      btn.addEventListener("click", () => {
        if (board[i] || checkWinner()) return;
        board[i] = turn;
        const winner = checkWinner();
        if (winner) { setTimeout(() => alert(winner === "Ничья" ? "Ничья!" : `Победили ${winner}!`), 50); }
        turn = turn === "X" ? "O" : "X";
        draw();
      });
      grid.appendChild(btn);
    });
    container.querySelector("#ttt-reset").addEventListener("click", () => { board = Array(9).fill(null); turn = "X"; draw(); });
  }
  draw();
}

// ============================================================
//  РАДИО / ПОДКАСТЫ (реальный живой аудиопоток из интернета)
// ============================================================
function makeStreamPlayerApp(streamUrl, label) {
  return function (container) {
    container.innerHTML = `
      <p style="font-weight:600;margin-bottom:10px;">${label}</p>
      <audio controls autoplay src="${streamUrl}" style="width:100%;"></audio>
      <p style="font-size:12px;color:var(--oneui-text-sub);margin-top:8px;">Живой поток из открытого интернет-радио.</p>
    `;
  };
}

// ============================================================
//  ЗДОРОВЬЕ / ФИТНЕС / СОН (реальный локальный трекер с сохранением)
// ============================================================
function makeTrackerApp(storageKey, unitLabel, title) {
  return function (container) {
    const entries = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const total = entries.reduce((s, v) => s + v, 0);

    container.innerHTML = `
      <p style="font-weight:700;margin-bottom:4px;">${title}</p>
      <p style="font-size:32px;font-weight:300;margin-bottom:14px;">${total} ${unitLabel}</p>
      <div style="display:flex;gap:8px;">
        <input id="tracker-value" type="number" placeholder="Добавить" style="flex:1;border:none;
          background:var(--oneui-bg);border-radius:12px;padding:10px;color:var(--oneui-text-main);" />
        <button id="tracker-add" style="border:none;background:var(--oneui-accent);color:#fff;
          padding:0 18px;border-radius:12px;font-weight:700;">+</button>
      </div>
    `;
    container.querySelector("#tracker-add").addEventListener("click", () => {
      const val = parseFloat(container.querySelector("#tracker-value").value);
      if (!val) return;
      entries.push(val);
      localStorage.setItem(storageKey, JSON.stringify(entries)); // реально сохраняется между запусками
      makeTrackerApp(storageKey, unitLabel, title)(container); // перерисовываем с новым итогом
    });
  };
}

// ============================================================
//  ФОТОРЕДАКТОР (реальные canvas-фильтры на своём фото)
// ============================================================
function renderEditorApp(container) {
  container.innerHTML = `
    <input id="editor-input" type="file" accept="image/*" style="margin-bottom:12px;" />
    <canvas id="editor-canvas" style="width:100%;border-radius:12px;display:none;"></canvas>
    <div id="editor-controls" style="display:none;margin-top:12px;">
      <label style="font-size:12px;color:var(--oneui-text-sub);">Яркость</label>
      <input id="editor-brightness" type="range" min="50" max="150" value="100" style="width:100%;" />
      <label style="font-size:12px;color:var(--oneui-text-sub);">Оттенки серого</label>
      <input id="editor-gray" type="range" min="0" max="100" value="0" style="width:100%;" />
    </div>
  `;
  const canvas = container.querySelector("#editor-canvas");
  const ctx = canvas.getContext("2d");
  let img = null;

  function applyFilters() {
    if (!img) return;
    const brightness = container.querySelector("#editor-brightness").value;
    const gray = container.querySelector("#editor-gray").value;
    ctx.filter = `brightness(${brightness}%) grayscale(${gray}%)`; // настоящие CSS-фильтры canvas, не имитация
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  container.querySelector("#editor-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      canvas.style.display = "block";
      container.querySelector("#editor-controls").style.display = "block";
      applyFilters();
    };
    img.src = URL.createObjectURL(file);
  });
  container.querySelectorAll("#editor-brightness, #editor-gray").forEach((el) =>
    el.addEventListener("input", applyFilters)
  );
}

// ============================================================
//  ПРИЛОЖЕНИЕ: О СИСТЕМЕ
// ============================================================
function renderAboutApp(container) {
  container.innerHTML = `
    <p><b>OneUI OS (симулятор)</b></p>
    <p>Версия MVP. Работает внутри Telegram Mini App.</p>
  `;
}

// ============================================================
//  ЭКРАН БЛОКИРОВКИ
// ============================================================
function setupLockScreen() {
  const lock = document.getElementById("lock-screen");
  const desktop = document.getElementById("desktop");
  let unlocking = false;

  function unlock() {
    if (unlocking) return; // защита от повторного запуска анимации при двойном тапе/свайпе
    unlocking = true;

    tg.HapticFeedback.impactOccurred("medium");
    tickClock(); // обновляем часы рабочего стола прямо перед показом — никакой задержки/несвежего значения

    // сначала показываем рабочий стол ПОД экраном блокировки (без .active-рывка), затем плавно уводим блокировку вверх
    desktop.classList.add("active");
    lock.classList.add("unlocking");

    lock.addEventListener("transitionend", () => {
      lock.classList.remove("active", "unlocking");
      unlocking = false;
    }, { once: true });
  }

  document.getElementById("lock-unlock").addEventListener("click", unlock);

  // свайп вверх по всему экрану блокировки тоже разблокирует, как на настоящем телефоне
  let startY = 0;
  lock.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, { passive: true });
  lock.addEventListener("touchend", (e) => {
    if (startY - e.changedTouches[0].clientY > 80) unlock();
  }, { passive: true });
}

function tickLockClock() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const lockTime = document.getElementById("lock-time");
  const lockDate = document.getElementById("lock-date");
  if (lockTime) lockTime.textContent = timeStr;
  if (lockDate) lockDate.textContent = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

// ============================================================
//  ШТОРКА БЫСТРЫХ НАСТРОЕК
// ============================================================
const QUICK_TOGGLES = [
  { id: "wifi", icon: "📶", label: "Wi-Fi" },
  { id: "bt", icon: "🔵", label: "Bluetooth" },
  { id: "flash", icon: "🔦", label: "Фонарик" },
  { id: "dnd", icon: "🌙", label: "Не беспокоить" },
];

function setupQuickPanel() {
  const panel = document.getElementById("quick-panel");
  const toggles = document.getElementById("quick-toggles");

  QUICK_TOGGLES.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "quick-toggle";
    btn.textContent = t.icon;
    btn.title = t.label;
    // визуальные переключатели-заглушки — подключите к реальным Web API (например, факел через camera track),
    // когда будете реализовывать эти функции по-настоящему
    btn.addEventListener("click", () => btn.classList.toggle("active"));
    toggles.appendChild(btn);
  });

  document.getElementById("status-bar").addEventListener("click", () => {
    panel.classList.toggle("open");
  });
}

// ============================================================
//  ПОИСК НА РАБОЧЕМ СТОЛЕ
// ============================================================
function setupDesktopSearch() {
  document.getElementById("desktop-search").addEventListener("click", () => {
    openWindow("google"); // используем уже готовое приложение Google/браузер
  });
}

// ============================================================
//  СТАРТ
// ============================================================
applyTheme();
applyWallpaper();
renderDesktop();
setupSwipeGestures();
setupNavBar();
setupLockScreen();
setupQuickPanel();
setupDesktopSearch();
tickLockClock();
setInterval(tickLockClock, 1000 * 30);

// Регистрируем service worker — без него сайт не пройдёт проверку PWABuilder на "устанавливаемость"
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {
    // если запуск не через https (например, локальный файл без сервера) — просто игнорируем ошибку
  });
}
