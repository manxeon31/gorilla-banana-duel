import React from "react";\nimport { createRoot } from "react-dom/client";\nimport "./style.css";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "deathmatch" | "five";
type Player = 0 | 1;
type Shot = { x: number; y: number; vx: number; vy: number; owner: Player; rotation: number };

const W = 1100, H = 580, GROUND = 508, GRAVITY = 330, GORILLA_W = 72, GORILLA_H = 92;
const controls = [
  { move: "A / D", angle: "W / S", power: "Q / E", throw: "SPACE" },
  { move: "← / →", angle: "↑ / ↓", power: "N / M", throw: "ENTER" },
];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const shotsRef = useRef<Shot[]>([]);
  const positionsRef = useRef<[number, number]>([145, 883]);
  const keysRef = useRef(new Set<string>());
  const throwLockRef = useRef<[boolean, boolean]>([false, false]);
  const runningRef = useRef(false);
  const modeRef = useRef<Mode>("deathmatch");
  const activeRef = useRef<Player>(0);
  const scoreRef = useRef<[number, number]>([0, 0]);
  const throwsRef = useRef<[number, number]>([0, 0]);
  const [mode, setMode] = useState<Mode>("deathmatch");
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [throws, setThrows] = useState<[number, number]>([0, 0]);
  const [active, setActive] = useState<Player>(0);
  const [time, setTime] = useState(60);
  const [angles, setAngles] = useState<[number, number]>([48, 48]);
  const [powers, setPowers] = useState<[number, number]>([68, 68]);
  const valuesRef = useRef({ angles, powers });
  const [message, setMessage] = useState("Choose a mode and start the duel");

  useEffect(() => { valuesRef.current = { angles, powers }; }, [angles, powers]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const finish = useCallback(() => {
    runningRef.current = false; setRunning(false); shotsRef.current = [];
    const s = scoreRef.current;
    setMessage(s[0] === s[1] ? `Draw — ${s[0]} to ${s[1]}` : `Player ${s[0] > s[1] ? 1 : 2} wins — ${Math.max(...s)} to ${Math.min(...s)}`);
  }, []);

  const reset = useCallback(() => {
    scoreRef.current = [0, 0]; throwsRef.current = [0, 0]; activeRef.current = 0;
    positionsRef.current = [145, 883]; shotsRef.current = [];
    setScore([0, 0]); setThrows([0, 0]); setActive(0); setTime(60);
    setMessage(modeRef.current === "deathmatch" ? "60 seconds. Fire at will!" : "Player 1 takes the first shot");
    runningRef.current = true; setRunning(true); lastRef.current = performance.now();
  }, []);

  const registerMiss = useCallback((owner: Player) => {
    if (modeRef.current !== "five") return;
    const next: Player = owner === 0 ? 1 : 0;
    activeRef.current = next; setActive(next);
    if (throwsRef.current[0] + throwsRef.current[1] >= 10) finish();
    else setMessage(`Miss. Player ${next + 1}'s turn`);
  }, [finish]);

  const throwBanana = useCallback((player: Player) => {
    if (!runningRef.current) return;
    if (modeRef.current === "five" && (activeRef.current !== player || shotsRef.current.length > 0 || throwsRef.current[player] >= 5)) return;
    const pos = positionsRef.current[player], angle = valuesRef.current.angles[player] * Math.PI / 180;
    const speed = valuesRef.current.powers[player] * 5.25, direction = player === 0 ? 1 : -1;
    shotsRef.current.push({ x: pos + GORILLA_W / 2 + direction * 32, y: GROUND - 72, vx: Math.cos(angle) * speed * direction, vy: -Math.sin(angle) * speed, owner: player, rotation: 0 });
    if (modeRef.current === "five") {
      const t: [number, number] = [...throwsRef.current] as [number, number]; t[player]++;
      throwsRef.current = t; setThrows(t); setMessage(`Player ${player + 1} launched banana ${t[player]} of 5`);
    }
  }, []);

  const drawGorilla = (ctx: CanvasRenderingContext2D, x: number, player: Player) => {
    const y = GROUND - GORILLA_H, team = player === 0 ? "#53d98c" : "#ff685d";
    ctx.save();
    ctx.translate(x + 36, y);
    ctx.scale(player === 0 ? 1 : -1, 1);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath(); ctx.ellipse(0, 96, 47, 9, 0, 0, Math.PI * 2); ctx.fill();
    // Oversized cartoon arms and knuckles.
    ctx.strokeStyle = "#30251f"; ctx.lineWidth = 18; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-19, 47); ctx.quadraticCurveTo(-35, 61, -40, 84); ctx.moveTo(19, 47); ctx.quadraticCurveTo(34, 51, 41, 71); ctx.stroke();
    ctx.fillStyle = "#6b5140"; ctx.beginPath(); ctx.arc(-42, 86, 11, 0, 7); ctx.arc(43, 74, 11, 0, 7); ctx.fill();
    // Barrel chest and crouched legs.
    ctx.fillStyle = "#3b2d25"; ctx.beginPath(); ctx.ellipse(0, 58, 34, 38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1d1714"; ctx.beginPath(); ctx.ellipse(-18, 88, 18, 13, -.18, 0, 7); ctx.ellipse(18, 88, 18, 13, .18, 0, 7); ctx.fill();
    ctx.fillStyle = team; ctx.beginPath(); ctx.roundRect(-27, 49, 54, 25, 8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "900 15px Arial"; ctx.textAlign = "center"; ctx.fillText(String(player + 1), 0, 67);
    // Brow, ears, muzzle and a clear inward-looking face.
    ctx.fillStyle = "#34271f"; ctx.beginPath(); ctx.arc(0, 22, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#705443"; ctx.beginPath(); ctx.arc(-24, 24, 8, 0, 7); ctx.arc(24, 24, 8, 0, 7); ctx.ellipse(4, 29, 16, 13, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#171311"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, 12); ctx.lineTo(-2, 10); ctx.moveTo(7, 10); ctx.lineTo(18, 13); ctx.stroke();
    ctx.fillStyle = "#f4efe8"; ctx.beginPath(); ctx.ellipse(-6, 18, 4, 5, 0, 0, 7); ctx.ellipse(9, 18, 4, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-4, 18, 2, 0, 7); ctx.arc(11, 18, 2, 0, 7); ctx.arc(0, 29, 2, 0, 7); ctx.arc(8, 29, 2, 0, 7); ctx.fill();
    ctx.strokeStyle = "#211814"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(4, 32, 9, .25, Math.PI - .1); ctx.stroke();
    ctx.restore();
  };

  const drawAimGuide = (ctx: CanvasRenderingContext2D, player: Player) => {
    const direction = player === 0 ? 1 : -1;
    const angle = valuesRef.current.angles[player] * Math.PI / 180;
    const x = positionsRef.current[player] + GORILLA_W / 2 + direction * 32;
    const y = GROUND - 72;
    const length = 78 + valuesRef.current.powers[player] * .8;
    const endX = x + Math.cos(angle) * length * direction;
    const endY = y - Math.sin(angle) * length;
    ctx.save();
    ctx.strokeStyle = player === 0 ? "rgba(83,217,140,.9)" : "rgba(255,104,93,.9)";
    ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(endX, endY, 5, 0, 7); ctx.fill();
    ctx.restore();
  };

  const drawPowerBar = (ctx: CanvasRenderingContext2D, player: Player) => {
    const x = positionsRef.current[player] + 4, y = GROUND - GORILLA_H - 24;
    const power = valuesRef.current.powers[player], color = player === 0 ? "#53d98c" : "#ff685d";
    ctx.save(); ctx.fillStyle = "rgba(5,9,15,.82)"; ctx.beginPath(); ctx.roundRect(x, y, 64, 13, 6); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, Math.max(5, 58 * power / 100), 7, 4); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "800 9px Arial"; ctx.textAlign = "center"; ctx.fillText(String(Math.round(power)), x + 32, y - 3); ctx.restore();
  };

  const drawControlLegend = (ctx: CanvasRenderingContext2D, player: Player) => {
    const left = player === 0 ? 24 : W - 350;
    const color = player === 0 ? "#53d98c" : "#ff685d";
    const keys = player === 0
      ? [["A D", "MOVE"], ["W S", "ANGLE"], ["Q E", "POWER"], ["SPACE", "THROW"]]
      : [["← →", "MOVE"], ["↑ ↓", "ANGLE"], ["N M", "POWER"], ["ENTER", "THROW"]];
    ctx.save();
    ctx.fillStyle = "rgba(7,12,21,.82)"; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(left, 20, 326, 54, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.font = "900 10px Arial"; ctx.textAlign = "left";
    ctx.fillText(`PLAYER ${player + 1} CONTROLS`, left + 10, 35);
    let x = left + 10;
    for (const [key, label] of keys) {
      ctx.fillStyle = "#f7f4e8"; ctx.font = "900 11px Arial"; ctx.fillText(key, x, 52);
      ctx.fillStyle = "#8d9aab"; ctx.font = "700 8px Arial"; ctx.fillText(label, x, 66);
      x += key.length > 4 ? 83 : 76;
    }
    ctx.restore();
  };

  const render = useCallback((now: number) => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return;
    const dt = Math.min((now - lastRef.current) / 1000 || 0, 0.035); lastRef.current = now;
    if (runningRef.current) {
      const keys = keysRef.current, p = positionsRef.current;
      if (keys.has("KeyA")) p[0] = Math.max(35, p[0] - 150 * dt);
      if (keys.has("KeyD")) p[0] = Math.min(430, p[0] + 150 * dt);
      if (keys.has("ArrowLeft")) p[1] = Math.max(600, p[1] - 150 * dt);
      if (keys.has("ArrowRight")) p[1] = Math.min(W - GORILLA_W - 35, p[1] + 150 * dt);
      setAngles(prev => { const n: [number, number] = [...prev] as [number, number];
        if (keys.has("KeyW")) n[0] = Math.min(85, n[0] + 40 * dt); if (keys.has("KeyS")) n[0] = Math.max(10, n[0] - 40 * dt);
        if (keys.has("ArrowUp")) n[1] = Math.min(85, n[1] + 40 * dt); if (keys.has("ArrowDown")) n[1] = Math.max(10, n[1] - 40 * dt); return n; });
      setPowers(prev => { const n: [number, number] = [...prev] as [number, number];
        if (keys.has("KeyE")) n[0] = Math.min(100, n[0] + 45 * dt); if (keys.has("KeyQ")) n[0] = Math.max(20, n[0] - 45 * dt);
        if (keys.has("KeyM")) n[1] = Math.min(100, n[1] + 45 * dt); if (keys.has("KeyN")) n[1] = Math.max(20, n[1] - 45 * dt); return n; });
      const remaining: Shot[] = [];
      for (const shot of shotsRef.current) {
        shot.vy += GRAVITY * dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.rotation += dt * 10;
        const target: Player = shot.owner === 0 ? 1 : 0, tx = p[target], ty = GROUND - GORILLA_H;
        const headHit = Math.hypot(shot.x - (tx + 36), shot.y - (ty + 22)) < 27;
        const bodyHit = shot.x > tx && shot.x < tx + GORILLA_W && shot.y > ty + 34 && shot.y < GROUND;
        if (headHit || bodyHit) {
          const points = headHit ? 2 : 1, s: [number, number] = [...scoreRef.current] as [number, number]; s[shot.owner] += points;
          scoreRef.current = s; setScore(s); setMessage(`${headHit ? "HEADSHOT" : "Hit"}! Player ${shot.owner + 1} +${points}`);
          if (modeRef.current === "five") { const next: Player = shot.owner === 0 ? 1 : 0; activeRef.current = next; setActive(next); if (throwsRef.current[0] + throwsRef.current[1] >= 10) setTimeout(finish, 450); }
          continue;
        }
        if (shot.y > GROUND || shot.x < -30 || shot.x > W + 30) { registerMiss(shot.owner); continue; }
        remaining.push(shot);
      }
      shotsRef.current = remaining;
    }
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#11182a"); sky.addColorStop(.65, "#243653"); sky.addColorStop(1, "#ff9c62"); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,220,160,.65)"; ctx.beginPath(); ctx.arc(550, 100, 46, 0, 7); ctx.fill(); ctx.fillStyle = "#172334";
    [0,105,230,350,490,625,760,905,1010].forEach((x, i) => { const h = [195,260,225,310,185,275,215,295,240][i]; ctx.fillRect(x, GROUND - h, 115, h); });
    ctx.fillStyle = "#ffd479"; for (let x=18;x<W;x+=38) for(let y=250;y<470;y+=38) if(((x+y)/38)%3<1) ctx.fillRect(x,y,7,11);
    ctx.fillStyle = "#101820"; ctx.fillRect(0, GROUND, W, H-GROUND);
    drawControlLegend(ctx, 0); drawControlLegend(ctx, 1);
    drawAimGuide(ctx, 0); drawAimGuide(ctx, 1);
    drawGorilla(ctx, positionsRef.current[0], 0); drawGorilla(ctx, positionsRef.current[1], 1);
    drawPowerBar(ctx, 0); drawPowerBar(ctx, 1);
    for (const shot of shotsRef.current) { ctx.save(); ctx.translate(shot.x, shot.y); ctx.rotate(shot.rotation); ctx.strokeStyle="#ffe044"; ctx.lineWidth=7; ctx.lineCap="round"; ctx.beginPath(); ctx.arc(0,0,12,.1,Math.PI*1.35); ctx.stroke(); ctx.restore(); }
    frameRef.current = requestAnimationFrame(render);
  }, [finish, registerMiss]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"].includes(e.code)) e.preventDefault(); keysRef.current.add(e.code);
      if (e.code === "Space" && !throwLockRef.current[0]) { throwLockRef.current[0] = true; throwBanana(0); }
      if (e.code === "Enter" && !throwLockRef.current[1]) { throwLockRef.current[1] = true; throwBanana(1); } };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.code); if(e.code === "Space") throwLockRef.current[0]=false; if(e.code === "Enter") throwLockRef.current[1]=false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); frameRef.current = requestAnimationFrame(render);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); if(frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [render, throwBanana]);

  useEffect(() => {
    if (!running || mode !== "deathmatch") return; const started = Date.now();
    const timer = setInterval(() => { const left = Math.max(0, 60 - Math.floor((Date.now()-started)/1000)); setTime(left); if(left===0){ clearInterval(timer); finish(); } }, 200);
    return () => clearInterval(timer);
  }, [running, mode, finish]);

  return <main className="game-shell">
    <header><div><p className="eyebrow">ROOFTOP RIVALRY</p><h1>GORILLA <span>BANANA</span> DUEL</h1></div><div className="mode-switch"><button className={mode==="deathmatch"?"selected":""} disabled={running} onClick={()=>setMode("deathmatch")}>60s Death Match</button><button className={mode==="five"?"selected":""} disabled={running} onClick={()=>setMode("five")}>5-Banana Match</button></div></header>
    <section className="scorebar"><div className="player p1"><strong>PLAYER 1</strong><b>{score[0]}</b></div><div className="status"><span>{mode==="deathmatch" ? `${time}s` : `${throws[0]} / 5  ·  ${throws[1]} / 5`}</span><p>{message}</p></div><div className="player p2"><b>{score[1]}</b><strong>PLAYER 2</strong></div></section>
    <div className="arena"><canvas ref={canvasRef} width={W} height={H} /></div>
    <section className="control-deck">
      {[0,1].map(i => <article key={i} className={`control-card p${i+1} ${mode==="five"&&running&&active===i?"active":""}`}><div className="control-title"><strong>PLAYER {i+1}</strong><span>{controls[i].throw} TO THROW</span></div><div className="gauges"><label>ANGLE <b>{Math.round(angles[i])}°</b><meter min="10" max="85" value={angles[i]} /></label><label>POWER <b>{Math.round(powers[i])}</b><meter min="20" max="100" value={powers[i]} /></label></div><p>Move <kbd>{controls[i].move}</kbd> · Angle <kbd>{controls[i].angle}</kbd> · Power <kbd>{controls[i].power}</kbd></p></article>)}
      <button className="start" onClick={reset}>{running ? "RESTART MATCH" : score[0]+score[1]>0 ? "PLAY AGAIN" : "START MATCH"}</button>
    </section><footer>Body hit <b>+1</b> · Headshot <b>+2</b> · Move, aim, charge, fire.</footer>
  </main>;
}
\n\ncreateRoot(document.getElementById("root")!).render(<Home />);\n