/**
 * End-to-end timing check: mounts the REAL CricketActionVisualizer and feeds it a sequence of deliveries.
 * Each next delivery is only supplied after onPlaybackComplete fires (exactly as the match engine does).
 * window.__arenaGateLog records when movement started/ended, the ball return ended and the gate released.
 */
import React, { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import CricketActionVisualizer from '../../src/components/CricketActionVisualizer';

(window as any).__arenaGateLog = [];
(window as any).__arenaProbe = { rec: [] };
const q = new URLSearchParams(location.search);
const speed = parseFloat(q.get('speed') || '1');

const P = (id: string, name: string, role: any = 'Batsman') => ({ id, name, role, nationality: 'Indian', rating: 80, basePrice: 1 } as any);
const striker = P('s1', 'Virat Kohli'); const nonStriker = P('s2', 'Rohit Sharma'); const bowler = { ...P('b1', 'Ravindra Jadeja', 'Bowler'), bowlingStyle: 'Left-arm orthodox' };
const base = { ballNumber: 1, overIndex: 0, ballInOver: 1, strikerId: 's1', strikerName: 'Virat Kohli', nonStrikerId: 's2', nonStrikerName: 'Rohit Sharma', bowlerId: 'b1', bowlerName: 'Pat Cummins',
  legalBall: true, batterRuns: 0, extraRuns: 0, totalRuns: 0, wicket: false, shotType: 'Drive', targetZone: 'Cover', resultType: 'DOT', commentary: '', timestamp: 0, strikeRotated: false, overCompleted: false } as any;
const path = (tx: number, ty: number, aerial = false) => ({ start: { x: 300, y: 410 }, bounce: { x: 300, y: 330 }, contact: { x: 300, y: 195 }, target: { x: tx, y: ty }, isAerial: aerial, apexHeight: aerial ? 9 : 0 });
const SEQ = [
  { name: 'dot', d: { ...base, id: 'd1', ballPath: path(300, 225) } },
  { name: '2 runs', d: { ...base, id: 'd2', totalRuns: 2, batterRuns: 2, resultType: 'RUNS', ballPath: path(430, 270) } },
  { name: 'four', d: { ...base, id: 'd3', totalRuns: 4, batterRuns: 4, resultType: 'FOUR', ballPath: path(555, 300) } },
  { name: 'six', d: { ...base, id: 'd3b', totalRuns: 6, batterRuns: 6, resultType: 'SIX', ballPath: path(430, 575, true) } },
  { name: 'bowled', d: { ...base, id: 'd3c', wicket: true, wicketType: 'Bowled', dismissedPlayerId: 's1', dismissedPlayerName: 'Virat Kohli', resultType: 'WICKET', ballPath: path(300, 200) } },
  { name: 'wicket', d: { ...base, id: 'd4', wicket: true, wicketType: 'Caught', dismissedPlayerId: 's1', dismissedPlayerName: 'Virat Kohli', resultType: 'WICKET', ballPath: path(390, 235, true) } },
  { name: 'single', d: { ...base, id: 'd5', totalRuns: 1, batterRuns: 1, resultType: 'RUNS', strikeRotated: true, ballPath: path(350, 250) } },
];
const results: any[] = [];
function analyse() {
  const rec: any[] = (window as any).__arenaProbe.rec;
  const d3 = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const contact = rec.filter((r) => r.attract > 0.95 && r.bat);
  const corr = contact.map((r) => d3(r.raw, r.bat));
  let maxStepDrawn = 0, maxStepRaw = 0;
  for (let i = 1; i < rec.length; i++) { if (rec[i].t - rec[i - 1].t > 200) continue; maxStepDrawn = Math.max(maxStepDrawn, d3(rec[i].drawn, rec[i - 1].drawn)); maxStepRaw = Math.max(maxStepRaw, d3(rec[i].raw, rec[i - 1].raw)); }
  return { frames: rec.length, contactFrames: contact.length, correctionMax: Math.max(0, ...corr), correctionMean: corr.length ? corr.reduce((a, b) => a + b, 0) / corr.length : 0, maxStepDrawn, maxStepRaw };
}

function App() {
  const [idx, setIdx] = useState(0);
  const t0 = useRef(performance.now());
  const onDone = useCallback(() => {
    const now = performance.now();
    results.push({ name: SEQ[idx].name, ms: Math.round(now - t0.current) });
    (window as any).__arenaGateLog.push({ t: now, e: 'parent:next-delivery-allowed' });
    if (idx + 1 < SEQ.length) { t0.current = now; setIdx(idx + 1); } else { (window as any).__results = results; (window as any).__probe = analyse(); (window as any).__done = true; }
  }, [idx]);
  return (
    <div style={{ position: 'relative', width: 1500, height: 900 }}>
      <CricketActionVisualizer
        key="v"
        striker={striker} nonStriker={nonStriker} bowler={bowler}
        deliveryResult={SEQ[idx].d}
        lifecycle={'BALL_READY' as any}
        onPlaybackComplete={onDone}
        format={'T20' as any}
        battingTeamName="India" bowlingTeamName="Australia"
        score={{ runs: 0, wickets: 0, overs: 0, balls: 0 }}
        playbackSpeed={speed as any}
        hideTopHeader hideSideAndBottomPanels
      />
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
setTimeout(() => { if (!(window as any).__done) { (window as any).__results = results; (window as any).__timeout = true; (window as any).__done = true; } }, parseInt(q.get('wait') || '90000'));
