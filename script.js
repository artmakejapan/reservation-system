// ================================
// アートメイクまなみ予約システム
// Ver1.0
// ================================

const LIFF_ID = "2010613933-uBqu1yDz";

let lineUserId = "";
let liffReady = false;

async function initLiff() {

    try {

        await liff.init({
            liffId: LIFF_ID
        });

        if (liff.isLoggedIn()) {

            const profile = await liff.getProfile();

            lineUserId = profile.userId;

            liffReady = true;

        } else {

            liff.login();

            return;

        }

    } catch (error) {

        console.error("LIFF初期化エラー:", error);

        alert("予約システムの読み込みに失敗しました。LINEからもう一度お試しください。");

        return;

    }

}

initLiff();

document.addEventListener("DOMContentLoaded", async () => {

    const visitRadios = document.querySelectorAll('input[name="visit"]');
    const nextButton = document.getElementById("nextButton");

    nextButton.disabled = true;

nextButton.textContent = "読み込み中...";

// LIFF初期化完了を待つ
while (!liffReady) {

    await new Promise(resolve => setTimeout(resolve, 100));

}

await loadInitialData();

const menuCheckboxes =
document.querySelectorAll('input[name="menu"]');

// メニューは表示済み
// ただし空き状況データは裏で取得中
nextButton.disabled = true;
nextButton.textContent = "空き状況を確認中…";

window.initialDataReady.then(() => {

    nextButton.disabled = false;
    nextButton.textContent = "空き状況を見る";

    console.log("予約システム準備完了");

});


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

        const reservationData = {

            menus: [...checkedMenus].map(item => item.value),

            visit: visit.value

        };

        console.log(reservationData);

        const calendarSection = document.getElementById("calendarSection");

        calendarSection.style.display = "block";

        document.getElementById("customerSection").style.display = "none";
        document.getElementById("confirmSection").style.display = "none";

        calendarSection.scrollIntoView({

            behavior: "smooth"

        });

        generateCalendar(reservationData);

    });

});