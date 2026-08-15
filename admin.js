let treatmentMenus = [];

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("loginButton").addEventListener("click", () => {

        const password = document.getElementById("adminPassword").value;

        if (password === "0918") {

            loadReservations();

        } else {

            alert("パスワードが違います");

        }

    });


    // ================================
    // 変更日を変えたとき
    // ================================

    document.getElementById("editDate").addEventListener("change", () => {

        const visit =
            document.getElementById("editVisit").value;

        updateEditTimeOptions(
            document.getElementById("editDate").value,
            visit
        );

    });


    // ================================
    // 初診・再診を変えたとき
    // ================================

    document.getElementById("editVisit").addEventListener("change", () => {

        const visit =
            document.getElementById("editVisit").value;

        updateEditTimeOptions(
            document.getElementById("editDate").value,
            visit
        );

    });

});

async function loadReservations() {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("adminArea").style.display = "block";
    
    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=getReservationList"
    );

    const list = await response.json();

const treatmentResponse = await fetch(
    "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=treatments"
);

treatmentMenus = await treatmentResponse.json();


// ================================
// BusinessHours・Holidays取得
// ================================

const businessResponse = await fetch(
    "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=businesshours"
);

const businessHours = await businessResponse.json();

const holidayResponse = await fetch(
    "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=holidays"
);

const holidays = await holidayResponse.json();

window.businessHours = businessHours;
window.holidays = holidays;

    window.reservationList = list;

    const keyword = document
    .getElementById("searchName")
    .value
    .trim();

    const searchDate = document
    .getElementById("searchDate")
    .value;

let filteredList = list;

if (keyword) {

    filteredList = filteredList.filter(item =>
        item.name.includes(keyword)
    );

}

if (searchDate) {

    filteredList = filteredList.filter(item =>
        item.date === searchDate
    );

}

    const today = new Date().toISOString().slice(0,10);

const area = document.getElementById("reservationList");

area.innerHTML = "";

const todayList = filteredList
.filter(item => item.date === today)
.sort((a,b)=>a.time.localeCompare(b.time));

const otherList = filteredList
.filter(item => item.date > today)
.sort((a,b)=>{

    if(a.date===b.date){

        return a.time.localeCompare(b.time);

    }

    return a.date.localeCompare(b.date);

});

if (todayList.length > 0) {

    area.innerHTML += `
<div class="today-header">
📅 本日の予約
</div>
`;

}

todayList.forEach(item => {

    area.innerHTML += `

<div class="reservation-card">

    <div><strong>📅 予約日</strong><br>${item.date}</div>

    <br>

    <div class="time-box">${item.time}</div>

    <br>

    <div><strong>👤 お名前</strong><br>${item.name}</div>

    <br>
    <div><strong>🩺 初診・再診</strong><br>${item.visit}</div>
    
    <br>

    <div><strong>🖋️ メニュー</strong><br>${item.menu}</div>

<br>

<div class="button-row">

<button
class="editButton"
data-id="${item.id}">
変更
</button>

<button
class="cancelButton"
data-id="${item.id}">
キャンセル
</button>

</div>

</div>

`;

});

if (otherList.length > 0) {

    area.innerHTML += `
<div class="today-header">
📖 その他の予約
</div>
`;

}

otherList.forEach(item => {
    
    area.innerHTML += `

<div class="reservation-card">

    <div><strong>📅 予約日</strong><br>${item.date}</div>

    <br>

    <div class="time-box">${item.time}</div>

    <br>

    <div><strong>👤 お名前</strong><br>${item.name}</div>

    <br>

    <div><strong>🩺 初診・再診</strong><br>${item.visit}</div>
    
    <br>
    
    <div><strong>🖋️ メニュー</strong><br>${item.menu}</div>

<br>

<div class="button-row">

<button
class="editButton"
data-id="${item.id}">
変更
</button>

<button
class="cancelButton"
data-id="${item.id}">
キャンセル
</button>

</div>

</div>

`;

});


document.querySelectorAll(".editButton").forEach(button => {

    button.addEventListener("click", () => {

        const id = button.dataset.id;

        const reservation = window.reservationList.find(item => item.id == id);

        openEditForm(reservation);

    });

});

document.querySelectorAll(".cancelButton").forEach(button => {

    button.addEventListener("click", async () => {

        const id = button.dataset.id;

        console.log("キャンセルID:", id);

        if(!confirm("この予約をキャンセルしますか？")){
            return;
        }

        // 以下そのまま

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec",
        {
            method:"POST",
            headers:{
    "Content-Type":"text/plain"
},
            body:JSON.stringify({
                action:"cancel",
                reservationId:id
            })
        }
    );

    const result = await response.json();

    if(result.result==="success"){

        alert("キャンセルしました");

        loadReservations();

    }else{

        alert("キャンセルできませんでした");

    }

});

});

}

function openEditForm(reservation){

    console.log(reservation);

    console.log(document.getElementById("editArea"));

    document.getElementById("editArea").style.display = "block";

    document.getElementById("editName").value = reservation.name;

    document.getElementById("editDate").value = reservation.date;

document.getElementById("editVisit").value = reservation.visit;

// ================================
// 変更日時の時間候補を更新
// ================================

updateEditTimeOptions(
    reservation.date,
    reservation.visit,
    reservation.time
);

    const menu1 = document.getElementById("editMenu1");
const menu2 = document.getElementById("editMenu2");

menu1.innerHTML = '<option value="">選択してください</option>';
menu2.innerHTML = '<option value="">選択してください</option>';

treatmentMenus.forEach(item => {

    menu1.innerHTML += `
    <option value="${item.name}">
    ${item.name}
    </option>`;

    menu2.innerHTML += `
    <option value="${item.name}">
    ${item.name}
    </option>`;

});

    document.getElementById("editMenu1").value = reservation.menu1 || "";

    document.getElementById("editMenu2").value = reservation.menu2 || "";
　　
    document.getElementById("editTel").value = reservation.tel || "";

    document.getElementById("editArea").scrollIntoView({
    behavior:"smooth"
});

document.getElementById("saveEditButton").onclick = async () => {

    const newData = {

        action: "update",

        reservationId: reservation.id,

        name: document.getElementById("editName").value,

        date: document.getElementById("editDate").value,

        time: document.getElementById("editTime").value,

        visit: document.getElementById("editVisit").value,
        
        menu1: document.getElementById("editMenu1").value,

　　　　menu2: document.getElementById("editMenu2").value,

　　　　　tel: document.getElementById("editTel").value
        

    };

    const response = await fetch(

        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec",

        {

            method:"POST",

            headers:{
    "Content-Type":"text/plain"
},

            body:JSON.stringify(newData)

        }

    );

    const result = await response.json();

    if(result.result==="success"){

        alert("変更しました");

        document.getElementById("editArea").style.display="none";

        loadReservations();

    }else{

        alert(result.message);

    }

};

document.getElementById("closeEditButton").onclick = () => {

    document.getElementById("editArea").style.display = "none";

};

}

document
.getElementById("searchName")
.addEventListener("input", loadReservations);

document
.getElementById("searchDate")
.addEventListener("change", loadReservations);

function updateEditTimeOptions(date, visit, currentTime = "") {

    const timeSelect = document.getElementById("editTime");

    timeSelect.innerHTML = "";

    if (!date) {
        return;
    }

    // ================================
    // 休日チェック
    // ================================

    if (
        window.holidays &&
        window.holidays.includes(date)
    ) {

        const option = document.createElement("option");

        option.value = "";
        option.textContent = "休診日";

        timeSelect.appendChild(option);

        return;
    }


    // ================================
    // 曜日取得
    // ================================

    const day = new Date(date + "T00:00:00").getDay();


    // ================================
    // BusinessHoursから該当曜日を取得
    // ================================

    const weekdayMap = {
        0: "日",
        1: "月",
        2: "火",
        3: "水",
        4: "木",
        5: "金",
        6: "土"
    };

    const weekday = weekdayMap[day];

    const business = (window.businessHours || [])
        .find(item => item.weekday === weekday);


    // 営業設定がない場合
    if (!business) {

        const option = document.createElement("option");

        option.value = "";
        option.textContent = "予約不可";

        timeSelect.appendChild(option);

        return;
    }


    // ================================
    // 通常の時間候補
    // ================================

    let times = [];

    if (business.first) {
        times.push(business.first);
    }

    if (business.repeat) {

        const repeatTimes =
            String(business.repeat)
                .split(",")
                .map(time => time.trim())
                .filter(Boolean);

        times.push(...repeatTimes);

    }


    // ================================
    // 重複削除
    // ================================

    times = [...new Set(times)];


    // ================================
    // 14:00は再診のみ
    // ================================

    if (
        visit === "再診" &&
        !times.includes("14:00")
    ) {

        times.push("14:00");

    }


    // ================================
    // 時間順
    // ================================

    times.sort();


    // ================================
    // 選択肢生成
    // ================================

    times.forEach(time => {

        const option =
            document.createElement("option");

        option.value = time;
        option.textContent = time;

        timeSelect.appendChild(option);

    });


    // ================================
    // 現在の予約時間を維持
    // ================================

    if (times.includes(currentTime)) {

        timeSelect.value = currentTime;

    }

}