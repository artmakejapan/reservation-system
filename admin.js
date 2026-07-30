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

// 今日の予約
filteredList
.filter(item => item.date === today)
.forEach(item => {

    area.innerHTML += `

<div class="today-header">
📅 本日の予約
</div>

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

<button
class="cancelButton"
data-id="${item.id}">
キャンセル
</button>

</div>

`;

});

// 今日以外
filteredList
.filter(item => item.date !== today)
.forEach(item => {

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

<button
class="cancelButton"
data-id="${item.id}">
キャンセル
</button>

</div>

`;

});

document.querySelectorAll(".cancelButton").forEach(button => {

    button.addEventListener("click", async () => {

    const id = button.dataset.id;

    if(!confirm("この予約をキャンセルしますか？")){
        return;
    }

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

document
.getElementById("searchName")
.addEventListener("input", loadReservations);

document
.getElementById("searchDate")
.addEventListener("change", loadReservations);