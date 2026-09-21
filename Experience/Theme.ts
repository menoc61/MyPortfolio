import { EventEmitter } from "eventemitter3";

export default class Theme extends EventEmitter {
    theme: "light" | "dark";
    toggleButton: HTMLElement | null;
    toggleCircle: HTMLElement | null;

    constructor() {
        super();

        this.theme = "light";

        this.toggleButton = document.querySelector(".toggle-button");
        this.toggleCircle = document.querySelector(".toggle-circle");

        this.setEventListeners();
    }

    setEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener("click", () => {
                if (this.toggleCircle) {
                    this.toggleCircle.classList.toggle("slide");
                }
                this.theme = this.theme === "light" ? "dark" : "light";
                document.body.classList.toggle("dark-theme");
                document.body.classList.toggle("light-theme");

                // Update ARIA attributes
                const isDark = this.theme === "dark";
                this.toggleButton?.setAttribute("aria-pressed", isDark ? "true" : "false");
                this.toggleButton?.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);

                this.emit("switch", this.theme);
            });
        }
    }
}
