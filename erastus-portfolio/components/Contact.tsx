"use client";
import { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import styles from "./Contact.module.css";

export default function Contact() {
    const containerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [animKey, setAnimKey] = useState(0);
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const panelRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);


    useEffect(() => {
        // Initialize EmailJS with your public key
        emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!);
        
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setAnimKey((k) => k + 1);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);


useEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    if (!panel || !canvas) return;
    const ctx = canvas.getContext('2d')!;

    let raf: number;
    let t = 0;
    let isHovered = false;

    const resize = () => {
        const rect = panel.getBoundingClientRect();
        const W = rect.width || panel.offsetWidth;
        const H = rect.height || panel.offsetHeight;
        if (W > 0 && H > 0) { canvas.width = W; canvas.height = H; }
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(panel);

    const onEnter = () => { isHovered = true; };
    const onLeave = () => { isHovered = false; };
    panel.addEventListener('mouseenter', onEnter);
    panel.addEventListener('mouseleave', onLeave);

    // Ink cloud blobs — each drifts slowly and pulses
    const inks = [
        { x: 0.3,  y: 0.6,  r: 0.58, ax: 0.00011, ay: 0.00008,  px: 0,    py: 1.1,  color: '15,160,80'  },
        { x: 0.72, y: 0.28, r: 0.44, ax: -0.00009, ay: 0.00013, px: 2.1,  py: 0.4,  color: '8,120,55'   },
        { x: 0.18, y: 0.42, r: 0.36, ax: 0.00015,  ay: -0.00010, px: 4.3,  py: 2.8,  color: '20,200,90'  },
        { x: 0.55, y: 0.78, r: 0.30, ax: -0.00013, ay: 0.00007,  px: 1.5,  py: 3.9,  color: '5,90,40'    },
        { x: 0.82, y: 0.65, r: 0.38, ax: 0.00007,  ay: -0.00012, px: 3.3,  py: 0.9,  color: '30,220,100' },
        // Dark ink masses for the pronounced black
        { x: 0.45, y: 0.35, r: 0.52, ax: 0.00006,  ay: 0.00009,  px: 5.1,  py: 1.7,  color: '2,18,8'     },
        { x: 0.15, y: 0.82, r: 0.42, ax: -0.00010, ay: -0.00007, px: 2.7,  py: 4.2,  color: '1,12,5'     },
        { x: 0.88, y: 0.18, r: 0.40, ax: 0.00012,  ay: 0.00011,  px: 0.8,  py: 2.5,  color: '3,22,10'    },
    ];

    const draw = () => {
        if (canvas.width === 0 || canvas.height === 0) { resize(); raf = requestAnimationFrame(draw); return; }

        const W = canvas.width;
        const H = canvas.height;
        const spd = isHovered ? 0.9 : 0.28;
        t += spd;

        // Deep black base
        ctx.fillStyle = '#060a06';
        ctx.fillRect(0, 0, W, H);

        const dim = Math.max(W, H);

        inks.forEach((ink) => {
            // Drift
            ink.x += ink.ax * spd;
            ink.y += ink.ay * spd;
            if (ink.x < -0.1) ink.ax = Math.abs(ink.ax);
            if (ink.x >  1.1) ink.ax = -Math.abs(ink.ax);
            if (ink.y < -0.1) ink.ay = Math.abs(ink.ay);
            if (ink.y >  1.1) ink.ay = -Math.abs(ink.ay);

            // Organic breathing — different freq per blob
            const breathe = 1 + Math.sin(t * 0.018 + ink.px) * 0.18
                              + Math.sin(t * 0.011 + ink.py) * 0.10;

            // Gentle positional wobble
            const ox = Math.sin(t * 0.013 + ink.py) * 0.055 * W;
            const oy = Math.cos(t * 0.009 + ink.px) * 0.055 * H;

            const cx = ink.x * W + ox;
            const cy = ink.y * H + oy;
            const radius = ink.r * dim * breathe;

            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

            // Ink diffusion: opaque core bleeding into transparent edges
            grd.addColorStop(0,    `rgba(${ink.color}, 0.82)`);
            grd.addColorStop(0.18, `rgba(${ink.color}, 0.64)`);
            grd.addColorStop(0.42, `rgba(${ink.color}, 0.32)`);
            grd.addColorStop(0.70, `rgba(${ink.color}, 0.10)`);
            grd.addColorStop(1,    `rgba(${ink.color}, 0)`);

            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
        });

        // ── Dark ink tendrils overlay — gives the "black ink cloud" feel ──
        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < 3; i++) {
            const fx = (0.25 + i * 0.28) * W + Math.sin(t * 0.007 + i * 2.1) * 0.12 * W;
            const fy = (0.4  + i * 0.15) * H + Math.cos(t * 0.005 + i * 1.7) * 0.12 * H;
            const fr = (0.38 + i * 0.06) * dim;
            const dark = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
            dark.addColorStop(0,    'rgba(0,0,0,0.72)');
            dark.addColorStop(0.35, 'rgba(0,0,0,0.45)');
            dark.addColorStop(0.7,  'rgba(0,0,0,0.15)');
            dark.addColorStop(1,    'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(fx, fy, fr, 0, Math.PI * 2);
            ctx.fillStyle = dark;
            ctx.fill();
        }

        // ── Edge vignette — pulls focus to the ink center ──
        ctx.globalCompositeOperation = 'source-over';
        const vign = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.05, W * 0.5, H * 0.5, H * 0.95);
        vign.addColorStop(0,   'rgba(0,0,0,0)');
        vign.addColorStop(0.6, 'rgba(0,0,0,0.25)');
        vign.addColorStop(1,   'rgba(0,0,0,0.82)');
        ctx.fillStyle = vign;
        ctx.fillRect(0, 0, W, H);

        raf = requestAnimationFrame(draw);
    };

    requestAnimationFrame(() => requestAnimationFrame(() => { resize(); draw(); }));

    return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        panel.removeEventListener('mouseenter', onEnter);
        panel.removeEventListener('mouseleave', onLeave);
    };
}, [animKey]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus('sending');

        try {
            const result = await emailjs.sendForm(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
                process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
                formRef.current!,
                process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
            );

            console.log('Email sent successfully:', result.text);
            setStatus('success');
            formRef.current?.reset();
            
            // Reset success message after 5 seconds
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Failed to send email:', error);
            setStatus('error');
        }
    };

    return (
        <div ref={containerRef} className={styles.Container}>
            <div
                key={`card-${animKey}`}
                className={`${styles.Card} ${styles.animate}`}
            >
                {/* Left column: form */}
                <div className={styles.FormCol}>
                    <h2
                        key={`heading-${animKey}`}
                        className={`${styles.Heading} ${styles.animate}`}
                    >
                        Let&rsquo;s Create Something Great
                    </h2>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        <div
                            key={`fields-${animKey}`}
                            className={`${styles.Fields} ${styles.animate}`}
                        >
                            <div className={styles.Field}>
                                <label className={styles.Label} htmlFor="from_name">
                                    Name
                                </label>
                                <input
                                    id="from_name"
                                    name="from_name"
                                    type="text"
                                    placeholder="e.g John Smith"
                                    className={styles.Input}
                                    required
                                    disabled={status === 'sending'}
                                />
                            </div>

                            <div className={styles.Field}>
                                <label className={styles.Label} htmlFor="from_email">
                                    Email address
                                </label>
                                <input
                                    id="from_email"
                                    name="from_email"
                                    type="email"
                                    placeholder="e.g smilly@gmail.com"
                                    className={styles.Input}
                                    required
                                    disabled={status === 'sending'}
                                />
                            </div>

                            <div className={styles.Field}>
                                <label className={styles.Label} htmlFor="message">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    placeholder="Let us know how we can help"
                                    className={styles.Textarea}
                                    required
                                    disabled={status === 'sending'}
                                />
                            </div>

                            {status === 'success' && (
                                <div className={styles.SuccessMessage}>
                                    ✓ Message sent successfully! I'll get back to you soon.
                                </div>
                            )}
                            
                            {status === 'error' && (
                                <div className={styles.ErrorMessage}>
                                    ✗ Failed to send message. Please try again.
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className={styles.SendBtn}
                                disabled={status === 'sending'}
                            >
                                {status === 'sending' ? 'Sending...' : 'Send message'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right column: decorative panel */}
              <div ref={panelRef} className={styles.Panel}>
    <div className={styles.PanelBase} />
    <canvas ref={canvasRef} className={styles.PanelCanvas} />
    <div className={styles.PanelFrost} />

    {/* NEW CONTENT */}
    <div className={styles.PanelContent}>
        <span className={styles.Badge}>🟢 Open to freelance</span>

        <div className={styles.PanelButtons}>
            <a href="/cv.pdf" download className={styles.PanelBtn}>
                Download CV
            </a>
          <a href="https://github.com/Erasy0" target="_blank" className={styles.PanelBtn}>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', marginBottom: '2px' }}
    >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
    GitHub
</a>
        </div>
    </div>
</div>
            </div>
        </div>
    );
}