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

// ============================================================
//  ХРАНИЛИЩЕ НАСТРОЕК (localStorage — простая "сохранка" на клиенте)
// ============================================================
const STORAGE_KEY = "oneui_os_state_v1";

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* повреждённые данные — игнорируем */ }
  }
  // состояние по умолчанию, если сохранки ещё нет
  return {
    darkMode: false,
    installedApps: [], // сюда попадают id приложений, "установленных" из магазина
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
//  РЕНДЕР СЕТКИ ИКОНОК И ДОКА
// ============================================================
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
  const grid = document.getElementById("app-grid");
  const dock = document.getElementById("dock");
  grid.innerHTML = "";
  dock.innerHTML = "";

  APPS.forEach((app) => {
    // приложения из категории "store" считаются установленными только если пользователь их поставил,
    // но встроенные системные (settings/store/notes/about) видны всегда
    (app.inDock ? dock : grid).appendChild(iconButton(app));
  });

  // Дополнительно рисуем иконки приложений, "установленных" из магазина
  state.installedApps.forEach((appId) => {
    const shopApp = STORE_CATALOG.find((a) => a.id === appId);
    if (shopApp) grid.appendChild(iconButton(shopApp));
  });
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
