import { useEffect, useRef } from "react";

/* Full day cycle = 120 seconds */
const DAY_CYCLE = 120_000;

function skyColor(phase: number): [string, string] {
  // phase 0-1, 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
  if (phase < 0.2) return ["#020818", "#060d20"];        // night
  if (phase < 0.28) return ["#1a0a2e", "#ff6b35"];       // pre-dawn
  if (phase < 0.35) return ["#ff8c42", "#ffd166"];       // dawn
  if (phase < 0.65) return ["#4fc3f7", "#81d4fa"];       // day
  if (phase < 0.72) return ["#ff6b6b", "#ffa726"];       // dusk
  if (phase < 0.8)  return ["#1a0a2e", "#2d1b69"];       // twilight
  return ["#020818", "#060d20"];                          // night
}

export function NatureBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    /* Clouds */
    const clouds = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random(),
      y: 0.05 + Math.random() * 0.25,
      w: 0.12 + Math.random() * 0.18,
      h: 0.035 + Math.random() * 0.04,
      speed: 0.000006 + Math.random() * 0.000008,
      puffs: Array.from({ length: Math.floor(Math.random() * 4) + 3 }, () => ({
        ox: (Math.random() - 0.5) * 0.08,
        oy: (Math.random() - 0.5) * 0.02,
        r: 0.025 + Math.random() * 0.025,
      })),
    }));

    /* Stars */
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(), y: Math.random() * 0.6,
      r: Math.random() * 1.2 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    /* Mountain layers */
    const makeMtn = (seed: number, peaks: number, amp: number, base: number) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        let y = base;
        for (let h = 1; h <= peaks; h++) {
          y -= amp * Math.abs(Math.sin(x * Math.PI * h + seed));
        }
        pts.push([x, Math.max(0, y)]);
      }
      return pts;
    };
    const mtn1 = makeMtn(1.2, 4, 0.16, 0.75);
    const mtn2 = makeMtn(2.5, 3, 0.12, 0.82);
    const mtn3 = makeMtn(0.8, 5, 0.08, 0.88);

    /* Grass blades */
    const BLADES = 120;
    const blades = Array.from({ length: BLADES }, (_, i) => ({
      x: i / BLADES + (Math.random() - 0.5) / BLADES,
      h: 0.04 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 0.8,
      lean: (Math.random() - 0.5) * 0.2,
    }));

    /* Rain drops */
    const DROPS = 200;
    const drops = Array.from({ length: DROPS }, () => ({
      x: Math.random(), y: Math.random(), vy: 0.004 + Math.random() * 0.006,
    }));

    /* Birds */
    const birds = Array.from({ length: 5 }, () => ({
      x: Math.random(), y: 0.08 + Math.random() * 0.2,
      speed: 0.00008 + Math.random() * 0.00012,
      wingPhase: Math.random() * Math.PI * 2,
      size: 0.008 + Math.random() * 0.006,
    }));

    let t = 0;
    let rainPhase = 0; // 0 = clear, 1 = raining, time-based
    let rainTimer = 15000 + Math.random() * 25000;
    let isRaining = false;
    let rainAlpha = 0;

    const drawMtn = (pts: [number, number][], fill: string, W: number, H: number) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (const [px, py] of pts) ctx.lineTo(px * W, py * H);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const drawCloud = (cx: number, cy: number, puffs: { ox: number; oy: number; r: number }[], W: number, H: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      for (const p of puffs) {
        ctx.beginPath();
        ctx.arc(cx + p.ox * W, cy + p.oy * H, p.r * Math.min(W, H), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = (dt: number) => {
      t += dt;
      const W = canvas.width;
      const H = canvas.height;
      const phase = ((t % DAY_CYCLE) / DAY_CYCLE);
      const [sky1, sky2] = skyColor(phase);

      /* Rain state machine */
      rainTimer -= dt;
      if (rainTimer <= 0) {
        isRaining = !isRaining;
        rainTimer = isRaining ? 10000 + Math.random() * 8000 : 18000 + Math.random() * 20000;
      }
      rainAlpha = isRaining
        ? Math.min(rainAlpha + dt * 0.0008, 0.7)
        : Math.max(rainAlpha - dt * 0.0006, 0);

      /* Sky gradient */
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
      skyGrad.addColorStop(0, sky1);
      skyGrad.addColorStop(1, sky2);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      /* Stars (only at night) */
      const starAlpha = phase < 0.25 || phase > 0.78
        ? 1 : phase < 0.32 ? (0.32 - phase) / 0.07 : phase > 0.70 ? (phase - 0.70) / 0.08 : 0;
      if (starAlpha > 0) {
        for (const s of stars) {
          const tw = 0.5 + 0.5 * Math.sin(t * 0.001 + s.phase);
          ctx.globalAlpha = starAlpha * tw * 0.9;
          ctx.beginPath();
          ctx.arc(s.x * W, s.y * H * 0.7, s.r, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      /* Sun / Moon */
      const bodyPhase = phase < 0.5 ? phase / 0.5 : (phase - 0.5) / 0.5;
      const bodyX = bodyPhase * W;
      const bodyY = H * 0.55 - Math.sin(bodyPhase * Math.PI) * H * 0.45;
      const isDay = phase >= 0.28 && phase <= 0.72;

      if (isDay) {
        // Sun glow
        const sunGlow = ctx.createRadialGradient(bodyX, bodyY, 0, bodyX, bodyY, 80);
        sunGlow.addColorStop(0, "rgba(255,230,100,0.4)");
        sunGlow.addColorStop(1, "rgba(255,200,50,0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath(); ctx.arc(bodyX, bodyY, 80, 0, Math.PI * 2); ctx.fill();
        // Sun disk
        ctx.beginPath();
        ctx.arc(bodyX, bodyY, 22, 0, Math.PI * 2);
        ctx.fillStyle = "#FFE55C";
        ctx.fill();
      } else {
        // Moon
        ctx.beginPath();
        ctx.arc(bodyX, bodyY, 18, 0, Math.PI * 2);
        ctx.fillStyle = "#dde8f5";
        ctx.fill();
        // Crescent shadow
        ctx.beginPath();
        ctx.arc(bodyX + 6, bodyY, 14, 0, Math.PI * 2);
        ctx.fillStyle = sky1;
        ctx.fill();
      }

      /* Clouds */
      const cloudAlpha = phase < 0.22 || phase > 0.82 ? 0.3 : 0.9;
      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x > 1.3) c.x = -0.3;
        drawCloud(c.x * W, c.y * H, c.puffs, W, H, cloudAlpha);
      }

      /* Rain overlay */
      if (rainAlpha > 0) {
        const overGrad = ctx.createLinearGradient(0, 0, 0, H);
        overGrad.addColorStop(0, `rgba(100,120,160,${rainAlpha * 0.15})`);
        overGrad.addColorStop(1, `rgba(80,100,140,${rainAlpha * 0.08})`);
        ctx.fillStyle = overGrad;
        ctx.fillRect(0, 0, W, H);
        // Drops
        ctx.strokeStyle = `rgba(200,220,255,${rainAlpha * 0.55})`;
        ctx.lineWidth = 0.8;
        for (const d of drops) {
          d.y += d.vy * (dt / 16);
          if (d.y > 1) { d.y = -0.05; d.x = Math.random(); }
          ctx.beginPath();
          ctx.moveTo(d.x * W, d.y * H);
          ctx.lineTo(d.x * W - 1, d.y * H + 12);
          ctx.stroke();
        }
      }

      /* Mountain layer 1 (far, pale) */
      const mtnFarColor = phase >= 0.28 && phase <= 0.72
        ? "#5a7a8a"
        : phase < 0.35 || phase > 0.75 ? "#1a2030" : "#2d3d50";
      drawMtn(mtn1, mtnFarColor, W, H);

      /* Mountain layer 2 */
      const mtnMidColor = phase >= 0.30 && phase <= 0.70
        ? "#3a5a3a"
        : phase < 0.35 || phase > 0.75 ? "#0d1a10" : "#1a2e1a";
      drawMtn(mtn2, mtnMidColor, W, H);

      /* Mountain layer 3 (close, dark green) */
      const mtnNearColor = phase >= 0.28 && phase <= 0.72
        ? "#2d4a2d"
        : "#0a120a";
      drawMtn(mtn3, mtnNearColor, W, H);

      /* Ground */
      const groundY = 0.88 * H;
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
      const grassTop = phase >= 0.28 && phase <= 0.72 ? "#3a7d44" : "#1a3a20";
      groundGrad.addColorStop(0, grassTop);
      groundGrad.addColorStop(1, phase >= 0.28 && phase <= 0.72 ? "#2d5a35" : "#0d1f10");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, W, H - groundY);

      /* Grass blades */
      const windStrength = isRaining ? 0.025 : 0.012;
      const windFreq = t * 0.001;
      const bladeColor = phase >= 0.28 && phase <= 0.72 ? "#4a9a58" : "#1f4a28";
      for (const b of blades) {
        const wind = Math.sin(windFreq * b.speed + b.phase) * windStrength;
        const bx = b.x * W;
        const by = groundY;
        const bh = b.h * H;
        const tipX = bx + (wind + b.lean) * W * 0.5;
        const tipY = by - bh;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + (wind * W * 0.25), by - bh * 0.5, tipX, tipY);
        ctx.strokeStyle = bladeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* Birds (daytime only) */
      if (isDay && !isRaining) {
        for (const bd of birds) {
          bd.x += bd.speed * dt;
          if (bd.x > 1.1) bd.x = -0.1;
          bd.wingPhase += dt * 0.005;
          const bx = bd.x * W;
          const by = bd.y * H;
          const sz = bd.size * Math.min(W, H);
          const wing = Math.sin(bd.wingPhase) * sz * 0.4;
          ctx.beginPath();
          ctx.moveTo(bx - sz, by + wing);
          ctx.quadraticCurveTo(bx - sz * 0.5, by, bx, by);
          ctx.quadraticCurveTo(bx + sz * 0.5, by, bx + sz, by + wing);
          ctx.strokeStyle = "rgba(20,20,20,0.7)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    };

    let last = performance.now();
    const loop = (now: number) => {
      draw(now - last); last = now;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}
