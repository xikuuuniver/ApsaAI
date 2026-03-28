import { useEffect, useRef } from "react";

const DAY_CYCLE = 90_000;

function skyStop(phase: number): [string, string] {
  if (phase < 0.2)  return ["#01050f", "#030a1a"];
  if (phase < 0.28) return ["#0d0820", "#8b3a62"];
  if (phase < 0.35) return ["#f4845f", "#f7c59f"];
  if (phase < 0.65) return ["#1a8fe0", "#62c5f5"];
  if (phase < 0.72) return ["#e05c2a", "#f4a460"];
  if (phase < 0.8)  return ["#0d0820", "#2d1b69"];
  return ["#01050f", "#030a1a"];
}

export function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    /* Stars */
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random(), y: Math.random() * 0.55,
      r: Math.random() * 1.2 + 0.3, phase: Math.random() * Math.PI * 2,
    }));

    /* Clouds */
    const clouds = Array.from({ length: 5 }, () => ({
      x: Math.random(), y: 0.04 + Math.random() * 0.2,
      speed: 0.000005 + Math.random() * 0.000008,
      puffs: Array.from({ length: 3 + Math.floor(Math.random() * 4) }, () => ({
        ox: (Math.random() - 0.5) * 0.1, oy: (Math.random() - 0.5) * 0.025,
        r: 0.022 + Math.random() * 0.028,
      })),
    }));

    /* Wave layers: [amplitude fraction of H, frequency, speed (px/s), color, yFrac] */
    const waveLayers = [
      { amp: 0.022, freq: 0.012, speed: 35, colorDay: "#0e7ecf", colorNight: "#062a52", yFrac: 0.44, alpha: 1    },
      { amp: 0.016, freq: 0.018, speed: 50, colorDay: "#1a9fe0", colorNight: "#0a3d6b", yFrac: 0.52, alpha: 0.85 },
      { amp: 0.012, freq: 0.028, speed: 65, colorDay: "#2ab5f0", colorNight: "#0f4e82", yFrac: 0.60, alpha: 0.75 },
      { amp: 0.009, freq: 0.040, speed: 80, colorDay: "#3dc8f8", colorNight: "#155e96", yFrac: 0.68, alpha: 0.65 },
      { amp: 0.007, freq: 0.055, speed: 95, colorDay: "#55d8ff", colorNight: "#1c6ea8", yFrac: 0.76, alpha: 0.55 },
      { amp: 0.005, freq: 0.070, speed:110, colorDay: "#70e4ff", colorNight: "#227cba", yFrac: 0.84, alpha: 0.45 },
    ];

    /* Seagulls */
    const gulls = Array.from({ length: 4 }, () => ({
      x: Math.random(), y: 0.36 + Math.random() * 0.1,
      speed: 0.00006 + Math.random() * 0.0001,
      phase: Math.random() * Math.PI * 2,
      size: 0.006 + Math.random() * 0.005,
    }));

    let t = 0;

    const drawCloud = (cx: number, cy: number, puffs: { ox: number; oy: number; r: number }[], W: number, H: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      for (const p of puffs) {
        ctx.beginPath();
        ctx.arc(cx + p.ox * W, cy + p.oy * H, p.r * Math.min(W, H), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.fill();
      }
      ctx.restore();
    };

    const lerp = (a: string, b: string, frac: number): string => {
      const parse = (h: string) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
      const [ar,ag,ab] = parse(a); const [br,bg,bb] = parse(b);
      return `rgb(${Math.round(ar+(br-ar)*frac)},${Math.round(ag+(bg-ag)*frac)},${Math.round(ab+(bb-ab)*frac)})`;
    };

    const draw = (dt: number) => {
      t += dt;
      const W = canvas.width;
      const H = canvas.height;
      const phase = (t % DAY_CYCLE) / DAY_CYCLE;
      const [sk1, sk2] = skyStop(phase);
      const isDay = phase >= 0.28 && phase <= 0.72;

      /* Sky */
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      skyGrad.addColorStop(0, sk1);
      skyGrad.addColorStop(1, sk2);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      /* Stars */
      const starAlpha = phase < 0.25 || phase > 0.78
        ? 0.95 : phase < 0.32 ? (0.32 - phase) / 0.07 : phase > 0.70 ? (phase - 0.70) / 0.08 : 0;
      if (starAlpha > 0) {
        for (const s of stars) {
          const tw = 0.5 + 0.5 * Math.sin(t * 0.001 + s.phase);
          ctx.globalAlpha = starAlpha * tw;
          ctx.beginPath();
          ctx.arc(s.x * W, s.y * H * 0.75, s.r, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      /* Sun / Moon */
      const bodyPhase = phase < 0.5 ? phase / 0.5 : (phase - 0.5) / 0.5;
      const bodyX = bodyPhase * W;
      const bodyY = H * 0.48 - Math.sin(bodyPhase * Math.PI) * H * 0.4;

      if (isDay) {
        const sunGlow = ctx.createRadialGradient(bodyX, bodyY, 0, bodyX, bodyY, 90);
        sunGlow.addColorStop(0, "rgba(255,240,80,0.45)");
        sunGlow.addColorStop(1, "rgba(255,200,0,0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath(); ctx.arc(bodyX, bodyY, 90, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.arc(bodyX, bodyY, 24, 0, Math.PI * 2);
        ctx.fillStyle = "#FFE55C";
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(bodyX, bodyY, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#dde8f5";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bodyX + 7, bodyY, 15, 0, Math.PI * 2);
        ctx.fillStyle = sk1;
        ctx.fill();
      }

      /* Clouds */
      const cloudA = phase < 0.22 || phase > 0.82 ? 0.35 : 0.85;
      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x > 1.3) c.x = -0.3;
        drawCloud(c.x * W, c.y * H, c.puffs, W, H, cloudA);
      }

      /* Sun reflection on water */
      if (isDay && bodyY < H * 0.5) {
        const reflY = H * 0.5 + (H * 0.5 - bodyY) * 0.3;
        const refGrad = ctx.createLinearGradient(bodyX, reflY, bodyX, H);
        refGrad.addColorStop(0, "rgba(255,230,80,0.25)");
        refGrad.addColorStop(1, "rgba(255,230,80,0)");
        ctx.fillStyle = refGrad;
        ctx.fillRect(bodyX - 40, reflY, 80, H - reflY);
      }

      /* Ocean base */
      const horizonY = waveLayers[0].yFrac * H;
      const oceanGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      oceanGrad.addColorStop(0, isDay ? "#0b6ab0" : "#041c38");
      oceanGrad.addColorStop(1, isDay ? "#094fa0" : "#02111f");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      /* Wave layers (back to front) */
      for (const wl of waveLayers) {
        const baseY = wl.yFrac * H;
        const amp = wl.amp * H;
        const color = isDay ? wl.colorDay : wl.colorNight;
        const offset = (t * 0.001 * wl.speed) % (Math.PI * 2 / wl.freq);

        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, baseY);
        for (let x = 0; x <= W; x += 2) {
          const wx = wl.freq * x + t * 0.001 * wl.speed;
          const wy = baseY + Math.sin(wx) * amp + Math.sin(wx * 1.3 + 1) * amp * 0.35;
          ctx.lineTo(x, wy);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.globalAlpha = wl.alpha;
        ctx.fillStyle = color;
        ctx.fill();

        /* Foam / crest highlights */
        ctx.globalAlpha = wl.alpha * 0.4;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const wx = wl.freq * x + t * 0.001 * wl.speed;
          const wy = baseY + Math.sin(wx) * amp + Math.sin(wx * 1.3 + 1) * amp * 0.35;
          x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      /* Seagulls (daytime) */
      if (isDay) {
        for (const g of gulls) {
          g.x += g.speed * dt;
          if (g.x > 1.1) g.x = -0.1;
          g.phase += dt * 0.004;
          const gx = g.x * W;
          const gy = g.y * H;
          const sz = g.size * Math.min(W, H);
          const wing = Math.sin(g.phase) * sz * 0.38;
          ctx.beginPath();
          ctx.moveTo(gx - sz, gy + wing);
          ctx.quadraticCurveTo(gx - sz * 0.5, gy, gx, gy);
          ctx.quadraticCurveTo(gx + sz * 0.5, gy, gx + sz, gy + wing);
          ctx.strokeStyle = "rgba(30,30,40,0.75)";
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
      }

      /* Moon reflection on water */
      if (!isDay) {
        const mr = ctx.createLinearGradient(bodyX, waveLayers[0].yFrac * H, bodyX, H);
        mr.addColorStop(0, "rgba(200,220,255,0.12)");
        mr.addColorStop(1, "rgba(200,220,255,0)");
        ctx.fillStyle = mr;
        ctx.fillRect(bodyX - 30, waveLayers[0].yFrac * H, 60, H - waveLayers[0].yFrac * H);
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
