"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import styles from "./Work.module.css";
import Image from "next/image";
import { projects, type Project } from "@/lib/projects";

interface WorkProps {
  blurMap: Record<number, string>;
}

const Card = React.memo(React.forwardRef<HTMLDivElement, {
  project: Project;
  cardState: "entering" | "visible" | "hidden" | undefined;
  exitDir: "left" | "right" | undefined;
  blurMap: Record<number, string>;
  onClick: () => void;
}>(function Card({ project, cardState, exitDir, blurMap, onClick }, ref) {
  let cls = `${styles.card} `;
  if (cardState === "entering") cls += styles.cardEntering;
  else if (cardState === "visible") cls += styles.cardVisible;
  else if (cardState === "hidden") cls += exitDir === "left" ? styles.cardHiddenLeft : styles.cardHiddenRight;
  else cls += styles.cardHiddenRight;

  return (
    <div ref={ref} data-id={project.id} className={cls} onClick={onClick}>
      <Image src={project.src} alt={project.title} fill sizes="320px"
        className={styles.cardImg} quality={80}
        placeholder="blur" blurDataURL={blurMap[project.id]} />
      <div className={styles.cardOverlay}>
        <span className={styles.cardCategory}>{project.category}</span>
        <span className={styles.cardTitle}>{project.title}</span>
        <span className={styles.cardCta}>View →</span>
      </div>
    </div>
  );
}));
export default function Work({ blurMap }: WorkProps) {
  const [selected, setSelected] = useState<Project | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sectionVisible, setSectionVisible] = useState(false);
  const [headingAnimKey, setHeadingAnimKey] = useState(0);
  const [cardStates, setCardStates] = useState<
    Map<number, "entering" | "visible" | "exiting" | "hidden">
  >(new Map());
  const [mounted, setMounted] = useState(false);

  // ── Refs replacing state (no re-renders on scroll) ──────
  const isDraggingRef = useRef(false);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const leftArrowRef = useRef<HTMLButtonElement>(null);
  const rightArrowRef = useRef<HTMLButtonElement>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const hasDragged = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const exitDirections = useRef<Map<number, "left" | "right">>(new Map());

  useEffect(() => setMounted(true), []);

  // ── Derive categories ───────────────────────────────────
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = ["All"];
    projects.forEach((p) => {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        cats.push(p.category);
      }
    });
    return cats;
  }, []);

  const featured = projects.find((p) => p.featured)!;

  const filteredRest = useMemo(() => {
    const rest = projects.filter((p) => !p.featured);
    if (activeCategory === "All") return rest;
    return rest.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [activeCategory]);

  // ── Section reveal ──────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          setHeadingAnimKey((k) => k + 1);
        } else {
          setSectionVisible(false);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Card scroll-reveal ──────────────────────────────────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Batch all card state updates into ONE setState call
        const updates: Array<[number, "entering" | "visible" | "hidden"]> = [];

        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const id = Number(el.dataset.id);

          if (entry.isIntersecting) {
            updates.push([id, "entering"]);
            exitDirections.current.delete(id);

            requestAnimationFrame(() => requestAnimationFrame (() =>{
              setCardStates((prev) => {
                const next = new Map(prev);
                if (next.get(id) === "entering") next.set(id, "visible");
                return next;
              });
            }));
          } else {
            const trackRect = track.getBoundingClientRect();
            const cardRect = el.getBoundingClientRect();
            exitDirections.current.set(
              id,
              cardRect.left > trackRect.right - 10 ? "right" : "left"
            );
            updates.push([id, "hidden"]);
          }
        });

        if (updates.length > 0) {
          // Single setState for all entries in this batch
          setCardStates((prev) => {
            const next = new Map(prev);
            updates.forEach(([id, state]) => next.set(id, state));
            return next;
          });
        }
      },
      { root: track, rootMargin: "0px 200px 0px 200px", threshold: 0.15 }
    );

    cardRefs.current.forEach((el) => observer.observe(el));
    const raf = requestAnimationFrame(() => {
      cardRefs.current.forEach((el) => {
        observer.unobserve(el);
        observer.observe(el);
      });
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [filteredRest]);



  // ── Scroll state — direct DOM, zero re-renders ──────────
  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const progress = max > 0 ? el.scrollLeft / max : 0;
    const canLeft = el.scrollLeft > 4;
    const canRight = el.scrollLeft < max - 4;

    // Direct DOM mutation — no setState
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${progress * 100}%`;
    }
    if (leftArrowRef.current) {
      leftArrowRef.current.classList.toggle(styles.arrowDisabled, !canLeft);
    }
    if (rightArrowRef.current) {
      rightArrowRef.current.classList.toggle(styles.arrowDisabled, !canRight);
    }
  }, []);

useEffect(() => {
  const el = trackRef.current;
  if (!el) return;

  let scrollTimer: ReturnType<typeof setTimeout>;

  const stopWheel = (e: WheelEvent) => {
    e.stopPropagation();
    // Suppress hover immediately on any wheel/touchpad scroll
    el.classList.add(styles.isScrolling);
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      el.classList.remove(styles.isScrolling);
    }, 150); // remove ~150ms after scroll stops
  };

  const pause = () => (window as any).__lenis?.stop();
  const resume = () => (window as any).__lenis?.start();

  el.addEventListener("wheel", stopWheel, { passive: false });
  el.addEventListener("mouseenter", pause);
  el.addEventListener("mouseleave", resume);
  return () => {
    el.removeEventListener("wheel", stopWheel);
    el.removeEventListener("mouseenter", pause);
    el.removeEventListener("mouseleave", resume);
    clearTimeout(scrollTimer);
  };
}, []);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

// ── Drag ────────────────────────────────────────────────
const onMouseDown = (e: React.MouseEvent) => {
  const el = trackRef.current;
  if (!el) return;
  isDraggingRef.current = true;
  hasDragged.current = false;
  dragStart.current = { x: e.pageX, scrollLeft: el.scrollLeft };
};

useEffect(() => {
  const onMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const dx = e.pageX - dragStart.current.x;
    if (Math.abs(dx) > 4) {
      hasDragged.current = true;
      trackRef.current.style.cursor = "grabbing";
      trackRef.current.classList.add(styles.isDragging);
    }
    trackRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const onMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (trackRef.current) {
      trackRef.current.style.cursor = "";
      trackRef.current.classList.remove(styles.isDragging);
    }
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}, []);// ← empty deps — no re-registration on every isDragging change

  const nudge = (dir: "left" | "right") => {
    trackRef.current?.scrollBy({
      left: dir === "right" ? 320 : -320,
      behavior: "smooth",
    });
  };

  // ── Touch drag ──────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    hasDragged.current = false;
    dragStart.current = {
      x: e.touches[0].pageX,
      scrollLeft: trackRef.current?.scrollLeft ?? 0,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].pageX - dragStart.current.x;
    if (Math.abs(dx) > 4) hasDragged.current = true;
  };

  // ── Modal ───────────────────────────────────────────────
  const openModal = (project: Project) => {
    if (hasDragged.current) return;
    setSelected(project);
    document.body.style.overflow = "hidden";
    document.getElementById("page-content")?.classList.add(styles.pageBlurred);
  };

  const closeModal = () => {
    setSelected(null);
    document.body.style.overflow = "";
    document.getElementById("page-content")?.classList.remove(styles.pageBlurred);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Card class helper ───────────────────────────────────
  const getCardClass = (id: number) => {
    const state = cardStates.get(id);
    const exitDir = exitDirections.current.get(id);
    if (state === "entering") return `${styles.card} ${styles.cardEntering}`;
    if (state === "visible") return `${styles.card} ${styles.cardVisible}`;
    if (state === "hidden") {
      return exitDir === "left"
        ? `${styles.card} ${styles.cardHiddenLeft}`
        : `${styles.card} ${styles.cardHiddenRight}`;
    }
    return `${styles.card} ${styles.cardHiddenRight}`;
  };

  const displayCount =
    activeCategory === "All"
      ? projects.length
      : projects.filter((p) => p.category === activeCategory).length;

  // ── Modal JSX ───────────────────────────────────────────
  const modalJsx = selected ? (
    <div className={styles.modalBackdrop} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={closeModal}>✕</button>
        <div className={styles.modalImgWrap}>
          <Image
            src={selected.src}
            alt={selected.title}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 900vw, 860px"
            className={styles.modalImg}
            quality={90}
            placeholder="blur"
            blurDataURL={blurMap[selected.id]}
          />
        </div>
        <div className={styles.modalInfo}>
          <span className={styles.modalCategory}>{selected.category}</span>
          <h2 className={styles.modalTitle}>{selected.title}</h2>
          {selected.description && (
            <p className={styles.modalDesc}>{selected.description}</p>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <section
        ref={sectionRef}
        className={`${styles.workSection} ${sectionVisible ? styles.sectionVisible : ""}`}
      >
        <div
          key={`heading-${headingAnimKey}`}
          className={`${styles.headingRow} ${headingAnimKey > 0 ? styles.animate : ""}`}
        >
          <p className={styles.Title}>Projects</p>
          <div className={styles.headingLine} />
          <span className={styles.projectCount}>{displayCount} works</span>
        </div>

        <div
          key={`filterbar-${headingAnimKey}`}
          className={`${styles.filterBar} ${headingAnimKey > 0 ? styles.filterAnimate : ""}`}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterPill} ${activeCategory === cat ? styles.filterPillActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          {(activeCategory === "All" || activeCategory === featured.category) && (
            <div className={styles.featuredCard} onClick={() => openModal(featured)}>
              <Image
                src={featured.src}
                alt={featured.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.cardImg}
                priority
                quality={85}
                placeholder="blur"
                blurDataURL={blurMap[featured.id]}
              />
              <div className={styles.cardOverlay}>
                <span className={styles.cardCategory}>{featured.category}</span>
                <span className={styles.cardTitle}>{featured.title}</span>
                <span className={styles.cardCta}>View →</span>
              </div>
              <div className={styles.featuredBadge}>Featured</div>
            </div>
          )}

          <div className={styles.scrollColumn}>
            <div className={styles.arrowRow}>
              <button
                ref={leftArrowRef}
                className={`${styles.arrowBtn} ${styles.arrowDisabled}`}
                onClick={() => nudge("left")}
              >←</button>
              <button
                ref={rightArrowRef}
                className={styles.arrowBtn}
                onClick={() => nudge("right")}
              >→</button>
            </div>

            <div
              ref={trackRef}
              className={styles.track}
              data-lenis-prevent 
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onTouchMove={(e) => {
  e.stopPropagation();
  const dx = e.touches[0].pageX - dragStart.current.x;
  if (Math.abs(dx) > 4) hasDragged.current = true;
}}
            >
              {filteredRest.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>✦</span>
                  <span>No works in this category</span>
                </div>
              ) : (
                <>
  {filteredRest.map((project) => (
  <div key={project.id} className={styles.cardGlowWrap}>
    <Card
      ref={(el) => {
        if (el) cardRefs.current.set(project.id, el);
        else cardRefs.current.delete(project.id);
      }}
      project={project}
      cardState={cardStates.get(project.id)}
      exitDir={exitDirections.current.get(project.id)}
      blurMap={blurMap}
      onClick={() => openModal(project)}
    />
  </div>
))}
                  <div className={styles.endHint}>
                    <span>That&apos;s all ✦</span>
                  </div>
                </>
              )}
            </div>

            {/* Progress bar — controlled via ref */}
            <div className={styles.progressTrack}>
              <div ref={progressFillRef} className={styles.progressFill} style={{ width: "0%" }} />
            </div>
            <p className={styles.dragHint}>drag or scroll →</p>
          </div>
        </div>
      </section>

      {mounted && createPortal(modalJsx, document.body)}
    </>
  );
}