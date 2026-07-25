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

    const response = await fetch(
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec?action=getReservationList"
    );

    const list = await response.json();

const area = document.getElementById("reservationList");

area.innerHTML = "";

list.forEach(item => {

    area.innerHTML += `

<div class="reservation-card">

    <div><strong>📅 予約日</strong><br>${item.date}</div>

    <br>

    <div><strong>🕘 時間</strong><br>${item.time}</div>

    <br>

    <div><strong>👤 お名前</strong><br>${item.name}</div>

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

    button.addEventListener("click", () => {

        const id = button.dataset.id;

        alert("予約ID：" + id);

    });

});

}