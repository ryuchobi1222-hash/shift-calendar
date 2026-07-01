const calendarEl = document.getElementById("calendar");
const monthTitleEl = document.getElementById("monthTitle");
const offCountEl = document.getElementById("offCount");
const workCountEl = document.getElementById("workCount");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

let current = new Date();
current.setDate(1);

function keyFor(year, monthIndex) {
  return `kiboukyu-${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function dateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function loadMonth(year, monthIndex) {
  const raw = localStorage.getItem(keyFor(year, monthIndex));
  return raw ? JSON.parse(raw) : {};
}

function saveMonth(year, monthIndex, data) {
  localStorage.setItem(keyFor(year, monthIndex), JSON.stringify(data));
}

function isWeekend(year, monthIndex, day) {
  const w = new Date(year, monthIndex, day).getDay();
  return w === 0 || w === 6;
}

function render() {
  const year = current.getFullYear();
  const monthIndex = current.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();

  const data = loadMonth(year, monthIndex);
  calendarEl.innerHTML = "";
  monthTitleEl.textContent = `${year}年${monthIndex + 1}月`;

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    blank.className = "day blank";
    calendarEl.appendChild(blank);
  }

  let offCount = 0;
  let workCount = 0;

  for (let day = 1; day <= lastDate; day++) {
    const id = dateKey(year, monthIndex, day);

    // 未設定なら土日は希望休、平日は出勤
    if (!data[id]) {
      data[id] = isWeekend(year, monthIndex, day) ? "off" : "work";
    }

    const status = data[id];
    if (status === "off") offCount++;
    if (status === "work") workCount++;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `day ${status === "off" ? "off" : "work"} ${isWeekend(year, monthIndex, day) ? "weekend" : ""}`;

    if (
      today.getFullYear() === year &&
      today.getMonth() === monthIndex &&
      today.getDate() === day
    ) {
      cell.classList.add("today");
    }

    cell.innerHTML = `
      <span class="dayNumber">${day}</span>
      <span class="status">${status === "off" ? "希望休" : "出勤"}</span>
    `;

    cell.addEventListener("click", () => {
      data[id] = data[id] === "off" ? "work" : "off";
      saveMonth(year, monthIndex, data);
      render();
    });

    calendarEl.appendChild(cell);
  }

  saveMonth(year, monthIndex, data);
  offCountEl.textContent = `${offCount}日`;
  workCountEl.textContent = `${workCount}日`;
}

prevBtn.addEventListener("click", () => {
  current.setMonth(current.getMonth() - 1);
  render();
});

nextBtn.addEventListener("click", () => {
  current.setMonth(current.getMonth() + 1);
  render();
});

todayBtn.addEventListener("click", () => {
  current = new Date();
  current.setDate(1);
  render();
});

clearBtn.addEventListener("click", () => {
  const year = current.getFullYear();
  const monthIndex = current.getMonth();
  if (confirm("この月の設定をリセットしますか？")) {
    localStorage.removeItem(keyFor(year, monthIndex));
    render();
  }
});

copyBtn.addEventListener("click", async () => {
  const year = current.getFullYear();
  const monthIndex = current.getMonth();
  const data = loadMonth(year, monthIndex);

  const offDays = Object.entries(data)
    .filter(([, status]) => status === "off")
    .map(([date]) => Number(date.slice(-2)))
    .sort((a, b) => a - b);

  const text = `${year}年${monthIndex + 1}月 希望休\n${offDays.join("日、")}日`;

  try {
    await navigator.clipboard.writeText(text);
    alert("希望休をコピーしました");
  } catch {
    alert(text);
  }
});

render();
