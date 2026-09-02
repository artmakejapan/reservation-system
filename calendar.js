// ======================================
// Calendar.js
// アートメイクまなみ予約システム
// ======================================

let reservedSlots = [];
let businessHours = [];
let holidays = [];
let treatmentSlots = {};

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

    // メニュー表示
    const menuList = document.getElementById("menuList");

    menuList.innerHTML = "";

    treatmentData
        .filter(item => item.enabled)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .forEach(item => {

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

            menuList.appendChild(label);

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

// 月・火・金、かつ休診日ではない
const reservable =
    (day === 1 || day === 2 || day === 5) &&
    !holiday;

let times = [];

if(reservable){

    const weekdayMap={
        1:"月",
        2:"火",
        5:"金"
    };

    const row=businessHours.find(item=>item.weekday===weekdayMap[day]);

    if(row){

        const source=data.visit==="初診"
            ? row.first
            : row.repeat;

        times=source.split(",").map(t=>t.trim());

    }

}

let checkTimes = [...times];

const requiredSlots = getRequiredSlots();

const weekdayName = {
    1:"月",
    2:"火",
    5:"金"
}[day];


// 2メニューは火曜16:15のみ
if (requiredSlots >= 2) {

    checkTimes = checkTimes.filter(time => {

        // 16:15より前 → 空きがあればOK
        if (time < "16:15") {
            return true;
        }

        // 火曜16:15 → OK
        if (weekdayName === "火" && time === "16:15") {
            return true;
        }

        // 16:15より後、または月・金16:15 → NG
        return false;

    });

}

const remain =
checkTimes.filter(time =>

    canReserve(
        dateString,
        time,
        checkTimes
    )

).length;

const full =
reservable &&
future &&
times.length > 0 &&
remain === 0;

console.log(dateString, remain, full);

if(reservable && future && !full){

    let colorClass = "";

// ================================================
// 初診・再診で残り枠の色分け
// ================================================

if (data.visit === "初診") {

    // 初診
    // 残り1枠 → 赤
    if (remain === 1) {
        colorClass = "one-left";
    }

    // 残り2枠 → 黄
    else if (remain === 2) {
        colorClass = "two-left";
    }

} else {

    // 再診
    // 残り1〜2枠 → 赤
    if (remain === 1 || remain === 2) {
    colorClass = "one-left";
}
else if (remain === 3 || remain === 4) {
    colorClass = "two-left";
}

    // 残り4枠以上 → ベージュ
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

    html+=`
    <button
    class="day-button full"
    disabled>
    ${d}
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

        showTimes(data);

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

const day = date.getDay();

let times = [];

const weekdayMap = {
    1: "月",
    2: "火",
    5: "金"
};

const weekday = weekdayMap[day];

const row = businessHours.find(item => item.weekday === weekday);

if (row) {

    const source = data.visit === "初診"
        ? row.first
        : row.repeat;

    times = source
        .split(",")
        .map(t => t.trim());

}

    timeArea.innerHTML="";

    timeArea.innerHTML+=`
        <h4 style="margin-top:20px;">
            ${selectedDate}
        </h4>
    `;

    let availableTimes =
times.filter(time=>{


    return canReserve(
        selectedDate,
        time,
        times
    );


});

// 2メニューの開始時間ルール
const requiredSlots = getRequiredSlots();

if (requiredSlots >= 2) {

    availableTimes = availableTimes.filter(time => {

        // 16:15より前 → 空きがあればOK
        if (time < "16:15") {
            return true;
        }

        // 火曜16:15 → OK
        if (weekday === "火" && time === "16:15") {
            return true;
        }

        // 16:15より後 → NG
        return false;

    });

}

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

    });

});

}

function showCustomerForm() {

    const section = document.getElementById("customerSection");

    const form = document.getElementById("customerForm");

    section.style.display = "block";

    section.scrollIntoView({

        behavior: "smooth"

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

<input type="radio" name="gender" value="女性">

<span>女性</span>

</label>

<label>

<input type="radio" name="gender" value="男性">

<span>男性</span>

</label>

</div>

</div>

<div class="form-group">
<label>年齢 <span style="color:red;">*</span></label>
<input type="number" id="customerAge">
</div>

<div class="form-group">
<label>紹介者</label>
<input type="text" id="customerReferrer" placeholder="紹介者様のお名前をご入力ください">
</div>

<div class="form-group">
<label>電話番号 <span style="color:red;">*</span></label>
<input type="tel" id="customerTel">
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

<input type="date" id="eyebrowHistoryDate">

</div>

<div id="eyelineHistoryGroup" style="display:none; margin-top:15px;">

<label>アイライン：施術歴日</label>

<input type="date" id="eyelineHistoryDate">

</div>

<div id="lipHistoryGroup" style="display:none; margin-top:15px;">

<label>リップ：施術歴日</label>

<input type="date" id="lipHistoryDate">

</div>

<div id="hairlineHistoryGroup" style="display:none; margin-top:15px;">

<label>ヘアライン：施術歴日</label>

<input type="date" id="hairlineHistoryDate">

</div>

<div id="otherHistoryGroup" style="display:none; margin-top:15px;">

<label>その他：施術内容</label>

<input type="text" id="otherHistory">

<label style="margin-top:15px;">その他：施術歴日</label>

<input type="date" id="otherHistoryDate">

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

<button class="next-form">

確認画面へ

</button>

`;

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

                group.querySelectorAll("input").forEach(input => {
                    input.value = "";
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

            group.querySelectorAll("input").forEach(input => {
                input.value = "";
            });

        });

        historyDetailArea.style.display = "none";

    }

});

document.querySelector(".next-form").addEventListener("click", () => {

const name = document.getElementById("customerName").value.trim();

const gender = document.querySelector('input[name="gender"]:checked');

const age = document.getElementById("customerAge").value.trim();

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

if (age === "") {

    alert("年齢を入力してください。");

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
    age,
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

    section.scrollIntoView({
        behavior: "smooth"
    });

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
<span class="value">${customerData.name}</span>
</div>

<br>

<button class="next-form" id="reserveButton">
予約を確定する
</button>

`;

        customerData.gender = "";
customerData.age = "";
customerData.referrer = "";
customerData.tel = "";

customerData.history = "";
customerData.historyDate = "";

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
<span class="value">${customerData.name}</span>
</div>

<div class="confirm-item">
<span class="label">電話番号</span>
<span class="value">${customerData.tel}</span>
</div>

<div class="confirm-item">
<span class="label">性別</span>
<span class="value">${customerData.gender}</span>
</div>

<div class="confirm-item">
<span class="label">年齢</span>
<span class="value">${customerData.age}歳</span>
</div>

<div class="confirm-item">
<span class="label">紹介者</span>
<span class="value">${customerData.referrer || "なし"}</span>
</div>

<div class="confirm-item">
<span class="label">アートメイク施術歴</span>
<span class="value">${customerData.history}</span>
</div>

${customerData.eyebrowHistory ? `
<div class="confirm-item">
<span class="label">眉施術歴</span>
<span class="value">${customerData.eyebrowHistory}</span>
</div>

<div class="confirm-item">
<span class="label">眉施術歴日</span>
<span class="value">${customerData.eyebrowHistoryDate}</span>
</div>
` : ""}

${customerData.eyelineHistory ? `
<div class="confirm-item">
<span class="label">アイライン施術歴</span>
<span class="value">${customerData.eyelineHistory}</span>
</div>

<div class="confirm-item">
<span class="label">アイライン施術歴日</span>
<span class="value">${customerData.eyelineHistoryDate}</span>
</div>
` : ""}

${customerData.lipHistory ? `
<div class="confirm-item">
<span class="label">リップ施術歴</span>
<span class="value">${customerData.lipHistory}</span>
</div>

<div class="confirm-item">
<span class="label">リップ施術歴日</span>
<span class="value">${customerData.lipHistoryDate}</span>
</div>
` : ""}

${customerData.hairlineHistory ? `
<div class="confirm-item">
<span class="label">ヘアライン施術歴</span>
<span class="value">${customerData.hairlineHistory}</span>
</div>

<div class="confirm-item">
<span class="label">ヘアライン施術歴日</span>
<span class="value">${customerData.hairlineHistoryDate}</span>
</div>
` : ""}

${customerData.otherHistory ? `
<div class="confirm-item">
<span class="label">その他施術歴</span>
<span class="value">${customerData.otherHistory}</span>
</div>

<div class="confirm-item">
<span class="label">その他施術歴日</span>
<span class="value">${customerData.otherHistoryDate}</span>
</div>
` : ""}

<div class="confirm-item">
<span class="label">既往歴・服薬中のお薬</span>
<span class="value">${customerData.medicalHistory || "なし"}</span>
</div>

<div class="confirm-item">
<span class="label">妊娠・授乳中</span>
<span class="value">${customerData.pregnancy}</span>
</div>

<br>

<button class="next-form" id="reserveButton">
予約を確定する
</button>

`;

    }

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
    age: reservationData.visit === "再診" ? "" : customerData.age,
    referrer: reservationData.visit === "再診" ? "" : customerData.referrer,
    tel: reservationData.visit === "再診" ? "" : customerData.tel,
    history: reservationData.visit === "再診" ? "" : customerData.history,
historyDate: reservationData.visit === "再診" ? "" : customerData.historyDate,

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

console.log("GAS response:", text);

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