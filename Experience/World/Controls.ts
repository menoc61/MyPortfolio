import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Experience from "../Experience.js";
import ASScroll from "@ashthornton/asscroll";

gsap.registerPlugin(ScrollTrigger);

export default class Controls {
    experience: Experience;
    scene: THREE.Scene;
    sizes: any;
    resources: any;
    time: any;
    camera: any;
    room: any;
    rectLight: any;
    circleFirst: any;
    circleSecond: any;
    circleThird: any;
    asscroll: any;

    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.sizes = this.experience.sizes;
        this.resources = this.experience.resources;
        this.time = this.experience.time;
        this.camera = this.experience.camera;
        this.room = this.experience.world.room.actualRoom;
        this.rectLight = this.experience.world.room.rectLight;

        this.circleFirst = this.experience.world.floor.circleFirst;
        this.circleSecond = this.experience.world.floor.circleSecond;
        this.circleThird = this.experience.world.floor.circleThird;

        ScrollTrigger.matchMedia({
            // Desktop
            "(min-width: 969px)": () => {
                // Reset
                this.room.scale.set(0.11, 0.11, 0.11);
                this.rectLight.width = 0.5;
                this.rectLight.height = 0.7;
                this.camera.orthographicCamera.position.set(0, 5.65, 10);

                // First section -----------------------------------------
                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".first-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                    },
                }).to(this.room.position, {
                    x: () => this.sizes.width * 0.0014,
                });

                // Second section -----------------------------------------
                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".second-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                    },
                })
                    .to(
                        this.room.position,
                        {
                            x: () => 1,
                            z: () => 3.2,
                        },
                        "same"
                    )
                    .to(
                        this.room.scale,
                        {
                            x: 0.4,
                            y: 0.4,
                            z: 0.4,
                        },
                        "same"
                    )
                    .to(
                        this.rectLight,
                        {
                            width: 0.5 * 4,
                            height: 0.7 * 4,
                        },
                        "same"
                    );

                // Third section -----------------------------------------
                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".third-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                    },
                }).to(this.camera.orthographicCamera.position, {
                    x: -2.4,
                    y: 6.5,
                });
            },

            // Mobile
            "(max-width: 968px)": () => {
                // Reset
                this.room.scale.set(0.07, 0.07, 0.07);
                this.room.position.set(0, 0, 0);
                this.rectLight.width = 0.3;
                this.rectLight.height = 0.4;
                this.camera.orthographicCamera.position.set(0, 6.5, 10);

                // First section -----------------------------------------
                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".first-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                    },
                }).to(this.room.scale, {
                    x: 0.1,
                    y: 0.1,
                    z: 0.1,
                });

                // Second section -----------------------------------------
                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".second-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                    },
                })
                    .to(
                        this.room.scale,
                        {
                            x: 0.25,
                            y: 0.25,
                            z: 0.25,
                        },
                        "same"
                    )
                    .to(
                        this.rectLight,
                        {
                            width: 0.3 * 3.4,
                            height: 0.4 * 3.4,
                        },
                        "same"
                    )
                    .to(
                        this.room.position,
                        {
                            x: 1.5,
                        },
                        "same"
                    );

                // Third section -----------------------------------------
                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".third-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                        invalidateOnRefresh: true,
                    },
                }).to(this.room.position, {
                    z: -4.5,
                });
            },

            // All
            all: () => {
                const sections = document.querySelectorAll(".section");
                sections.forEach((section) => {
                    const progressWrapper = section.querySelector(".progress-wrapper");
                    const progressBar = section.querySelector(".progress-bar");

                    if (section.classList.contains("right")) {
                        gsap.to(section, {
                            borderTopLeftRadius: 10,
                            scrollTrigger: {
                                trigger: section,
                                start: "top bottom",
                                end: "top top",
                                scrub: 0.6,
                            },
                        });
                        gsap.to(section, {
                            borderBottomLeftRadius: 700,
                            scrollTrigger: {
                                trigger: section,
                                start: "bottom bottom",
                                end: "bottom top",
                                scrub: 0.6,
                            },
                        });
                    } else {
                        gsap.to(section, {
                            borderTopRightRadius: 10,
                            scrollTrigger: {
                                trigger: section,
                                start: "top bottom",
                                end: "top top",
                                scrub: 0.6,
                            },
                        });
                        gsap.to(section, {
                            borderBottomRightRadius: 700,
                            scrollTrigger: {
                                trigger: section,
                                start: "bottom bottom",
                                end: "bottom top",
                                scrub: 0.6,
                            },
                        });
                    }
                    if (progressBar) {
                        gsap.from(progressBar, {
                            scaleY: 0,
                            scrollTrigger: {
                                trigger: section,
                                start: "top top",
                                end: "bottom bottom",
                                scrub: 0.4,
                                pin: progressWrapper,
                                pinSpacing: false,
                            },
                        });
                    }
                });

                // Circles
                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".first-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                    },
                }).to(this.circleFirst.scale, { x: 3, y: 3, z: 3 });

                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".second-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                    },
                })
                    .to(this.circleSecond.scale, { x: 3, y: 3, z: 3 }, "same")
                    .to(this.room.position, { y: 0.7 }, "same");

                gsap.timeline({
                    scrollTrigger: {
                        trigger: ".third-move",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.6,
                    },
                }).to(this.circleThird.scale, { x: 3, y: 3, z: 3 });

                // Mini Platform Animations
                const secondPartTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".third-move",
                        start: "center center",
                    },
                });

                let first, second, third, fourth, fifth, sixth, seventh, eighth, ninth;

                this.room.children.forEach((child: THREE.Object3D) => {
                    if (child.name === "Mini_Floor") {
                        first = gsap.to(child.position, {
                            x: -5.44055,
                            z: 13.6135,
                            duration: 0.3,
                        });
                    }
                    if (child.name === "Mailbox") {
                        second = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, duration: 0.3,
                        });
                    }
                    if (child.name === "Lamp") {
                        third = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, ease: "back.out(2)", duration: 0.3,
                        });
                    }
                    if (child.name === "FloorFirst") {
                        fourth = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, ease: "back.out(2)", duration: 0.3,
                        });
                    }
                    if (child.name === "FloorSecond") {
                        fifth = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, duration: 0.3,
                        });
                    }
                    if (child.name === "FloorThird") {
                        sixth = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, ease: "back.out(2)", duration: 0.3,
                        });
                    }
                    if (child.name === "Dirt") {
                        seventh = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, ease: "back.out(2)", duration: 0.3,
                        });
                    }
                    if (child.name === "Flower1") {
                        eighth = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, ease: "back.out(2)", duration: 0.3,
                        });
                    }
                    if (child.name === "Flower2") {
                        ninth = gsap.to(child.scale, {
                            x: 1, y: 1, z: 1, ease: "back.out(2)", duration: 0.3,
                        });
                    }
                });

                if (first) secondPartTimeline.add(first);
                if (second) secondPartTimeline.add(second);
                if (third) secondPartTimeline.add(third);
                if (fourth) secondPartTimeline.add(fourth, "-=0.2");
                if (fifth) secondPartTimeline.add(fifth, "-=0.2");
                if (sixth) secondPartTimeline.add(sixth, "-=0.2");
                if (seventh) secondPartTimeline.add(seventh, "-=0.2");
                if (eighth) secondPartTimeline.add(eighth);
                if (ninth) secondPartTimeline.add(ninth, "-=0.1");
            },
        });
    }

    setupASScroll() {
        const asscroll = new ASScroll({
            ease: 0.1,
            disableRaf: true,
        });

        gsap.ticker.add(asscroll.update);

        ScrollTrigger.defaults({
            scroller: asscroll.containerElement,
        });

        ScrollTrigger.scrollerProxy(asscroll.containerElement, {
            scrollTop(value) {
                if (arguments.length) {
                    asscroll.currentPos = value;
                    return;
                }
                return asscroll.currentPos;
            },
            getBoundingClientRect() {
                return {
                    top: 0,
                    left: 0,
                    width: window.innerWidth,
                    height: window.innerHeight,
                };
            },
            fixedMarkers: true,
        });

        asscroll.on("update", ScrollTrigger.update);
        asscroll.enable({
            newScrollElements: document.querySelectorAll(
                ".gsap-marker-start, .gsap-marker-end, [asscroll]"
            ),
        });

        return asscroll;
    }

    resize() {}

    update() {}
}
