import { useEffect, useRef } from "react";

export function NatureBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W = window.innerWidth, H = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;

    /* ── Cartoon helpers ── */
    const drawRoundedBlob = (x: number, y: number, rx: number, ry: number, color: string) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /* Puffy cartoon cloud */
    const drawCloud = (cx: number, cy: number, scale: number, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffffff";
      const puffs = [
        [0, 0, 26], [-28, 8, 20], [28, 8, 20], [-14, -10, 22], [14, -10, 22],
      ] as [number, number, number][];
      for (const [ox, oy, r] of puffs) {
        ctx.beginPath();
        ctx.arc(cx + ox * scale, cy + oy * scale, r * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      // flat bottom
      ctx.fillRect(cx - 54 * scale, cy, 108 * scale, 18 * scale);
      ctx.restore();
    };

    /* Cartoon sun with rotating rays */
    const drawSun = (cx: number, cy: number, r: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      // rays
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      for (let i = 0; i < 8; i++) {
        const a = rot + (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6));
        ctx.lineTo(Math.cos(a) * (r + 18), Math.sin(a) * (r + 18));
        ctx.stroke();
      }
      // disk
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a"; ctx.fill();
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3; ctx.stroke();
      // smiley
      ctx.fillStyle = "#d97706";
      ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.15, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.28, -r * 0.15, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.arc(0, r * 0.05, r * 0.3, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = "#d97706"; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    };

    /* Cartoon tree (lollipop) */
    const drawTree = (x: number, y: number, scale: number) => {
      ctx.save();
      // trunk
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.roundRect(x - 5 * scale, y - 28 * scale, 10 * scale, 32 * scale, 4);
      ctx.fill();
      // foliage
      ctx.fillStyle = "#16a34a";
      ctx.beginPath(); ctx.arc(x, y - 36 * scale, 22 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#15803d";
      ctx.beginPath(); ctx.arc(x - 10 * scale, y - 30 * scale, 14 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 10 * scale, y - 30 * scale, 14 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    /* Cartoon flower */
    const drawFlower = (x: number, y: number, scale: number, sway: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      // stem
      ctx.strokeStyle = "#16a34a"; ctx.lineWidth = 3 * scale; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sway * 12, -16 * scale, sway * 8, -30 * scale);
      ctx.stroke();
      // petals
      ctx.translate(sway * 8, -30 * scale);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 6 * scale, Math.sin(a) * 6 * scale, 5 * scale, 3 * scale, a, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      }
      // center
      ctx.beginPath(); ctx.arc(0, 0, 4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a"; ctx.fill();
      ctx.restore();
    };

    /* Cartoon bird (V shape) */
    const drawBird = (x: number, y: number, scale: number, wingPhase: number) => {
      ctx.save();
      const wing = Math.sin(wingPhase) * 5 * scale;
      ctx.strokeStyle = "#1e3a5f"; ctx.lineWidth = 2.5 * scale; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - 10 * scale, y + wing);
      ctx.quadraticCurveTo(x - 5 * scale, y, x, y);
      ctx.quadraticCurveTo(x + 5 * scale, y, x + 10 * scale, y + wing);
      ctx.stroke();
      ctx.restore();
    };

    /* Cartoon raindrop */
    const dropCount = 120;
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random(), y: Math.random(), speed: 0.003 + Math.random() * 0.003,
    }));

    /* Rolling green hills */
    const drawHills = (color: string, amplitude: number, offset: number, baseY: number) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) {
        const y = baseY * H + Math.sin((x / W) * Math.PI * 3 + offset) * amplitude * H
                  + Math.sin((x / W) * Math.PI * 5 + offset * 1.5) * amplitude * 0.4 * H;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    /* Birds state */
    const birds = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random(), y: 0.1 + Math.random() * 0.2,
      speed: 0.00006 + Math.random() * 0.00006,
      wingPhase: i * 1.2,
    }));

    /* Clouds state */
    const clouds = [
      { x: 0.1, y: 0.12, s: 0.75, speed: 0.00003 },
      { x: 0.45, y: 0.08, s: 1,    speed: 0.000022 },
      { x: 0.72, y: 0.15, s: 0.6,  speed: 0.000035 },
      { x: 0.88, y: 0.07, s: 0.85, speed: 0.000028 },
    ];

    /* Trees/flowers positions */
    const trees  = [{ x: 0.08, s: 1.1 }, { x: 0.25, s: 0.85 }, { x: 0.78, s: 1.0 }, { x: 0.91, s: 0.75 }];
    const flowers = [
      { x: 0.18, c: "#f43f5e" }, { x: 0.32, c: "#a855f7" }, { x: 0.48, c: "#f97316" },
      { x: 0.58, c: "#ec4899" }, { x: 0.70, c: "#f43f5e" }, { x: 0.84, c: "#8b5cf6" },
    ];

    /* Day/night state toggle: 80s day, 40s night  */
    const CYCLE = 120_000;
    let isRaining = false;
    let rainTimer = 20000 + Math.random() * 30000;
    let rainAlpha = 0;

    const draw = (dt: number) => {
      t += dt;
      ctx.clearRect(0, 0, W, H);

      const phase = (t % CYCLE) / CYCLE; // 0-1
      const dayFrac = phase < 0.65 && phase > 0.05
        ? Math.min((phase - 0.05) / 0.1, 1, (0.70 - phase) / 0.05) : 0;

      /* Rain state machine */
      rainTimer -= dt;
      if (rainTimer <= 0) {
        isRaining = !isRaining;
        rainTimer = isRaining ? 8000 + Math.random() * 6000 : 20000 + Math.random() * 28000;
      }
      rainAlpha = isRaining
        ? Math.min(rainAlpha + dt * 0.001, 0.65)
        : Math.max(rainAlpha - dt * 0.0008, 0);

      /* Sky */
      const skyTop = phase < 0.05 || phase > 0.85 ? "#0f172a"
        : phase < 0.12 ? "#1e3a5f"
        : phase < 0.2  ? "#f97316"
        : phase < 0.65 ? (isRaining ? "#64748b" : "#38bdf8")
        : phase < 0.75 ? "#fb923c"
        : "#0f172a";
      const skyBot = phase < 0.05 || phase > 0.85 ? "#1e1b4b"
        : phase < 0.12 ? "#7c3aed"
        : phase < 0.2  ? "#fbbf24"
        : phase < 0.65 ? (isRaining ? "#94a3b8" : "#7dd3fc")
        : phase < 0.75 ? "#fde68a"
        : "#1e1b4b";
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.72);
      skyGrad.addColorStop(0, skyTop);
      skyGrad.addColorStop(1, skyBot);
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);

      /* Sun (daytime) */
      if (phase > 0.08 && phase < 0.78) {
        const sunX = ((phase - 0.08) / 0.7) * W;
        const sunY = H * 0.35 - Math.sin(((phase - 0.08) / 0.7) * Math.PI) * H * 0.28;
        drawSun(sunX, sunY, 32, t * 0.0004);
      }

      /* Moon/stars (nighttime) */
      if (phase < 0.06 || phase > 0.80) {
        const moonX = W * 0.75;
        const moonY = H * 0.14;
        // cartoon crescent
        ctx.save();
        ctx.translate(moonX, moonY);
        ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fillStyle = "#fde68a"; ctx.fill();
        ctx.beginPath(); ctx.arc(14, -3, 22, 0, Math.PI * 2);
        const night = phase < 0.06 ? "#0f172a" : "#0f172a";
        ctx.fillStyle = night; ctx.fill();
        ctx.restore();
        // Stars
        const starPositions = [
          [0.1,0.06],[0.3,0.04],[0.5,0.09],[0.15,0.15],[0.6,0.05],[0.85,0.08],[0.4,0.16],[0.7,0.12],
        ];
        for (const [sx, sy] of starPositions) {
          const tw = 0.6 + 0.4 * Math.sin(t * 0.002 + sx * 10);
          ctx.globalAlpha = tw;
          ctx.fillStyle = "#fde68a";
          ctx.beginPath(); ctx.arc(sx * W, sy * H, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      /* Clouds */
      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x > 1.25) c.x = -0.25;
        drawCloud(c.x * W, c.y * H, c.s, isRaining ? 0.7 : 0.9);
      }

      /* Hills — back to front */
      drawHills("#4ade80", 0.06, 0.8, 0.62);
      drawHills("#22c55e", 0.08, 1.8, 0.68);
      drawHills("#16a34a", 0.07, 0, 0.74);
      drawHills("#15803d", 0.05, 2.5, 0.79);

      /* Ground */
      const groundGrad = ctx.createLinearGradient(0, H * 0.82, 0, H);
      groundGrad.addColorStop(0, "#15803d");
      groundGrad.addColorStop(1, "#14532d");
      ctx.fillStyle = groundGrad; ctx.fillRect(0, H * 0.82, W, H * 0.18);

      /* Trees */
      for (const tr of trees) drawTree(tr.x * W, H * 0.82, tr.s);

      /* Flowers */
      for (const fl of flowers) {
        const sway = Math.sin(t * 0.002 + fl.x * 15) * 0.5;
        drawFlower(fl.x * W, H * 0.82, 1, sway, fl.c);
      }

      /* Birds (daytime only) */
      if (phase > 0.2 && phase < 0.72 && !isRaining) {
        for (const b of birds) {
          b.x += b.speed * dt;
          if (b.x > 1.05) b.x = -0.05;
          b.wingPhase += dt * 0.005;
          drawBird(b.x * W, b.y * H, 1, b.wingPhase);
        }
      }

      /* Rain */
      if (rainAlpha > 0) {
        ctx.globalAlpha = rainAlpha;
        ctx.strokeStyle = "#bfdbfe";
        ctx.lineWidth = 1.2;
        for (const d of drops) {
          d.y += d.speed * (dt / 16);
          if (d.y > 1) { d.y = -0.05; d.x = Math.random(); }
          ctx.beginPath();
          ctx.moveTo(d.x * W, d.y * H);
          ctx.lineTo(d.x * W - 1.5, d.y * H + 14);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        /* Rain overlay tint */
        ctx.fillStyle = "rgba(100,140,200,0.08)";
        ctx.fillRect(0, 0, W, H);
      }
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
