'use client'

import { useEffect, useRef, useState } from 'react'

export default function ScrollProgressBar() {
  const lenisRef = useRef<any>(null)
  const rafRef = useRef<number>(0)
  const smoothProgressRef = useRef(0)
  const displayProgressRef = useRef(0)
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    async function initLenis() {
      const Lenis = (await import('@studio-freight/lenis')).default

      const lenis = new Lenis({
        duration: 2.4,
        easing: (t: number) => 1 - Math.pow(1 - t, 5),
        smoothWheel: true,
        wheelMultiplier: 0.75,
        touchMultiplier: 1.0,
        orientation: "vertical",      // ← add this
        gestureOrientation: "vertical"
       
      })

      lenisRef.current = lenis
      ;(window as any).__lenis = lenis

      lenis.on('scroll', ({ progress }: { progress: number }) => {
        smoothProgressRef.current = progress
      })

      function lerpLoop() {
        const current = displayProgressRef.current
        const target = smoothProgressRef.current
        const lerped = current + (target - current) * 0.06

        displayProgressRef.current = lerped
        setDisplayProgress(lerped)

        rafRef.current = requestAnimationFrame(lerpLoop)
      }

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)
      rafRef.current = requestAnimationFrame(lerpLoop)

      function handleAnchorClick(e: MouseEvent) {
        const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
        if (!anchor) return

        e.preventDefault()
        const id = anchor.getAttribute('href')?.slice(1)
        if (!id) return

        const section = document.getElementById(id)
        if (section) {
          lenis.scrollTo(section, {
            offset: -80,
            duration: 2.4,
            easing: (t: number) => 1 - Math.pow(1 - t, 5),
          })
        }
      }

      document.addEventListener('click', handleAnchorClick)

      return () => {
        cancelAnimationFrame(rafRef.current)
        document.removeEventListener('click', handleAnchorClick)
        lenis.destroy()
      }
    }

    const cleanup = initLenis()
    return () => {
      cleanup.then((fn) => fn?.())
    }
  }, [])

  const pct = displayProgress * 100

  return (
    <>
      {/* Progress bar — no visible track, just the fill */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '2px',
          height: '100vh',
          backgroundColor: 'transparent', // ← track is now hidden
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${pct}%`,
            backgroundColor: 'white',
            boxShadow: '0 0 5px rgba(255,255,255,0.5), 0 0 1px white',
            borderRadius: '0 0 1px 1px',
          }}
        />
      </div>

      {/* Percentage label — bigger, brighter, fades in after scroll starts */}
      <div
        style={{
          position: 'fixed',
          right: '12px',
          top: `clamp(14px, ${pct}vh, calc(100vh - 22px))`,
          transform: 'translateY(-50%)',
          fontSize: '11px',
          fontWeight: '500',
          fontFamily: '"Courier New", monospace',
          letterSpacing: '0.08em',
          color: `rgba(255,255,255,${pct > 2 ? 0.75 : 0})`, // ← more visible
          zIndex: 9999,
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'color 0.4s ease',
        }}
      >
        {Math.round(pct)}
      </div>
    </>
  )
}