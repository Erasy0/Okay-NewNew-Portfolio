"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./About.module.css";

type VisState = "hidden" | "visible" | "hiding";

export default function About() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visState, setVisState] = useState<VisState>("hidden");
    const [animKey, setAnimKey] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Reset to hidden first so animation replays
                    setVisState("hidden");
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setVisState("visible");
                            setAnimKey((k) => k + 1);
                        });
                    });
                } else {
                    // Smooth fade-out transition
                    setVisState("hiding");
                }
            },
            { threshold: 0.05 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const anim =
        visState === "visible"
            ? styles.animate
            : visState === "hiding"
            ? styles.hiding
            : styles.hidden;

    return (
        <div ref={containerRef} className={styles.Container}>
            <div className="containat-about">
                <p key={`title-${animKey}`} className={`${styles.Title} ${anim}`}>
                    About Me
                </p>
                <div key={`glow-${animKey}`} className={`${styles.glow} ${anim}`} />
            </div>

            <div className="qoute-txt">
                <p key={`quote-${animKey}`} className={`${styles.Quote} ${anim}`}>
                    Great Design Is Not Just Seen — It Is Felt
                </p>
            </div>

            <p key={`desc-${animKey}`} className={`${styles.Description} ${anim}`}>
                Hi, I&apos;m Erastus Shindinge, a graphic designer and software developer based in Windhoek, Namibia.<br />
                I specialize in creating visually striking designs and digital experiences that help brands communicate their message effectively.
            </p>

            <div key={`divider-${animKey}`} className={`${styles.divider} ${anim}`} />

            <div key={`stats-${animKey}`} className={`${styles.stats} ${anim}`}>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>3+</span>
                    <span className={styles.statLabel}>Years Experience</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>40+</span>
                    <span className={styles.statLabel}>Projects Completed</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>6+</span>
                    <span className={styles.statLabel}>Clients Served</span>
                </div>
            </div>

            <div key={`disciplines-${animKey}`} className={`${styles.disciplineRow} ${anim}`}>
                {[
                    "Brand Identity", "UI / UX", "Motion",
                    "Web Development", "Typography", "Art Direction",
                ].map((tag) => (
                    <span key={tag} className={styles.disciplineTag}>{tag}</span>
                ))}
            </div>
        </div>
    );
}