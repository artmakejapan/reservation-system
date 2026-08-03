document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("loginButton").addEventListener("click", () => {

        const password = document.getElementById("adminPassword").value;

        if (password === "1234") {

            loadReservations();

        } else {

            alert("パスワードが違います");

        }

    });

});

async function loadReservations() {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("adminArea").style.display = "block";
    
    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=getReservationList"
    );

    const list = await response.json();

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
.filter(item => item.date !== today)
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

        if(!confirm("この予約をキャンセルしますか？")){
            return;
        }

        // 以下そのまま

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec",
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
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

    document.getElementById("editTime").value = reservation.time;

}

document
.getElementById("searchName")
.addEventListener("input", loadReservations);

document
.getElementById("searchDate")
.addEventListener("change", loadReservations);

