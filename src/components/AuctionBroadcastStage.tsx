import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Franchise } from '../stores/useGameStore';
import type { Player } from '../types/common';
import { getPlayerAvatar } from '../lib/playerImages';
import { CharacterInstance, CharacterErrorBoundary } from '../characters/CharacterInstance';

const AUCTION_CHARACTER_MODEL = '/models/cricket-arena/cartoon_character_3d_model.glb';

// Warm the shared model cache before the auction room mounts its character instances.
useGLTF.preload(AUCTION_CHARACTER_MODEL);

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
  bidLog: Array<{ teamId: string; amount: number; timestamp: number }>;
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
      {/* Raised-backed delegate chair on the outer side of each franchise desk. */}
      <mesh position={[0, 0.57, -1.23]}>
        <boxGeometry args={[1.12, 0.16, 0.96]} />
        <meshStandardMaterial color="#111c31" roughness={0.65} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.15, -1.68]}>
        <boxGeometry args={[1.12, 1.16, 0.16]} />
        <meshStandardMaterial color="#182b4a" roughness={0.55} metalness={0.25} />
      </mesh>
      {[-0.43, 0.43].map((leg) => (
        <mesh key={leg} position={[leg, 0.29, -1.23]}>
          <boxGeometry args={[0.12, 0.58, 0.12]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
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

function AuctionGavel({ phase }: { phase: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const swing = phase === 'sold' ? Math.sin(state.clock.elapsedTime * 8) * 0.55 : Math.sin(state.clock.elapsedTime * 1.8) * 0.08;
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, swing, phase === 'sold' ? 10 : 3, delta);
  });
  return (
    <group ref={ref} position={[1.05, 2.25, 2.0]} rotation={[0, 0, -0.5]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.065, 0.075, 0.82, 12]} />
        <meshStandardMaterial color="#8b552d" roughness={0.42} />
      </mesh>
      <mesh position={[0.38, 0, 0]}>
        <boxGeometry args={[0.42, 0.28, 0.32]} />
        <meshStandardMaterial color="#c88b43" metalness={0.42} roughness={0.3} />
      </mesh>
      <mesh position={[-0.38, 0, 0]}>
        <boxGeometry args={[0.16, 0.22, 0.25]} />
        <meshStandardMaterial color="#c88b43" metalness={0.35} roughness={0.35} />
      </mesh>
    </group>
  );
}

function AuctionScreen({
  franchises, player, playerImage, currentBid, phase, timer, leadingTeam, bidLog,
}: AuctionBroadcastStageProps & { leadingTeam: DeskTeam | undefined }) {
  const basePriceCr = player?.price ? (player.price / 10000000).toFixed(2) : '2.00';
  const currentBidCr = (currentBid / 10000000).toFixed(2);

  return (
    <Html position={[0, 4.25, -3.62]} center distanceFactor={12}>
      <div style={{
        width: 560, minHeight: 280, padding: 14, boxSizing: 'border-box',
        display: 'grid', gridTemplateColumns: '136px minmax(0, 1fr) 150px', gap: 14, alignItems: 'center',
        position: 'relative', color: '#f7fbff', fontFamily: 'Arial,sans-serif',
        background: 'linear-gradient(135deg, rgba(18,40,105,.98), rgba(4,14,44,.99) 58%, rgba(5,32,90,.98))',
        border: phase === 'sold' ? '2.5px solid #f5b82e' : '2px solid rgba(115,181,255,.95)', borderRadius: 18,
        boxShadow: phase === 'sold'
          ? '0 0 0 6px rgba(245,184,46,.4), 0 0 45px rgba(245,184,46,.7), 0 20px 42px rgba(0,0,0,.6)'
          : '0 0 0 5px rgba(28,72,190,.3), 0 0 34px rgba(44,129,255,.65), 0 16px 38px rgba(0,0,0,.55)',
      }}>
        {/* SOLD Celebration Broadcast Banner */}
        {phase === 'sold' ? (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(8,24,65,0.95), rgba(4,12,36,0.97))',
            border: '2px solid #f5b82e', padding: '16px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 0 30px rgba(245,184,46,0.3)',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 20,
              background: 'linear-gradient(90deg, #b45309, #d97706, #f59e0b)', color: '#fff',
              fontSize: 12, fontWeight: 900, letterSpacing: 2.5, textTransform: 'uppercase',
              boxShadow: '0 4px 15px rgba(245,158,11,0.5)',
            }}>
              🏆 PLAYER SOLD 🏆
            </div>
            <div style={{ fontSize: 26, fontWeight: 1000, marginTop: 10, color: '#ffffff', textAlign: 'center' }}>
              {player?.name}
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>
              {player?.role} · {player?.nationality}
            </div>
            <div style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(2,8,26,0.85)', padding: '8px 18px', borderRadius: 12,
              border: '1px solid rgba(245,184,46,0.6)',
            }}>
              {leadingTeam?.logo ? (
                <img src={leadingTeam.logo} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              ) : null}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800 }}>SOLD TO</div>
                <div style={{ fontSize: 17, fontWeight: 1000, color: '#f5b82e' }}>
                  {leadingTeam?.name || 'FRANCHISE'}
                </div>
              </div>
              <div style={{ height: 28, width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800 }}>FINAL PRICE</div>
                <div style={{ fontSize: 20, fontWeight: 1000, color: '#ffffff' }}>
                  ₹{currentBidCr} Cr
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* UNSOLD Broadcast Stamp */}
        {phase === 'unsold' ? (
          <div style={{
            position: 'absolute', right: 14, top: 12, transform: 'rotate(-8deg)', zIndex: 10,
            border: '3px solid #ef4444', color: '#ef4444', borderRadius: 8,
            padding: '5px 12px', fontSize: 20, fontWeight: 1000, letterSpacing: 2,
            background: 'rgba(15,23,42,0.92)', textShadow: '0 0 12px rgba(239,68,68,0.5)',
          }}>UNSOLD</div>
        ) : null}

        {/* Player Photo Card */}
        <div style={{
          height: 180, borderRadius: 12, overflow: 'hidden',
          border: '2px solid rgba(245,184,46,.95)', background: '#0c1a38',
          boxShadow: '0 0 20px rgba(245,184,46,.25)', position: 'relative',
        }}>
          {player ? (
            <img src={playerImage || getPlayerAvatar(player.name)} alt={player.name}
              onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getPlayerAvatar(player.name); }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#a9c6ff', fontWeight: 900 }}>PLAYER</div>
          )}
          <div style={{
            position: 'absolute', bottom: 0, insetInline: 0, padding: '4px 6px',
            background: 'rgba(2,6,23,0.88)', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#93c5fd',
          }}>
            Base: ₹{basePriceCr} Cr
          </div>
        </div>

        {/* Center Nomination Details */}
        <div style={{ minWidth: 0, paddingTop: phase === 'sold' ? 25 : 0 }}>
          <div style={{ color: '#83c6ff', fontSize: 10, fontWeight: 900, letterSpacing: 2.8 }}>CRIC ARENA · LIVE IPL AUCTION</div>
          <div style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 1000, marginTop: 7, textShadow: '0 2px 12px rgba(0,0,0,.45)' }}>
            {player?.name || 'PLAYER NOMINATION'}
          </div>
          <div style={{ color: '#d2def7', fontSize: 12, marginTop: 5 }}>
            {(player?.role || 'Awaiting player') + '  ·  ' + (player?.nationality || 'Auction pool')}
          </div>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 7, background: 'rgba(2,10,31,.72)', border: '1px solid rgba(114,181,255,.38)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 10, background: phase === 'bidding' ? '#ff334b' : '#f5b82e', display: 'inline-block' }} />
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 10, letterSpacing: 1.2 }}>{phase === 'bidding' ? 'BIDDING LIVE' : phase.toUpperCase()}</span>
          </div>
          {leadingTeam ? (
            <div style={{ color: '#ffdb73', fontSize: 11, fontWeight: 900, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>LEADING:</span>
              <span style={{ color: '#ffffff', background: leadingTeam.color || '#1e3a8a', padding: '2px 6px', borderRadius: 4 }}>
                {leadingTeam.shortName}
              </span>
            </div>
          ) : null}
        </div>

        {/* Current Bid & Timer Panel */}
        <div style={{
          textAlign: 'center', padding: '14px 10px', borderRadius: 14,
          background: 'linear-gradient(180deg, rgba(2,14,42,.95), rgba(12,25,57,.98))',
          border: '1.5px solid rgba(245,184,46,.75)', boxShadow: 'inset 0 0 15px rgba(35,111,255,.15)',
        }}>
          <div style={{ color: '#b9cce9', fontSize: 9, fontWeight: 900, letterSpacing: 1.4 }}>CURRENT BID</div>
          <div style={{ color: '#fff', fontSize: 26, lineHeight: 1.1, fontWeight: 1000, marginTop: 6, whiteSpace: 'nowrap' }}>
            ₹{currentBidCr} Cr
          </div>
          <div style={{
            color: timer <= 5 ? '#ff6579' : '#d8e5fa',
            fontSize: 11, marginTop: 8, fontWeight: 900,
            padding: '3px 6px', borderRadius: 6,
            background: timer <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(30,58,138,0.3)',
          }}>
            {phase === 'bidding' ? `${timer}s remaining` : phase === 'sold' ? 'PLAYER SOLD' : phase === 'unsold' ? 'NO SALE' : 'NEXT PLAYER'}
          </div>
        </div>

        {/* Latest Bidding Stream */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, minHeight: 28, paddingTop: 7, borderTop: '1px solid rgba(160,195,255,.22)', overflow: 'hidden' }}>
          <span style={{ color: '#8fc8ff', fontSize: 9, fontWeight: 1000, letterSpacing: 1.2, whiteSpace: 'nowrap' }}>LATEST BIDS:</span>
          {bidLog.slice(0, 3).map((entry) => {
            const bidder = franchises.find((team) => team.id === entry.teamId);
            return (
              <span key={entry.timestamp + entry.teamId} style={{ color: '#f8fbff', background: 'rgba(4,14,38,.72)', border: '1px solid rgba(135,175,255,.25)', borderRadius: 6, padding: '4px 7px', fontSize: 9, fontWeight: 900, whiteSpace: 'nowrap' }}>
                {bidder?.shortName || 'TEAM'} · ₹{(entry.amount / 10000000).toFixed(2)}Cr
              </span>
            );
          })}
          {bidLog.length === 0 ? <span style={{ color: '#a7b8d2', fontSize: 9 }}>Awaiting first bid</span> : null}
        </div>
      </div>
    </Html>
  );
}

function SideAuctionBoard({ side, title, subtitle }: { side: 'left' | 'right'; title: string; subtitle: string }) {
  const x = side === 'left' ? -19.5 : 19.5;
  return (
    <>
      <mesh position={[x, 3.9, -4.4]} rotation={[0, side === 'left' ? 0.12 : -0.12, 0]}>
        <boxGeometry args={[7.2, 4.1, 0.36]} />
        <meshStandardMaterial color="#061634" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh position={[x, 3.9, -4.18]} rotation={[0, side === 'left' ? 0.12 : -0.12, 0]}>
        <boxGeometry args={[6.82, 3.73, 0.035]} />
        <meshBasicMaterial color="#0b245e" />
      </mesh>
      <Html position={[x, 3.9, -4.12]} center distanceFactor={12}>
        <div style={{
          width: 220, padding: '18px 12px', textAlign: 'center',
          fontFamily: 'Arial,sans-serif', color: '#fff',
          background: 'linear-gradient(145deg, rgba(7,27,76,.98), rgba(4,13,42,.98))',
          border: '1px solid rgba(65,164,255,.72)', borderRadius: 10,
          boxShadow: '0 0 22px rgba(0,112,255,.3)',
        }}>
          <div style={{ color: '#9dceff', fontSize: 11, fontWeight: 900, letterSpacing: 3 }}>{title}</div>
          <div style={{ color: '#fff', fontSize: 21, fontWeight: 1000, marginTop: 7 }}>{subtitle}</div>
          <div style={{ color: '#f5b82e', fontSize: 9, fontWeight: 900, letterSpacing: 2, marginTop: 10 }}>CRIC ARENA</div>
        </div>
      </Html>
    </>
  );
}

function AuctionCharacterLoading({ position, color }: { position: [number, number]; color: string }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.23, 0.28, 0.78, 10]} />
        <meshStandardMaterial color={color || '#7894b8'} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <sphereGeometry args={[0.19, 12, 10]} />
        <meshStandardMaterial color="#d6b49a" roughness={0.88} />
      </mesh>
      <mesh position={[-0.27, 0.83, 0]} rotation={[0, 0, 0.28]}>
        <cylinderGeometry args={[0.07, 0.08, 0.53, 8]} />
        <meshStandardMaterial color={color || '#7894b8'} roughness={0.82} />
      </mesh>
      <mesh position={[0.27, 0.83, 0]} rotation={[0, 0, -0.28]}>
        <cylinderGeometry args={[0.07, 0.08, 0.53, 8]} />
        <meshStandardMaterial color={color || '#7894b8'} roughness={0.82} />
      </mesh>
    </group>
  );
}

function AuctionRoomScene(props: AuctionBroadcastStageProps) {
  const { franchises, leadingTeamId, selectedTeamId, player, playerImage, currentBid, phase, timer } = props;
  const leadingTeam = franchises.find((team) => team.id === leadingTeamId);
  return (
    <>
      <color attach="background" args={['#030a1c']} />
      <fog attach="fog" args={['#071426', 42, 82]} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[-8, 15, 12]} intensity={1.45} />
      <pointLight position={[0, 10, -5]} intensity={2.2} color="#397cff" distance={42} />
      <pointLight position={[-16, 7, 2]} intensity={1.9} color="#147bff" distance={27} />
      <pointLight position={[16, 7, 2]} intensity={1.8} color="#18a7ff" distance={27} />
      <pointLight position={[0, 8, 15]} intensity={1.2} color="#f5a623" distance={24} />

      {/* Main arena floor and concentric broadcast stage. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <circleGeometry args={[31, 96]} />
        <meshStandardMaterial color="#07142b" roughness={0.62} metalness={0.28} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <ringGeometry args={[8.3, 8.55, 96]} />
        <meshBasicMaterial color="#167bff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[5.3, 5.55, 96]} />
        <meshBasicMaterial color="#f5b82e" />
      </mesh>
      <mesh position={[0, 0.18, 0.7]}>
        <cylinderGeometry args={[6.3, 6.7, 0.55, 72]} />
        <meshStandardMaterial color="#102b5c" roughness={0.34} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.48, 0.7]}>
        <cylinderGeometry args={[5.9, 6.25, 0.12, 72]} />
        <meshBasicMaterial color="#f5b82e" />
      </mesh>
      <mesh position={[0, 0.57, 0.7]}>
        <cylinderGeometry args={[5.65, 5.9, 0.08, 72]} />
        <meshBasicMaterial color="#0a74ff" />
      </mesh>

      {/* Rear LED wall, large player screen and lit architectural ribs. */}
      <mesh position={[0, 4.15, -4.35]}>
        <boxGeometry args={[14.2, 6.1, 0.65]} />
        <meshStandardMaterial color="#071633" metalness={0.65} roughness={0.24} />
      </mesh>
      <mesh position={[0, 4.15, -3.98]}>
        <boxGeometry args={[13.55, 5.55, 0.05]} />
        <meshBasicMaterial color="#102d75" />
      </mesh>
      {[-7.55, 7.55].map((x) => (
        <group key={x} position={[x, 3.65, -1.8]}>
          <mesh>
            <boxGeometry args={[0.3, 7.9, 0.5]} />
            <meshStandardMaterial color="#172d69" metalness={0.4} roughness={0.32} emissive="#123a8a" emissiveIntensity={0.45} />
          </mesh>
          <mesh position={[0, 0, 0.29]}>
            <boxGeometry args={[0.07, 7.2, 0.04]} />
            <meshBasicMaterial color="#ffbd55" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 7.25, -2.2]}>
        <boxGeometry args={[18, 0.28, 0.7]} />
        <meshStandardMaterial color="#1f3778" emissive="#0b4cbb" emissiveIntensity={0.7} metalness={0.45} />
      </mesh>
      <mesh position={[0, 7.08, -1.82]}>
        <boxGeometry args={[17.5, 0.055, 0.05]} />
        <meshBasicMaterial color="#41b5ff" />
      </mesh>

      <SideAuctionBoard side="left" title="IPL" subtitle="PLAYER AUCTION" />
      <SideAuctionBoard side="right" title="LIVE" subtitle="BIDDING ROOM" />

      <AuctionScreen {...props} leadingTeam={leadingTeam} />

      {/* Auctioneer podium with a raised fascia and a clear front-facing nameplate. */}
      <mesh position={[0, 1.05, 3.25]}>
        <boxGeometry args={[5.8, 1.55, 1.55]} />
        <meshStandardMaterial color="#071b43" metalness={0.5} roughness={0.29} />
      </mesh>
      <mesh position={[0, 1.85, 3.25]}>
        <boxGeometry args={[5.95, 0.13, 1.66]} />
        <meshStandardMaterial color="#f5b82e" emissive="#8d5b0c" emissiveIntensity={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.12, 2.45]}>
        <boxGeometry args={[4.9, 0.9, 0.04]} />
        <meshBasicMaterial color="#0a2d72" />
      </mesh>
      <Html position={[0, 1.15, 2.39]} center distanceFactor={12}>
        <div style={{
          width: 120, padding: '7px 9px', textAlign: 'center', borderRadius: 8,
          color: '#fff', background: 'rgba(5,20,54,.94)', border: '1px solid rgba(245,184,46,.78)',
          font: '900 16px Arial,sans-serif', letterSpacing: 2,
        }}>CA · AUCTION</div>
      </Html>

      {/* Team desks in two banks, preserving the ten franchises and their own kit colours. */}
      {franchises.map((team, index) => (
        <FranchiseDesk key={team.id} team={team} index={index} count={franchises.length} leading={team.id === leadingTeamId} selected={team.id === selectedTeamId} />
      ))}

      {/* Reuse the exact rigged GLB already shipped for match players. Background reps update at 8 Hz;
          the active bidder gets 16 Hz. The auctioneer gets a responsive 24 Hz pose update. */}
      {franchises.map((team, index) => {
        const leftCount = Math.ceil(franchises.length / 2);
        const onLeft = index < leftCount;
        const sideIndex = onLeft ? index : index - leftCount;
        const sideCount = onLeft ? leftCount : franchises.length - leftCount;
        const z = sideCount <= 1 ? 0 : -10 + (sideIndex / (sideCount - 1)) * 19;
        const activeBidder = team.id === leadingTeamId;
        const position: [number, number] = [onLeft ? -14.05 : 14.05, z];
        return (
          <CharacterErrorBoundary key={'auction-rep-' + team.id} fallback={<AuctionCharacterLoading position={position} color={team.color} />}>
            <Suspense fallback={<AuctionCharacterLoading position={position} color={team.color} />}>
              <CharacterInstance
                modelUrl={AUCTION_CHARACTER_MODEL}
                position={position}
                yaw={onLeft ? Math.PI / 2 : -Math.PI / 2}
                action={activeBidder ? 'auctionBid' : 'auctionSit'}
                progress={activeBidder ? 0.46 : 0.12}
                team={team.name}
                format="T20"
                kitRole="fielder"
                heightScale={0.68}
                updateFps={activeBidder ? 12 : 8}
                trackBall={false}
                castShadow={false}
              />
            </Suspense>
          </CharacterErrorBoundary>
        );
      })}

      <CharacterErrorBoundary fallback={<AuctionCharacterLoading position={[0, 2.05]} color="#f5b82e" />}>
        <Suspense fallback={<AuctionCharacterLoading position={[0, 2.05]} color="#f5b82e" />}>
          <CharacterInstance
            modelUrl={AUCTION_CHARACTER_MODEL}
            position={[0, 2.05]}
            yaw={0}
            action={phase === 'sold' ? 'victory' : 'auctioneerCall'}
            progress={phase === 'sold' ? 0.45 : 0.34}
            heightScale={0.92}
            updateFps={18}
            trackBall={false}
            castShadow={false}
          />
        </Suspense>
      </CharacterErrorBoundary>
      <AuctionGavel phase={phase} />

      {/* Foreground broadcast floor graphics and audience-side seating rails. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 22, 0, 7]}>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.24, 2.2, 18]} />
            <meshStandardMaterial color="#102b5c" metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[0, 2.25, 0]}>
            <boxGeometry args={[0.3, 0.07, 18]} />
            <meshBasicMaterial color={side < 0 ? "#247cff" : "#f5b82e"} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function AuctionBroadcastStage(props: AuctionBroadcastStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    const element = stageRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement === element) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch (error) {
      console.warn('Auction fullscreen is unavailable in this browser:', error);
    }
  };

  return (
    <div
      ref={stageRef}
      className={isFullscreen
        ? 'relative h-screen w-screen overflow-hidden rounded-none bg-[#030a1c]'
        : 'relative h-[500px] w-full overflow-hidden rounded-3xl border border-[#e6b34b]/30 bg-[#030a1c] shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:h-[620px]'}
    >
      <div className="pointer-events-none absolute left-4 top-3 z-20 rounded-lg border border-cyan-300/40 bg-[#071426]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
        CRIC ARENA · LIVE AUCTION BROADCAST
      </div>
      <div className="pointer-events-none absolute right-24 top-3 z-20 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> LIVE
      </div>
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute right-4 top-3 z-30 rounded-lg border border-white/25 bg-[#071426]/95 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-lg hover:bg-blue-900"
        aria-label={isFullscreen ? 'Exit fullscreen auction' : 'View auction fullscreen'}
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      <Canvas
        dpr={[0.55, 0.85]}
        shadows={false}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 10.5, 31], fov: 48, near: 0.1, far: 100 }}
      >
        <AuctionRoomScene {...props} />
      </Canvas>
    </div>
  );
}
