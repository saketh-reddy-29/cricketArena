/** Mounts the real CricketAction3DView so the full wiring (team + format -> kits in the stadium) can be screenshotted. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import CricketAction3DView from '../../src/components/CricketAction3DView';

const q = new URLSearchParams(location.search);
const bat = q.get('bat') || 'India';
const bowl = q.get('bowl') || 'Australia';
const fmt = q.get('fmt') || 'ODI';
const cam = (q.get('cam') || 'EA_BATTER') as any;
const day = q.get('day') === '1';
const stageP = (q.get('stage') || 'IDLE') as any;
const shotP = q.get('shot') || 'Cover Drive';
const runsP = parseInt(q.get('r') || '4');
(window as any).__arenaProbe = { rec: [] };
const trKind = q.get('tr') as 'WICKET' | 'RUNS' | null;
const trP = parseFloat(q.get('trp') || '0.5');

const F = (id: string, x: number, y: number, positionKey: string, extra: object = {}) => ({ id, name: id, role: positionKey, currentX: x, currentY: y, positionKey, ...extra });
const fielders = [
  F('bowler', 300, 410, 'BOWLER', { isBowler: true }),
  F('keeper', 300, 150, 'WICKETKEEPER', { isWicketkeeper: true }),
  F('slip', 262, 140, 'SLIP'), F('gully', 232, 160, 'GULLY'), F('point', 190, 215, 'POINT'), F('cover', 205, 285, 'COVER'),
  F('midoff', 255, 355, 'MID_OFF'), F('midon', 345, 355, 'MID_ON'), F('sqleg', 415, 215, 'SQUARE_LEG'),
  F('deepmid', 450, 290, 'DEEP_MIDWICKET'), F('fineleg', 390, 90, 'FINE_LEG'),
];
function App() {
  return (
    <div style={{ position: 'relative', width: 1500, height: 840 }}>
      <CricketAction3DView
        fielders={fielders as any}
        striker={{ id: 's', name: 'Striker', role: 'Striker', currentX: 300, currentY: 190 }}
        nonStriker={{ id: 'n', name: 'Non-striker', role: 'Non-striker', currentX: 300, currentY: 400 }}
        delivery={stageP === 'IDLE' ? null : { shotType: shotP, totalRuns: runsP, wicket: false, legalBall: true, batterRuns: runsP, ballPath: { isAerial: false } } as any}
        stage={stageP}
        progress={parseFloat(q.get('prog') || '0.55')}
        ballPos={{ x: 300, y: stageP === 'IDLE' ? 410 : 195 }}
        ballVisible={stageP !== 'IDLE'}
        ballScale={1}
        strikerPos={{ x: 300, y: 190 }}
        nonStrikerPos={{ x: 300, y: 400 }}
        bowlerPos={{ x: 300, y: 410 }}
        activeFielderAction={null}
        score={{ runs: 0, wickets: 0, overs: 0, balls: 0 }}
        battingTeamName={bat}
        bowlingTeamName={bowl}
        matchFormat={fmt}
        initialCameraMode={cam}
        initialDay={day}
        isLeftHanded={q.get('lh') === '1'}
        batterTransition={trKind ? { kind: trKind, progress: trP, runs: parseInt(q.get('runs') || '2') } : null}
      />
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
setTimeout(() => { (window as any).__done = true; }, parseInt(q.get('wait') || '9000'));
