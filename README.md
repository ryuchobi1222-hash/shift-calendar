<!DOCTYPE html>

<html lang="ja">

<head>

  <meta charset="UTF-8" />

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>希望休カレンダー</title>

  <style>

    body {

      font-family: -apple-system, BlinkMacSystemFont, sans-serif;

      margin: 0;

      background: #f5f5f5;

      color: #222;

    }

    header {

      background: #4f7cff;

      color: white;

      padding: 18px;

      text-align: center;

      font-size: 22px;

      font-weight: bold;

    }

    .container {

      max-width: 500px;

      margin: 0 auto;

      padding: 16px;

    }

    .month-control {

      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-bottom: 14px;

    }

    button {

      border: none;

      background: #4f7cff;

      color: white;

      padding: 10px 14px;

      border-radius: 10px;

      font-size: 15px;

    }

    .month-title {

      font-size: 20px;

      font-weight: bold;

    }

    .count {

      background: white;

      padding: 12px;

      border-radius: 12px;

      margin-bottom: 14px;

      text-align: center;

      font-weight: bold;

    }

    .weekdays, .calendar {

      display: grid;

      grid-template-columns: repeat(7, 1fr);

      gap: 6px;

    }

    .weekdays div {

      text-align: center;

      font-size: 13px;

      font-weight: bold;

      color: #666;

    }

    .day {

      background: white;

      height: 58px;

      border-radius: 12px;

      display: flex;

      flex-direction: column;

      justify-content: center;

      align-items: center;

      font-size: 15px;

      box-shadow: 0 1px 3px rgba(0,0,0,0.08);

      user-select: none;

    }

    .day.empty {

      background: transparent;

      box-shadow: none;

    }

    .day.off {

      background: #ffefef;

      color: #d33;

      font-weight: bold;

    }

    .label {

      font-size: 11px;

      margin-top: 3px;

    }

    .sat {

      color: #2f6cff;

    }

    .sun {

      color: #e34848;

    }

  </style>

</head>

<body>

  <header>希望休カレンダー</header>

  <div class="container">

    <div class="month-control">

      <button onclick="changeMonth(-1)">前月</button>

      <div class="month-title" id="monthTitle"></div>

      <button onclick="changeMonth(1)">翌月</button>

    </div>

    <div class="count" id="offCount">希望休：0日</div>

    <div class="weekdays">

      <div class="sun">日</div>

      <div>月</div>

      <div>火</div>

      <div>水</div>

      <div>木</div>

      <div>金</div>

      <div class="sat">土</div>

    </div>

    <div class="calendar" id="calendar"></div>

  </div>

  <script>

    let currentDate = new Date();

    let selectedOffDays = {};

    function getMonthKey(year, month) {

      return `${year}-${month + 1}`;

    }

    function renderCalendar() {

      const calendar = document.getElementById("calendar");

      const monthTitle = document.getElementById("monthTitle");

      const offCount = document.getElementById("offCount");

      calendar.innerHTML = "";

      const year = currentDate.getFullYear();

      const month = currentDate.getMonth();

      const monthKey = getMonthKey(year, month);

      if (!selectedOffDays[monthKey]) {

        selectedOffDays[monthKey] = [];

      }

      monthTitle.textContent = `${year}年 ${month + 1}月`;

      const firstDay = new Date(year, month, 1).getDay();

      const lastDate = new Date(year, month + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {

        const empty = document.createElement("div");

        empty.className = "day empty";

        calendar.appendChild(empty);

      }

      for (let day = 1; day <= lastDate; day++) {

        const date = new Date(year, month, day);

        const week = date.getDay();

        const dayDiv = document.createElement("div");

        dayDiv.className = "day";

        if (week === 0) dayDiv.classList.add("sun");

        if (week === 6) dayDiv.classList.add("sat");

        const isWeekend = week === 0 || week === 6;

        const isSelected = selectedOffDays[monthKey].includes(day);

        if (isWeekend || isSelected) {

          dayDiv.classList.add("off");

        }

        dayDiv.innerHTML = `

          <div>${day}</div>

          <div class="label">${dayDiv.classList.contains("off") ? "休み" : "出勤"}</div>

        `;

        dayDiv.onclick = () => {

          const index = selectedOffDays[monthKey].indexOf(day);

          if (index === -1) {

            selectedOffDays[monthKey].push(day);

          } else {

            selectedOffDays[monthKey].splice(index, 1);

          }

          renderCalendar();

        };

        calendar.appendChild(dayDiv);

      }

      const weekendDays = [];

      for (let day = 1; day <= lastDate; day++) {

        const week = new Date(year, month, day).getDay();

        if (week === 0 || week === 6) weekendDays.push(day);

      }

      const allOffDays = new Set([...weekendDays, ...selectedOffDays[monthKey]]);

      offCount.textContent = `休み：${allOffDays.size}日`;

    }

    function changeMonth(amount) {

      currentDate.setMonth(currentDate.getMonth() + amount);

      renderCalendar();

    }

    renderCalendar();

  </script>

</body>

</html>
