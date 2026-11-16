import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Franchise } from '../stores/useGameStore';
import type { Player } from '../types/common';
import { getPlayerAvatar } from '../lib/playerImages';

type DeskTeam = Pick<Franchise, 'id' | 'name' | 'shortName' | 'color' | 'logo' | 'purse'>;

interface AuctionBroadcastStageProps {
  franchises: DeskTeam[];
  leadingTeamId: string | null;
  selectedTeamId: string | null;
  player: Player | null;
  playerImage: string;
  currentBid: number;
  phase: string;
  timer: number;
}

function BidPaddle({ team, leading, selected }: { team: DeskTeam; leading: boolean; selected: boolean }) {
  const paddle = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!paddle.current) return;
    const target = leading ? -0.08 : -1.22;
    paddle.current.rotation.x = THREE.MathUtils.damp(paddle.current.rotation.x, target, 8, delta);
  });

  return (
    <group ref={paddle} position={[0, 1.25, 0.95]}>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.86, 1.02, 0.12]} />
        <meshStandardMaterial color={leading ? '#f5b82e' : selected ? '#dbeafe' : '#26364e'} emissive={leading ? '#9a6411' : '#071426'} emissiveIntensity={leading ? 0.42 : 0.1} roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.48, 0.075]}>
        <boxGeometry args={[0.68, 0.84, 0.015]} />
        <meshBasicMaterial color={team.color || '#26364e'} />
      </mesh>
      <Html position={[0, 0.48, 0.1]} center distanceFactor={13}>
        <div style={{
          minWidth: 54, padding: '5px 8px', borderRadius: 7,
          background: 'rgba(4,12,27,.92)', border: '1px solid rgba(255,255,255,.28)',
          color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: 900,
          letterSpacing: 1, whiteSpace: 'nowrap', boxShadow: '0 4px 18px rgba(0,0,0,.4)',
        }}>
          {team.shortName}
          {leading ? <div style={{ color: '#f5b82e', fontSize: 9, marginTop: 2 }}>HIGH BID</div> : null}
        </div>
      </Html>
    </group>
  );
}

function FranchiseDesk({
  team, index, count, leading, selected,
}: {
  team: DeskTeam; index: number; count: number; leading: boolean; selected: boolean;
}) {
  const leftCount = Math.ceil(count / 2);
  const onLeft = index < leftCount;
  const sideIndex = onLeft ? index : index - leftCount;
  const sideCount = onLeft ? leftCount : count - leftCount;
  const z = sideCount <= 1 ? 0 : -10 + (sideIndex / (sideCount - 1)) * 19;
  const x = onLeft ? -12.8 : 12.8;

  return (
    <group position={[x, 0, z]} rotation={[0, onLeft ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh position={[0, 0.93, 0]}>
        <boxGeometry args={[3.8, 0.28, 2.25]} />
        <meshStandardMaterial color="#18283e" roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.49, 0.86]}>
        <boxGeometry args={[3.45, 0.78, 0.14]} />
        <meshStandardMaterial color={team.color || '#24344e'} roughness={0.5} metalness={0.18} />
      </mesh>
      {[-1.55, 1.55].map((leg) => (
        <mesh key={leg} position={[leg, 0.43, 0]}>
          <boxGeometry args={[0.2, 0.86, 1.7]} />
          <meshStandardMaterial color="#68758b" metalness={0.45} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 0.99, 0.45]}>
        <boxGeometry args={[1.2, 0.08, 0.3]} />
        <meshStandardMaterial color={leading ? '#f5b82e' : '#8092aa'} emissive={leading ? '#a16a12' : '#000000'} />
      </mesh>
      <BidPaddle team={team} leading={leading} selected={selected} />
      <Html position={[0, 2.15, -0.1]} center distanceFactor={15}>
        <div style={{
          width: 128, padding: '7px 8px', borderRadius: 10, color: '#fff',
          background: 'rgba(4,12,27,.92)',
          border: leading ? '1px solid #f5b82e' : '1px solid rgba(148,163,184,.35)',
          boxShadow: leading ? '0 0 20px rgba(245,184,46,.3)' : '0 5px 18px rgba(0,0,0,.3)',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'Arial,sans-serif', whiteSpace: 'nowrap',
        }}>
          {team.logo ? <img src={team.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} /> : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 900, lineHeight: 1.1 }}>{team.shortName}</div>
            <div style={{ color: '#b9c5d7', fontSize: 8, marginTop: 3 }}>₹{(team.purse / 10000000).toFixed(1)} Cr left</div>
            {leading ? <div style={{ color: '#f5b82e', fontSize: 8, fontWeight: 900, marginTop: 2 }}>LEADING BID</div> : null}
          </div>
        </div>
      </Html>
    </group>
  );
}

function AuctionRoomScene(props: AuctionBroadcastStageProps) {
  const { franchises, leadingTeamId, selectedTeamId, player, playerImage, currentBid, phase, timer } = props;
  return (
    <>
      <color attach="background" args={['#071426']} />
      <fog attach="fog" args={['#071426', 34, 72]} />
      <ambientLight intensity={1.45} />
      <directionalLight position={[-7, 14, 13]} intensity={1.8} />
      <pointLight position={[0, 8, -4]} intensity={2.2} color="#528dd2" distance={30} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[29, 80]} />
        <meshStandardMaterial color="#101f35" roughness={0.8} metalness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[3.1, 3.55, 64]} />
        <meshBasicMaterial color="#e3b34c" />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[2.8, 3.1, 0.9, 48]} />
        <meshStandardMaterial color="#253b59" roughness={0.4} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[2.45, 2.8, 0.16, 48]} />
        <meshStandardMaterial color="#f5b82e" emissive="#7d4b0c" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 1.55, -4.2]}>
        <boxGeometry args={[12, 3.8, 0.4]} />
        <meshStandardMaterial color="#10243e" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.6, -3.97]}>
        <boxGeometry args={[11.5, 3.25, 0.04]} />
        <meshBasicMaterial color="#102f53" />
      </mesh>
      {franchises.map((team, index) => (
        <FranchiseDesk key={team.id} team={team} index={index} count={franchises.length} leading={team.id === leadingTeamId} selected={team.id === selectedTeamId} />
      ))}
      <Html position={[0, 3.25, 0.5]} center distanceFactor={14}>
        <div style={{
          width: 220, padding: 10, borderRadius: 14,
          background: 'linear-gradient(160deg, rgba(13,29,50,.98), rgba(3,10,22,.97))',
          border: '1px solid rgba(245,184,46,.72)',
          boxShadow: '0 0 34px rgba(245,184,46,.22),0 12px 32px rgba(0,0,0,.55)',
          color: '#fff', textAlign: 'center', fontFamily: 'Arial,sans-serif',
        }}>
          {player ? (
            <>
              <img
                src={playerImage || getPlayerAvatar(player.name)}
                alt={player.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getPlayerAvatar(player.name);
                }}
                style={{
                  display: 'block', width: 112, height: 132, borderRadius: 10,
                  objectFit: 'cover', margin: '0 auto 8px',
                  border: '2px solid rgba(245,184,46,.8)', background: '#162238',
                }}
              />
              <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.15 }}>{player.name}</div>
              <div style={{ color: '#aabbd1', fontSize: 10, marginTop: 3 }}>
                {player.role || 'Player'} · {player.nationality || 'Squad player'}
              </div>
            </>
          ) : <div style={{ padding: '34px 0', color: '#dce7f5', fontWeight: 900 }}>PLAYER AUCTION</div>}
          <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <div style={{ color: '#f5b82e', fontSize: 9, fontWeight: 900, letterSpacing: 1.4 }}>
              {phase === 'bidding' ? 'LIVE BIDDING' : phase.toUpperCase()}
            </div>
            <div style={{ fontSize: 23, fontWeight: 900, marginTop: 2 }}>₹{(currentBid / 10000000).toFixed(2)} Cr</div>
            {phase === 'bidding' ? <div style={{ color: timer <= 5 ? '#fb7185' : '#b7c7da', fontSize: 10 }}>{timer}s remaining</div> : null}
          </div>
        </div>
      </Html>
    </>
  );
}

export default function AuctionBroadcastStage(props: AuctionBroadcastStageProps) {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-3xl border border-[#e6b34b]/30 bg-[#071426] shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:h-[420px]">
      <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-lg border border-[#f5b82e]/40 bg-[#071426]/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f5b82e] backdrop-blur">
        CRIC ARENA · LIVE AUCTION BROADCAST
      </div>
      <Canvas dpr={[0.6, 0.9]} gl={{ antialias: false, powerPreference: 'high-performance' }} camera={{ position: [0, 12, 27], fov: 43, near: 0.1, far: 100 }}>
        <AuctionRoomScene {...props} />
      </Canvas>
    </div>
  );
}
