// Keep the registration drawer independent from the optional animation libraries.
const registrationDrawer = document.querySelector("#registration-drawer");
const registrationForm = document.querySelector("#registration-form");
const formStatus = document.querySelector("#form-status");
const drawerCloseButtons = document.querySelectorAll("[data-drawer-close]");
let swipeStartX = 0;
let swipeStartY = 0;
let activeDrawerTrigger = null;

function openDrawer(trigger = activeDrawerTrigger || document.querySelector(".drawer-trigger")) {
    activeDrawerTrigger = trigger;
    document.body.classList.add("drawer-open");
    registrationDrawer.setAttribute("aria-hidden", "false");
    document.querySelectorAll(".drawer-trigger").forEach((item) => item.setAttribute("aria-expanded", item === trigger ? "true" : "false"));
    window.setTimeout(() => registrationDrawer.querySelector("input").focus(), 350);
}

function closeDrawer() {
    document.body.classList.remove("drawer-open");
    registrationDrawer.setAttribute("aria-hidden", "true");
    document.querySelectorAll(".drawer-trigger").forEach((item) => item.setAttribute("aria-expanded", "false"));
    if (activeDrawerTrigger) activeDrawerTrigger.focus();
}

drawerCloseButtons.forEach((button) => button.addEventListener("click", closeDrawer));

registrationDrawer.addEventListener("touchstart", (event) => {
    swipeStartX = event.touches[0].clientX;
    swipeStartY = event.touches[0].clientY;
}, { passive: true });

registrationDrawer.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - swipeStartX;
    const deltaY = event.changedTouches[0].clientY - swipeStartY;
    const isMobileDrawer = window.matchMedia("(max-width: 600px)").matches;

    if ((isMobileDrawer && deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) ||
        (!isMobileDrawer && deltaX > 80 && Math.abs(deltaX) > Math.abs(deltaY))) {
        closeDrawer();
    }
}, { passive: true });

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
        closeDrawer();
    }
});

registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = registrationForm.querySelector(".submit-button");
    const formData = new FormData(registrationForm);

    submitButton.disabled = true;
    submitButton.textContent = "Submitting…";
    formStatus.textContent = "";
    formStatus.classList.remove("is-error", "is-success");

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: formData.get("name"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                website: formData.get("website")
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || "Registration could not be completed.");
        }

        formStatus.textContent = "Thanks — your registration has been received.";
        formStatus.classList.add("is-success");
        registrationForm.reset();
    } catch (error) {
        formStatus.textContent = error instanceof Error
            ? error.message
            : "Registration could not be completed. Please try again.";
        formStatus.classList.add("is-error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit registration";
    }
});

if (window.gsap && window.SplitText) {
    gsap.registerPlugin(SplitText);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let stackEffectReady = prefersReducedMotion;

if (!prefersReducedMotion) {
    window.setTimeout(() => {
        stackEffectReady = true;
    }, 3200);
}

const brandColors = [
    "#2780FF", // Index blue
    "#213666", // Index navy
    "#FFCC00", // bright yellow
    "#FB9CFD", // bright pink
    "#A19BFF", // bright lavender
    "#85AF00"  // bright green
];

function split(el) {
    return new SplitText(el, { type: "lines, chars" });
}

const texts = gsap.utils.toArray("h1");

texts.forEach((txt) => {
    const lineArray = split(txt);

    lineArray.lines.forEach((line) => {
        line.addEventListener("mouseenter", () => {
            if (!stackEffectReady) return;

            const charsInLine = lineArray.chars.filter((char) => line.contains(char));

            const totalChars = charsInLine.length;
            const middleIndex = (totalChars - 1) / 2;

            charsInLine.forEach((char, index) => {
                if (!char.dataset.orig) {
                    char.dataset.orig = char.textContent;
                }

                // 2. Calcola la distanza dal centro (il centro avrà distanza 0)
                const distanceFromCenter = Math.abs(index - middleIndex);

                gsap.fromTo(char, {color: "#fff"},{
                    color: gsap.utils.random(brandColors),
                    ease: "power3.out",
                    duration: 0.3,
                    delay: distanceFromCenter * 0.03, 
                    repeat: 1,
                    yoyo: true,
                    overwrite: "auto",

                    onStart: () => {
                        const randomNum = gsap.utils.random(["0", "1"])
                        const randomNumThree = gsap.utils.random(["0", "1", "2"])
                        // Generazione di caratteri alternativi
                        if(randomNum == 1) {
                            char.textContent = gsap.utils.random([
                                // Lettere minuscole
                                "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", 
                                "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",

                                // Lettere maiuscole
                                "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
                                "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",

                                // Numeri
                                "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",

                                // Caratteri speciali
                                "<", ">", "%", "&", "@", "!", "#", "$", "^", "*", "(", ")", "-", 
                                "_", "+", "=", "{", "}", "[", "]", "|", "\\", ":", ";", "\"", 
                                "?", "/", "~", "`"
                                ]
                            );
                        }

                        // Generazione di dettagli ai caratteri
                        if(randomNumThree == 1) {
                            const detail = document.createElement("span")
                            detail.classList.add("detail-size")
                            detail.textContent = `△x = ${char.clientWidth}px`
                            char.appendChild(detail)
                        }

                        // Generazione di bordi
                        if(randomNumThree == 1) {
                            char.style.border = `1px solid ${gsap.utils.random(brandColors)}`
                        }
                    },

                    onComplete: () => {
                        char.textContent = char.dataset.orig;
                        char.style.border = "none"
                    }
                });
            });
        });
    });
});
}

// SplitText can rebuild headline nodes, so attach CTA handlers only after splitting.
document.querySelectorAll(".drawer-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => openDrawer(trigger));
    trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDrawer(trigger);
        }
    });
});
