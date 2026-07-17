// ================================
// アートメイクまなみ予約システム
// Ver1.0
// ================================

const LIFF_ID = "2010613933-uBqu1yDz";

let lineUserId = "";

async function initLiff() {
    await liff.init({
        liffId: LIFF_ID
    });

    if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        lineUserId = profile.userId;
    } else {
        liff.login();
    }
}

initLiff();

document.addEventListener("DOMContentLoaded", () => {

    const menuCheckboxes = document.querySelectorAll('input[name="menu"]');
    const visitRadios = document.querySelectorAll('input[name="visit"]');
    const nextButton = document.getElementById("nextButton");

    loadInitialData();
    // 同時選択不可ルール
const exclusiveRules = {
    "アイライン上": ["アイライン上下セット"],
    "アイライン下": ["アイライン上下セット"],
    "アイライン上下セット": ["アイライン上", "アイライン下"],
    "ヘアライン（M字 or 分け目）": ["ヘアライン全体"],
    "ヘアライン全体": ["ヘアライン（M字 or 分け目）"]
};

    // メニューは2つまで
    menuCheckboxes.forEach(box => {

    box.addEventListener("change", () => {

        // 最大2メニュー
        const checked = [...document.querySelectorAll('input[name="menu"]:checked')];

        if (checked.length > 2) {

            alert("施術メニューは最大2つまで選択できます。");

            box.checked = false;

            return;

        }

        // 一旦全部有効化
        menuCheckboxes.forEach(item => {

            item.disabled = false;

            item.parentElement.style.opacity = "1";

        });

        // 選択中メニューから同時選択不可を探す
        checked.forEach(item => {

            const ngList = exclusiveRules[item.value];

            if (!ngList) return;

            ngList.forEach(name => {

                const target = document.querySelector(`input[value="${name}"]`);

                if (target && !target.checked) {

                    target.disabled = true;

                    target.parentElement.style.opacity = "0.4";

                }

            });

        });

    });

});

    // 予約へ進む
    nextButton.addEventListener("click", () => {

        const checkedMenus = document.querySelectorAll('input[name="menu"]:checked');
        const visit = document.querySelector('input[name="visit"]:checked');

        if (checkedMenus.length === 0) {

            alert("施術メニューを選択してください。");
            return;

        }

        if (!visit) {

            alert("初診・再診を選択してください。");
            return;

        }

        // 選択内容保存
const reservationData = {

    menus: [...checkedMenus].map(item => item.value),

    visit: visit.value

};

console.log(reservationData);

// カレンダー表示
const calendarSection = document.getElementById("calendarSection");

calendarSection.style.display = "block";

// お客様情報・確認画面はまだ非表示
document.getElementById("customerSection").style.display = "none";
document.getElementById("confirmSection").style.display = "none";

// カレンダーまでスクロール
calendarSection.scrollIntoView({

    behavior: "smooth"

});

// 次のステップでカレンダー生成
generateCalendar(reservationData);

});

});