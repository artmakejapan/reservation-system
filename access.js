const RESERVATION_LIFF_URL =
    "https://liff.line.me/2010613933-uBqu1yDz";

const closeButton = document.getElementById("closeButton");

if (closeButton) {
    closeButton.addEventListener("click", () => {

        const fromMenu =
            sessionStorage.getItem("fromReservationMenu");

        if (fromMenu === "1") {

            sessionStorage.removeItem("fromReservationMenu");

            window.location.href =
                RESERVATION_LIFF_URL + "?openMenu=1";

        } else {

            window.close();

        }

    });
}