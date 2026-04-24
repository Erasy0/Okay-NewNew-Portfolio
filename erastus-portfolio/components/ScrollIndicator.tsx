"use client";

import { useEffect, useState } from "react";

export default function ScrollIndicator() {
  const [isLastSection, setIsLastSection] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const lastSection = sections[sections.length - 1];

    const observer = new IntersectionObserver(
      ([entry]) => setIsLastSection(entry.isIntersecting),
      { threshold: 0.5 }
    );

    if (lastSection) observer.observe(lastSection);
    return () => observer.disconnect();
  }, []);

  // Watch for modal open/close via body overflow
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setModalOpen(document.body.style.overflow === "hidden");
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, []);

  const hidden = isLastSection || modalOpen;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        zIndex: 12,
        opacity: hidden ? 0 : 1,
        transition: "opacity 0.6s ease",
        pointerEvents: "none",
      }}
    >
      <svg
        width="20"
        height="30"
        viewBox="0 0 20 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "scrollBounce 2s ease-in-out infinite" }}
      >
        <rect x="1" y="1" width="18" height="26" rx="9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <rect
          x="9" y="5" width="2" height="6" rx="1"
          fill="rgba(255,255,255,0.8)"
          style={{ animation: "scrollWheel 2s ease-in-out infinite" }}
        />
      </svg>
      <span
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.25em",
          color: "rgba(255,255,255,0.8)",
          fontFamily: "monospace",
          textTransform: "uppercase",
        }}
      >
        scroll
      </span>
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
        }
        @keyframes scrollWheel {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50%       { opacity: 0.3; transform: translateY(3px); }
        }
      `}</style>
    </div>
  );
}