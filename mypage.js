const LIFF_ID = "2010613933-QlpOgM74";

const GAS_URL =
"https://script.google.com/macros/s/AKfycbwfESEqxmljBjSHMP56ufwb0eA9y9FbwRXcFZXWNsU577Fu_BOYg1zpAb5CYfZxnamF/exec";

async function initMyPage() {

    try {

        await liff.init({
            liffId: LIFF_ID
        });


        if (!liff.isLoggedIn()) {

            liff.login();

            return;

        }


        const profile = await liff.getProfile();

        const lineUserId = profile.userId;


        // 名前表示
        document.getElementById("userName").textContent =
            `${profile.displayName} 様`;


        // GASから予約情報取得
        const response = await fetch(
            GAS_URL +
            "?action=mypage&lineUserId=" +
            encodeURIComponent(lineUserId)
        );


        const data = await response.json();


        if (data.result !== "success") {

            throw new Error("データ取得に失敗しました。");

        }


        displayReservation(data.reservations);


        displayHistory(data.reservations);


    } catch (error) {

        console.error(error);

        document.getElementById("reservationArea").textContent =
            "データを取得できませんでした。";

        document.getElementById("historyArea").textContent =
            "データを取得できませんでした。";

    }

}


// ================================
// 次回予約
// ================================

function displayReservation(reservations) {

    const area =
        document.getElementById("reservationArea");


    const today = new Date();

    today.setHours(0, 0, 0, 0);


    const futureReservations =
        reservations.filter(item => {

            const date =
                new Date(item.date);

            date.setHours(0, 0, 0, 0);

            return date >= today;

        });


    if (futureReservations.length === 0) {

        area.innerHTML = `
            <p>現在、ご予約はありません。</p>
        `;

        return;

    }


    futureReservations.sort((a, b) => {

    return new Date(a.date + " " + a.time) -
           new Date(b.date + " " + b.time);

});

const reservation =
    futureReservations[0];


    area.innerHTML = `

        <div class="reservation-item">

            <p>
                <span>予約日</span>
                ${reservation.date}
            </p>

            <p>
                <span>予約時間</span>
                ${reservation.time}
            </p>

            <p>
                <span>施術</span>
                ${reservation.menu1}
                ${reservation.menu2
                    ? "・" + reservation.menu2
                    : ""}
            </p>

            <p>
                <span>初診・再診</span>
                ${reservation.visit}
            </p>

        </div>

    `;

}


// ================================
// 施術歴
// ================================

function displayHistory(reservations) {

    const area =
        document.getElementById("historyArea");


    const today = new Date();

    today.setHours(0, 0, 0, 0);


    const history =
        reservations.filter(item => {

            const date =
                new Date(item.date);

            date.setHours(0, 0, 0, 0);

            return date < today;

        });


    if (history.length === 0) {

        area.innerHTML = `
            <p>施術歴はありません。</p>
        `;

        return;

    }


    // 新しい順
    history.sort((a, b) => {

        return new Date(b.date) -
               new Date(a.date);

    });


    area.innerHTML = "";


    history.forEach(item => {

        area.innerHTML += `

            <div class="history-item">

                <p>
                    ${item.date}
                </p>

                <p>
                    ${item.menu1}
                    ${item.menu2
                        ? "・" + item.menu2
                        : ""}
                </p>

            </div>

        `;

    });

}


initMyPage();