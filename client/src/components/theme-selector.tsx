import { useEffect, useRef } from "react";
import { BgTheme, useBgTheme } from "@/contexts/bg-theme-context";

interface ThemeSelectorProps {
  open: boolean;
  onClose: () => void;
}

/* ── Cartoon preview painters ── */
const THEMES: { id: BgTheme; label: string; desc: string; paint: (ctx: CanvasRenderingContext2D, W: number, H: number) => void }[] = [
  {
    id: "particles",
    label: "Particles",
    desc: "Interactive floating dots",
    paint: (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#f8fafc"); g.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const dots = [
        { x:0.18,y:0.28,r:4,c:"#FF6B6B" }, { x:0.48,y:0.58,r:3.5,c:"#4ECDC4" },
        { x:0.73,y:0.2, r:3,  c:"#45B7D1" }, { x:0.32,y:0.72,r:4,  c:"#96CEB4" },
        { x:0.62,y:0.48,r:3,  c:"#DDA0DD" }, { x:0.1, y:0.55,r:3.5,c:"#FFEAA7" },
        { x:0.83,y:0.68,r:3,  c:"#BB8FCE" }, { x:0.43,y:0.15,r:4,  c:"#F7DC6F" },
        { x:0.9, y:0.35,r:2.5,c:"#98D8C8" }, { x:0.25,y:0.42,r:3,  c:"#F8B4BC" },
      ];
      for (const d of dots) {
        ctx.beginPath(); ctx.arc(d.x*W,d.y*H,d.r,0,Math.PI*2); ctx.fillStyle=d.c; ctx.fill();
      }
      ctx.strokeStyle="rgba(120,120,140,0.18)"; ctx.lineWidth=1;
      for (let i=0;i<dots.length;i++) for (let j=i+1;j<dots.length;j++) {
        const dx=dots[j].x-dots[i].x, dy=dots[j].y-dots[i].y;
        if (dx*dx+dy*dy<0.14) {
          ctx.beginPath(); ctx.moveTo(dots[i].x*W,dots[i].y*H); ctx.lineTo(dots[j].x*W,dots[j].y*H); ctx.stroke();
        }
      }
    },
  },
  {
    id: "space",
    label: "Space",
    desc: "Planets, stars & a rocket",
    paint: (ctx, W, H) => {
      /* Background */
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0,"#2e1065"); bg.addColorStop(1,"#1e1b4b");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      /* 4-point cartoon stars */
      const starPts = [[0.12,0.12],[0.35,0.06],[0.55,0.18],[0.78,0.08],[0.9,0.22],
                       [0.18,0.38],[0.66,0.38],[0.88,0.5],[0.08,0.55],[0.42,0.55]];
      ctx.fillStyle="#fde68a";
      for (const [sx,sy] of starPts) {
        const r=3+Math.random()*2.5, x=sx*W, y=sy*H;
        ctx.beginPath();
        for (let i=0;i<8;i++) {
          const a=(i/8)*Math.PI*2, len=i%2===0?r:r*0.38;
          i===0?ctx.moveTo(x+Math.cos(a)*len,y+Math.sin(a)*len):ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);
        }
        ctx.closePath(); ctx.fill();
      }

      /* Saturn */
      const px=W*0.72, py=H*0.26, r=W*0.085;
      ctx.save(); ctx.translate(px,py);
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
      ctx.fillStyle="#fcd34d"; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.clip();
      for (let i=0;i<5;i++) {
        ctx.fillStyle=i%2?"#f59e0b":"#fde68a";
        ctx.fillRect(-r,-r+i*(r*2/5),r*2,r*2/5);
      }
      ctx.restore();
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
      ctx.strokeStyle="rgba(0,0,0,0.15)"; ctx.lineWidth=2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,0,r*1.8,r*0.35,0.3,0,Math.PI*2);
      ctx.strokeStyle="rgba(200,150,60,0.7)"; ctx.lineWidth=5; ctx.stroke();
      ctx.restore();

      /* Small purple planet */
      ctx.save(); ctx.translate(W*0.2,H*0.28);
      ctx.beginPath(); ctx.arc(0,0,W*0.055,0,Math.PI*2);
      ctx.fillStyle="#a78bfa"; ctx.fill();
      ctx.strokeStyle="rgba(0,0,0,0.12)"; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();

      /* Cartoon rocket */
      ctx.save(); ctx.translate(W*0.52,H*0.62); ctx.rotate(-0.35);
      const sc=Math.min(W,H)*0.045;
      // body
      ctx.fillStyle="#f0f4ff";
      ctx.beginPath(); ctx.roundRect(-sc*0.5,-sc*1.3,sc,sc*2,sc*0.45); ctx.fill();
      ctx.strokeStyle="#b0bcd4"; ctx.lineWidth=1.5; ctx.stroke();
      // nose
      ctx.beginPath(); ctx.moveTo(-sc*0.5,-sc*1.3); ctx.quadraticCurveTo(0,-sc*2.5,sc*0.5,-sc*1.3);
      ctx.fillStyle="#f472b6"; ctx.fill();
      // window
      ctx.beginPath(); ctx.arc(0,-sc*0.4,sc*0.3,0,Math.PI*2);
      ctx.fillStyle="#7dd3fc"; ctx.fill();
      ctx.strokeStyle="#38bdf8"; ctx.lineWidth=1; ctx.stroke();
      // fins
      ctx.fillStyle="#818cf8";
      ctx.beginPath(); ctx.moveTo(-sc*0.5,sc*0.7); ctx.lineTo(-sc*1,sc*1.3); ctx.lineTo(-sc*0.5,sc*1.1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sc*0.5,sc*0.7); ctx.lineTo(sc*1,sc*1.3); ctx.lineTo(sc*0.5,sc*1.1); ctx.closePath(); ctx.fill();
      // flame
      ctx.beginPath(); ctx.moveTo(-sc*0.28,sc*1.3); ctx.quadraticCurveTo(0,sc*1.6,sc*0.28,sc*1.3);
      ctx.quadraticCurveTo(sc*0.12,sc*1.9,0,sc*2); ctx.quadraticCurveTo(-sc*0.12,sc*1.9,-sc*0.28,sc*1.3);
      ctx.fillStyle="#fbbf24"; ctx.fill();
      ctx.restore();

      /* Moon crescent */
      ctx.save(); ctx.translate(W*0.15,H*0.15);
      ctx.beginPath(); ctx.arc(0,0,W*0.05,0,Math.PI*2); ctx.fillStyle="#fde68a"; ctx.fill();
      ctx.beginPath(); ctx.arc(W*0.025,0,W*0.038,0,Math.PI*2); ctx.fillStyle="#2e1065"; ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "nature",
    label: "Nature",
    desc: "Hills, flowers & cartoon sun",
    paint: (ctx, W, H) => {
      /* Sky */
      const sk = ctx.createLinearGradient(0,0,0,H);
      sk.addColorStop(0,"#38bdf8"); sk.addColorStop(0.6,"#7dd3fc"); sk.addColorStop(1,"#22c55e");
      ctx.fillStyle=sk; ctx.fillRect(0,0,W,H);

      /* Sun with rays */
      const sx=W*0.78, sy=H*0.18, sr=H*0.1;
      ctx.strokeStyle="#fbbf24"; ctx.lineWidth=3; ctx.lineCap="round";
      for (let i=0;i<8;i++) {
        const a=(i/8)*Math.PI*2;
        ctx.beginPath();
        ctx.moveTo(sx+Math.cos(a)*(sr+4),sy+Math.sin(a)*(sr+4));
        ctx.lineTo(sx+Math.cos(a)*(sr+13),sy+Math.sin(a)*(sr+13));
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
      ctx.fillStyle="#fde68a"; ctx.fill();
      ctx.strokeStyle="#f59e0b"; ctx.lineWidth=2; ctx.stroke();
      /* smiley */
      ctx.fillStyle="#d97706";
      ctx.beginPath(); ctx.arc(sx-sr*0.3,sy-sr*0.15,sr*0.11,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+sr*0.3,sy-sr*0.15,sr*0.11,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx,sy+sr*0.1,sr*0.3,0.15,Math.PI-0.15);
      ctx.strokeStyle="#d97706"; ctx.lineWidth=2; ctx.stroke();

      /* Cloud */
      ctx.fillStyle="rgba(255,255,255,0.92)";
      for (const [ox,oy,r] of [[-20,5,16],[0,0,22],[20,5,16],[10,-10,17],[-10,-10,17]] as [number,number,number][]) {
        ctx.beginPath(); ctx.arc(W*0.28+ox,H*0.16+oy,r,0,Math.PI*2); ctx.fill();
      }

      /* Rolling hills */
      const hillData = [
        { yb:0.55, amp:0.1,  ph:0.8, c:"#4ade80" },
        { yb:0.63, amp:0.09, ph:1.8, c:"#22c55e" },
        { yb:0.70, amp:0.08, ph:0,   c:"#16a34a" },
        { yb:0.77, amp:0.06, ph:2.5, c:"#15803d" },
      ];
      for (const hl of hillData) {
        ctx.beginPath(); ctx.moveTo(0,H);
        for (let x=0;x<=W;x+=3) {
          const y = hl.yb*H + Math.sin((x/W)*Math.PI*3+hl.ph)*hl.amp*H
                    + Math.sin((x/W)*Math.PI*5+hl.ph*1.5)*hl.amp*0.35*H;
          ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H); ctx.closePath(); ctx.fillStyle=hl.c; ctx.fill();
      }

      /* Ground */
      ctx.fillStyle="#14532d"; ctx.fillRect(0,H*0.86,W,H*0.14);

      /* Cartoon trees (lollipops) */
      for (const [tx] of [[W*0.1],[W*0.88]] as [number][]) {
        const ty=H*0.85, sc=Math.min(W,H)*0.04;
        ctx.fillStyle="#92400e";
        ctx.beginPath(); ctx.roundRect(tx-sc*0.3,ty-sc*1.8,sc*0.6,sc*2,sc*0.2); ctx.fill();
        ctx.fillStyle="#16a34a";
        ctx.beginPath(); ctx.arc(tx,ty-sc*2.2,sc*1.4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#15803d";
        ctx.beginPath(); ctx.arc(tx-sc*0.7,ty-sc*1.8,sc*0.9,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx+sc*0.7,ty-sc*1.8,sc*0.9,0,Math.PI*2); ctx.fill();
      }

      /* Cartoon flowers */
      const flowerData = [[0.25,"#f43f5e"],[0.42,"#a855f7"],[0.58,"#f97316"],[0.72,"#ec4899"]] as [number,string][];
      for (const [fx, fc] of flowerData) {
        const bx=fx*W, by=H*0.86, sc=Math.min(W,H)*0.012;
        ctx.strokeStyle="#16a34a"; ctx.lineWidth=sc; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.quadraticCurveTo(bx+sc*2,by-sc*6,bx,by-sc*12); ctx.stroke();
        for (let i=0;i<6;i++) {
          const a=(i/6)*Math.PI*2;
          ctx.beginPath();
          ctx.ellipse(bx+Math.cos(a)*sc*3,by-sc*12+Math.sin(a)*sc*3,sc*2.5,sc*1.5,a,0,Math.PI*2);
          ctx.fillStyle=fc; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(bx,by-sc*12,sc*2,0,Math.PI*2);
        ctx.fillStyle="#fde68a"; ctx.fill();
      }

      /* Birds */
      ctx.strokeStyle="rgba(15,30,60,0.65)"; ctx.lineWidth=1.8; ctx.lineCap="round";
      for (const [bx,by] of [[W*0.38,H*0.3],[W*0.48,H*0.26],[W*0.43,H*0.34]] as [number,number][]) {
        ctx.beginPath(); ctx.moveTo(bx-7,by+3); ctx.quadraticCurveTo(bx-3,by,bx,by);
        ctx.quadraticCurveTo(bx+3,by,bx+7,by+3); ctx.stroke();
      }
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    desc: "Waves, fish & a sailboat",
    paint: (ctx, W, H) => {
      /* Sky */
      const sk = ctx.createLinearGradient(0,0,0,H*0.5);
      sk.addColorStop(0,"#0ea5e9"); sk.addColorStop(1,"#38bdf8");
      ctx.fillStyle=sk; ctx.fillRect(0,0,W,H);

      /* Sun */
      const sx=W*0.72, sy=H*0.18, sr=H*0.095;
      ctx.strokeStyle="#fbbf24"; ctx.lineWidth=3; ctx.lineCap="round";
      for (let i=0;i<8;i++) {
        const a=(i/8)*Math.PI*2;
        ctx.beginPath();
        ctx.moveTo(sx+Math.cos(a)*(sr+4),sy+Math.sin(a)*(sr+4));
        ctx.lineTo(sx+Math.cos(a)*(sr+13),sy+Math.sin(a)*(sr+13));
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
      ctx.fillStyle="#fde68a"; ctx.fill();
      ctx.strokeStyle="#f59e0b"; ctx.lineWidth=2; ctx.stroke();

      /* Cloud */
      ctx.fillStyle="rgba(255,255,255,0.92)";
      for (const [ox,oy,r] of [[-18,4,14],[0,0,20],[18,4,14],[9,-9,15],[-9,-9,15]] as [number,number,number][]) {
        ctx.beginPath(); ctx.arc(W*0.22+ox,H*0.14+oy,r,0,Math.PI*2); ctx.fill();
      }

      /* Sun reflection */
      const rg = ctx.createLinearGradient(sx,H*0.47,sx,H);
      rg.addColorStop(0,"rgba(253,230,138,0.25)"); rg.addColorStop(1,"rgba(253,230,138,0)");
      ctx.fillStyle=rg; ctx.fillRect(sx-30,H*0.47,60,H*0.53);

      /* Ocean base */
      const og = ctx.createLinearGradient(0,H*0.47,0,H);
      og.addColorStop(0,"#0284c7"); og.addColorStop(1,"#075985");
      ctx.fillStyle=og; ctx.fillRect(0,H*0.47,W,H*0.53);

      /* Cartoon waves (back to front) */
      const waves = [
        {yF:0.47,amp:0.025,freq:0.035,c:"#0369a1",a:1.0},
        {yF:0.55,amp:0.022,freq:0.048,c:"#0284c7",a:0.9},
        {yF:0.63,amp:0.018,freq:0.060,c:"#0ea5e9",a:0.8},
        {yF:0.72,amp:0.014,freq:0.075,c:"#38bdf8",a:0.7},
        {yF:0.82,amp:0.010,freq:0.090,c:"#7dd3fa",a:0.6},
      ];
      for (const wl of waves) {
        const by=wl.yF*H, amp=wl.amp*H;
        ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(0,by);
        for (let x=0;x<=W;x+=3) {
          const y=by+Math.sin(x*wl.freq)*amp+Math.sin(x*wl.freq*1.5+1)*amp*0.35;
          ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H); ctx.closePath();
        ctx.globalAlpha=wl.a; ctx.fillStyle=wl.c; ctx.fill();
        /* foam */
        ctx.globalAlpha=wl.a*0.4;
        ctx.strokeStyle="#ffffff"; ctx.lineWidth=2; ctx.setLineDash([8,14]);
        ctx.beginPath();
        for (let x=0;x<=W;x+=3) {
          const y=by+Math.sin(x*wl.freq)*amp+Math.sin(x*wl.freq*1.5+1)*amp*0.35;
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.globalAlpha=1;

      /* Sailboat */
      const bx=W*0.18, by=H*0.45, sc=Math.min(W,H)*0.045;
      ctx.fillStyle="#f1f5f9";
      ctx.beginPath();
      ctx.moveTo(bx-sc*1.4,by); ctx.lineTo(bx-sc,by+sc*0.6); ctx.lineTo(bx+sc,by+sc*0.6); ctx.lineTo(bx+sc*1.4,by);
      ctx.closePath(); ctx.fill(); ctx.strokeStyle="#94a3b8"; ctx.lineWidth=1.5; ctx.stroke();
      ctx.strokeStyle="#64748b"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx,by-sc*2.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx,by-sc*2); ctx.lineTo(bx-sc*1.3,by); ctx.lineTo(bx,by); ctx.closePath();
      ctx.fillStyle="#fef3c7"; ctx.fill(); ctx.strokeStyle="#d97706"; ctx.lineWidth=1; ctx.stroke();

      /* Cartoon fish */
      const fishes = [[0.38,0.52,"#f87171",false],[0.62,0.64,"#34d399",true],[0.8,0.72,"#fbbf24",false]] as [number,number,string,boolean][];
      for (const [fx,fy,fc,flip] of fishes) {
        const fxw=fx*W, fyw=fy*H, fsc=Math.min(W,H)*0.028;
        ctx.save(); ctx.translate(fxw,fyw); if(flip) ctx.scale(-1,1);
        ctx.beginPath(); ctx.ellipse(0,0,fsc*1.4,fsc*0.75,0,0,Math.PI*2);
        ctx.fillStyle=fc; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-fsc*1.1,0); ctx.lineTo(-fsc*1.9,-fsc*0.7); ctx.lineTo(-fsc*1.9,fsc*0.7); ctx.closePath();
        ctx.fillStyle=fc; ctx.fill();
        ctx.beginPath(); ctx.arc(fsc*0.8,-fsc*0.2,fsc*0.22,0,Math.PI*2);
        ctx.fillStyle="#fff"; ctx.fill();
        ctx.beginPath(); ctx.arc(fsc*0.88,-fsc*0.2,fsc*0.12,0,Math.PI*2);
        ctx.fillStyle="#1e293b"; ctx.fill();
        ctx.restore();
      }

      /* Seagulls */
      ctx.strokeStyle="rgba(15,30,60,0.65)"; ctx.lineWidth=2; ctx.lineCap="round";
      for (const [gx,gy] of [[W*0.4,H*0.28],[W*0.52,H*0.24],[W*0.46,H*0.33]] as [number,number][]) {
        ctx.beginPath(); ctx.moveTo(gx-8,gy+4); ctx.quadraticCurveTo(gx-3,gy,gx,gy);
        ctx.quadraticCurveTo(gx+3,gy,gx+8,gy+4); ctx.stroke();
      }
    },
  },
];

function ThemeCard({ theme, active, onSelect }: { theme: typeof THEMES[0]; active: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = c.offsetWidth || 200;
    c.height = c.offsetHeight || 112;
    const ctx = c.getContext("2d");
    if (ctx) theme.paint(ctx, c.width, c.height);
  }, [theme]);

  return (
    <button
      onClick={onSelect}
      className="relative rounded-2xl overflow-hidden text-left transition-all"
      style={{
        border: active ? "2.5px solid #60a5fa" : "2.5px solid rgba(255,255,255,0.1)",
        boxShadow: active ? "0 0 0 4px rgba(96,165,250,0.25)" : "none",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div className="w-full aspect-video relative">
        <canvas ref={ref} className="w-full h-full block" />
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: "rgba(96,165,250,0.85)" }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="5" stroke="white" strokeWidth="1.2"/>
                <path d="M3 5.5l1.7 1.7 3.3-3.4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Active
            </div>
          </div>
        )}
      </div>
      <div className="px-3 pt-2 pb-2.5">
        <div className="text-white/90 text-sm font-semibold">{theme.label}</div>
        <div className="text-white/45 text-xs mt-0.5">{theme.desc}</div>
      </div>
    </button>
  );
}

export function ThemeSelector({ open, onClose }: ThemeSelectorProps) {
  const { bgTheme, setBgTheme } = useBgTheme();
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-end justify-center pb-8 px-4" style={{ zIndex: 200 }} onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "rgba(8,8,20,0.88)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(28px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>
        <div className="px-5 pb-6 pt-2">
          <h2 className="text-white/90 text-lg font-bold tracking-tight mb-0.5">Background Theme</h2>
          <p className="text-white/40 text-sm mb-5">Pick an animated background for your chat</p>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((th) => (
              <ThemeCard
                key={th.id}
                theme={th}
                active={bgTheme === th.id}
                onSelect={() => { setBgTheme(th.id); onClose(); }}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full py-3 rounded-xl text-white/45 text-sm font-medium transition hover:text-white/75"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
