// ======================================
// Calendar.js
// アートメイクまなみ予約システム
// ======================================

let reservedSlots = [];
let businessHours = [];
let holidays = [];
let treatmentSlots = {};

// 日付が選択されたかどうか
let calendarDateSelected = false;

// ======================================
// 電話・LINE固定ボタンの表示切り替え
// ======================================

function updateCalendarContactButtons() {

const contactButtons =
    document.getElementById("calendarContactButtons");

const calendarSection =
    document.getElementById("calendarSection");

const customerSection =
    document.getElementById("customerSection");

const confirmSection =
    document.getElementById("confirmSection");

if (
    !contactButtons ||
    !calendarSection ||
    !customerSection ||
    !confirmSection
) {
    return;
}

// カレンダーが非表示ならボタンも非表示
if (getComputedStyle(calendarSection).display === "none") {
    contactButtons.style.display = "none";
    return;
}

// 日付を選択するまではボタンを表示しない
if (!calendarDateSelected) {
    contactButtons.style.display = "none";
    return;
}

// 予約確認画面が表示されていたら非表示
if (getComputedStyle(confirmSection).display !== "none") {
    contactButtons.style.display = "none";
    return;
}

const calendarRect =
    calendarSection.getBoundingClientRect();

// カレンダー・時間選択エリアが画面外なら非表示
if (
    calendarRect.bottom <= 0 ||
    calendarRect.top >= window.innerHeight
) {
    contactButtons.style.display = "none";
    return;
}

// お客様情報の画面が表示されている場合
if (getComputedStyle(customerSection).display !== "none") {

    const customerTop =
        customerSection.getBoundingClientRect().top;

    // お客様情報の入力画面に進んだら非表示
    if (customerTop < window.innerHeight * 0.75) {
        contactButtons.style.display = "none";
        return;
    }
}

// カレンダー・時間選択エリアでは表示
contactButtons.style.display = "flex";

}

// スクロール・画面サイズ変更時に表示状態を更新
window.addEventListener(
"scroll",
updateCalendarContactButtons,
{ passive: true }
);

window.addEventListener(
"resize",
updateCalendarContactButtons
);



async function loadReservations() {

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=reservations"
    );

    reservedSlots = await response.json();

}

async function loadBusinessHours() {

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=businesshours"
    );

    businessHours = await response.json();

}

async function loadHolidays() {

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=holidays"
    );

    holidays = await response.json();

}

async function loadInitialData() {

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=init"
    );

    const data = await response.json();

    reservedSlots = data.reservations || [];
    businessHours = data.businessHours || [];
    holidays = data.holidays || [];

    const treatmentData = data.treatments || [];

    treatmentSlots = {};

    treatmentData.forEach(item => {

        treatmentSlots[item.name] = Number(item.slots);

    });

    exclusiveRules = {};

    treatmentData.forEach(item => {

        if (!item.exclusive) return;

        const ngList = item.exclusive
            .split(",")
            .map(name => name.trim())
            .filter(name => name);

        exclusiveRules[item.name] = ngList;

    });

    // メニュー表示（カテゴリーごとのアコーディオン）
    const menuList = document.getElementById("menuList");
    menuList.innerHTML = "";

    const enabledTreatments = treatmentData
        .filter(item => item.enabled)
        .sort((a, b) => a.displayOrder - b.displayOrder);

    const menuCategories = [
        { key: "brow", title: "眉", matches: name => name.includes("眉") },
        { key: "lip", title: "リップ", matches: name => name.includes("リップ") && !name.includes("眉") },
        { key: "eyeliner", title: "アイライン", matches: name => name.includes("アイライン") },
        { key: "hairline", title: "ヘアライン", matches: name => name.includes("ヘアライン") }
    ];

    const groupedMenus = menuCategories.map(category => ({
        ...category,
        items: enabledTreatments.filter(item => category.matches(item.name))
    })).filter(category => category.items.length > 0);

    const otherItems = enabledTreatments.filter(item =>
        !menuCategories.some(category => category.matches(item.name))
    );
    if (otherItems.length > 0) {
        groupedMenus.push({ key: "other", title: "その他", items: otherItems });
    }

    groupedMenus.forEach((category, index) => {
        const section = document.createElement("section");
        section.className = `menu-category menu-category-${category.key}`;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "menu-category-toggle";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", `menu-options-${category.key}`);

        const title = document.createElement("span");
        title.textContent = category.title;

        const arrow = document.createElement("span");
        arrow.className = "menu-category-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "▼";

        toggle.appendChild(title);
        toggle.appendChild(arrow);

        const options = document.createElement("div");
        options.className = "menu-category-options";
        options.id = `menu-options-${category.key}`;
        options.hidden = true;

        category.items.forEach(item => {
            const label = document.createElement("label");
            label.className = "menu-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "menu";
            checkbox.value = item.name;

            const span = document.createElement("span");
            span.textContent = item.name;

            label.appendChild(checkbox);
            label.appendChild(span);
            options.appendChild(label);
        });

        toggle.addEventListener("click", () => {
            const shouldOpen = toggle.getAttribute("aria-expanded") !== "true";

            // 開いているカテゴリーは先にすべて閉じる（同時に1つだけ開く）
            menuList.querySelectorAll(".menu-category-toggle").forEach(otherToggle => {
                otherToggle.setAttribute("aria-expanded", "false");
                const otherOptions = document.getElementById(
                    otherToggle.getAttribute("aria-controls")
                );
                if (otherOptions) otherOptions.hidden = true;
            });

            // 押したカテゴリーが閉じていた場合だけ開く。開いていた場合は閉じたまま。
            if (shouldOpen) {
                toggle.setAttribute("aria-expanded", "true");
                options.hidden = false;
            }
        });

        section.appendChild(toggle);
        section.appendChild(options);
        menuList.appendChild(section);
    });

}

let customerData = {};
let selectedTime = null;
let selectedDate = null;
let currentDate = new Date();
const baseDate = new Date();

baseDate.setDate(1);
let reservationData = null;

let exclusiveRules = {};

function createLocalDate(date, time) {

    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    return new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        0
    );

}

function getRequiredSlots(){

    let total = 0;


    reservationData.menus.forEach(menu=>{


        total += treatmentSlots[menu] || 1;


    });


    return total;

}



// ================================================
// 予約ルール設定（変更はこの block だけ直せば全画面に反映される）
// ================================================

const RESERVATION_RULES = {

    // 営業曜日（0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土）
    openDays: [1, 2, 5],

    // 2メニュー以上は、この時間以降の開始を原則不可
    twoMenuCutoff: "16:15",

    // 例外：この曜日だけ cutoff 時間の開始を許可（2=火曜）
    twoMenuAllowedDay: 2,

    // カレンダー色分け用の実質枠（代表開始時間）
    slotTimes: {
        "初診": ["09:30", "11:45", "16:15"],
        "再診": ["09:30", "11:45", "14:00", "16:15"]
    },

    // 残り枠表示の上限
    maxSlots: {
        "初診": 3,
        "再診": 4
    }
};

// その日は営業日か
function isOpenDay(dateObj) {

    return RESERVATION_RULES.openDays.includes(dateObj.getDay());

}

// BusinessHours シートからその日の候補時間を取得
function getDayTimes(dateString, visit) {

    const dateObj = createLocalDate(dateString, "00:00");

    const weekdayNames = {
        0: "日",
        1: "月",
        2: "火",
        3: "水",
        4: "木",
        5: "金",
        6: "土"
    };

    const weekday = weekdayNames[dateObj.getDay()];

    const row = businessHours.find(item => item.weekday === weekday);

    if (!row) return [];

    const source = visit === "初診"
        ? row.first
        : row.repeat;

    return String(source || "")
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

}

// 2メニュー以上の開始時間ルール
function filterTwoMenuRule(times, dateObj) {

    const requiredSlots = getRequiredSlots();

    if (requiredSlots < 2) return times;

    return times.filter(time => {

        // cutoff より前 → OK
        if (time < RESERVATION_RULES.twoMenuCutoff) {
            return true;
        }

        // 例外曜日の cutoff 時間 → OK（火曜16:15）
        if (
            dateObj.getDay() === RESERVATION_RULES.twoMenuAllowedDay &&
            time === RESERVATION_RULES.twoMenuCutoff
        ) {
            return true;
        }

        // それ以降 → NG
        return false;

    });

}

// その日に予約可能な候補時間（営業日・休診日・ルールすべて適用）
function getReservableTimes(dateString, visit) {

    const dateObj = createLocalDate(dateString, "00:00");

    if (!isOpenDay(dateObj)) return [];

    if (holidays.includes(dateString)) return [];

    return filterTwoMenuRule(
        getDayTimes(dateString, visit),
        dateObj
    );

}



function canReserve(date, time) {

    const requiredSlots = getRequiredSlots();


    // 必要時間（分）
    const duration = requiredSlots * 120;


    const start =
    createLocalDate(date, time);


    const end =
    new Date(start);

    end.setMinutes(
        end.getMinutes() + duration
    );


    // 既存予約チェック

    for(let i = 0; i < reservedSlots.length; i++){


        const item = reservedSlots[i];


        if(item.date !== date){

            continue;

        }


        const bookedStart =
        createLocalDate(date, item.time);


        const bookedDuration =
        item.slotCount ? item.slotCount * 120 : 120;


        const bookedEnd =
        new Date(bookedStart);


        bookedEnd.setMinutes(
            bookedEnd.getMinutes()
            + bookedDuration
        );



        // 時間が重なっているか

        if(
            start < bookedEnd &&
            end > bookedStart
        ){

            return false;

        }


    }



    return true;


}


// ================================================
// HTMLエスケープ（お客様入力値を画面に表示する際に使用）
// ================================================

function escapeHtml(str) {

    if (str === null || str === undefined) return "";

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}

function generateCalendar(data) {

    reservationData = data;

    drawCalendar(currentDate, reservationData);

}

function drawCalendar(date, data) {

    const title = document.getElementById("calendarTitle");
    const calendar = document.getElementById("calendar");
    const timeArea = document.getElementById("timeArea");

    const year = date.getFullYear();
    const month = date.getMonth();

    title.textContent = `${year}年 ${month + 1}月`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let html = `
        <div class="calendar-grid">
            <div>日</div>
            <div>月</div>
            <div>火</div>
            <div>水</div>
            <div>木</div>
            <div>金</div>
            <div>土</div>
    `;

    for(let i=0;i<firstDay.getDay();i++){

        html += `<div></div>`;

    }

   for (let d = 1; d <= lastDay.getDate(); d++) {

    const date = new Date(year, month, d);

    const day = date.getDay();

    // 今日の日付（時刻は0:00にする）
const today = new Date();

today.setHours(0, 0, 0, 0);

date.setHours(0, 0, 0, 0);

// 翌日以降のみ予約可能
const tomorrow = new Date(today);

tomorrow.setDate(today.getDate() + 1);

const future = date >= tomorrow;

const dateString =
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const holiday = holidays.includes(dateString);

// 営業曜日・休診日判定（ルールは RESERVATION_RULES に一元化）
const reservable =
    RESERVATION_RULES.openDays.includes(day) &&
    !holiday;

// この日の営業時間（初診/再診別）
const dayTimes = getDayTimes(dateString, data.visit);

// 2メニューの開始時間ルールを適用した候補
const times = filterTwoMenuRule(dayTimes, date);

// ================================================
// カレンダー色分け用：実質枠数を計算
// ================================================

// 初診は3枠、再診は4枠
const maxSlots =
    RESERVATION_RULES.maxSlots[data.visit] || 4;

// 各実質枠の代表開始時間
const slotTimes =
    RESERVATION_RULES.slotTimes[data.visit] || [];

// 実質枠ごとの空き状況を確認
// （times には 2メニュールール適用済み）
let remain = 0;

slotTimes.forEach(time => {

    if (
        times.includes(time) &&
        canReserve(dateString, time)
    ) {
        remain++;
    }

});

// 念のため上限を超えないようにする
remain = Math.min(remain, maxSlots);

const full =
reservable &&
future &&
times.length > 0 &&
remain === 0;


if(reservable && future && !full){

    let colorClass = "";

// ================================================
// 残り枠の色分け
// ================================================

if (data.visit === "初診") {

    // 初診
    // 残り1枠 → 赤
    if (remain === 1) {
        colorClass = "one-left";

    // 残り2枠 → 黄色
    } else if (remain === 2) {
        colorClass = "two-left";
    }

    // 残り3枠以上 → colorClassなし
    // → 通常のベージュ

} else {

    // 再診
// 残り1枠 → 赤
if (remain === 1) {
    colorClass = "one-left";

// 残り2枠 → 黄色
} else if (remain === 2) {
    colorClass = "two-left";
}

// 残り3〜4枠 → colorClassなし
// → 元のベージュ
}



    html+=`
    <button
    class="day-button ${colorClass}"
    data-date="${dateString}">
    ${d}
    </button>
    `;

}

else if(full){

    html += `
    <button
        class="day-button full"
        disabled>
        <span class="full-label">満</span>
    </button>
`;

}
else{

    html+=`
    <button
    class="day-button"
    disabled>
    ${d}
    </button>
    `;

}

}

    html += `</div>`;

    calendar.innerHTML = html;

    timeArea.innerHTML = "";

    document.querySelectorAll(".day-button:not(:disabled)").forEach(btn=>{

    btn.addEventListener("click",()=>{

        document.querySelectorAll(".day-button").forEach(item=>{

            item.classList.remove("selected");

        });

        btn.classList.add("selected");

                selectedDate = btn.dataset.date;

// 日付を選択したので電話・LINEボタンを表示可能にする
calendarDateSelected = true;

updateCalendarContactButtons();

showTimes(data);

        // 時間表示の一番下が見える位置までスクロール
setTimeout(() => {
    const timeArea = document.getElementById("timeArea");

    const bottom =
        timeArea.getBoundingClientRect().bottom +
        window.scrollY;

    const target =
    bottom - window.innerHeight + 40;

    window.scrollTo({
        top: Math.max(0, target),
        behavior: "smooth"
    });
}, 100);

    });

});

}

// =========================
// 月送り
// =========================

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("prevMonth").addEventListener("click", () => {

       const prev = new Date(currentDate);

prev.setMonth(prev.getMonth() - 1);

if (
    prev.getFullYear() < baseDate.getFullYear() ||
    (
        prev.getFullYear() === baseDate.getFullYear() &&
        prev.getMonth() < baseDate.getMonth()
    )
){
    return;
}

currentDate = prev;

drawCalendar(currentDate, reservationData);

    });

    document.getElementById("nextMonth").addEventListener("click", () => {

       const next = new Date(currentDate);

next.setMonth(next.getMonth() + 1);

const limit = new Date(baseDate);

limit.setMonth(limit.getMonth() + 2);

if (
    next.getFullYear() > limit.getFullYear() ||
    (
        next.getFullYear() === limit.getFullYear() &&
        next.getMonth() > limit.getMonth()
    )
){
    return;
}

currentDate = next;

drawCalendar(currentDate, reservationData);

    });

});

function showTimes(data){

    const timeArea=document.getElementById("timeArea");

    const date = createLocalDate(selectedDate, "00:00");

    timeArea.innerHTML="";

    timeArea.innerHTML+=`
        <div class="selected-date-heading" style="margin-top:20px; display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <h4 style="margin:0;">
                ${selectedDate}
            </h4>
            <span style="font-size:12px; color:#8f8175; font-weight:400; white-space:nowrap;">
                日時をタップしWEB予約へ進む
            </span>
        </div>
    `;

// その日の候補時間（営業日・休診日・2メニュールール適用済み）
let availableTimes =
    getReservableTimes(selectedDate, data.visit)
        .filter(time => canReserve(selectedDate, time));

if (availableTimes.length === 0) {

    timeArea.innerHTML += `

        <p style="margin-top:20px;color:#c00;font-weight:bold;">

            この日の予約枠はすべて埋まっています。

        </p>

    `;

    return;

}

    // 時間表示
const earlyTimes = availableTimes.filter(time => time < "16:15");
const lateTimes = availableTimes.filter(time => time >= "16:15");

// 16:15より前は今まで通り1つずつ表示
earlyTimes.forEach(time => {
    timeArea.innerHTML += `
        <button class="time-button" data-time="${time}">
            ${time}
        </button>
    `;
});

// 16:15以降は1つの枠にまとめて縦並び
if (lateTimes.length > 0) {

    timeArea.innerHTML += `
        <div class="late-time-group">
            ${lateTimes.map(time => `
                <button class="time-button late-time-button" data-time="${time}">
                    ${time}
                </button>
            `).join("")}
        </div>
    `;
}

document.querySelectorAll(".time-button").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".time-button").forEach(item => {

            item.classList.remove("selected");

        });

        btn.classList.add("selected");

        selectedTime = btn.dataset.time;

showCustomerForm();

setTimeout(() => {
    const section = document.getElementById("customerSection");

    if (section) {
        const top = section.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
            top: top,
            behavior: "smooth"
        });
    }
}, 300);

    });

});

}

// ====================================
// 生年月日から年齢を自動計算
// ====================================

function calcAgeFromBirth(birthDate) {

    if (!birthDate) return "";

    const birth =
        new Date(birthDate + "T00:00:00");

    if (isNaN(birth.getTime())) return "";

    const today = new Date();

    let age =
        today.getFullYear() - birth.getFullYear();

    const m =
        today.getMonth() - birth.getMonth();

    if (
        m < 0 ||
        (m === 0 && today.getDate() < birth.getDate())
    ) {
        age--;
    }

    return age >= 0 ? age : "";

}

// ====================================
// 生年月日・施術歴日：手入力方式
// ====================================

function createDateSelects(hiddenId, prefix) {
    return `
        <div class="date-input-row">
            <input
                type="text"
                id="${prefix}Year"
                class="date-year"
                inputmode="numeric"
                maxlength="4"
                placeholder="西暦"
                aria-label="年"
                autocomplete="off"
            >
            <span>/</span>
            <input
                type="text"
                id="${prefix}Month"
                class="date-month"
                inputmode="numeric"
                maxlength="2"
                placeholder="月"
                aria-label="月"
                autocomplete="off"
            >
            <span>/</span>
            <input
                type="text"
                id="${prefix}Day"
                class="date-day"
                inputmode="numeric"
                maxlength="2"
                placeholder="日"
                aria-label="日"
                autocomplete="off"
            >
        </div>

        <input type="hidden" id="${hiddenId}">
    `;
}

function setupDateSelects(hiddenId, prefix) {
    const yearInput = document.getElementById(`${prefix}Year`);
    const monthInput = document.getElementById(`${prefix}Month`);
    const dayInput = document.getElementById(`${prefix}Day`);
    const hidden = document.getElementById(hiddenId);

    if (!yearInput || !monthInput || !dayInput || !hidden) {
        return;
    }

    const inputs = [yearInput, monthInput, dayInput];

    // 数字以外を除去
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "");
            updateDate();
        });
    });

    // 日付を検証し、YYYY-MM-DD形式に変換
    function updateDate() {
        hidden.value = "";

        const yearText = yearInput.value;
        const monthText = monthInput.value;
        const dayText = dayInput.value;

        // すべて入力されているか確認
        if (
            !/^\d{4}$/.test(yearText) ||
            !/^\d{1,2}$/.test(monthText) ||
            !/^\d{1,2}$/.test(dayText)
        ) {
            return;
        }

        const year = Number(yearText);
        const month = Number(monthText);
        const day = Number(dayText);

        // 月・日の範囲を確認
        if (
            year < 1 ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return;
        }

        // 実在する日付か確認
        const date = new Date(0);
        date.setHours(0, 0, 0, 0);
        date.setFullYear(year, month - 1, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return;
        }

        // 未来の日付は無効
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date > today) {
            return;
        }

        // GASへの送信形式：YYYY-MM-DD
        hidden.value =
            `${yearText}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // 月・日の入力欄から離れたときだけ1桁をゼロ埋め
    function normalizePart(input, max, label) {
        if (input.value === "") {
            updateDate();
            return;
        }

        const number = Number(input.value);

        if (
            !Number.isInteger(number) ||
            number < 1 ||
            number > max
        ) {
            hidden.value = "";

            alert(`${label}は1～${max}で入力してください。`);

            input.value = "";
            input.focus();

            return;
        }

        input.value = String(number).padStart(2, "0");

        updateDate();
    }

    monthInput.addEventListener("blur", () => {
        normalizePart(monthInput, 12, "月");
    });

    dayInput.addEventListener("blur", () => {
        normalizePart(dayInput, 31, "日");
    });

    yearInput.addEventListener("blur", updateDate);
}

function showCustomerForm() {

    const section = document.getElementById("customerSection");

    const form = document.getElementById("customerForm");

    // お客様情報の画面を表示
section.style.display = "block";

// 電話・LINEボタンの表示状態を更新
requestAnimationFrame(() => {
    updateCalendarContactButtons();
});

    if (reservationData.visit === "再診") {

    form.innerHTML = `

<div class="form-group">
<label>予約日</label>
<input type="text" value="${selectedDate}" readonly>
</div>

<div class="form-group">
<label>予約時間</label>
<input type="text" value="${selectedTime}" readonly>
</div>

<div class="form-group">
<label>氏名（フルネーム・漢字） <span style="color:red;">*</span></label>
<input type="text" id="customerName">
</div>

<button class="next-form">
確認画面へ
</button>

`;

    document.querySelector(".next-form").addEventListener("click", () => {

        const name = document.getElementById("customerName").value.trim();

        if (name === "") {
            alert("お名前を入力してください。");
            return;
        }

        customerData = {
            name: name
        };

        showConfirm();

    });

    return;
}

form.innerHTML = `

<div class="form-group">
<label>予約日</label>
<input type="text" value="${selectedDate}" readonly>
</div>

<div class="form-group">
<label>予約時間</label>
<input type="text" value="${selectedTime}" readonly>
</div>

<div class="form-group">
<label>氏名（フルネーム・漢字） <span style="color:red;">*</span></label>
<input type="text" id="customerName">
</div>

<div class="form-group">
<label>性別 <span style="color:red;">*</span></label>

<div class="radio-group">

<label>

<input type="radio" name="gender" value="女性" checked>

<span>女性</span>

</label>

<label>

<input type="radio" name="gender" value="男性">

<span>男性</span>

</label>

</div>

</div>

<div class="form-group">
<label>生年月日 <span style="color:red;">*</span></label>

${createDateSelects("customerBirthDate", "customerBirth")}

</div>

<div class="form-group">
<label>電話番号 <span style="color:red;">*</span></label>
<input type="tel" id="customerTel">
</div>

<div class="form-group">
<label>紹介者</label>
<input
    type="text"
    id="customerReferrer"
    placeholder="紹介者名 / クリニック / インスタ / その他"
>
</div>

<div class="form-group">

<label>アートメイク施術歴</label>

<div class="radio-group">

<label>
<input type="checkbox" name="historyType" value="眉">
<span>眉</span>
</label>

<label>
<input type="checkbox" name="historyType" value="アイライン">
<span>アイライン</span>
</label>

<label>
<input type="checkbox" name="historyType" value="リップ">
<span>リップ</span>
</label>

<label>
<input type="checkbox" name="historyType" value="ヘアライン">
<span>ヘアライン</span>
</label>

<label>
<input type="checkbox" name="historyType" value="その他">
<span>その他</span>
</label>

<label>
<input type="checkbox" id="noHistory" checked>
<span>なし</span>
</label>

</div>

</div>

<div class="form-group" id="historyDetailArea" style="display:none;">

<div id="eyebrowHistoryGroup" style="display:none;">

<label>眉：施術歴日</label>

${createDateSelects("eyebrowHistoryDate", "eyebrowHistory")}

</div>

<div id="eyelineHistoryGroup" style="display:none; margin-top:15px;">

<label>アイライン：施術歴日</label>

${createDateSelects("eyelineHistoryDate", "eyelineHistory")}

</div>

<div id="lipHistoryGroup" style="display:none; margin-top:15px;">

<label>リップ：施術歴日</label>

${createDateSelects("lipHistoryDate", "lipHistory")}

</div>

<div id="hairlineHistoryGroup" style="display:none; margin-top:15px;">

<label>ヘアライン：施術歴日</label>

${createDateSelects("hairlineHistoryDate", "hairlineHistory")}

</div>

<div id="otherHistoryGroup" style="display:none; margin-top:15px;">

<label>その他：施術内容</label>

<input type="text" id="otherHistory">

<label style="margin-top:15px;">その他：施術歴日</label>

${createDateSelects("otherHistoryDate", "otherHistory")}

</div>

</div>

<div class="form-group">

<label>既往歴・服薬中のお薬</label>

<textarea
id="medicalHistory"
rows="4"
placeholder="既往歴・服薬中のお薬をご入力ください。
特になければ「なし」とご入力ください。"
></textarea>

</div>

<div class="form-group">

<label>妊娠・授乳中</label>

<div class="radio-group">

<label>

<input type="radio" name="pregnancy" value="はい">

<span>はい</span>

</label>

<label>

<input type="radio" name="pregnancy" value="いいえ" checked>

<span>いいえ</span>

</label>

</div>

</div>

<!-- 初診のみ：重要事項の確認 -->
<div class="important-confirm-box">
    <h4 class="important-confirm-title">重要事項のご確認</h4>
    <p class="important-confirm-description">ご予約前に、アートメイクの重要事項を必ずご確認ください。</p>
    <a class="important-confirm-link"
       href="https://reservation-system-2r3.pages.dev/notice"
       target="_blank"
       rel="noopener noreferrer">重要事項を確認する ↗</a>
    <label class="important-confirm-check">
        <input type="checkbox" id="importantAgreed">
        <span>重要事項を確認し、内容を理解・了承しました。</span>
    </label>
</div>

<button class="next-form">

確認画面へ

</button>

`;

// 初診のみ：重要事項の了承チェックに応じて確認ボタンを切り替える
const importantAgreedCheckbox = document.getElementById("importantAgreed");
const initialConfirmButton = form.querySelector(".next-form");

function updateImportantConfirmButton() {
    const agreed = importantAgreedCheckbox.checked;
    initialConfirmButton.disabled = !agreed;
    initialConfirmButton.classList.toggle("important-confirm-disabled", !agreed);
    initialConfirmButton.setAttribute("aria-disabled", String(!agreed));
}

importantAgreedCheckbox.addEventListener("change", updateImportantConfirmButton);
updateImportantConfirmButton();

setupDateSelects("customerBirthDate", "customerBirth");
setupDateSelects("eyebrowHistoryDate", "eyebrowHistory");
setupDateSelects("eyelineHistoryDate", "eyelineHistory");
setupDateSelects("lipHistoryDate", "lipHistory");
setupDateSelects("hairlineHistoryDate", "hairlineHistory");
setupDateSelects("otherHistoryDate", "otherHistory");

const historyChecks =
    document.querySelectorAll('input[name="historyType"]');

const noHistory =
    document.getElementById("noHistory");

const historyDetailArea =
    document.getElementById("historyDetailArea");

const historyGroups = {
    "眉": document.getElementById("eyebrowHistoryGroup"),
    "アイライン": document.getElementById("eyelineHistoryGroup"),
    "リップ": document.getElementById("lipHistoryGroup"),
    "ヘアライン": document.getElementById("hairlineHistoryGroup"),
    "その他": document.getElementById("otherHistoryGroup")
};

historyChecks.forEach(check => {

    check.addEventListener("change", () => {

        const group = historyGroups[check.value];

        if (check.checked) {

            noHistory.checked = false;

            historyDetailArea.style.display = "block";

            if (group) {
                group.style.display = "block";
            }

        } else {

            if (group) {

                group.style.display = "none";

                group.querySelectorAll("input, select").forEach(element => {
                element.value = "";
             });

            }

            const hasHistory =
                [...historyChecks].some(item => item.checked);

              if (!hasHistory) {
                 historyDetailArea.style.display = "none";
                 noHistory.checked = true;
            }

        }

    });

});

// 初期状態は「なし」
noHistory.checked = true;
historyDetailArea.style.display = "none";

noHistory.addEventListener("change", () => {

    if (noHistory.checked) {

        historyChecks.forEach(check => {

            check.checked = false;

        });

        Object.values(historyGroups).forEach(group => {

            group.style.display = "none";

            group.querySelectorAll("input, select").forEach(element => {
                 element.value = "";
           });

        });

        historyDetailArea.style.display = "none";

    }

});

document.querySelector(".next-form").addEventListener("click", () => {

// 初診のみ：重要事項への同意がなければ確認画面に進めない
const importantAgreed = document.getElementById("importantAgreed");
if (!importantAgreed || !importantAgreed.checked) {
    alert("重要事項をご確認のうえ、了承のチェックを入れてください。");
    if (importantAgreed) importantAgreed.focus();
    return;
}

const name = document.getElementById("customerName").value.trim();

const gender = document.querySelector('input[name="gender"]:checked');

const birthDate = document.getElementById("customerBirthDate").value;

const referrer = document.getElementById("customerReferrer").value.trim();

const tel = document.getElementById("customerTel").value.trim();

    if (name === "") {

        alert("お名前を入力してください。");

        return;

    }

    if (!gender) {

    alert("性別を選択してください。");

    return;

}

if (birthDate === "") {

    alert("生年月日を選択してください。");

    return;

}

    if (tel === "") {

        alert("電話番号を入力してください。");

        return;

    }

    const selectedHistories = [
    ...document.querySelectorAll(
        'input[name="historyType"]:checked'
    )
].map(input => input.value);

const history = selectedHistories.length > 0
    ? "あり"
    : "なし";

const eyebrowHistory =
    selectedHistories.includes("眉") ? "あり" : "";

const eyebrowHistoryDate =
    document.getElementById("eyebrowHistoryDate").value;

const eyelineHistory =
    selectedHistories.includes("アイライン") ? "あり" : "";

const eyelineHistoryDate =
    document.getElementById("eyelineHistoryDate").value;

const lipHistory =
    selectedHistories.includes("リップ") ? "あり" : "";

const lipHistoryDate =
    document.getElementById("lipHistoryDate").value;

const hairlineHistory =
    selectedHistories.includes("ヘアライン") ? "あり" : "";

const hairlineHistoryDate =
    document.getElementById("hairlineHistoryDate").value;

const otherHistory =
    selectedHistories.includes("その他")
        ? document.getElementById("otherHistory").value.trim()
        : "";

const otherHistoryDate =
    document.getElementById("otherHistoryDate").value;


// ==========================
// 入力チェック
// ==========================

if (selectedHistories.includes("眉") && eyebrowHistoryDate === "") {

    alert("眉の施術歴日を選択してください。");
    return;

}

if (
    selectedHistories.includes("アイライン") &&
    eyelineHistoryDate === ""
) {

    alert("アイラインの施術歴日を選択してください。");
    return;

}

if (
    selectedHistories.includes("リップ") &&
    lipHistoryDate === ""
) {

    alert("リップの施術歴日を選択してください。");
    return;

}

if (
    selectedHistories.includes("ヘアライン") &&
    hairlineHistoryDate === ""
) {

    alert("ヘアラインの施術歴日を選択してください。");
    return;

}

if (
    selectedHistories.includes("その他") &&
    otherHistory === ""
) {

    alert("その他の施術内容を入力してください。");
    return;

}

if (
    selectedHistories.includes("その他") &&
    otherHistoryDate === ""
) {

    alert("その他の施術歴日を選択してください。");
    return;

}

customerData = {

    name,
    gender: gender.value,
    birthDate,
    referrer,
    tel,
    history,

eyebrowHistory,
eyebrowHistoryDate,

eyelineHistory,
eyelineHistoryDate,

lipHistory,
lipHistoryDate,

hairlineHistory,
hairlineHistoryDate,

otherHistory,
otherHistoryDate,
    medicalHistory: document.getElementById("medicalHistory").value.trim(),
    pregnancy: document.querySelector('input[name="pregnancy"]:checked').value

};

    showConfirm();

});

}

function showConfirm() {

    const section = document.getElementById("confirmSection");
    const area = document.getElementById("confirmArea");

    section.style.display = "block";

    // 確認画面では電話・LINEボタンを非表示
const contactButtons =
    document.getElementById("calendarContactButtons");

if (contactButtons) {
    contactButtons.style.display = "none";
}

    // ==========================
    // 再診
    // ==========================
    if (reservationData.visit === "再診") {

        area.innerHTML = `

<h2 class="confirm-title">予約内容確認</h2>

<div class="confirm-item">
<span class="label">施術メニュー</span>
<span class="value">${reservationData.menus.join("・")}</span>
</div>

<div class="confirm-item">
<span class="label">予約日</span>
<span class="value">${selectedDate}</span>
</div>

<div class="confirm-item">
<span class="label">予約時間</span>
<span class="value">${selectedTime}</span>
</div>

<div class="confirm-item">
<span class="label">氏名</span>
<span class="value">${escapeHtml(customerData.name)}</span>
</div>

<br>

<button class="next-form" id="reserveButton">
予約を確定する
</button>

`;

        customerData.gender = "";
customerData.birthDate = "";
customerData.referrer = "";
customerData.tel = "";

customerData.history = "";

customerData.eyebrowHistory = "";
customerData.eyebrowHistoryDate = "";

customerData.eyelineHistory = "";
customerData.eyelineHistoryDate = "";

customerData.lipHistory = "";
customerData.lipHistoryDate = "";

customerData.hairlineHistory = "";
customerData.hairlineHistoryDate = "";

customerData.otherHistory = "";
customerData.otherHistoryDate = "";

customerData.medicalHistory = "";
customerData.pregnancy = "";

    }

    // ==========================
    // 初診
    // ==========================

    else {

        area.innerHTML = `

<h2 class="confirm-title">予約内容確認</h2>

<div class="confirm-item">
<span class="label">施術メニュー</span>
<span class="value">${reservationData.menus.join("・")}</span>
</div>

<div class="confirm-item">
<span class="label">初診・再診</span>
<span class="value">${reservationData.visit}</span>
</div>

<div class="confirm-item">
<span class="label">予約日</span>
<span class="value">${selectedDate}</span>
</div>

<div class="confirm-item">
<span class="label">予約時間</span>
<span class="value">${selectedTime}</span>
</div>

<div class="confirm-item">
<span class="label">お名前</span>
<span class="value">${escapeHtml(customerData.name)}</span>
</div>

<div class="confirm-item">
<span class="label">電話番号</span>
<span class="value">${escapeHtml(customerData.tel)}</span>
</div>

<div class="confirm-item">
<span class="label">性別</span>
<span class="value">${escapeHtml(customerData.gender)}</span>
</div>

<div class="confirm-item">
<span class="label">生年月日</span>
<span class="value">${escapeHtml(customerData.birthDate) || "-"}</span>
</div>

<div class="confirm-item">
<span class="label">紹介者</span>
<span class="value">${escapeHtml(customerData.referrer) || "なし"}</span>
</div>

<div class="confirm-item">
<span class="label">アートメイク施術歴</span>
<span class="value">${escapeHtml(customerData.history)}</span>
</div>

${customerData.eyebrowHistory ? `
<div class="confirm-item">
<span class="label">眉施術歴</span>
<span class="value">${escapeHtml(customerData.eyebrowHistory)}</span>
</div>

<div class="confirm-item">
<span class="label">眉施術歴日</span>
<span class="value">${escapeHtml(customerData.eyebrowHistoryDate)}</span>
</div>
` : ""}

${customerData.eyelineHistory ? `
<div class="confirm-item">
<span class="label">アイライン施術歴</span>
<span class="value">${escapeHtml(customerData.eyelineHistory)}</span>
</div>

<div class="confirm-item">
<span class="label">アイライン施術歴日</span>
<span class="value">${escapeHtml(customerData.eyelineHistoryDate)}</span>
</div>
` : ""}

${customerData.lipHistory ? `
<div class="confirm-item">
<span class="label">リップ施術歴</span>
<span class="value">${escapeHtml(customerData.lipHistory)}</span>
</div>

<div class="confirm-item">
<span class="label">リップ施術歴日</span>
<span class="value">${escapeHtml(customerData.lipHistoryDate)}</span>
</div>
` : ""}

${customerData.hairlineHistory ? `
<div class="confirm-item">
<span class="label">ヘアライン施術歴</span>
<span class="value">${escapeHtml(customerData.hairlineHistory)}</span>
</div>

<div class="confirm-item">
<span class="label">ヘアライン施術歴日</span>
<span class="value">${escapeHtml(customerData.hairlineHistoryDate)}</span>
</div>
` : ""}

${customerData.otherHistory ? `
<div class="confirm-item">
<span class="label">その他施術歴</span>
<span class="value">${escapeHtml(customerData.otherHistory)}</span>
</div>

<div class="confirm-item">
<span class="label">その他施術歴日</span>
<span class="value">${escapeHtml(customerData.otherHistoryDate)}</span>
</div>
` : ""}

<div class="confirm-item">
<span class="label">既往歴・服薬中のお薬</span>
<span class="value">${escapeHtml(customerData.medicalHistory) || "なし"}</span>
</div>

<div class="confirm-item">
<span class="label">妊娠・授乳中</span>
<span class="value">${escapeHtml(customerData.pregnancy)}</span>
</div>

<br>

<button class="next-form" id="reserveButton">
予約を確定する
</button>

`;

    }

    // 「予約内容確認」の見出しを画面上部に移動
requestAnimationFrame(() => {
    const title = section.querySelector(".confirm-title");

    if (!title) return;

    const top = title.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth"
    });
});

        document.getElementById("reserveButton").addEventListener("click", async () => {

    // LINE情報の取得確認
    if (!liffReady || !lineUserId) {
        alert("LINE情報の取得中です。少し待ってからもう一度お試しください。");
        return;
    }

    const reserveButton = document.getElementById("reserveButton");

    const data = {

    date: selectedDate,
    time: selectedTime,
    visit: reservationData.visit,
    menu1: reservationData.menus[0] || "",
    menu2: reservationData.menus[1] || "",
    name: customerData.name,

    gender: reservationData.visit === "再診" ? "" : customerData.gender,
    age: reservationData.visit === "再診" ? "" : calcAgeFromBirth(customerData.birthDate),
    birthDate: reservationData.visit === "再診" ? "" : customerData.birthDate,
    referrer: reservationData.visit === "再診" ? "" : customerData.referrer,
    tel: reservationData.visit === "再診" ? "" : customerData.tel,
    history: reservationData.visit === "再診" ? "" : customerData.history,

eyebrowHistory: reservationData.visit === "再診" ? "" : customerData.eyebrowHistory,
eyebrowHistoryDate: reservationData.visit === "再診" ? "" : customerData.eyebrowHistoryDate,

eyelineHistory: reservationData.visit === "再診" ? "" : customerData.eyelineHistory,
eyelineHistoryDate: reservationData.visit === "再診" ? "" : customerData.eyelineHistoryDate,

lipHistory: reservationData.visit === "再診" ? "" : customerData.lipHistory,
lipHistoryDate: reservationData.visit === "再診" ? "" : customerData.lipHistoryDate,

hairlineHistory: reservationData.visit === "再診" ? "" : customerData.hairlineHistory,
hairlineHistoryDate: reservationData.visit === "再診" ? "" : customerData.hairlineHistoryDate,

otherHistory: reservationData.visit === "再診" ? "" : customerData.otherHistory,
otherHistoryDate: reservationData.visit === "再診" ? "" : customerData.otherHistoryDate,

medicalHistory: reservationData.visit === "再診" ? "" : customerData.medicalHistory,
pregnancy: reservationData.visit === "再診" ? "" : customerData.pregnancy

};

        data.lineUserId = lineUserId;

        try {

            reserveButton.disabled = true;
            reserveButton.classList.add("loading");
            reserveButton.textContent = "送信中...";

            const response = await fetch(
                "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify(data)
                }
            );

            const text = await response.text();


let result;

try {

    result = JSON.parse(text);

} catch(e) {

    alert("返答エラー\n" + text);
    return;

}

            if (result.result === "success") {

                reserveButton.disabled = true;
                reserveButton.classList.remove("loading");
                reserveButton.textContent = "予約完了";

                document.getElementById("confirmSection").innerHTML = `

<div class="complete-box">

<p class="complete-title-small">
ご予約ありがとうございます。
</p>

<h2 class="complete-title">
予約が完了しました
</h2>

<p class="complete-emoji">✨</p>

<p class="complete-text">
LINEへ予約内容を送信しました。
</p>

</div>

`;

            } else {

                reserveButton.disabled = false;
                reserveButton.classList.remove("loading");
                reserveButton.textContent = "予約を確定する";

                alert("保存エラー：" + result.message);

            }

        } catch (err) {

            console.error(err);

            alert(err.stack || err);

            reserveButton.disabled = false;
            reserveButton.textContent = "予約を確定する";

        }

    });

}