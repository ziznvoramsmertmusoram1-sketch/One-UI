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
];

// Приложения из магазина, которые уже стоят "из коробки" при первом запуске —
// как бывает, когда покупаешь новый телефон и часть софта Samsung уже установлена.
const DEFAULT_PREINSTALLED_APPS = ["calc", "weather"];

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
    <span class="icon-glyph">${app.icon}</span>
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

  const template = document.getElementById("window-template");
  const node = template.content.firstElementChild.cloneNode(true);

  node.dataset.appId = appId;
  node.querySelector(".window-title").textContent = app.name;
  node.querySelector(".window-close").addEventListener("click", () => closeWindow(node));

  const body = node.querySelector(".window-body");
  app.render(body); // каждое приложение само наполняет своё окно содержимым

  document.getElementById("windows-container").appendChild(node);
}

function closeWindow(node) {
  node.style.animation = "none"; // убираем анимацию открытия перед закрытием
  node.remove();
}

// ============================================================
//  СИСТЕМНАЯ НАВИГАЦИЯ: ДОМОЙ / НАЗАД / ПОСЛЕДНИЕ (recents)
// ============================================================
function getOpenWindows() {
  return Array.from(document.querySelectorAll("#windows-container .app-window"));
}

function goHome() {
  // кнопка "Домой" — закрывает все окна и прячет обзор последних приложений, как на телефоне
  closeRecents();
  getOpenWindows().forEach((w) => w.remove());
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
      <span class="icon-glyph">${app.icon}</span>
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
  document.getElementById("nav-home").addEventListener("click", goHome);
  document.getElementById("nav-back").addEventListener("click", goBack);
  document.getElementById("nav-recents").addEventListener("click", () => {
    const recents = document.getElementById("recents-screen");
    recents.classList.contains("active") ? closeRecents() : openRecents();
  });
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
  // ---- Инструменты (с рабочей логикой-примером) ----
  shopApp("calc", "Калькулятор", "🧮", "Инструменты", 4.6, "1.2 МБ", renderCalcApp),
  shopApp("weather", "Погода", "☀️", "Инструменты", 4.4, "3.4 МБ", renderWeatherApp),
  shopApp("flashlight", "Фонарик", "🔦", "Инструменты", 4.2, "0.8 МБ"),
  shopApp("compass", "Компас", "🧭", "Инструменты", 4.0, "1.5 МБ"),
  shopApp("converter", "Конвертер единиц", "📐", "Инструменты", 4.3, "2.1 МБ"),
  shopApp("scanner", "Сканер документов", "📄", "Инструменты", 4.5, "12 МБ"),
  shopApp("recorder", "Диктофон", "🎙️", "Инструменты", 4.1, "3.9 МБ"),
  shopApp("qr", "QR-сканер", "🔳", "Инструменты", 4.4, "4.2 МБ"),

  // ---- Продуктивность ----
  shopApp("calendar", "Календарь", "📅", "Продуктивность", 4.5, "9 МБ"),
  shopApp("todo", "Задачи", "✅", "Продуктивность", 4.6, "6 МБ"),
  shopApp("cloud", "Облако", "☁️", "Продуктивность", 4.3, "15 МБ"),
  shopApp("mail", "Почта", "📧", "Продуктивность", 4.2, "22 МБ"),
  shopApp("office", "Офисный пакет", "📊", "Продуктивность", 4.4, "45 МБ"),
  shopApp("translator", "Переводчик", "🌍", "Продуктивность", 4.5, "18 МБ"),

  // ---- Соцсети и общение ----
  shopApp("chat", "Мессенджер", "💬", "Общение", 4.3, "28 МБ"),
  shopApp("video", "Видеозвонки", "📹", "Общение", 4.2, "31 МБ"),
  shopApp("social", "Лента новостей", "📰", "Общение", 4.0, "26 МБ"),

  // ---- Развлечения ----
  shopApp("music", "Музыка", "🎵", "Развлечения", 4.6, "19 МБ"),
  shopApp("video-player", "Видеоплеер", "🎬", "Развлечения", 4.4, "24 МБ"),
  shopApp("games", "Игровой центр", "🎮", "Развлечения", 4.5, "40 МБ"),
  shopApp("podcast", "Подкасты", "🎧", "Развлечения", 4.3, "14 МБ"),
  shopApp("radio", "Радио", "📻", "Развлечения", 4.1, "8 МБ"),

  // ---- Здоровье и стиль жизни ----
  shopApp("health", "Здоровье", "❤️", "Здоровье", 4.4, "16 МБ"),
  shopApp("fitness", "Фитнес-трекер", "🏃", "Здоровье", 4.3, "20 МБ"),
  shopApp("sleep", "Сон", "😴", "Здоровье", 4.2, "9 МБ"),

  // ---- Фото и графика ----
  shopApp("gallery", "Галерея Плюс", "🖼️", "Фото", 4.5, "17 МБ"),
  shopApp("editor", "Фоторедактор", "🎨", "Фото", 4.4, "33 МБ"),
  shopApp("camera-pro", "Камера Pro", "📷", "Фото", 4.6, "27 МБ"),
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
        <div class="icon-glyph">${item.icon}</div>
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

// ---- Пример простого установленного приложения: калькулятор ----
function renderCalcApp(container) {
  container.innerHTML = `<p>Здесь будет калькулятор. Замените на свою вёрстку/логику.</p>`;
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
//  ПРИЛОЖЕНИЕ: О СИСТЕМЕ
// ============================================================
function renderAboutApp(container) {
  container.innerHTML = `
    <p><b>OneUI OS (симулятор)</b></p>
    <p>Версия MVP. Работает внутри Telegram Mini App.</p>
  `;
}

// ============================================================
//  СТАРТ
// ============================================================
applyTheme();
applyWallpaper();
renderDesktop();
setupSwipeGestures();
setupNavBar();
