const calendarEl = document.getElementById("calendar");
const monthTitleEl = document.getElementById("monthTitle");
const offCountEl = document.getElementById("offCount");
const workCountEl = document.getElementById("workCount");
const remainCountEl = document.getElementById("remainCount");
const limitInput = document.getElementById("limitInput");
const limitLabel = document.getElementById("limitLabel");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const lineBtn = document.getElementById("lineBtn");
const pdfBtn = document.getElementById("pdfBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const copyText = document.getElementById("copyText");

const memoModal = document.getElementById("memoModal");
const memoTitle = document.getElementById("memoTitle");
const memoInput = document.getElementById("memoInput");
const saveMemoBtn = document.getElementById("saveMemoBtn");
const deleteMemoBtn = document.getElementById("deleteMemoBtn");
const cancelMemoBtn = document.getElementById("cancelMemoBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const toast = document.getElementById("toast");

let current = new Date();
current.setDate(1);
let selectedMemoDate = null;
let suppressNextClick = false;

const defaultLimit = 10;
const weekNames = ["日", "月", "火", "水", "木", "金", "土"];

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 1400);
}

function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}

function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function keyFor(year, monthIndex) {
  return `kiboukyu-v4-${monthKey(year, monthIndex)}`;
}

function limitKeyFor(year, monthIndex) {
  return `kiboukyu-v4-limit-${monthKey(year, monthIndex)}`;
}

function dateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function loadData(year, monthIndex) {
  const raw = localStorage.getItem(keyFor(year, monthIndex));
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveData(year, monthIndex, data) {
  localStorage.setItem(keyFor(year, monthIndex), JSON.stringify(data));
}

function loadLimit(year, monthIndex) {
  const saved = localStorage.getItem(limitKeyFor(year, monthIndex));
  return saved === null ? defaultLimit : Number(saved);
}

function saveLimit(year, monthIndex, value) {
  localStorage.setItem(limitKeyFor(year, monthIndex), String(value));
}

function isWeekend(year, monthIndex, day) {
  const week = new Date(year, monthIndex, day).getDay();
  return week === 0 || week === 6;
}

function isToday(year, monthIndex, day) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day;
}

function getRecord(data, key) {
  if (!data[key]) data[key] = { status: "work", memo: "" };
  return data[key];
}

function getStatus(year, monthIndex, day, data) {
  if (isWeekend(year, monthIndex, day)) return "fixed";
  const key = dateKey(year, monthIndex, day);
  return data[key]?.status || "work";
}

function setStatus(year, monthIndex, day, status, data) {
  if (isWeekend(year, monthIndex, day)) return;

  const key = dateKey(year, monthIndex, day);
  const rec = getRecord(data, key);
  rec.status = status;

  if (rec.status === "work" && !rec.memo) delete data[key];

  saveData(year, monthIndex, data);
}

function getMemo(year, monthIndex, day, data) {
  return data[dateKey(year, monthIndex, day)]?.memo || "";
}

function setMemo(year, monthIndex, day, memo, data) {
  const key = dateKey(year, monthIndex, day);
  const rec = getRecord(data, key);
  rec.memo = memo.trim();

  if (rec.status === "work" && !rec.memo) delete data[key];

  saveData(year, monthIndex, data);
}

function formatMonthTitle(year, monthIndex) {
  return `${year}年${monthIndex + 1}月`;
}

function render() {
  const year = current.getFullYear();
  const monthIndex = current.getMonth();
  const data = loadData(year, monthIndex);
  const limit = loadLimit(year, monthIndex);

  monthTitleEl.textContent = formatMonthTitle(year, monthIndex);
  limitInput.value = limit;
  limitLabel.textContent = limit;

  calendarEl.innerHTML = "";

  const firstWeek = new Date(year, monthIndex, 1).getDay();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  for (let i = 0; i < firstWeek; i++) {
    const blank = document.createElement("div");
    blank.className = "day blank";
    calendarEl.appendChild(blank);
  }

  let requestCount = 0;
  let workCount = 0;
  const requestDays = [];
  const memos = [];

  for (let day = 1; day <= lastDay; day++) {
    const status = getStatus(year, monthIndex, day, data);
    const memo = getMemo(year, monthIndex, day, data);

    if (status === "off") {
      requestCount++;
      requestDays.push(day);
    } else if (status === "work") {
      workCount++;
    }

    if (memo) memos.push({ day, memo });

    const dayEl = document.createElement("button");
    dayEl.type = "button";
    dayEl.className = "day";

    if (status === "off") dayEl.classList.add("off");
    if (status === "fixed") dayEl.classList.add("fixed");
    if (isToday(year, monthIndex, day)) dayEl.classList.add("today");

    const label = status === "fixed" ? "固定休" : status === "off" ? "希望休" : "出勤";

    dayEl.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-status">${label}</span>
      ${memo ? '<span class="memo-dot"></span>' : ""}
    `;

    let pressTimer = null;

    const startPress = () => {
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        suppressNextClick = true;
        haptic();
        openMemo(year, monthIndex, day);
      }, 560);
    };

    const cancelPress = () => {
      clearTimeout(pressTimer);
    };

    dayEl.addEventListener("touchstart", startPress, { passive: true });
    dayEl.addEventListener("touchmove", cancelPress, { passive: true });
    dayEl.addEventListener("touchend", cancelPress);
    dayEl.addEventListener("mousedown", startPress);
    dayEl.addEventListener("mouseleave", cancelPress);
    dayEl.addEventListener("mouseup", cancelPress);

    dayEl.addEventListener("click", () => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }

      if (status === "fixed") return;

      const freshData = loadData(year, monthIndex);
      const currentStatus = getStatus(year, monthIndex, day, freshData);
      setStatus(year, monthIndex, day, currentStatus === "off" ? "work" : "off", freshData);
      haptic();
      render();
    });

    calendarEl.appendChild(dayEl);
  }

  offCountEl.textContent = `${requestCount}日`;
  workCountEl.textContent = `${workCount}日`;

  const remain = limit - requestCount;
  remainCountEl.textContent = `${remain}日`;
  remainCountEl.style.color = remain < 0 ? "var(--danger)" : "var(--text)";

  copyText.value = makeText(year, monthIndex, requestDays, requestCount, limit, memos);
}

function makeText(year, monthIndex, requestDays, requestCount, limit, memos) {
  const month = monthIndex + 1;

  const requestText = requestDays.length
    ? requestDays
        .map((day) => `${month}/${day}（${weekNames[new Date(year, monthIndex, day).getDay()]}）`)
        .join("\n")
    : "なし";

  const memoText = memos.length
    ? memos
        .map((m) => `${month}/${m.day}（${weekNames[new Date(year, monthIndex, m.day).getDay()]}） ${m.memo}`)
        .join("\n")
    : "";

  return [
    `【${year}年${month}月 希望休】`,
    "",
    requestText,
    "",
    `希望休数：${requestCount}日 / 上限${limit}日`,
    memoText ? "\n【メモ】\n" + memoText : "",
    "",
    "よろしくお願いいたします。"
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

function openMemo(year, monthIndex, day) {
  selectedMemoDate = { year, monthIndex, day };
  const data = loadData(year, monthIndex);
  memoTitle.textContent = `${monthIndex + 1}/${day} のメモ`;
  memoInput.value = getMemo(year, monthIndex, day, data);
  memoModal.classList.remove("hidden");
  memoModal.setAttribute("aria-hidden", "false");
  setTimeout(() => memoInput.focus(), 120);
}

function closeMemo() {
  memoModal.classList.add("hidden");
  memoModal.setAttribute("aria-hidden", "true");
  selectedMemoDate = null;
}

saveMemoBtn.addEventListener("click", () => {
  if (!selectedMemoDate) return;

  const { year, monthIndex, day } = selectedMemoDate;
  const data = loadData(year, monthIndex);
  setMemo(year, monthIndex, day, memoInput.value, data);
  closeMemo();
  render();
  showToast("メモを保存しました");
});

deleteMemoBtn.addEventListener("click", () => {
  if (!selectedMemoDate) return;

  const { year, monthIndex, day } = selectedMemoDate;
  const data = loadData(year, monthIndex);
  setMemo(year, monthIndex, day, "", data);
  closeMemo();
  render();
  showToast("メモを削除しました");
});

cancelMemoBtn.addEventListener("click", closeMemo);

memoModal.addEventListener("click", (event) => {
  if (event.target === memoModal) closeMemo();
});

function changeMonth(amount) {
  current.setMonth(current.getMonth() + amount);
  current.setDate(1);
  render();
}

prevBtn.addEventListener("click", () => changeMonth(-1));
nextBtn.addEventListener("click", () => changeMonth(1));

todayBtn.addEventListener("click", () => {
  current = new Date();
  current.setDate(1);
  render();
});

limitInput.addEventListener("input", () => {
  const value = Number(limitInput.value || 0);
  saveLimit(current.getFullYear(), current.getMonth(), value);
  limitLabel.textContent = value;
  render();
});

clearBtn.addEventListener("click", () => {
  const title = formatMonthTitle(current.getFullYear(), current.getMonth());
  if (!confirm(`${title}の希望休とメモをリセットしますか？`)) return;

  localStorage.removeItem(keyFor(current.getFullYear(), current.getMonth()));
  render();
  showToast("リセットしました");
});

lineBtn.addEventListener("click", () => {
  const text = encodeURIComponent(copyText.value);
  window.location.href = `https://line.me/R/msg/text/?${text}`;
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyText.value);
    showToast("コピーしました");
  } catch {
    copyText.focus();
    copyText.select();
    showToast("長押しでコピーしてください");
  }
});

pdfBtn.addEventListener("click", () => {
  window.print();
});

settingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
  settingsModal.setAttribute("aria-hidden", "false");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
  settingsModal.setAttribute("aria-hidden", "true");
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    settingsModal.classList.add("hidden");
    settingsModal.setAttribute("aria-hidden", "true");
  }
});

document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.theme;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kiboukyu-v4-theme", theme);
    settingsModal.classList.add("hidden");
    settingsModal.setAttribute("aria-hidden", "true");
    showToast("テーマを変更しました");
  });
});

const savedTheme = localStorage.getItem("kiboukyu-v4-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

render();
