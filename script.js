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

// 初診・再診を選んだら、空き状況を見るボタンへスクロール
visitRadios.forEach(radio => {

    radio.addEventListener("change", () => {

        setTimeout(() => {

            const nextButton = document.getElementById("nextButton");

            if (!nextButton) return;

            const buttonBottom =
                nextButton.getBoundingClientRect().bottom + window.scrollY;

            const targetPosition =
                buttonBottom - window.innerHeight + 30;

            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: "smooth"
            });

        }, 200);

    });

});

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
// メニュー選択・選択中メニューの表示
// ================================

const selectedMenuNames =
    document.getElementById("selectedMenuNames");

function updateSelectedMenuDisplay() {

    const checkedMenus = [
        ...document.querySelectorAll('input[name="menu"]:checked')
    ];

    if (!selectedMenuNames) return;

    if (checkedMenus.length === 0) {
        selectedMenuNames.textContent = "未選択";
    } else {
        selectedMenuNames.textContent =
            checkedMenus.map(item => item.value).join(" ・ ");
    }
}

menuCheckboxes.forEach(box => {

    box.addEventListener("change", () => {

        let checked = [
            ...document.querySelectorAll('input[name="menu"]:checked')
        ];

        // 最大2メニュー
        if (checked.length > 2) {

            alert("施術メニューは最大2つまで選択できます。");

            box.checked = false;

            checked = [
                ...document.querySelectorAll('input[name="menu"]:checked')
            ];
        }

        // 一旦全部有効化
        menuCheckboxes.forEach(item => {
            item.disabled = false;
            item.parentElement.style.opacity = "1";
        });

        // 同時選択できないメニューを無効化
        checked.forEach(item => {

            const ngList = exclusiveRules[item.value];

            if (!ngList) return;

            ngList.forEach(name => {

                const target = document.querySelector(
                    `input[name="menu"][value="${name}"]`
                );

                if (target && !target.checked) {
                    target.disabled = true;
                    target.parentElement.style.opacity = "0.4";
                }
            });
        });

        // 選択中メニューの表示を更新
        updateSelectedMenuDisplay();
    });
});

// 初期表示
updateSelectedMenuDisplay();



    // ================================
    // 予約へ進む
    // ================================

    nextButton.addEventListener("click", () => {

        const checkedMenus =
            document.querySelectorAll('input[name="menu"]:checked');

        const visit =
            document.querySelector('input[name="visit"]:checked');

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

        // ================================
// カレンダー表示・固定ボタン表示
// ================================

const calendarSection =
    document.getElementById("calendarSection");

const contactButtons =
    document.getElementById("calendarContactButtons");

// カレンダーを表示
calendarSection.style.display = "block";

// 電話・LINEボタンを表示
if (contactButtons) {
    contactButtons.style.display = "flex";
}

// お客様情報・確認画面は非表示
document.getElementById("customerSection").style.display = "none";

        // お客様情報・確認画面はまだ非表示
        document.getElementById("customerSection").style.display = "none";

        document.getElementById("confirmSection").style.display = "none";

        // カレンダー生成
generateCalendar(reservationData);

// カレンダーが表示されたあとにスクロール
requestAnimationFrame(() => {
  setTimeout(() => {
    const calendarSection = document.getElementById("calendarSection");
    const top = calendarSection.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: Math.max(0, top - 10),
      behavior: "smooth"
    });
  }, 200);
});

    });

});

// =================================
// サイドメニュー
// =================================

document.addEventListener("DOMContentLoaded", () => {

    const menuButton = document.getElementById("menuButton");
    const sideMenu = document.getElementById("sideMenu");
    const sideOverlay = document.getElementById("sideOverlay");
    const menuItems = document.querySelectorAll("[data-menu-target]");


    // サイドメニューの名前表示
async function updateSideMenuWelcome() {

    const welcome =
        document.getElementById("sideMenuWelcome");

    if (!welcome) return;

    try {

        // LIFF初期化が完了するまで待つ（最大5秒）
        let waited = 0;
        while (!liffReady && waited < 100) {
            await new Promise(resolve =>
                setTimeout(resolve, 50)
            );
            waited++;
        }

        if (!liffReady) {
            welcome.textContent = "ようこそ ゲスト様";
            return;
        }

        const profile =
            await liff.getProfile();

        welcome.textContent =
            `ようこそ ${profile.displayName}様`;

    } catch (error) {

        console.error(
            "サイドメニュー名前取得エラー:",
            error
        );

        welcome.textContent =
            "ようこそ ゲスト様";

    }

}


    // メニューを開く
    function openSideMenu() {
        sideMenu.classList.add("open");
        sideOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }


    // ACCESSから戻ってきた場合は
    // サイドメニューを自動で開く
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("openMenu") === "1") {
        setTimeout(() => {
            openSideMenu();
        }, 300);
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


    // 背景をタップ
    if (sideOverlay) {
        sideOverlay.addEventListener("click", closeSideMenu);
    }


    // メニュー項目
    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            const target = item.dataset.menuTarget;

            if (target !== "mypage") {
                closeSideMenu();
            }


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

                sessionStorage.setItem(
                    "fromReservationMenu",
                    "1"
                );

                window.location.href =
                    "access.html";

            }

        });

    });


    updateSideMenuWelcome();

});