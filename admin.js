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
        .filter(item => {

            // 名前検索・日付検索をしている場合
            // → 過去の予約も検索結果として表示
            if (keyword || searchDate) {
                return item.date !== today;
            }

            // 通常表示
            // → 今日より前の予約は非表示
            return item.date > today;

        })
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
                <strong>🩺 初診・再診</strong><br>
                ${item.visit || "-"}
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

// ================================
// 施術歴
// ================================

const historySelector =
    document.getElementById("editHistorySelector");

const historySelected =
    document.getElementById("editHistorySelected");

historySelected.innerHTML = "";


// 既存の施術歴を復元
const existingHistories = [
    {
        name: "眉",
        history: reservation.eyebrowHistory,
        date: reservation.eyebrowHistoryDate
    },
    {
        name: "アイライン",
        history: reservation.eyelineHistory,
        date: reservation.eyelineHistoryDate
    },
    {
        name: "リップ",
        history: reservation.lipHistory,
        date: reservation.lipHistoryDate
    },
    {
        name: "ヘアライン",
        history: reservation.hairlineHistory,
        date: reservation.hairlineHistoryDate
    },
    {
        name: "その他",
        history: reservation.otherHistory,
        date: reservation.otherHistoryDate
    }
];

existingHistories.forEach(item => {

    if (item.history === "あり") {

        addHistoryItem(
            item.name,
            item.date || ""
        );

    }

});


// プルダウンから追加
historySelector.onchange = () => {

    const value =
        historySelector.value;

    if (!value) return;

    // すでに追加されていたら何もしない
    const exists =
        [...historySelected.querySelectorAll(".history-item")]
            .some(item =>
                item.dataset.history === value
            );

    if (!exists) {

        addHistoryItem(value, "");

    }

    // 選択を初期状態に戻す
    historySelector.value = "";

};

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


    // ================================
    // 施術歴データ
    // ================================

    const historyData =
        getHistoryData();


    // ================================
    // 新しい予約データ
    // ================================

    const newData = {

        action: "update",

        reservationId:
            editingReservation.id,

        name:
            document
                .getElementById("editName")
                .value
                .trim(),

        date:
            document
                .getElementById("editDate")
                .value,

        time:
            document
                .getElementById("editTime")
                .value,

        visit:
            document
                .getElementById("editVisit")
                .value,

        menu1:
            document
                .getElementById("editMenu1")
                .value,

        menu2:
            document
                .getElementById("editMenu2")
                .value,

        tel:
            document
                .getElementById("editTel")
                .value,

        gender:
            document
                .getElementById("editGender")
                .value,

        age:
            document
                .getElementById("editAge")
                .value,

        referrer:
            document
                .getElementById("editReferrer")
                .value,


        // ================================
        // 施術歴
        // ================================

        eyebrowHistory:
            historyData.eyebrowHistory,

        eyebrowHistoryDate:
            historyData.eyebrowHistoryDate,

        eyelineHistory:
            historyData.eyelineHistory,

        eyelineHistoryDate:
            historyData.eyelineHistoryDate,

        lipHistory:
            historyData.lipHistory,

        lipHistoryDate:
            historyData.lipHistoryDate,

        hairlineHistory:
            historyData.hairlineHistory,

        hairlineHistoryDate:
            historyData.hairlineHistoryDate,

        otherHistory:
            historyData.otherHistory,

        otherHistoryDate:
            historyData.otherHistoryDate,


        medicalHistory:
            document
                .getElementById("editMedicalHistory")
                .value,

        pregnancy:
            document
                .getElementById("editPregnancy")
                .value

    };


    // ================================
    // 入力チェック
    // ================================

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


    // ================================
    // 保存
    // ================================

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


    // ================================
    // 保存成功
    // ================================

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

// ==================================================
// 施術歴データ取得
// ==================================================

function getHistoryData() {

    const data = {

        eyebrowHistory: "",
        eyebrowHistoryDate: "",

        eyelineHistory: "",
        eyelineHistoryDate: "",

        lipHistory: "",
        lipHistoryDate: "",

        hairlineHistory: "",
        hairlineHistoryDate: "",

        otherHistory: "",
        otherHistoryDate: ""

    };


    document
        .querySelectorAll("#editHistorySelected .history-item")
        .forEach(item => {

            const name =
                item.dataset.history;

            const date =
                item.querySelector(".history-date")?.value || "";


            if (name === "眉") {

                data.eyebrowHistory = "あり";
                data.eyebrowHistoryDate = date;

            }


            if (name === "アイライン") {

                data.eyelineHistory = "あり";
                data.eyelineHistoryDate = date;

            }


            if (name === "リップ") {

                data.lipHistory = "あり";
                data.lipHistoryDate = date;

            }


            if (name === "ヘアライン") {

                data.hairlineHistory = "あり";
                data.hairlineHistoryDate = date;

            }


            if (name === "その他") {

                data.otherHistory = "あり";
                data.otherHistoryDate = date;

            }

        });


    return data;

}

// ==================================================
// 施術歴日の表示・非表示
// ==================================================

function updateHistoryDateVisibility(
    historyElement,
    dateElement
) {

    if (!historyElement || !dateElement) return;

    if (historyElement.value === "あり") {

        dateElement.style.display = "block";

        if (dateElement.previousElementSibling) {
            dateElement.previousElementSibling.style.display = "block";
        }

    } else {

        dateElement.style.display = "none";

        if (dateElement.previousElementSibling) {
            dateElement.previousElementSibling.style.display = "none";
        }

        if (historyElement.value === "なし") {
            dateElement.value = "";
        }

    }

}

// ==================================================
// 施術歴項目追加
// ==================================================

function addHistoryItem(name, dateValue = "") {

    const container =
        document.getElementById("editHistorySelected");

    const item =
        document.createElement("div");

    item.className = "history-item";

    item.dataset.history = name;

    item.innerHTML = `

        <div class="history-title">
            ${escapeHtml(name)}
        </div>

        <label>施術歴日</label>

        <input
            type="date"
            class="history-date"
            value="${escapeHtml(dateValue)}">

        <button
            type="button"
            class="history-remove">
            削除
        </button>

    `;

    item
        .querySelector(".history-remove")
        .addEventListener("click", () => {

            item.remove();

        });

    container.appendChild(item);

}