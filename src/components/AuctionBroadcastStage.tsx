import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Gavel } from 'lucide-react';
import type { Franchise } from '../stores/useGameStore';
import type { Player } from '../types/common';
import { getPlayerAvatar } from '../lib/playerImages';
import { CharacterInstance, CharacterErrorBoundary } from '../characters/CharacterInstance';
import { getBidIncrement } from '../lib/iplAuctionEngine';

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
  onBid?: (increment?: number) => void;
  onPass?: () => void;
  isOverseasBlocked?: boolean;
  isSquadFull?: boolean;
  isPurseShort?: boolean;
}

function BidPaddle({ team, leading, selected }: { team: DeskTeam; leading: boolean; selected: boolean }) {
  const paddle = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!paddle.current) return;
    const targetRot = leading ? -0.12 : -1.25;
    const targetY = leading ? 1.55 : 0.85;
    paddle.current.rotation.x = THREE.MathUtils.damp(paddle.current.rotation.x, targetRot, 9, delta);
    paddle.current.position.y = THREE.MathUtils.damp(paddle.current.position.y, targetY, 9, delta);
  });

  return (
    <group ref={paddle} position={[0.42, 0.85, 0.35]}>
      {/* Paddle Handle */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.024, 0.026, 0.6, 10]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.5} />
      </mesh>
      {/* Paddle Head Board */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.72, 0.84, 0.08]} />
        <meshStandardMaterial
          color={leading ? '#f5b82e' : selected ? '#dbeafe' : '#1e293b'}
          emissive={leading ? '#f5b82e' : '#000000'}
          emissiveIntensity={leading ? 0.35 : 0}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.22, 0.045]}>
        <boxGeometry args={[0.6, 0.72, 0.015]} />
        <meshBasicMaterial color={team.color || '#258bff'} />
      </mesh>
      <Html position={[0, 0.22, 0.06]} center distanceFactor={14}>
        <div
          style={{
            minWidth: 58,
            padding: '4px 6px',
            borderRadius: 6,
            background: 'rgba(3,10,24,0.94)',
            border: leading ? '1.5px solid #f5b82e' : '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            boxShadow: leading ? '0 0 15px rgba(245,184,46,0.6)' : '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {team.shortName}
          {leading ? <div style={{ color: '#f5b82e', fontSize: 8, marginTop: 1 }}>HIGH BID</div> : null}
        </div>
      </Html>
    </group>
  );
}

function FranchiseDesk({
  team,
  index,
  count,
  leading,
  selected,
}: {
  team: DeskTeam;
  index: number;
  count: number;
  leading: boolean;
  selected: boolean;
}) {
  const leftCount = Math.ceil(count / 2);
  const onLeft = index < leftCount;
  const sideIndex = onLeft ? index : index - leftCount;
  const sideCount = onLeft ? leftCount : count - leftCount;

  // Stagger the 5 desks in an inward-facing broadcast arc inside the visible camera viewport
  const z = sideCount <= 1 ? 0 : -1.8 + (sideIndex / (sideCount - 1)) * 7.6;
  const x = onLeft ? -6.2 - sideIndex * 0.25 : 6.2 + sideIndex * 0.25;
  const yaw = onLeft ? 0.48 : -0.48;

  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      {/* Leading Bidder Spotlight & Aura */}
      {leading && (
        <>
          <pointLight position={[0, 3.8, 0]} intensity={4.5} distance={9} color="#f5b82e" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[1.5, 1.75, 36]} />
            <meshBasicMaterial color="#f5b82e" />
          </mesh>
        </>
      )}

      {/* Main Desk Tabletop (Height 0.74m) */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[2.0, 0.08, 0.95]} />
        <meshStandardMaterial
          color="#152642"
          roughness={0.4}
          metalness={0.3}
          emissive={leading ? '#f5b82e' : '#000000'}
          emissiveIntensity={leading ? 0.15 : 0}
        />
      </mesh>

      {/* Desk Front Branding Fascia with Team Color */}
      <mesh position={[0, 0.36, 0.45]}>
        <boxGeometry args={[1.94, 0.68, 0.06]} />
        <meshStandardMaterial color={team.color || '#24344e'} roughness={0.45} metalness={0.2} />
      </mesh>

      {/* Glowing Edge Line */}
      <mesh position={[0, 0.74, 0.48]}>
        <boxGeometry args={[1.98, 0.03, 0.04]} />
        <meshBasicMaterial color={leading ? '#f5b82e' : team.color || '#3b82f6'} />
      </mesh>

      {/* Desk Legs */}
      {[-0.92, 0.92].map((lx) => (
        <group key={lx} position={[lx, 0.34, 0]}>
          <mesh position={[0, 0, -0.36]}>
            <cylinderGeometry args={[0.035, 0.035, 0.68, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.36]}>
            <cylinderGeometry args={[0.035, 0.035, 0.68, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Franchise Chair (Seat at y=0.40m, backrest at z=-0.65m) */}
      <group position={[0, 0, -0.58]}>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.82, 0.07, 0.78]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.88, -0.36]}>
          <boxGeometry args={[0.78, 0.95, 0.09]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
      </group>

      {/* Franchise Delegate Character - Perfectly seated and visible above table */}
      <CharacterErrorBoundary fallback={<AuctionCharacterLoading position={[0, 0.38, -0.58]} color={team.color} />}>
        <Suspense fallback={<AuctionCharacterLoading position={[0, 0.38, -0.58]} color={team.color} />}>
          <CharacterInstance
            modelUrl={AUCTION_CHARACTER_MODEL}
            position={[0, 0.38, -0.58]}
            yaw={0}
            action={leading ? 'auctionBid' : 'auctionSit'}
            progress={leading ? 0.45 : 0.12}
            team={team.name}
            format="T20"
            kitRole="fielder"
            heightScale={0.92}
            updateFps={leading ? 18 : 10}
            trackBall={false}
            castShadow={false}
          />
        </Suspense>
      </CharacterErrorBoundary>

      {/* Interactive/Animated Bidding Paddle */}
      <BidPaddle team={team} leading={leading} selected={selected} />

      {/* Team Name & Purse written directly on the front panel of the desk */}
      <Html
        position={[0, 0.36, 0.49]}
        center
        distanceFactor={14}
        transform
        scale={0.16}
      >
        <div
          style={{
            width: 310,
            padding: '7px 10px',
            borderRadius: 8,
            background: 'rgba(5, 14, 32, 0.94)',
            border: leading ? '2.5px solid #f5b82e' : '1.5px solid rgba(255,255,255,0.25)',
            boxShadow: leading ? '0 0 25px rgba(245,184,46,0.6)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'Arial, sans-serif',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {team.logo ? <img src={team.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /> : null}
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1, letterSpacing: 0.5 }}>{team.shortName}</div>
              <div style={{ fontSize: 12, color: '#f5b82e', fontWeight: 800, marginTop: 2 }}>
                ₹{(team.purse / 10000000).toFixed(1)} Cr
              </div>
            </div>
          </div>
          {leading ? (
            <span style={{ fontSize: 10, fontWeight: 900, background: '#f5b82e', color: '#000', padding: '3px 8px', borderRadius: 4, letterSpacing: 1 }}>
              HIGH BID
            </span>
          ) : selected ? (
            <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(37,139,255,0.4)', color: '#93c5fd', padding: '3px 6px', borderRadius: 4 }}>
              YOU
            </span>
          ) : null}
        </div>
      </Html>
    </group>
  );
}

function AuctionGavel({ phase }: { phase: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const swing = phase === 'sold' ? Math.sin(state.clock.elapsedTime * 9) * 0.6 : Math.sin(state.clock.elapsedTime * 2) * 0.08;
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, swing, phase === 'sold' ? 12 : 3, delta);
  });

  return (
    <group ref={ref} position={[0.55, 1.18, 1.25]} rotation={[0, 0, -0.4]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.055, 0.55, 10]} />
        <meshStandardMaterial color="#8b552d" roughness={0.4} />
      </mesh>
      <mesh position={[0.26, 0, 0]}>
        <boxGeometry args={[0.3, 0.22, 0.22]} />
        <meshStandardMaterial color="#c88b43" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

function AuctionScreen({
  player,
  playerImage,
  currentBid,
  phase,
  timer,
  leadingTeam,
}: AuctionBroadcastStageProps & { leadingTeam: DeskTeam | undefined }) {
  const basePriceCr = player?.basePrice ? (player.basePrice / 10000000).toFixed(2) : player?.price ? (player.price / 10000000).toFixed(2) : '2.00';
  const currentBidCr = (currentBid / 10000000).toFixed(2);

  return (
    <Html position={[0, 4.25, -3.8]} center distanceFactor={12}>
      <div
        style={{
          width: 560,
          minHeight: 280,
          padding: 14,
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: '136px minmax(0, 1fr) 150px',
          gap: 14,
          alignItems: 'center',
          position: 'relative',
          color: '#f7fbff',
          fontFamily: 'Arial,sans-serif',
          background: 'linear-gradient(135deg, rgba(14,34,88,0.98), rgba(4,14,44,0.99) 58%, rgba(5,32,90,0.98))',
          border: phase === 'sold' ? '2.5px solid #f5b82e' : '2px solid rgba(115,181,255,0.95)',
          borderRadius: 18,
          boxShadow:
            phase === 'sold'
              ? '0 0 0 6px rgba(245,184,46,0.4), 0 0 45px rgba(245,184,46,0.7), 0 20px 42px rgba(0,0,0,0.6)'
              : '0 0 0 5px rgba(28,72,190,0.3), 0 0 34px rgba(44,129,255,0.65), 0 16px 38px rgba(0,0,0,0.55)',
        }}
      >
        {/* SOLD Celebration Broadcast Banner */}
        {phase === 'sold' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(8,24,65,0.96), rgba(4,12,36,0.98))',
              border: '2px solid #f5b82e',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 3,
                color: '#f5b82e',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              IPL 2026 MEGA AUCTION · OFFICIAL RESULT
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: 2,
                color: '#f5b82e',
                textShadow: '0 0 20px rgba(245,184,46,0.8)',
                marginBottom: 8,
              }}
            >
              SOLD!
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginBottom: 2 }}>{player?.name}</div>
            <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 10 }}>{player?.role}</div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(245,184,46,0.15)',
                border: '1.5px solid #f5b82e',
                borderRadius: 12,
                padding: '6px 14px',
              }}
            >
              {leadingTeam?.logo ? (
                <img src={leadingTeam.logo} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              ) : null}
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{leadingTeam?.name || 'Winning Team'}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#f5b82e' }}>₹{currentBidCr} CR</span>
            </div>
          </div>
        ) : phase === 'unsold' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(30,10,18,0.96), rgba(12,4,8,0.98))',
              border: '2px solid #ef4444',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#ef4444',
                letterSpacing: 3,
                border: '3px solid #ef4444',
                padding: '6px 20px',
                borderRadius: 8,
                transform: 'rotate(-4deg)',
              }}
            >
              UNSOLD
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginTop: 10 }}>
              {player?.name} moves to Accelerated Round
            </div>
          </div>
        ) : null}

        {/* Player Photo Presentation */}
        <div
          style={{
            width: 136,
            height: 180,
            borderRadius: 14,
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #163260, #081634)',
            border: '2px solid rgba(255,255,255,0.22)',
            position: 'relative',
          }}
        >
          <img
            src={playerImage}
            alt={player?.name || 'Player'}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getPlayerAvatar(player?.name || 'player');
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              right: 6,
              background: 'rgba(3,10,24,0.85)',
              padding: '3px 6px',
              borderRadius: 6,
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 800,
              color: '#f5b82e',
            }}
          >
            ★ {player?.rating || 78} OVR
          </div>
        </div>

        {/* Center Details */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#f5b82e', letterSpacing: 2, textTransform: 'uppercase' }}>
            NOW ON THE BLOCK
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.15, marginTop: 2 }}>{player?.name || 'Player Nominated'}</div>
          <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 3 }}>
            {player?.role} · {player?.nationality || 'India'}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 10px', borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>Base Price</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#e2e8f0' }}>₹{basePriceCr} Cr</div>
            </div>
            <div style={{ background: 'rgba(245,184,46,0.12)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(245,184,46,0.3)' }}>
              <div style={{ fontSize: 9, color: '#f5b82e', textTransform: 'uppercase' }}>Current Bid</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f5b82e' }}>₹{currentBidCr} Cr</div>
            </div>
          </div>
        </div>

        {/* Right Status */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Leading Franchise</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: leadingTeam ? '#fff' : '#64748b', marginTop: 2 }}>
            {leadingTeam?.shortName || 'NO BID'}
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 28,
              fontWeight: 900,
              color: timer <= 3 ? '#ef4444' : '#f5b82e',
              background: 'rgba(0,0,0,0.4)',
              padding: '6px 12px',
              borderRadius: 10,
              display: 'inline-block',
            }}
          >
            {timer}s
          </div>
        </div>
      </div>
    </Html>
  );
}

function AuctionCharacterLoading({ position, color }: { position: [number, number] | [number, number, number]; color?: string }) {
  const posY = position.length === 3 ? position[1] : 0;
  const posZ = position.length === 3 ? position[2] : position[1];
  return (
    <group position={[position[0], posY, posZ]}>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.85, 10]} />
        <meshStandardMaterial color={color || '#258bff'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <sphereGeometry args={[0.19, 12, 10]} />
        <meshStandardMaterial color="#d6b49a" roughness={0.88} />
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
      <fog attach="fog" args={['#071426', 40, 75]} />

      {/* Broadcast Studio Lighting - High Lux & Key Illumination */}
      <hemisphereLight args={['#e0f2fe', '#071426', 1.8]} />
      <ambientLight intensity={1.3} color="#ffffff" />
      <directionalLight position={[0, 16, 12]} intensity={2.6} color="#ffffff" />
      <directionalLight position={[-12, 11, 8]} intensity={2.0} color="#93c5fd" />
      <directionalLight position={[12, 11, 8]} intensity={2.0} color="#93c5fd" />
      <directionalLight position={[0, 7, -10]} intensity={1.5} color="#38bdf8" />

      {/* Auctioneer Stage Spotlight */}
      <spotLight position={[0, 9.5, 4.5]} intensity={4.5} angle={0.45} penumbra={0.3} color="#fff8e7" target-position={[0, 1.2, 0.8]} />

      {/* Studio Floor with Concentric Glowing Stage Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[28, 72]} />
        <meshStandardMaterial color="#07142b" roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]}>
        <ringGeometry args={[7.8, 8.05, 72]} />
        <meshBasicMaterial color="#167bff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[4.8, 5.05, 72]} />
        <meshBasicMaterial color="#f5b82e" />
      </mesh>

      {/* Central Raised Stage Dais (Radius 2.8m, sleek & well-proportioned) */}
      <mesh position={[0, 0.20, 0.2]}>
        <cylinderGeometry args={[2.5, 2.8, 0.40, 48]} />
        <meshStandardMaterial color="#0f2652" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.41, 0.2]}>
        <cylinderGeometry args={[2.35, 2.55, 0.05, 48]} />
        <meshBasicMaterial color="#f5b82e" />
      </mesh>

      {/* Big Screen Backwall Architecture */}
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

      {/* 3D Screen with Player Photo, Bid Status & SOLD/UNSOLD celebrations */}
      <AuctionScreen {...props} leadingTeam={leadingTeam} />

      {/* Auctioneer Podium / Lectern - Standing proudly on stage */}
      <group position={[0, 0.45, 1.3]}>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[1.6, 0.92, 0.75]} />
          <meshStandardMaterial color="#0a2354" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <boxGeometry args={[1.72, 0.08, 0.82]} />
          <meshStandardMaterial color="#f5b82e" emissive="#9a6510" emissiveIntensity={0.4} metalness={0.5} />
        </mesh>
        <Html position={[0, 0.52, 0.4]} center distanceFactor={11}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              background: 'rgba(5,20,54,0.95)',
              border: '1.5px solid #f5b82e',
              color: '#f5b82e',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 2,
              whiteSpace: 'nowrap',
            }}
          >
            IPL AUCTIONEER
          </div>
        </Html>
      </group>

      {/* Auctioneer 3D Character - Standing on stage platform at y=0.45, clearly visible */}
      <CharacterErrorBoundary fallback={<AuctionCharacterLoading position={[0, 0.45, 0.45]} color="#f5b82e" />}>
        <Suspense fallback={<AuctionCharacterLoading position={[0, 0.45, 0.45]} color="#f5b82e" />}>
          <CharacterInstance
            modelUrl={AUCTION_CHARACTER_MODEL}
            position={[0, 0.45, 0.45]}
            yaw={0}
            action={phase === 'sold' ? 'victory' : 'auctioneerCall'}
            progress={phase === 'sold' ? 0.45 : 0.35}
            heightScale={0.96}
            updateFps={24}
            trackBall={false}
            castShadow={false}
          />
        </Suspense>
      </CharacterErrorBoundary>
      <AuctionGavel phase={phase} />

      {/* 10 IPL Franchise Desks with Delegates Seated & Visible */}
      {franchises.map((team, index) => (
        <FranchiseDesk
          key={team.id}
          team={team}
          index={index}
          count={franchises.length}
          leading={team.id === leadingTeamId}
          selected={team.id === selectedTeamId}
        />
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

  const isLeading = Boolean(props.selectedTeamId && props.selectedTeamId === props.leadingTeamId);
  const hudIncrement = getBidIncrement(props.currentBid);
  const hudNextBid = props.leadingTeamId ? props.currentBid + hudIncrement : props.currentBid;

  return (
    <div
      ref={stageRef}
      className={
        isFullscreen
          ? 'relative h-screen w-screen overflow-hidden rounded-none bg-[#030a1c]'
          : 'relative h-[500px] w-full overflow-hidden rounded-3xl border border-[#e6b34b]/30 bg-[#030a1c] shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:h-[620px]'
      }
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
        className="absolute right-4 top-3 z-30 rounded-lg border border-white/25 bg-[#071426]/95 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-lg hover:bg-blue-900 cursor-pointer"
        aria-label={isFullscreen ? 'Exit fullscreen auction' : 'View auction fullscreen'}
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      <Canvas
        dpr={[0.8, 1.2]}
        shadows={false}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 5.6, 16.2], fov: 47, near: 0.1, far: 100 }}
      >
        <AuctionRoomScene {...props} />
      </Canvas>

      {/* Live Screen Quick Bidding HUD: User can bid directly on the live screen without scrolling */}
      {props.player && props.phase === 'bidding' && props.onBid && (
        <div className="absolute bottom-3 inset-x-3 z-30 flex flex-wrap items-center justify-between gap-3 bg-[#071426]/95 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 sm:p-3 shadow-2xl">
          {/* Current Nominated Player Quick Info */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={props.playerImage}
              alt={props.player.name}
              className="w-10 h-10 rounded-xl object-cover object-top border border-white/20 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-white truncate">{props.player.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold">
                  {props.player.role}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#9DAEC4] flex items-center gap-2 mt-0.5">
                <span>Base: ₹{(props.player.basePrice ? props.player.basePrice / 10000000 : 2).toFixed(2)} Cr</span>
                <span>·</span>
                <span className="font-bold text-[#F5B82E]">Current: ₹{(props.currentBid / 10000000).toFixed(2)} Cr</span>
                <span>·</span>
                <span className="text-cyan-300 font-bold">
                  Leader: {props.franchises.find((f) => f.id === props.leadingTeamId)?.shortName || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown & Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${
                props.timer <= 3
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-white/10 text-amber-400 border-amber-400/30'
              }`}
            >
              ⏱ {props.timer}s
            </div>

            <button
              type="button"
              onClick={() => props.onBid && props.onBid()}
              disabled={isLeading || props.isOverseasBlocked || props.isSquadFull || props.isPurseShort}
              className={`py-2 px-3 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg cursor-pointer ${
                isLeading
                  ? 'bg-emerald-600/70 text-emerald-100 border border-emerald-400/50 cursor-not-allowed'
                  : props.isOverseasBlocked || props.isSquadFull || props.isPurseShort
                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed'
                  : 'bg-[#258BFF] hover:bg-blue-600 text-white btn-glow active:scale-95'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>
                {isLeading
                  ? 'YOU HOLD HIGHEST BID'
                  : props.isOverseasBlocked
                  ? 'OVERSEAS FULL'
                  : props.isSquadFull
                  ? 'SQUAD FULL'
                  : props.isPurseShort
                  ? 'PURSE CAP REACHED'
                  : !props.leadingTeamId
                  ? `OPEN BID ₹${(props.currentBid / 10000000).toFixed(2)} CR`
                  : `RAISE (+₹${hudIncrement / 100000}L) → ₹${(hudNextBid / 10000000).toFixed(2)} CR`}
              </span>
            </button>

            {props.onPass && (
              <button
                type="button"
                onClick={props.onPass}
                className="py-2 px-2.5 sm:px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs uppercase cursor-pointer active:scale-95"
              >
                PASS
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
