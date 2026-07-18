// ======================================
// Calendar.js
// アートメイクまなみ予約システム
// ======================================

let reservedSlots = [];
let businessHours = [];
let holidays = [];

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

    reservedSlots = data.reservations;
    businessHours = data.businessHours;
    holidays = data.holidays;

}
let customerData = {};
let selectedTime = null;
let selectedDate = null;
let currentDate = new Date();
const baseDate = new Date();

baseDate.setDate(1);
let reservationData = null;

async function generateCalendar(data) {

    reservationData = data;

    if (reservedSlots.length === 0) {
    await loadInitialData();
}

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

const full =
reservable &&
future &&
times.length>0 &&
times.every(time=>

reservedSlots.some(item=>

item.date===dateString &&
item.time===time

)

);

if(reservable && future && !full){

    html+=`
    <button
    class="day-button"
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

limit.setMonth(limit.getMonth() + 1);

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

    const date = new Date(selectedDate);

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

    const availableTimes = times.filter(time => {

    return !reservedSlots.some(item => {

        return item.date === selectedDate && item.time === time;

    });

});

if (availableTimes.length === 0) {

    timeArea.innerHTML += `

        <p style="margin-top:20px;color:#c00;font-weight:bold;">

            この日の予約枠はすべて埋まっています。

        </p>

    `;

    return;

}

    availableTimes.forEach(time => {

    timeArea.innerHTML += `
        <button class="time-button" data-time="${time}">
            ${time}
        </button>
    `;

});

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
<label>氏名 <span style="color:red;">*</span></label>
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

<input type="radio" name="history" value="あり">

<span>あり</span>

</label>

<label>

<input type="radio" name="history" value="なし" checked>

<span>なし</span>

</label>

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

    customerData = {

    name,
    gender: gender.value,
    age,
    referrer,
    tel,
    history: document.querySelector('input[name="history"]:checked').value,
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

    area.innerHTML = `

<p><strong>施術メニュー</strong><br>${reservationData.menus.join("・")}</p>

<p><strong>初診・再診</strong><br>${reservationData.visit}</p>

<p><strong>予約日</strong><br>${selectedDate}</p>

<p><strong>予約時間</strong><br>${selectedTime}</p>

<p><strong>お名前</strong><br>${customerData.name}</p>

<p><strong>電話番号</strong><br>${customerData.tel}</p>

<p><strong>性別</strong><br>${customerData.gender}</p>

<p><strong>年齢</strong><br>${customerData.age}歳</p>

<p><strong>紹介者</strong><br>${customerData.referrer || "なし"}</p>

<p><strong>アートメイク施術歴</strong><br>${customerData.history}</p>

<p><strong>既往歴・服薬中のお薬</strong><br>${customerData.medicalHistory || "なし"}</p>

<p><strong>妊娠・授乳中</strong><br>${customerData.pregnancy}</p>

<br>

<button class="next-form" id="reserveButton">

予約を確定する

</button>

`;

document.getElementById("reserveButton").addEventListener("click", async () => {

    const data = {

        date: selectedDate,

        time: selectedTime,

        visit: reservationData.visit,

        menu1: reservationData.menus[0] || "",

        menu2: reservationData.menus[1] || "",

        name: customerData.name,

        gender: customerData.gender,

        age: customerData.age,

        referrer: customerData.referrer,

        tel: customerData.tel,

        history: customerData.history,

        medicalHistory: customerData.medicalHistory,

        pregnancy: customerData.pregnancy

    };

data.lineUserId = lineUserId;

    try {
        alert("送信開始");

        const response = await fetch("https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(data)

        });

        const result = await response.json();

        if (result.result === "success") {

            alert("予約が完了しました！");

        } else {

            alert("保存エラー：" + result.message);

        }

    } catch (err) {

        alert("通信エラー：" + err);

    }

});

}

