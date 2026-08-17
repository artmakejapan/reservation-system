let treatmentMenus = [];

window.reservationList = [];
window.businessHours = [];
window.holidays = [];

let editingReservation = null;


document.addEventListener("DOMContentLoaded", () => {

    // ================================
    // ログイン
    // ================================

    document
        .getElementById("loginButton")
        .addEventListener("click", () => {

            const password =
                document.getElementById("adminPassword").value;

            if (password === "0918") {

                loadReservations();

            } else {

                alert("パスワードが違います");

            }

        });


    // ================================
    // 日付変更
    // ================================

    document
        .getElementById("editDate")
        .addEventListener("change", () => {

            updateEditTimeOptions(
                document.getElementById("editDate").value,
                document.getElementById("editVisit").value
            );

        });


    // ================================
    // 初診・再診変更
    // ================================

    document
        .getElementById("editVisit")
        .addEventListener("change", () => {

            updateEditTimeOptions(
                document.getElementById("editDate").value,
                document.getElementById("editVisit").value
            );

        });


    // ================================
    // 検索
    // ================================

    document
        .getElementById("searchName")
        .addEventListener("input", renderReservations);

    document
        .getElementById("searchDate")
        .addEventListener("change", renderReservations);

});


// ==================================================
// データ取得
// ==================================================

async function loadReservations() {

    document.getElementById("loginArea").style.display = "none";
    document.getElementById("adminArea").style.display = "block";

    const baseUrl =
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec";


    const reservationResponse =
        await fetch(baseUrl + "?action=getReservationList");

    window.reservationList =
        await reservationResponse.json();


    const treatmentResponse =
        await fetch(baseUrl + "?action=treatments");

    treatmentMenus =
        await treatmentResponse.json();


    const businessResponse =
        await fetch(baseUrl + "?action=businesshours");

    window.businessHours =
        await businessResponse.json();


    const holidayResponse =
        await fetch(baseUrl + "?action=holidays");

    window.holidays =
        await holidayResponse.json();


    renderReservations();

}


// ==================================================
// 予約一覧表示
// ==================================================

function renderReservations() {

    const keyword =
        document
            .getElementById("searchName")
            .value
            .trim();

    const searchDate =
        document
            .getElementById("searchDate")
            .value;


    let filteredList =
        [...window.reservationList];


    if (keyword) {

        filteredList =
            filteredList.filter(item =>
                String(item.name || "")
                    .includes(keyword)
            );

    }


    if (searchDate) {

        filteredList =
            filteredList.filter(item =>
                item.date === searchDate
            );

    }


    const today =
        new Date().toISOString().slice(0, 10);


    const area =
        document.getElementById("reservationList");

    area.innerHTML = "";


    const todayList =
        filteredList
            .filter(item => item.date === today)
            .sort((a, b) =>
                a.time.localeCompare(b.time)
            );


    const otherList =
        filteredList
            .filter(item => item.date !== today)
            .sort((a, b) => {

                if (a.date === b.date) {

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

        todayList.forEach(item => {
            area.innerHTML += createReservationCard(item);
        });

    }


    if (otherList.length > 0) {

        area.innerHTML += `
            <div class="today-header">
                📖 その他の予約
            </div>
        `;

        otherList.forEach(item => {
            area.innerHTML += createReservationCard(item);
        });

    }


    document
        .querySelectorAll(".editButton")
        .forEach(button => {

            button.addEventListener("click", () => {

                const id =
                    button.dataset.id;

                const reservation =
                    window.reservationList.find(
                        item => String(item.id) === String(id)
                    );

                if (reservation) {

                    openEditForm(reservation);

                }

            });

        });


    document
        .querySelectorAll(".cancelButton")
        .forEach(button => {

            button.addEventListener("click", () => {

                cancelReservation(button.dataset.id);

            });

        });

}


// ==================================================
// 予約カード
// ==================================================

function createReservationCard(item) {

    return `

        <div class="reservation-card">

            <div>
                <strong>📅 予約日</strong><br>
                ${item.date}
            </div>

            <br>

            <div>
                <strong>🕘 開始時間</strong><br>
                <div class="time-box">
                    ${item.time}
                </div>
            </div>

            <div>
                <strong>👤 お名前</strong><br>
                ${item.name || "-"}
            </div>

            <br>

            <div>
                <strong>🖋️ 施術メニュー</strong><br>
                ${item.menu || "-"}
            </div>

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

}


// ==================================================
// 編集画面
// ==================================================

function openEditForm(reservation) {

    editingReservation = reservation;


    document
        .getElementById("editArea")
        .style.display = "block";


    document.getElementById("editName").value =
        reservation.name || "";


    document.getElementById("editDate").value =
        reservation.date || "";


    document.getElementById("editVisit").value =
        reservation.visit || "初診";


    // ================================
    // メニュー生成
    // ================================

    const menu1 =
        document.getElementById("editMenu1");

    const menu2 =
        document.getElementById("editMenu2");


    menu1.innerHTML =
        `<option value="">選択してください</option>`;

    menu2.innerHTML =
        `<option value="">選択してください</option>`;


    treatmentMenus
        .filter(item => item.enabled)
        .forEach(item => {

            menu1.innerHTML += `
                <option value="${escapeHtml(item.name)}">
                    ${escapeHtml(item.name)}
                </option>
            `;

            menu2.innerHTML += `
                <option value="${escapeHtml(item.name)}">
                    ${escapeHtml(item.name)}
                </option>
            `;

        });


    menu1.value =
        reservation.menu1 || "";

    menu2.value =
        reservation.menu2 || "";


    // ================================
    // 詳細情報
    // ================================

    document.getElementById("editTel").value =
        reservation.tel || "";

    document.getElementById("editGender").value =
        reservation.gender || "";

    document.getElementById("editAge").value =
        reservation.age || "";

    document.getElementById("editReferrer").value =
        reservation.referrer || "";

    document.getElementById("editHistory").value =
        reservation.history || "";

    document.getElementById("editHistoryDate").value =
        reservation.historyDate || "";

    document.getElementById("editMedicalHistory").value =
        reservation.medicalHistory || "";

    document.getElementById("editPregnancy").value =
        reservation.pregnancy || "";


    // ================================
    // 時間候補
    // ================================

    updateEditTimeOptions(
        reservation.date,
        reservation.visit,
        reservation.time
    );


    document
        .getElementById("editArea")
        .scrollIntoView({
            behavior: "smooth"
        });


    // ================================
    // 保存
    // ================================

    document
        .getElementById("saveEditButton")
        .onclick = saveEdit;


    // ================================
    // 閉じる
    // ================================

    document
        .getElementById("closeEditButton")
        .onclick = () => {

            document
                .getElementById("editArea")
                .style.display = "none";

            editingReservation = null;

        };

}


// ==================================================
// 保存
// ==================================================

async function saveEdit() {

    if (!editingReservation) return;


    const oldDate =
        editingReservation.date;

    const oldTime =
        editingReservation.time;


    const newData = {

        action: "update",

        reservationId:
            editingReservation.id,

        name:
            document.getElementById("editName").value.trim(),

        date:
            document.getElementById("editDate").value,

        time:
            document.getElementById("editTime").value,

        visit:
            document.getElementById("editVisit").value,

        menu1:
            document.getElementById("editMenu1").value,

        menu2:
            document.getElementById("editMenu2").value,

        // 電話番号は文字列として送る
        tel:
            document.getElementById("editTel").value,

        gender:
            document.getElementById("editGender").value,

        age:
            document.getElementById("editAge").value,

        referrer:
            document.getElementById("editReferrer").value,

        history:
            document.getElementById("editHistory").value,

        historyDate:
            document.getElementById("editHistoryDate").value,

        medicalHistory:
            document.getElementById("editMedicalHistory").value,

        pregnancy:
            document.getElementById("editPregnancy").value

    };


    if (!newData.name) {

        alert("お名前を入力してください。");
        return;

    }


    if (!newData.date || !newData.time) {

        alert("予約日と開始時間を入力してください。");
        return;

    }


    const baseUrl =
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec";


    const response =
        await fetch(baseUrl, {

            method: "POST",

            headers: {
                "Content-Type": "text/plain"
            },

            body: JSON.stringify(newData)

        });


    const result =
        await response.json();


    if (result.result === "success") {

        const dateChanged =
            oldDate !== newData.date;

        const timeChanged =
            oldTime !== newData.time;


        if (dateChanged || timeChanged) {

            alert(
                "予約を変更しました。\n\n" +
                "予約日時が変更されたため、お客様へLINE通知を送信しました。"
            );

        } else {

            alert("予約内容を変更しました。");

        }


        document
            .getElementById("editArea")
            .style.display = "none";


        editingReservation = null;


        await loadReservations();


    } else {

        alert(
            result.message ||
            "変更できませんでした。"
        );

    }

}


// ==================================================
// キャンセル
// ==================================================

async function cancelReservation(id) {

    if (!confirm("この予約をキャンセルしますか？")) {
        return;
    }


    const baseUrl =
        "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec";


    const response =
        await fetch(baseUrl, {

            method: "POST",

            headers: {
                "Content-Type": "text/plain"
            },

            body: JSON.stringify({

                action: "cancel",

                reservationId: id

            })

        });


    const result =
        await response.json();


    if (result.result === "success") {

        alert("キャンセルしました。");

        loadReservations();

    } else {

        alert(
            result.message ||
            "キャンセルできませんでした。"
        );

    }

}


// ==================================================
// 時間候補
// ==================================================

function updateEditTimeOptions(
    date,
    visit,
    currentTime = ""
) {

    const timeSelect =
        document.getElementById("editTime");


    timeSelect.innerHTML = "";


    if (!date) return;


    if (
        window.holidays &&
        window.holidays.includes(date)
    ) {

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent = "休診日";

        timeSelect.appendChild(option);

        return;

    }


    const day =
        new Date(date + "T00:00:00").getDay();


    const weekdayMap = {

        0: "日",
        1: "月",
        2: "火",
        3: "水",
        4: "木",
        5: "金",
        6: "土"

    };


    const weekday =
        weekdayMap[day];


    const business =
        (window.businessHours || [])
            .find(item =>
                item.weekday === weekday
            );


    if (!business) {

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent = "予約不可";

        timeSelect.appendChild(option);

        return;

    }


    const sourceTimes =
        visit === "再診"
            ? business.repeat
            : business.first;


    let times =
        String(sourceTimes || "")
            .split(/[,、]/)
            .map(time => time.trim())
            .filter(Boolean);


    times =
        [...new Set(times)];


    times.sort();


    times.forEach(time => {

        const option =
            document.createElement("option");

        option.value = time;
        option.textContent = time;

        timeSelect.appendChild(option);

    });


    if (times.includes(currentTime)) {

        timeSelect.value = currentTime;

    }

}


// ==================================================
// HTMLエスケープ
// ==================================================

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}