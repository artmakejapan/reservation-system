let treatmentMenus = [];

window.reservationList = [];
window.businessHours = [];
window.holidays = [];

let editingReservation = null;
let selectedNewCustomer = null;
let customerLabelMap = new Map();

const ADMIN_BASE_URL =
    "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec";


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
    // 編集日時変更
    // ================================

    document
        .getElementById("editDate")
        .addEventListener("change", () => {

            updateEditTimeOptions(
                document.getElementById("editDate").value,
                document.getElementById("editVisit").value
            );

        });


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


    // ================================
    // 新規予約UI
    // ================================

    document
        .getElementById("openNewReservationButton")
        .addEventListener("click", openNewReservationArea);

    document
        .getElementById("closeNewReservationButton")
        .addEventListener("click", closeNewReservationArea);

    document
        .getElementById("createNewReservationButton")
        .addEventListener("click", submitNewReservation);

    document
        .getElementById("newDate")
        .addEventListener("change", () => {

            updateNewTimeOptions(
                document.getElementById("newDate").value,
                document.getElementById("newVisit").value
            );

        });

    document
        .getElementById("newVisit")
        .addEventListener("change", () => {

            updateNewTimeOptions(
                document.getElementById("newDate").value,
                document.getElementById("newVisit").value
            );

        });

    document
        .getElementById("newCustomerSearch")
        .addEventListener("change", handleNewCustomerSelection);

    document
        .getElementById("newCustomerSearch")
        .addEventListener("blur", handleNewCustomerSelection);

    document
        .getElementById("newCustomerSearch")
        .addEventListener("input", () => {

            const value =
                document.getElementById("newCustomerSearch").value.trim();

            if (!value) {
                selectedNewCustomer = null;
                clearNewCustomerFields();
            }

        });

    document
        .getElementById("newHistorySelector")
        .addEventListener("change", () => {

            const selector =
                document.getElementById("newHistorySelector");

            const value =
                selector.value;

            if (!value) return;

            const exists =
                [...document.querySelectorAll("#newHistorySelected .history-item")]
                    .some(item =>
                        item.dataset.history === value
                    );

            if (!exists) {
                addNewHistoryItem(value, "");
            }

            selector.value = "";

        });

});


async function loadReservations() {

    document.getElementById("loginArea").style.display = "none";
    document.getElementById("adminArea").style.display = "block";

    const reservationResponse =
        await fetch(ADMIN_BASE_URL + "?action=getReservationList");

    window.reservationList =
        await reservationResponse.json();

    const treatmentResponse =
        await fetch(ADMIN_BASE_URL + "?action=treatments");

    treatmentMenus =
        await treatmentResponse.json();

    const businessResponse =
        await fetch(ADMIN_BASE_URL + "?action=businesshours");

    window.businessHours =
        await businessResponse.json();

    const holidayResponse =
        await fetch(ADMIN_BASE_URL + "?action=holidays");

    window.holidays =
        await holidayResponse.json();

    buildCustomerSearchList();
    buildNewMenuOptions();
    renderReservations();

}


// ==================================================
// 新規予約表示
// ==================================================

function openNewReservationArea() {

    resetNewReservationForm();

    document
        .getElementById("newReservationArea")
        .style.display = "block";

    document
        .getElementById("newReservationArea")
        .scrollIntoView({
            behavior: "smooth"
        });

}


function closeNewReservationArea() {

    document
        .getElementById("newReservationArea")
        .style.display = "none";

    resetNewReservationForm();

}


// ==================================================
// 新規予約 初期化
// ==================================================

function resetNewReservationForm() {

    selectedNewCustomer = null;

    const search =
        document.getElementById("newCustomerSearch");

    if (search) {
        search.value = "";
    }

    document.getElementById("newDate").value = "";
    document.getElementById("newVisit").value = "初診";
    document.getElementById("newName").value = "";
    document.getElementById("newGender").value = "";
    document.getElementById("newAge").value = "";
    document.getElementById("newReferrer").value = "";
    document.getElementById("newTel").value = "";
    document.getElementById("newMedicalHistory").value = "";
    document.getElementById("newPregnancy").value = "";
    document.getElementById("newMenu1").value = "";
    document.getElementById("newMenu2").value = "";
    document.getElementById("newHistorySelected").innerHTML = "";
    document.getElementById("newHistorySelector").value = "";

    const timeSelect =
        document.getElementById("newTime");

    timeSelect.innerHTML = `
        <option value="">
            選択してください
        </option>
    `;

    buildNewMenuOptions();

}


// ==================================================
// 新規予約 顧客候補作成
// ==================================================

function buildCustomerSearchList() {

    const datalist =
        document.getElementById("newCustomerCandidates");

    if (!datalist) return;

    datalist.innerHTML = "";
    customerLabelMap = new Map();

    const grouped =
        new Map();

    window.reservationList.forEach(item => {

        const lineUserId =
            String(item.lineUserId || "").trim();

        const name =
            String(item.name || "").trim();

        if (!lineUserId || !name) return;

        if (!grouped.has(lineUserId)) {
            grouped.set(lineUserId, []);
        }

        grouped.get(lineUserId).push(item);

    });

    [...grouped.entries()]
        .map(([lineUserId, list]) => {

            const sorted =
                [...list].sort(compareReservationDesc);

            const source =
                sorted.find(item => item.visit === "初診") || sorted[0];

            const tel =
                String(source.tel || "").trim();

            const label =
                tel
                    ? `${source.name}｜${tel}`
                    : `${source.name}｜LINE連携済み`;

            return {
                label: label,
                lineUserId: lineUserId,
                source: source
            };

        })
        .sort((a, b) =>
            a.source.name.localeCompare(
                b.source.name,
                "ja"
            )
        )
        .forEach(customer => {

            const option =
                document.createElement("option");

            option.value = customer.label;

            datalist.appendChild(option);

            customerLabelMap.set(
                customer.label,
                customer
            );

        });

}


// ==================================================
// 新規予約 顧客選択
// ==================================================

function handleNewCustomerSelection() {

    const input =
        document.getElementById("newCustomerSearch");

    const value =
        input.value.trim();

    if (!value) {
        selectedNewCustomer = null;
        clearNewCustomerFields();
        return;
    }

    const customer =
        customerLabelMap.get(value);

    if (!customer) {
        selectedNewCustomer = null;
        clearNewCustomerFields();
        alert("候補からお客様を選択してください。");
        return;
    }

    selectedNewCustomer = customer.source;

    applyCustomerToNewForm(customer.source);

}


function applyCustomerToNewForm(customer) {

    document.getElementById("newName").value =
        customer.name || "";

    document.getElementById("newTel").value =
        customer.tel || "";

    document.getElementById("newGender").value =
        customer.gender || "";

    document.getElementById("newAge").value =
        customer.age || "";

    document.getElementById("newReferrer").value =
        customer.referrer || "";

    document.getElementById("newMedicalHistory").value =
        customer.medicalHistory || "";

    document.getElementById("newPregnancy").value =
        customer.pregnancy || "";

    document.getElementById("newVisit").value = "再診";

    restoreNewHistoryFromReservation(customer);

    updateNewTimeOptions(
        document.getElementById("newDate").value,
        "再診"
    );

}


function clearNewCustomerFields() {

    document.getElementById("newName").value = "";
    document.getElementById("newTel").value = "";
    document.getElementById("newGender").value = "";
    document.getElementById("newAge").value = "";
    document.getElementById("newReferrer").value = "";
    document.getElementById("newMedicalHistory").value = "";
    document.getElementById("newPregnancy").value = "";
    document.getElementById("newHistorySelected").innerHTML = "";

}


// ==================================================
// 新規予約 メニュー
// ==================================================

function buildNewMenuOptions() {

    const menu1 =
        document.getElementById("newMenu1");

    const menu2 =
        document.getElementById("newMenu2");

    menu1.innerHTML =
        `<option value="">選択してください</option>`;

    menu2.innerHTML =
        `<option value="">なし</option>`;

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

}


// ==================================================
// 新規予約 時間候補
// ==================================================

function updateNewTimeOptions(
    date,
    visit,
    currentTime = ""
) {

    const timeSelect =
        document.getElementById("newTime");

    timeSelect.innerHTML = `
        <option value="">
            選択してください
        </option>
    `;

    if (!date) return;

    if (
        window.holidays &&
        window.holidays.includes(date)
    ) {

        timeSelect.innerHTML = `
            <option value="">
                休診日
            </option>
        `;
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

        timeSelect.innerHTML = `
            <option value="">
                予約不可
            </option>
        `;
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
// 新規予約 施術歴
// ==================================================

function restoreNewHistoryFromReservation(reservation) {

    const historySelected =
        document.getElementById("newHistorySelected");

    historySelected.innerHTML = "";

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
            addNewHistoryItem(
                item.name,
                item.date || ""
            );
        }

    });

}


function addNewHistoryItem(
    name,
    dateValue = ""
) {

    const container =
        document.getElementById("newHistorySelected");

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


function getNewHistoryData() {

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
        .querySelectorAll("#newHistorySelected .history-item")
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
// 新規予約 送信
// ==================================================

async function submitNewReservation() {

    const historyData =
        getNewHistoryData();

    const visit =
        document.getElementById("newVisit").value;

    const newData = {

        action: "adminCreate",

        date:
            document.getElementById("newDate").value,

        time:
            document.getElementById("newTime").value,

        visit: visit,

        menu1:
            document.getElementById("newMenu1").value,

        menu2:
            document.getElementById("newMenu2").value,

        name:
            document.getElementById("newName").value.trim(),

        tel:
            document.getElementById("newTel").value.trim(),

        gender:
            document.getElementById("newGender").value,

        age:
            document.getElementById("newAge").value,

        referrer:
            document.getElementById("newReferrer").value.trim(),

        medicalHistory:
            document.getElementById("newMedicalHistory").value.trim(),

        pregnancy:
            document.getElementById("newPregnancy").value,

        lineUserId:
            selectedNewCustomer?.lineUserId || "",

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
            historyData.otherHistoryDate
    };


    if (!newData.date) {
        alert("予約日を入力してください。");
        return;
    }

    if (!newData.time) {
        alert("開始時間を入力してください。");
        return;
    }

    if (!newData.menu1) {
        alert("メニュー①を選択してください。");
        return;
    }

    if (!newData.name) {
        alert("お名前を入力してください。");
        return;
    }

    if (
        newData.menu1 &&
        newData.menu2 &&
        newData.menu1 === newData.menu2
    ) {
        alert("同じ施術メニューは2つ選択できません。");
        return;
    }

    if (
        visit === "再診" &&
        !newData.lineUserId
    ) {
        alert("再診の方はお客様検索の候補から選択してください。");
        return;
    }

    const button =
        document.getElementById("createNewReservationButton");

    const oldText =
        button.textContent;

    button.disabled = true;
    button.textContent = "登録中...";

    try {

        const response =
            await fetch(ADMIN_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify(newData)
            });

        const result =
            await response.json();

        if (result.result === "success") {

            if (newData.lineUserId) {
                alert("予約を登録しました。\n\nお客様へLINE通知も送信しました。");
            } else {
                alert("予約を登録しました。");
            }

            closeNewReservationArea();
            await loadReservations();

        } else {

            alert(
                result.message ||
                "予約登録に失敗しました。"
            );

        }

    } catch (error) {

        console.error(
            "管理画面新規予約エラー:",
            error
        );

        alert("予約登録に失敗しました。");

    } finally {

        button.disabled = false;
        button.textContent = oldText;

    }

}


// ==================================================
// 比較
// ==================================================

function compareReservationDesc(a, b) {

    const aDate =
        String(a.date || "");

    const bDate =
        String(b.date || "");

    if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
    }

    return String(b.time || "")
        .localeCompare(String(a.time || ""));

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

// ========================================
// 管理画面から新規予約登録
// ========================================

async function createAdminReservation(data) {

  try {

    const baseUrl =
      "https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec";

    const response = await fetch(baseUrl, {

      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify({

        action: "createAdminReservation",

        date: data.date,
        time: data.time,
        visit: data.visit,

        menu1: data.menu1,
        menu2: data.menu2,

        name: data.name,

        gender: data.gender || "",
        age: data.age || "",
        referrer: data.referrer || "",
        tel: data.tel || "",

        history: data.history || "",
        historyDate: data.historyDate || "",

        eyebrowHistory: data.eyebrowHistory || "",
        eyebrowHistoryDate: data.eyebrowHistoryDate || "",

        eyelineHistory: data.eyelineHistory || "",
        eyelineHistoryDate: data.eyelineHistoryDate || "",

        lipHistory: data.lipHistory || "",
        lipHistoryDate: data.lipHistoryDate || "",

        hairlineHistory: data.hairlineHistory || "",
        hairlineHistoryDate: data.hairlineHistoryDate || "",

        otherHistory: data.otherHistory || "",
        otherHistoryDate: data.otherHistoryDate || "",

        medicalHistory: data.medicalHistory || "",
        pregnancy: data.pregnancy || "",

        // 既存客の場合はReservationsから
        // LINE userIdを取得してGAS側で紐付ける
        customerName: data.customerName || data.name || ""
      })

    });

    const result = await response.json();

    if (result.result !== "success") {

      throw new Error(
        result.message || "予約登録に失敗しました。"
      );

    }

    return result;

  } catch (error) {

    console.error(
      "管理画面新規予約エラー:",
      error
    );

    throw error;

  }

}