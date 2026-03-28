import { useEffect, useRef } from "react";
import { BgTheme, useBgTheme } from "@/contexts/bg-theme-context";

interface ThemeSelectorProps {
  open: boolean;
  onClose: () => void;
}

const THEMES: {
  id: BgTheme;
  label: string;
  desc: string;
  preview: (canvas: HTMLCanvasElement) => void;
}[] = [
  {
    id: "particles",
    label: "Particles",
    desc: "Interactive floating dots",
    preview: (c) => {
      const ctx = c.getContext("2d")!;
      const W = c.width; const H = c.height;
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#f8fafc"); grad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      const dots = [
        { x: 0.2, y: 0.3, r: 3, c: "#FF6B6B" }, { x: 0.5, y: 0.6, r: 2.5, c: "#4ECDC4" },
        { x: 0.75, y: 0.2, r: 2, c: "#45B7D1" }, { x: 0.35, y: 0.75, r: 3, c: "#96CEB4" },
        { x: 0.65, y: 0.5, r: 2, c: "#DDA0DD" }, { x: 0.1, y: 0.6, r: 2.5, c: "#FFEAA7" },
        { x: 0.85, y: 0.7, r: 2, c: "#BB8FCE" }, { x: 0.45, y: 0.15, r: 3, c: "#F7DC6F" },
      ];
      for (const d of dots) { ctx.beginPath(); ctx.arc(d.x*W, d.y*H, d.r, 0, Math.PI*2); ctx.fillStyle = d.c; ctx.fill(); }
      ctx.strokeStyle = "rgba(150,150,150,0.2)"; ctx.lineWidth = 0.8;
      for (let i = 0; i < dots.length; i++) for (let j = i+1; j < dots.length; j++) {
        const dx = dots[j].x - dots[i].x; const dy = dots[j].y - dots[i].y;
        if (dx*dx + dy*dy < 0.15) {
          ctx.beginPath(); ctx.moveTo(dots[i].x*W, dots[i].y*H); ctx.lineTo(dots[j].x*W, dots[j].y*H); ctx.stroke();
        }
      }
    },
  },
  {
    id: "space",
    label: "Space",
    desc: "Galaxies, stars & nebulas",
    preview: (c) => {
      const ctx = c.getContext("2d")!;
      const W = c.width; const H = c.height;
      const bg = ctx.createRadialGradient(W*0.5, H*0.4, 0, W*0.5, H*0.4, W*0.8);
      bg.addColorStop(0, "#1a0a3e"); bg.addColorStop(0.5, "#0d0520"); bg.addColorStop(1, "#020108");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // Nebula
      const nb = ctx.createRadialGradient(W*0.6, H*0.35, 0, W*0.6, H*0.35, W*0.35);
      nb.addColorStop(0, "rgba(100,50,200,0.15)"); nb.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nb; ctx.beginPath(); ctx.arc(W*0.6, H*0.35, W*0.35, 0, Math.PI*2); ctx.fill();
      const nb2 = ctx.createRadialGradient(W*0.2, H*0.6, 0, W*0.2, H*0.6, W*0.25);
      nb2.addColorStop(0, "rgba(60,120,200,0.12)"); nb2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nb2; ctx.beginPath(); ctx.arc(W*0.2, H*0.6, W*0.25, 0, Math.PI*2); ctx.fill();
      // Stars
      const rng = (n: number) => { let x = Math.sin(n+1)*10000; return x-Math.floor(x); };
      for (let i = 0; i < 60; i++) {
        const x = rng(i*3)*W; const y = rng(i*3+1)*H; const r = rng(i*3+2)*1.5+0.3;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle = `rgba(255,255,255,${0.4+rng(i)*0.6})`; ctx.fill();
      }
      // Galaxy spiral
      for (let i = 0; i < 80; i++) {
        const a = (i/80)*Math.PI*4; const d = (i/80)*18;
        const gx = W*0.78 + Math.cos(a)*d; const gy = H*0.25 + Math.sin(a)*d*0.5;
        ctx.beginPath(); ctx.arc(gx,gy,0.8,0,Math.PI*2);
        ctx.fillStyle = `hsla(230,70%,75%,${(1-i/80)*0.4})`; ctx.fill();
      }
    },
  },
  {
    id: "nature",
    label: "Nature",
    desc: "Mountains, wind & day/night",
    preview: (c) => {
      const ctx = c.getContext("2d")!;
      const W = c.width; const H = c.height;
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H*0.75);
      sky.addColorStop(0, "#4fc3f7"); sky.addColorStop(1, "#81d4fa");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // Sun
      const sun = ctx.createRadialGradient(W*0.75, H*0.18, 0, W*0.75, H*0.18, 20);
      sun.addColorStop(0,"rgba(255,240,80,0.5)"); sun.addColorStop(1,"rgba(255,200,0,0)");
      ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(W*0.75,H*0.18,20,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(W*0.75,H*0.18,8,0,Math.PI*2); ctx.fillStyle="#FFE55C"; ctx.fill();
      // Cloud
      for (const p of [{ox:0,oy:0,r:10},{ox:12,oy:-4,r:8},{ox:-10,oy:-2,r:7}]) {
        ctx.beginPath(); ctx.arc(W*0.25+p.ox, H*0.2+p.oy, p.r, 0, Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.fill();
      }
      // Far mountain
      ctx.beginPath(); ctx.moveTo(0,H); 
      const mpts1 = [0,0.72,0.1,0.52,0.25,0.70,0.38,0.48,0.52,0.68,0.65,0.45,0.78,0.65,0.9,0.50,1,0.68,1,1];
      for (let i=0; i<mpts1.length; i+=2) ctx.lineTo(mpts1[i]*W, mpts1[i+1]*H);
      ctx.closePath(); ctx.fillStyle="#5a7a8a"; ctx.fill();
      // Near mountain
      ctx.beginPath(); ctx.moveTo(0,H);
      const mpts2 = [0,0.78,0.15,0.62,0.3,0.75,0.5,0.58,0.7,0.72,0.85,0.60,1,0.74,1,1];
      for (let i=0; i<mpts2.length; i+=2) ctx.lineTo(mpts2[i]*W, mpts2[i+1]*H);
      ctx.closePath(); ctx.fillStyle="#3a5a3a"; ctx.fill();
      // Ground
      ctx.fillStyle="#3a7d44"; ctx.fillRect(0, H*0.88, W, H*0.12);
      // Grass blades
      for (let i=0; i<30; i++) {
        const bx = (i/30)*W + Math.random()*10-5;
        const by = H*0.88;
        const bh = H*0.055;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + Math.sin(i)*6, by - bh*0.5, bx + Math.sin(i)*10, by - bh);
        ctx.strokeStyle="#4a9a58"; ctx.lineWidth=1.2; ctx.stroke();
      }
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    desc: "Waves, sky & sunrise/sunset",
    preview: (c) => {
      const ctx = c.getContext("2d")!;
      const W = c.width; const H = c.height;
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H*0.5);
      sky.addColorStop(0, "#1a8fe0"); sky.addColorStop(1, "#62c5f5");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // Sun
      const sg = ctx.createRadialGradient(W*0.7, H*0.2, 0, W*0.7, H*0.2, 25);
      sg.addColorStop(0,"rgba(255,240,80,0.5)"); sg.addColorStop(1,"rgba(255,200,0,0)");
      ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(W*0.7,H*0.2,25,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(W*0.7,H*0.2,9,0,Math.PI*2); ctx.fillStyle="#FFE55C"; ctx.fill();
      // Reflection
      ctx.fillStyle="rgba(255,230,80,0.12)"; ctx.fillRect(W*0.6, H*0.45, W*0.2, H*0.55);
      // Cloud
      for (const p of [{ox:0,oy:0,r:9},{ox:11,oy:-3,r:7},{ox:-9,oy:-2,r:6}]) {
        ctx.beginPath(); ctx.arc(W*0.2+p.ox, H*0.15+p.oy, p.r, 0, Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,0.88)"; ctx.fill();
      }
      // Ocean base
      const og = ctx.createLinearGradient(0, H*0.45, 0, H);
      og.addColorStop(0,"#0b6ab0"); og.addColorStop(1,"#094fa0");
      ctx.fillStyle=og; ctx.fillRect(0, H*0.45, W, H*0.55);
      // Waves
      const waveData = [
        {y:0.45,amp:0.022,freq:0.04,c:"#1a9fe0",a:0.9},
        {y:0.57,amp:0.016,freq:0.06,c:"#2ab5f0",a:0.8},
        {y:0.68,amp:0.012,freq:0.08,c:"#3dc8f8",a:0.7},
        {y:0.79,amp:0.008,freq:0.10,c:"#55d8ff",a:0.6},
      ];
      for (const wl of waveData) {
        const baseY = wl.y * H; const amp = wl.amp * H;
        ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,baseY);
        for (let x=0; x<=W; x+=3) {
          const wy = baseY + Math.sin(x*wl.freq)*amp + Math.sin(x*wl.freq*1.3+1)*amp*0.3;
          ctx.lineTo(x, wy);
        }
        ctx.lineTo(W,H); ctx.closePath();
        ctx.globalAlpha=wl.a; ctx.fillStyle=wl.c; ctx.fill(); ctx.globalAlpha=1;
      }
      // Seagull
      ctx.beginPath();
      ctx.moveTo(W*0.3, H*0.38); ctx.quadraticCurveTo(W*0.34, H*0.36, W*0.38, H*0.38);
      ctx.strokeStyle="rgba(20,20,40,0.7)"; ctx.lineWidth=1.5; ctx.stroke();
    },
  },
];

function ThemePreview({ preview }: { preview: (c: HTMLCanvasElement) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // Use logical pixels for preview (crisp enough at small size)
    c.width = c.offsetWidth || 200;
    c.height = c.offsetHeight || 120;
    preview(c);
  }, [preview]);
  return <canvas ref={ref} className="w-full h-full" style={{ display: "block" }} />;
}

export function ThemeSelector({ open, onClose }: ThemeSelectorProps) {
  const { bgTheme, setBgTheme } = useBgTheme();

  const select = (id: BgTheme) => {
    setBgTheme(id);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-end justify-center pb-8 px-4"
      style={{ zIndex: 200 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "rgba(10,10,20,0.85)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <h2 className="text-white/90 text-lg font-semibold tracking-tight mb-1">Background Theme</h2>
          <p className="text-white/40 text-sm mb-5">Choose an animated background for your workspace</p>

          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((th) => {
              const active = bgTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => select(th.id)}
                  className="relative rounded-2xl overflow-hidden text-left transition-all"
                  style={{
                    border: active ? "2px solid rgba(99,179,237,0.9)" : "2px solid rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 0 0 4px rgba(99,179,237,0.2)" : "none",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Canvas preview */}
                  <div className="w-full aspect-video relative">
                    <ThemePreview preview={th.preview} />
                    {active && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <div
                          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{ background: "rgba(99,179,237,0.8)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="5.5" stroke="white" strokeWidth="1.2"/>
                            <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Active
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="px-3 pt-2 pb-2.5">
                    <div className="text-white/90 text-sm font-medium">{th.label}</div>
                    <div className="text-white/40 text-xs mt-0.5">{th.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-3 rounded-xl text-white/50 text-sm font-medium transition hover:text-white/80"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
