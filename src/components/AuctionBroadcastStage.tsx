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

  // Stagger the 5 desks in an inward-facing broadcast arc
  const z = sideCount <= 1 ? 0 : -2.8 + (sideIndex / (sideCount - 1)) * 12.8;
  const x = onLeft ? -9.6 : 9.6;
  const yaw = onLeft ? 0.42 : -0.42;

  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      {/* Leading Bidder Spotlight & Aura */}
      {leading && (
        <>
          <pointLight position={[0, 3.8, 0]} intensity={4.5} distance={9} color="#f5b82e" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[1.8, 2.05, 36]} />
            <meshBasicMaterial color="#f5b82e" />
          </mesh>
        </>
      )}

      {/* Main Desk Tabletop (Height 0.74m) */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[2.5, 0.08, 1.15]} />
        <meshStandardMaterial
          color="#152642"
          roughness={0.4}
          metalness={0.3}
          emissive={leading ? '#f5b82e' : '#000000'}
          emissiveIntensity={leading ? 0.15 : 0}
        />
      </mesh>

      {/* Desk Front Branding Fascia with Team Color */}
      <mesh position={[0, 0.36, 0.54]}>
        <boxGeometry args={[2.42, 0.68, 0.06]} />
        <meshStandardMaterial color={team.color || '#24344e'} roughness={0.45} metalness={0.2} />
      </mesh>

      {/* Glowing Edge Line */}
      <mesh position={[0, 0.74, 0.58]}>
        <boxGeometry args={[2.46, 0.03, 0.04]} />
        <meshBasicMaterial color={leading ? '#f5b82e' : team.color || '#3b82f6'} />
      </mesh>

      {/* Desk Legs */}
      {[-1.15, 1.15].map((lx) => (
        <group key={lx} position={[lx, 0.34, 0]}>
          <mesh position={[0, 0, -0.45]}>
            <cylinderGeometry args={[0.04, 0.04, 0.68, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.45]}>
            <cylinderGeometry args={[0.04, 0.04, 0.68, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Franchise Chair (Seat at y=0.40m, backrest at z=-0.75m) */}
      <group position={[0, 0, -0.62]}>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.9, 0.07, 0.85]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.88, -0.4]}>
          <boxGeometry args={[0.86, 0.95, 0.1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
      </group>

      {/* Franchise Delegate Character - Perfectly seated and visible above table */}
      <CharacterErrorBoundary fallback={<AuctionCharacterLoading position={[0, 0.38, -0.6]} color={team.color} />}>
        <Suspense fallback={<AuctionCharacterLoading position={[0, 0.38, -0.6]} color={team.color} />}>
          <CharacterInstance
            modelUrl={AUCTION_CHARACTER_MODEL}
            position={[0, 0.38, -0.6]}
            yaw={0}
            action={leading ? 'auctionBid' : 'auctionSit'}
            progress={leading ? 0.45 : 0.12}
            team={team.name}
            format="T20"
            kitRole="fielder"
            heightScale={0.9}
            updateFps={leading ? 18 : 10}
            trackBall={false}
            castShadow={false}
          />
        </Suspense>
      </CharacterErrorBoundary>

      {/* Interactive/Animated Bidding Paddle */}
      <BidPaddle team={team} leading={leading} selected={selected} />

      {/* Desk Nameplate & Purse Display */}
      <Html position={[0, 1.45, 0.3]} center distanceFactor={14}>
        <div
          style={{
            minWidth: 120,
            padding: '6px 8px',
            borderRadius: 9,
            color: '#fff',
            background: 'rgba(5,15,36,0.92)',
            border: leading ? '1.5px solid #f5b82e' : '1px solid rgba(148,163,184,0.35)',
            boxShadow: leading ? '0 0 20px rgba(245,184,46,0.45)' : '0 4px 14px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Arial,sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {team.logo ? <img src={team.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} /> : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 900, lineHeight: 1.1 }}>{team.shortName}</div>
            <div style={{ color: '#93c5fd', fontSize: 9, marginTop: 2 }}>₹{(team.purse / 10000000).toFixed(1)} Cr left</div>
            {leading ? <div style={{ color: '#f5b82e', fontSize: 8, fontWeight: 900, marginTop: 1 }}>LEADING BID</div> : null}
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

      {/* Central Raised Stage Dais (Height 0.45m) */}
      <mesh position={[0, 0.22, 0.4]}>
        <cylinderGeometry args={[5.2, 5.6, 0.45, 64]} />
        <meshStandardMaterial color="#0f2652" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.46, 0.4]}>
        <cylinderGeometry args={[4.9, 5.15, 0.08, 64]} />
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
        camera={{ position: [0, 5.0, 16.5], fov: 42, near: 0.1, far: 100 }}
      >
        <AuctionRoomScene {...props} />
      </Canvas>
    </div>
  );
}
