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
    installedApps: [...DEFAULT_PREINSTALLED_APPS],
    currentPage: 0,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

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
    <div class="settings-row">
      <span>Тёмная тема</span>
      <div class="switch ${state.darkMode ? "on" : ""}" id="toggle-dark"></div>
    </div>
    <div class="settings-row">
      <span>Установлено приложений</span>
      <span>${state.installedApps.length}</span>
    </div>
    <div class="settings-row">
      <span>Пользователь Telegram</span>
      <span>${tg.initDataUnsafe?.user?.first_name || "Гость"}</span>
    </div>
  `;

  container.querySelector("#toggle-dark").addEventListener("click", (e) => {
    state.darkMode = !state.darkMode;
    saveState();
    applyTheme();
    e.currentTarget.classList.toggle("on", state.darkMode);
  });
}

function applyTheme() {
  document.body.classList.toggle("dark", state.darkMode);
}

// ============================================================
//  ПРИЛОЖЕНИЕ: МАГАЗИН
// ============================================================
// Каталог "загружаемых" утилит. В реальном проекте эти данные стоит
// получать с бэкенда (см. bot.py + отдельный API), здесь — заглушка.
// Каждая запись — как карточка реального Google Play: рейтинг, число оценок, размер файла.
// Реальные иконки/данные из настоящего Play Маркета получить нельзя — у Google нет публичного
// API для стороннего каталога, поэтому здесь пример-заглушка в том же визуальном стиле.
const STORE_CATALOG = [
  { id: "calc", name: "Калькулятор", icon: "🧮", desc: "Инструменты", rating: 4.6, votes: "12К", size: "1.2 МБ", render: renderCalcApp },
  { id: "weather", name: "Погода", icon: "☀️", desc: "Погода и время", rating: 4.4, votes: "8.7К", size: "3.4 МБ", render: renderWeatherApp },
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

  STORE_CATALOG.forEach((item) => {
    const installed = state.installedApps.includes(item.id);

    const row = document.createElement("div");
    row.className = "store-item";
    row.innerHTML = `
      <div class="icon-glyph">${item.icon}</div>
      <div class="store-item-info">
        <div class="store-item-title">${item.name}</div>
        <div class="store-item-desc">${item.desc}</div>
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
renderDesktop();
setupSwipeGestures();
setupNavBar();
