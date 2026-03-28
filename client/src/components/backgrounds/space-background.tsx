import { useEffect, useRef } from "react";

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W = window.innerWidth, H = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;

    /* ── helpers ── */
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    };

    /* cartoon 4-point star */
    const drawStar4 = (x: number, y: number, r: number, color: string, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const len = i % 2 === 0 ? r : r * 0.35;
        i === 0 ? ctx.moveTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
                : ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    /* cartoon planet */
    const drawPlanet = (x: number, y: number, r: number, color: string, stripes: string[], hasRing: boolean, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      // body
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      // stripes
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
      for (let i = 0; i < stripes.length; i++) {
        const sy = -r + (i / stripes.length) * r * 2;
        const sh = r * 2 / stripes.length;
        ctx.fillStyle = stripes[i];
        ctx.fillRect(-r, sy, r * 2, sh);
      }
      ctx.restore();
      // outline
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 2.5; ctx.stroke();
      // ring
      if (hasRing) {
        ctx.save(); ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.85, r * 0.38, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(200,160,80,0.7)"; ctx.lineWidth = 6; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };

    /* cartoon rocket */
    const drawRocket = (x: number, y: number, scale: number, tiltRad: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tiltRad);
      ctx.scale(scale, scale);
      // body
      ctx.fillStyle = "#f0f4ff";
      roundRect(-9, -24, 18, 36, 8); ctx.fill();
      ctx.strokeStyle = "#b0bcd4"; ctx.lineWidth = 2; ctx.stroke();
      // nose
      ctx.beginPath();
      ctx.moveTo(-9, -24); ctx.quadraticCurveTo(0, -46, 9, -24);
      ctx.fillStyle = "#ff6b9d"; ctx.fill();
      ctx.strokeStyle = "#d0407a"; ctx.lineWidth = 2; ctx.stroke();
      // window
      ctx.beginPath(); ctx.arc(0, -8, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#7dd3fc"; ctx.fill();
      ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 1.5; ctx.stroke();
      // fins
      ctx.fillStyle = "#818cf8";
      ctx.beginPath(); ctx.moveTo(-9, 12); ctx.lineTo(-18, 24); ctx.lineTo(-9, 22); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(9, 12); ctx.lineTo(18, 24); ctx.lineTo(9, 22); ctx.closePath(); ctx.fill();
      // flame
      const flameLen = 14 + Math.sin(Date.now() * 0.025) * 5;
      ctx.beginPath();
      ctx.moveTo(-5, 12); ctx.quadraticCurveTo(0, 12 + flameLen * 0.6, 5, 12);
      ctx.quadraticCurveTo(2, 12 + flameLen, 0, 12 + flameLen * 1.1);
      ctx.quadraticCurveTo(-2, 12 + flameLen, -5, 12);
      ctx.fillStyle = "#fbbf24"; ctx.fill();
      ctx.restore();
    };

    /* cartoon moon crescent */
    const drawMoon = (x: number, y: number, r: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a"; ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.05, r * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = "#6d28d9"; ctx.fill(); // cut out using background color
      ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      // face dots
      ctx.fillStyle = "#d97706";
      ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.1, r * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.18, r * 0.045, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    /* cartoon UFO */
    const drawUFO = (x: number, y: number, bob: number) => {
      ctx.save();
      ctx.translate(x, y + bob);
      // beam
      ctx.beginPath();
      ctx.moveTo(-14, 8); ctx.lineTo(-26, 38); ctx.lineTo(26, 38); ctx.lineTo(14, 8);
      ctx.fillStyle = "rgba(124,231,255,0.18)"; ctx.fill();
      // saucer body
      ctx.beginPath(); ctx.ellipse(0, 8, 30, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#94a3b8"; ctx.fill();
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 2; ctx.stroke();
      // dome
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, Math.PI, Math.PI * 2);
      ctx.fillStyle = "#7dd3fc"; ctx.fill();
      ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 1.5; ctx.stroke();
      // lights
      const lightColors = ["#f87171","#fbbf24","#34d399","#f87171"];
      for (let i = 0; i < 4; i++) {
        const lx = -20 + i * 14;
        ctx.beginPath(); ctx.arc(lx, 10, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = lightColors[i]; ctx.fill();
      }
      ctx.restore();
    };

    /* static element positions (fraction of screen) */
    const elements = {
      saturn: { x: 0.78, y: 0.22, r: 42 },
      jupiter: { x: 0.12, y: 0.35, r: 30 },
      smallPlanet: { x: 0.65, y: 0.72, r: 18 },
      moon: { x: 0.22, y: 0.12, r: 26 },
      rocket: { x: 0.55, y: 0.18 },
      ufo: { x: 0.35, y: 0.62 },
      stars: Array.from({ length: 28 }, (_, i) => ({
        x: (Math.sin(i * 3.7 + 1) * 0.5 + 0.5),
        y: (Math.sin(i * 2.3 + 0.5) * 0.5 + 0.5),
        r: 5 + (i % 4) * 3.5,
        phase: i * 0.7,
        color: ["#fde68a","#ffffff","#c4b5fd","#fbcfe8"][i % 4],
      })),
    };

    const draw = (dt: number) => {
      t += dt * 0.001;
      ctx.clearRect(0, 0, W, H);

      /* sky gradient — deep purple/indigo */
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#2e1065");
      bg.addColorStop(0.5, "#4c1d95");
      bg.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      /* twinkling cartoon stars */
      for (const s of elements.stars) {
        const alpha = 0.55 + 0.45 * Math.sin(t * 1.8 + s.phase);
        drawStar4(s.x * W, s.y * H, s.r, s.color, alpha);
      }

      /* Saturn */
      drawPlanet(elements.saturn.x * W, elements.saturn.y * H, elements.saturn.r,
        "#fcd34d", ["#fde68a","#f59e0b","#fde68a","#fbbf24","#fde68a"],
        true, t * 0.15);

      /* Jupiter */
      drawPlanet(elements.jupiter.x * W, elements.jupiter.y * H, elements.jupiter.r,
        "#fed7aa", ["#fde68a","#fb923c","#fed7aa","#f97316","#fed7aa","#fde68a"],
        false, 0);

      /* Small purple planet */
      drawPlanet(elements.smallPlanet.x * W, elements.smallPlanet.y * H, elements.smallPlanet.r,
        "#a78bfa", ["#c4b5fd","#8b5cf6","#c4b5fd"],
        false, 0);

      /* Moon crescent */
      drawMoon(elements.moon.x * W, elements.moon.y * H, elements.moon.r, Math.sin(t * 0.3) * 0.05);

      /* Floating rocket — gentle drift */
      const rocketDriftY = Math.sin(t * 0.9) * 14;
      const rocketDriftX = Math.cos(t * 0.5) * 6;
      drawRocket(
        elements.rocket.x * W + rocketDriftX,
        elements.rocket.y * H + rocketDriftY,
        1.1, -0.25
      );

      /* UFO hovering */
      const ufoB = Math.sin(t * 1.4) * 9;
      drawUFO(elements.ufo.x * W, elements.ufo.y * H, ufoB);
    };

    let last = performance.now();
    const loop = (now: number) => { draw(now - last); last = now; rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}
