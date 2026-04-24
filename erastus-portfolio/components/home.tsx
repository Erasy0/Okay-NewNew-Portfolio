"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Home.module.css";

export default function HomeComp() {
    const containerRef = useRef<HTMLDivElement>(null);
    // Home section fires once only — no point replaying on re-entry
    // since it's the very first thing visible on load.
    // But we still use the observer so that if the user navigates away
    // (e.g. anchor link) and scrolls back, it replays.
    const [animKey, setAnimKey] = useState(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Always replay when scrolled back in
                    setAnimKey((k) => k + 1);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className={styles.Container}>
            <p key={`title-${animKey}`} className={`${styles.Title} ${styles.animate}`}>
                Designing With Intention.
            </p>
            <p key={`title2-${animKey}`} className={`${styles.Title2} ${styles.animate}`}>
                Building with Precision.
            </p>
            <div className={styles.yearContainer}>
                <p key={`year-${animKey}`} className={`${styles.year} ${styles.animate}`}>
                    2026
                </p>
            </div>
            <div className={styles.subtext}>
                <p key={`text-${animKey}`} className={`${styles.text} ${styles.animate}`}>
                    PORTFOLIO
                </p>
                <div key={`glow1-${animKey}`} className={`${styles.glow1} ${styles.animate}`} />
            </div>

            {/* Scroll Down Indicator */}
            <div key={`scroll-${animKey}`} className={`${styles.scrollIndicator} ${styles.animate}`}>
                <span className={styles.scrollLabel}>SCROLL</span>
                <svg
                    className={styles.scrollArrow}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
            </div>
        </div>
    );
}