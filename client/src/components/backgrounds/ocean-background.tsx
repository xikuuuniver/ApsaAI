import { useEffect, useRef } from "react";

export function OceanBackground() {
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
    /* Puffy cloud */
    const drawCloud = (cx: number, cy: number, scale: number, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffffff";
      const puffs: [number, number, number][] = [[0,0,28],[-30,10,21],[30,10,21],[-15,-12,23],[15,-12,23]];
      for (const [ox, oy, r] of puffs) {
        ctx.beginPath();
        ctx.arc(cx + ox * scale, cy + oy * scale, r * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillRect(cx - 58 * scale, cy + 6 * scale, 116 * scale, 18 * scale);
      ctx.restore();
    };

    /* Cartoon sun */
    const drawSun = (cx: number, cy: number, r: number, rot: number) => {
      ctx.save(); ctx.translate(cx, cy);
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 5; ctx.lineCap = "round";
      for (let i = 0; i < 8; i++) {
        const a = rot + (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6));
        ctx.lineTo(Math.cos(a) * (r + 20), Math.sin(a) * (r + 20));
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a"; ctx.fill();
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    };

    /* Cartoon moon */
    const drawMoon = (cx: number, cy: number, r: number, bgColor: string) => {
      ctx.save(); ctx.translate(cx, cy);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a"; ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.08, r * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = bgColor; ctx.fill();
      ctx.restore();
    };

    /* Cartoon flat wave strip (filled polygon) */
    const drawWaveStrip = (baseY: number, amp: number, freq: number, phase: number, color: string, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, baseY);
      for (let x = 0; x <= W; x += 3) {
        const y = baseY
          + Math.sin(x * freq + phase) * amp
          + Math.sin(x * freq * 1.6 + phase * 1.1) * amp * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };

    /* Cartoon foam line on top of wave */
    const drawFoamLine = (baseY: number, amp: number, freq: number, phase: number, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.setLineDash([12, 18]);
      ctx.beginPath();
      let first = true;
      for (let x = 0; x <= W; x += 3) {
        const y = baseY
          + Math.sin(x * freq + phase) * amp
          + Math.sin(x * freq * 1.6 + phase * 1.1) * amp * 0.4;
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        first = false;
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    };

    /* Cartoon fish */
    const drawFish = (x: number, y: number, scale: number, flip: boolean, color: string) => {
      ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
      // body
      ctx.beginPath();
      ctx.ellipse(0, 0, 20 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      // tail fin
      ctx.beginPath();
      ctx.moveTo(-16 * scale, 0);
      ctx.lineTo(-28 * scale, -11 * scale);
      ctx.lineTo(-28 * scale, 11 * scale);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      // eye
      ctx.beginPath(); ctx.arc(12 * scale, -3 * scale, 3.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.beginPath(); ctx.arc(13 * scale, -3 * scale, 1.8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b"; ctx.fill();
      ctx.restore();
    };

    /* Sailboat */
    const drawSailboat = (x: number, y: number, scale: number, bob: number) => {
      ctx.save(); ctx.translate(x, y + bob);
      // hull
      ctx.beginPath();
      ctx.moveTo(-28 * scale, 0);
      ctx.lineTo(-22 * scale, 12 * scale);
      ctx.lineTo(22 * scale, 12 * scale);
      ctx.lineTo(28 * scale, 0);
      ctx.closePath();
      ctx.fillStyle = "#f1f5f9"; ctx.fill();
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.stroke();
      // mast
      ctx.strokeStyle = "#64748b"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44 * scale); ctx.stroke();
      // sail
      ctx.beginPath();
      ctx.moveTo(0, -40 * scale);
      ctx.lineTo(-26 * scale, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = "#fef3c7"; ctx.fill();
      ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    };

    /* Seagull (V) */
    const drawGull = (x: number, y: number, scale: number, wPhase: number) => {
      const wing = Math.sin(wPhase) * 5 * scale;
      ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2.2 * scale; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - 9 * scale, y + wing);
      ctx.quadraticCurveTo(x - 4 * scale, y, x, y);
      ctx.quadraticCurveTo(x + 4 * scale, y, x + 9 * scale, y + wing);
      ctx.stroke();
    };

    /* State */
    const clouds = [
      { x: 0.06, y: 0.08, s: 0.85, sp: 0.000025 },
      { x: 0.40, y: 0.05, s: 1.05, sp: 0.000018 },
      { x: 0.70, y: 0.10, s: 0.7,  sp: 0.000030 },
      { x: 0.88, y: 0.06, s: 0.9,  sp: 0.000020 },
    ];
    const gulls = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random(), y: 0.30 + Math.random() * 0.1, sp: 0.00005 + Math.random() * 0.00005, wp: i * 1.3,
    }));
    const fishList = [
      { x: 0.22, vy: 0, jumping: false, timer: 3000 + Math.random() * 4000, baseY: 0, flip: false, color: "#f87171" },
      { x: 0.55, vy: 0, jumping: false, timer: 5000 + Math.random() * 5000, baseY: 0, flip: true,  color: "#34d399" },
      { x: 0.78, vy: 0, jumping: false, timer: 2000 + Math.random() * 6000, baseY: 0, flip: false, color: "#fbbf24" },
    ];

    const CYCLE = 90_000;

    const draw = (dt: number) => {
      t += dt;
      ctx.clearRect(0, 0, W, H);

      const phase = (t % CYCLE) / CYCLE;
      const nightMode = phase < 0.08 || phase > 0.82;

      /* Sky */
      const skyTop = nightMode ? "#0c1222"
        : phase < 0.15 ? "#7c3aed"
        : phase < 0.22 ? "#f97316"
        : phase < 0.72 ? "#0ea5e9"
        : phase < 0.80 ? "#f97316"
        : "#1e1b4b";
      const skyBot = nightMode ? "#1e2a45"
        : phase < 0.15 ? "#c084fc"
        : phase < 0.22 ? "#fde68a"
        : phase < 0.72 ? "#38bdf8"
        : phase < 0.80 ? "#fde68a"
        : "#312e81";
      const sg = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      sg.addColorStop(0, skyTop); sg.addColorStop(1, skyBot);
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);

      /* Stars at night */
      if (nightMode) {
        const starPts = [[0.1,0.06],[0.28,0.04],[0.46,0.09],[0.62,0.05],[0.79,0.08],
                         [0.18,0.16],[0.52,0.13],[0.71,0.18],[0.88,0.11],[0.38,0.19]];
        for (const [sx, sy] of starPts) {
          const tw = 0.5 + 0.5 * Math.sin(t * 0.002 + sx * 8);
          ctx.globalAlpha = tw * 0.9;
          ctx.fillStyle = "#fde68a";
          ctx.beginPath(); ctx.arc(sx * W, sy * H * 0.7, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      /* Sun or Moon */
      if (!nightMode && phase > 0.1 && phase < 0.78) {
        const sx = ((phase - 0.10) / 0.68) * W;
        const sy = H * 0.38 - Math.sin(((phase - 0.10) / 0.68) * Math.PI) * H * 0.3;
        drawSun(sx, sy, 30, t * 0.0003);
      } else {
        drawMoon(W * 0.8, H * 0.12, 26, skyTop);
      }

      /* Clouds */
      for (const c of clouds) {
        c.x += c.sp * dt;
        if (c.x > 1.3) c.x = -0.3;
        drawCloud(c.x * W, c.y * H, c.s, nightMode ? 0.45 : 0.92);
      }

      /* Sun/Moon reflection */
      if (!nightMode) {
        const reflG = ctx.createLinearGradient(W * 0.5, H * 0.48, W * 0.5, H);
        reflG.addColorStop(0, "rgba(255,220,80,0.18)");
        reflG.addColorStop(1, "rgba(255,220,80,0)");
        ctx.fillStyle = reflG;
        ctx.fillRect(W * 0.38, H * 0.48, W * 0.24, H * 0.52);
      } else {
        const moonR = ctx.createLinearGradient(W * 0.75, H * 0.5, W * 0.75, H);
        moonR.addColorStop(0, "rgba(180,200,255,0.12)");
        moonR.addColorStop(1, "rgba(180,200,255,0)");
        ctx.fillStyle = moonR;
        ctx.fillRect(W * 0.68, H * 0.5, W * 0.14, H * 0.5);
      }

      /* Ocean + cartoon waves (back to front) */
      const horizonY = H * 0.48;
      const oceanBase = ctx.createLinearGradient(0, horizonY, 0, H);
      oceanBase.addColorStop(0, nightMode ? "#0c2a4a" : "#0369a1");
      oceanBase.addColorStop(1, nightMode ? "#061628" : "#075985");
      ctx.fillStyle = oceanBase; ctx.fillRect(0, horizonY, W, H - horizonY);

      const waveConfigs = [
        { yF: 0.48, amp: 16, freq: 0.016, spd: 0.9,  c: nightMode ? "#0f3460" : "#0284c7", a: 1.0 },
        { yF: 0.55, amp: 13, freq: 0.022, spd: 1.2,  c: nightMode ? "#134074" : "#0ea5e9", a: 0.9 },
        { yF: 0.63, amp: 10, freq: 0.032, spd: 1.6,  c: nightMode ? "#1a4e86" : "#38bdf8", a: 0.82 },
        { yF: 0.71, amp:  8, freq: 0.044, spd: 2.0,  c: nightMode ? "#1d5c98" : "#7dd3fa", a: 0.72 },
        { yF: 0.80, amp:  6, freq: 0.058, spd: 2.5,  c: nightMode ? "#215da0" : "#bae6fd", a: 0.60 },
      ];
      for (const wl of waveConfigs) {
        const ph = t * 0.001 * wl.spd;
        drawWaveStrip(wl.yF * H, wl.amp, wl.freq, ph, wl.c, wl.a);
        drawFoamLine(wl.yF * H, wl.amp, wl.freq, ph, wl.a);
      }

      /* Sailboat */
      const bob = Math.sin(t * 0.001) * 5;
      drawSailboat(W * 0.2, H * 0.44, 1, bob);

      /* Fish jumping */
      for (const f of fishList) {
        f.timer -= dt;
        const waveY = waveConfigs[0].yF * H + Math.sin(f.x * W * 0.016 + t * 0.001 * 0.9) * waveConfigs[0].amp;
        f.baseY = waveY;
        if (!f.jumping && f.timer <= 0) {
          f.jumping = true;
          f.vy = -(3.5 + Math.random() * 1.5);
          f.timer = 4000 + Math.random() * 6000;
        }
        if (f.jumping) {
          f.baseY += f.vy * (dt / 16);
          f.vy += 0.18;
          if (f.baseY >= waveY) { f.jumping = false; f.baseY = waveY; }
        }
        drawFish(f.x * W, f.baseY, 1, f.flip, f.color);
      }

      /* Seagulls (daytime) */
      if (!nightMode) {
        for (const g of gulls) {
          g.x += g.sp * dt;
          if (g.x > 1.05) g.x = -0.05;
          g.wp += dt * 0.004;
          drawGull(g.x * W, g.y * H, 1, g.wp);
        }
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
