import { useEffect, useRef } from "react";

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── Stars ── */
    const STAR_COUNT = 320;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.6 + 0.3,
      color: ["#ffffff", "#ffe8c0", "#c0d8ff", "#ffd0ff"][Math.floor(Math.random() * 4)],
    }));

    /* ── Nebula blobs ── */
    const nebulas = Array.from({ length: 7 }, () => ({
      x: Math.random(),
      y: Math.random(),
      rx: 0.15 + Math.random() * 0.22,
      ry: 0.08 + Math.random() * 0.14,
      angle: Math.random() * Math.PI,
      color: [
        "rgba(100,60,200,0.07)",
        "rgba(60,100,220,0.08)",
        "rgba(180,60,120,0.06)",
        "rgba(60,180,180,0.06)",
        "rgba(120,40,180,0.07)",
      ][Math.floor(Math.random() * 5)],
      driftX: (Math.random() - 0.5) * 0.00004,
      driftY: (Math.random() - 0.5) * 0.00004,
    }));

    /* ── Shooting stars ── */
    interface Shoot { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }
    const shoots: Shoot[] = [];
    let nextShoot = 2000 + Math.random() * 4000;

    /* ── Galaxy spirals ── */
    const galaxies = Array.from({ length: 3 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.7,
      arms: Math.floor(Math.random() * 2) + 2,
      turns: 1.5 + Math.random(),
      pts: 180,
      rot: 0,
      rotSpeed: (Math.random() - 0.5) * 0.0003,
      scale: 0.04 + Math.random() * 0.06,
      hue: Math.random() * 60 + 200,
    }));

    let t = 0;

    const draw = (dt: number) => {
      t += dt;
      const W = canvas.width;
      const H = canvas.height;

      /* Background */
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.8);
      bg.addColorStop(0, "#0d0820");
      bg.addColorStop(0.4, "#080514");
      bg.addColorStop(1, "#020108");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      /* Nebulas */
      for (const nb of nebulas) {
        nb.x += nb.driftX;
        nb.y += nb.driftY;
        if (nb.x < -0.3) nb.x = 1.3;
        if (nb.x > 1.3) nb.x = -0.3;
        if (nb.y < -0.3) nb.y = 1.3;
        if (nb.y > 1.3) nb.y = -0.3;

        ctx.save();
        ctx.translate(nb.x * W, nb.y * H);
        ctx.rotate(nb.angle);
        ctx.scale(1, nb.ry / nb.rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, nb.rx * W);
        g.addColorStop(0, nb.color.replace("0.0", "0.1"));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, nb.rx * W, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* Galaxy spirals */
      for (const gx of galaxies) {
        gx.rot += gx.rotSpeed;
        const cx = gx.x * W;
        const cy = gx.y * H;
        const sc = gx.scale * Math.min(W, H);
        for (let a = 0; a < gx.arms; a++) {
          const offset = (a / gx.arms) * Math.PI * 2;
          for (let i = 0; i < gx.pts; i++) {
            const frac = i / gx.pts;
            const angle = offset + frac * gx.turns * Math.PI * 2 + gx.rot;
            const dist = frac * sc;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            const alpha = (1 - frac) * 0.3;
            const r = 1 - frac * 0.6;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${gx.hue + frac * 40},70%,75%,${alpha})`;
            ctx.fill();
          }
        }
        /* Core glow */
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, sc * 0.12);
        core.addColorStop(0, `hsla(${gx.hue},60%,90%,0.35)`);
        core.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, sc * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Stars */
      for (const s of stars) {
        const alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color.replace(")", `,${alpha})`).replace("rgb", "rgba");
        // simple: just use globalAlpha
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.globalAlpha = 1;

        /* Star glow for bright ones */
        if (s.r > 1.2) {
          const glow = ctx.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, s.r * 4);
          glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.25})`);
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(s.x * W, s.y * H, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* Shooting stars */
      nextShoot -= dt;
      if (nextShoot <= 0) {
        shoots.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.5,
          vx: (3 + Math.random() * 5) * (Math.random() < 0.5 ? 1 : -1),
          vy: 1 + Math.random() * 3,
          life: 0,
          maxLife: 600 + Math.random() * 400,
        });
        nextShoot = 3000 + Math.random() * 7000;
      }

      for (let i = shoots.length - 1; i >= 0; i--) {
        const sh = shoots[i];
        sh.life += dt;
        if (sh.life > sh.maxLife) { shoots.splice(i, 1); continue; }
        const prog = sh.life / sh.maxLife;
        const alpha = Math.sin(prog * Math.PI);
        const tailLen = 80 + prog * 40;
        const nx = sh.x + sh.vx * (sh.life / 16);
        const ny = sh.y + sh.vy * (sh.life / 16);
        const grad = ctx.createLinearGradient(nx - sh.vx * tailLen / sh.vx, ny - sh.vy * tailLen / sh.vy, nx, ny);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, `rgba(255,255,255,${alpha * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(nx - Math.sign(sh.vx) * tailLen, ny - Math.sign(sh.vy) * tailLen * Math.abs(sh.vy / sh.vx));
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    let last = performance.now();
    const loop = (now: number) => {
      draw(now - last);
      last = now;
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
