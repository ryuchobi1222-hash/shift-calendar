const calendarEl = document.getElementById("calendar");
const monthTitleEl = document.getElementById("monthTitle");
const offCountEl = document.getElementById("offCount");
const workCountEl = document.getElementById("workCount");
const requestCountEl = document.getElementById("requestCount");
const remainCountEl = document.getElementById("remainCount");
const limitInput = document.getElementById("limitInput");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const copyText = document.getElementById("copyText");

let current = new Date();
current.setDate(1);

const defaultLimit = 10;

function keyFor(year, monthIndex) {
  return `kiboukyu-${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function limitKeyFor(year, monthIndex) {
  return `kiboukyu-limit-${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function dateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function loadData(year, monthIndex) {
  const raw = localStorage.getItem(keyFor(year, monthIndex));
  return raw ? JSON.parse(raw) : {};
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
  return (
    today.getFullYear() === year &&
    today.getMonth() === monthIndex &&
    today.getDate() === day
  );
}

function getStatus(year, monthIndex, day, data) {
  const key = dateKey(year, monthIndex, day);
  if (data[key]) return data[key];
  return isWeekend(year, monthIndex, day) ? "off" : "work";
}

function setStatus(year, monthIndex, day, status, data) {
  const key = dateKey(year, monthIndex, day);
  const defaultStatus = isWeekend(year, monthIndex, day) ? "off" : "work";

  if (status === defaultStatus) {
    delete data[key];
  } else {
    data[key] = status;
  }

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

  calendarEl.innerHTML = "";

  const firstWeek = new Date(year, monthIndex, 1).getDay();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  for (let i = 0; i < firstWeek; i++) {
    const blank = document.createElement("div");
    blank.className = "day blank";
    calendarEl.appendChild(blank);
  }

  let offCount = 0;
  let workCount = 0;
  let requestCount = 0;
  const requestDays = [];
  const allOffDays = [];

  for (let day = 1; day <= lastDay; day++) {
    const status = getStatus(year, monthIndex, day, data);
    const weekend = isWeekend(year, monthIndex, day);
    const today = isToday(year, monthIndex, day);

    if (status === "off") {
      offCount++;
      allOffDays.push(day);
      if (!weekend) {
        requestCount++;
        requestDays.push(day);
      }
    } else {
      workCount++;
    }

    const dayEl = document.createElement("button");
    dayEl.type = "button";
    dayEl.className = "day";
    if (status === "off") dayEl.classList.add("off");
    if (weekend) dayEl.classList.add("weekend");
    if (today) dayEl.classList.add("today");
    if (requestCount > limit && status === "off" && !weekend) {
      dayEl.classList.add("limitOver");
    }

    dayEl.innerHTML = `
      <span class="dayNumber">${day}</span>
      <span class="status">${status === "off" ? "希望休" : "出勤"}</span>
    `;

    dayEl.addEventListener("click", () => {
      const currentStatus = getStatus(year, monthIndex, day, data);
      const nextStatus = currentStatus === "off" ? "work" : "off";
      setStatus(year, monthIndex, day, nextStatus, data);
      render();
    });

    calendarEl.appendChild(dayEl);
  }

  offCountEl.textContent = `${offCount}日`;
  workCountEl.textContent = `${workCount}日`;
  requestCountEl.textContent = `${requestCount}日`;

  const remain = limit - requestCount;
  remainCountEl.textContent = `${remain}日`;
  remainCountEl.style.color = remain < 0 ? "var(--danger)" : "var(--text)";

  copyText.value = makeCopyText(year, monthIndex, requestDays, allOffDays, requestCount, limit);
}

function makeCopyText(year, monthIndex, requestDays, allOffDays, requestCount, limit) {
  const month = monthIndex + 1;
  const requestText = requestDays.length
    ? requestDays.map((d) => `${month}/${d}`).join("、")
    : "なし";

  const allOffText = allOffDays.length
    ? allOffDays.map((d) => `${month}/${d}`).join("、")
    : "なし";

  return [
    `【${year}年${month}月 希望休】`,
    `平日希望休：${requestText}`,
    `希望休数：${requestCount}日 / 上限${limit}日`,
    ``,
    `休み扱い全日：${allOffText}`
  ].join("\n");
}

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
  const year = current.getFullYear();
  const monthIndex = current.getMonth();
  const value = Number(limitInput.value || 0);
  saveLimit(year, monthIndex, value);
  render();
});

clearBtn.addEventListener("click", () => {
  const year = current.getFullYear();
  const monthIndex = current.getMonth();
  const ok = confirm(`${formatMonthTitle(year, monthIndex)}の変更をリセットしますか？`);
  if (!ok) return;

  localStorage.removeItem(keyFor(year, monthIndex));
  render();
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyText.value);
    copyBtn.textContent = "コピーしました";
    setTimeout(() => {
      copyBtn.textContent = "希望休をコピー";
    }, 1400);
  } catch (error) {
    copyText.focus();
    copyText.select();
    alert("コピーできない場合は、下の文章を長押ししてコピーしてください。");
  }
});

render();
