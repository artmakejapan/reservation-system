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

    // ================================
    // メニュー読み込み
    // LIFFの完了を待たずに開始する
    // ================================

    try {

        await loadInitialData();

    } catch (error) {

        console.error("初期データ読み込みエラー:", error);

        const menuList = document.getElementById("menuList");

        if (menuList) {

            menuList.innerHTML =
                '<p>メニューの読み込みに失敗しました。ページを再読み込みしてください。</p>';

        }

        return;

    }

    // ================================
    // メニュー読み込み完了
    // ================================

    const menuCheckboxes =
        document.querySelectorAll('input[name="menu"]');

    nextButton.disabled = false;
    nextButton.textContent = "空き状況を見る";


    // ================================
    // メニューは2つまで
    // ================================

    menuCheckboxes.forEach(box => {

        box.addEventListener("change", () => {

            // 最大2メニュー
            const checked =
                [...document.querySelectorAll('input[name="menu"]:checked')];

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

                    const target =
                        document.querySelector(`input[value="${name}"]`);

                    if (target && !target.checked) {

                        target.disabled = true;
                        target.parentElement.style.opacity = "0.4";

                    }

                });

            });

        });

    });


    // ================================
    // 予約へ進む
    // ================================

    nextButton.addEventListener("click", () => {

        const checkedMenus =
            document.querySelectorAll('input[name="menu"]:checked');

        const visit =
            document.querySelector('input[name="visit"]:checked');

        if (checkedMenus.length === 0) {

            alert("施術メニューを選択してください.");

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
        const calendarSection =
            document.getElementById("calendarSection");

        calendarSection.style.display = "block";

        // お客様情報・確認画面はまだ非表示
        document.getElementById("customerSection").style.display = "none";

        document.getElementById("confirmSection").style.display = "none";

        // カレンダーまでスクロール
        calendarSection.scrollIntoView({

            behavior: "smooth"

        });

        // カレンダー生成
        generateCalendar(reservationData);

    });

});

// =================================
// サイドメニュー
// =================================

document.addEventListener("DOMContentLoaded", () => {

    const menuButton = document.getElementById("menuButton");
    const sideMenu = document.getElementById("sideMenu");
    const sideOverlay = document.getElementById("sideOverlay");
    const sideMenuClose = document.getElementById("sideMenuClose");
    const menuItems = document.querySelectorAll("[data-menu-target]");


    // メニューを開く
    function openSideMenu() {
        sideMenu.classList.add("open");
        sideOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }


    // メニューを閉じる
    function closeSideMenu() {
        sideMenu.classList.remove("open");
        sideOverlay.classList.remove("open");
        document.body.style.overflow = "";
    }


    // ☰
    if (menuButton) {
        menuButton.addEventListener("click", openSideMenu);
    }


    // ×
    if (sideMenuClose) {
        sideMenuClose.addEventListener("click", closeSideMenu);
    }


    // 背景をタップ
    if (sideOverlay) {
        sideOverlay.addEventListener("click", closeSideMenu);
    }


    // メニュー項目
    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            const target = item.dataset.menuTarget;

            closeSideMenu();


            // HOME
            if (target === "home") {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }


            // ご予約・空き状況
            if (target === "reservation") {

                const reservationStart =
                    document.getElementById("reservationStart");

                if (reservationStart) {

                    setTimeout(() => {

                        reservationStart.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }, 100);

                }

            }


            // マイページ
            if (target === "mypage") {

    window.location.href =
        "https://liff.line.me/2010613933-QlpOgM74";

}


            // ACCESS
            if (target === "access") {

    window.location.href =
        "https://liff.line.me/2010613933-QlpOgM74#access";

}

        });

    });

});