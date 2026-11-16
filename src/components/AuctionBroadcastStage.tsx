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

function useDeskTexture(
  teamName: string,
  shortName: string,
  purse: number,
  color: string,
  leading: boolean,
  selected: boolean
): THREE.CanvasTexture | null {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const texture = React.useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark studio console background
    ctx.fillStyle = leading ? '#141c2e' : selected ? '#0c1a30' : '#081220';
    ctx.fillRect(0, 0, 512, 160);

    // Team color vertical accent bar
    ctx.fillStyle = color || '#258bff';
    ctx.fillRect(0, 0, 16, 160);

    // Desk plate border
    ctx.strokeStyle = leading ? '#f5b82e' : selected ? '#38bdf8' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = leading ? 8 : 4;
    ctx.strokeRect(2, 2, 508, 156);

    // Team Short Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(shortName || teamName, 32, 24);

    // Purse Value
    const purseCr = (purse / 10000000).toFixed(1);
    ctx.fillStyle = leading ? '#f5b82e' : '#38bdf8';
    ctx.font = 'bold 44px Arial, Helvetica, sans-serif';
    ctx.fillText(`₹${purseCr} Cr`, 32, 90);

    // Status pill
    if (leading) {
      ctx.fillStyle = '#f5b82e';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(330, 48, 160, 64, 10);
        ctx.fill();
      } else {
        ctx.fillRect(330, 48, 160, 64);
      }

      ctx.fillStyle = '#050c18';
      ctx.font = '900 24px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HIGH BID', 410, 80);
    } else if (selected) {
      ctx.fillStyle = '#1d4ed8';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(330, 48, 160, 64, 10);
        ctx.fill();
      } else {
        ctx.fillRect(330, 48, 160, 64);
      }

      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOUR TEAM', 410, 80);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [teamName, shortName, purse, color, leading, selected]);

  React.useEffect(() => {
    if (textureRef.current && textureRef.current !== texture) {
      textureRef.current.dispose();
    }
    textureRef.current = texture;
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [texture]);

  return texture;
}

function BidPaddle({ team, leading, selected }: { team: DeskTeam; leading: boolean; selected: boolean }) {
  const paddle = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!paddle.current) return;
    const targetRot = leading ? -0.15 : -1.55;
    const targetY = leading ? 1.05 : 0.74;
    paddle.current.rotation.x = THREE.MathUtils.damp(paddle.current.rotation.x, targetRot, 10, delta);
    paddle.current.position.y = THREE.MathUtils.damp(paddle.current.position.y, targetY, 10, delta);
  });

  return (
    <group ref={paddle} position={[0.55, 0.74, 0.2]}>
      {/* Sleek small paddle handle */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.01, 0.012, 0.24, 10]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.5} />
      </mesh>
      {/* Small compact paddle head board */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.24, 0.3, 0.02]} />
        <meshStandardMaterial
          color={leading ? '#f5b82e' : selected ? '#dbeafe' : '#1e293b'}
          emissive={leading ? '#f5b82e' : '#000000'}
          emissiveIntensity={leading ? 0.4 : 0}
          roughness={0.4}
        />
      </mesh>
      {/* Paddle face in team color */}
      <mesh position={[0, 0.15, 0.011]}>
        <boxGeometry args={[0.21, 0.27, 0.005]} />
        <meshStandardMaterial
          color={team.color || '#258bff'}
          roughness={0.3}
          metalness={0.2}
          emissive={leading ? team.color || '#258bff' : '#000000'}
          emissiveIntensity={leading ? 0.25 : 0}
        />
      </mesh>
      {/* Gold Rim accent when leading */}
      {leading && (
        <mesh position={[0, 0.15, 0.012]}>
          <boxGeometry args={[0.23, 0.29, 0.003]} />
          <meshBasicMaterial color="#f5b82e" />
        </mesh>
      )}
    </group>
  );
}

function FranchiseDesk({
  team,
  index,
  leading,
  selected,
}: {
  team: DeskTeam;
  index: number;
  count: number;
  leading: boolean;
  selected: boolean;
}) {
  // Stagger all 10 franchise desks into two tiered rows with an open center aisle:
  // Back Row (Elevated on Riser at y = 0.42m, z = 4.2m):
  //   Left Wing:  index 0 (x = -4.3), index 1 (x = -2.8), index 2 (x = -1.3)
  //   Right Wing: index 5 (x =  1.3), index 6 (x =  2.8), index 7 (x =  4.3)
  // Front Row (Ground Floor at y = 0.0m, z = 7.0m, nested between back desks):
  //   Left Wing:  index 3 (x = -3.55), index 4 (x = -2.05)
  //   Right Wing: index 8 (x =  2.05), index 9 (x =  3.55)
  // This ensures:
  // 1. ALL 10 TEAMS ARE FULLY VISIBLE IN FRAME (no clipping at sides).
  // 2. Center aisle (x = -1.2 to +1.2) is open so Auctioneer is 100% visible.
  // 3. Front row delegates never block the back row desks!
  const deskLayout: Record<number, { x: number; y: number; z: number; yaw: number }> = {
    0: { x: -4.3, y: 0.42, z: 4.3, yaw: 0.14 },
    1: { x: -2.8, y: 0.42, z: 4.15, yaw: 0.09 },
    2: { x: -1.3, y: 0.42, z: 4.0, yaw: 0.04 },
    3: { x: -3.55, y: 0.0, z: 7.1, yaw: 0.11 },
    4: { x: -2.05, y: 0.0, z: 6.9, yaw: 0.06 },
    5: { x: 1.3, y: 0.42, z: 4.0, yaw: -0.04 },
    6: { x: 2.8, y: 0.42, z: 4.15, yaw: -0.09 },
    7: { x: 4.3, y: 0.42, z: 4.3, yaw: -0.14 },
    8: { x: 2.05, y: 0.0, z: 6.9, yaw: -0.06 },
    9: { x: 3.55, y: 0.0, z: 7.1, yaw: -0.11 },
  };

  const pos = deskLayout[index] || { x: (index - 4.5) * 1.8, y: 0, z: 5.5, yaw: 0 };
  const { x, y, z, yaw } = pos;

  const deskTexture = useDeskTexture(
    team.name,
    team.shortName,
    team.purse,
    team.color,
    leading,
    selected
  );

  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      {/* Leading Bidder Spotlight & Aura */}
      {leading && (
        <>
          <pointLight position={[0, 3.8, 0]} intensity={4.5} distance={9} color="#f5b82e" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[1.3, 1.55, 36]} />
            <meshBasicMaterial color="#f5b82e" />
          </mesh>
        </>
      )}

      {/* Main Desk Tabletop (Height 0.72m, width 1.65m) */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.65, 0.07, 0.85]} />
        <meshStandardMaterial
          color="#152642"
          roughness={0.4}
          metalness={0.3}
          emissive={leading ? '#f5b82e' : '#000000'}
          emissiveIntensity={leading ? 0.15 : 0}
        />
      </mesh>

      {/* Desk Front Branding Plate with Team Name & Purse texture (No HTML tags!) */}
      <mesh position={[0, 0.35, 0.43]}>
        <planeGeometry args={[1.56, 0.54]} />
        {deskTexture ? (
          <meshStandardMaterial map={deskTexture} roughness={0.3} metalness={0.2} />
        ) : (
          <meshStandardMaterial color={team.color || '#24344e'} roughness={0.45} metalness={0.2} />
        )}
      </mesh>

      {/* Glowing Edge Border Frame around Front Plate */}
      <mesh position={[0, 0.35, 0.415]}>
        <boxGeometry args={[1.62, 0.58, 0.02]} />
        <meshBasicMaterial color={leading ? '#f5b82e' : selected ? '#38bdf8' : team.color || '#3b82f6'} />
      </mesh>

      {/* Desk Top Accent Line */}
      <mesh position={[0, 0.74, 0.43]}>
        <boxGeometry args={[1.66, 0.025, 0.03]} />
        <meshBasicMaterial color={leading ? '#f5b82e' : team.color || '#3b82f6'} />
      </mesh>

      {/* Desk Legs */}
      {[-0.75, 0.75].map((lx) => (
        <group key={lx} position={[lx, 0.34, 0]}>
          <mesh position={[0, 0, -0.32]}>
            <cylinderGeometry args={[0.03, 0.03, 0.68, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.32]}>
            <cylinderGeometry args={[0.03, 0.03, 0.68, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Franchise Chair (Seat at y=0.38m, backrest at z=-0.52m) */}
      <group position={[0, 0, -0.52]}>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.74, 0.07, 0.7]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.88, -0.32]}>
          <boxGeometry args={[0.7, 0.95, 0.08]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
      </group>

      {/* Franchise Delegate Character - Perfectly seated and visible above table */}
      <CharacterErrorBoundary fallback={<AuctionCharacterLoading position={[0, 0.38, -0.52]} color={team.color} />}>
        <Suspense fallback={<AuctionCharacterLoading position={[0, 0.38, -0.52]} color={team.color} />}>
          <CharacterInstance
            modelUrl={AUCTION_CHARACTER_MODEL}
            position={[0, 0.38, -0.52]}
            yaw={0}
            action={leading ? 'auctionBid' : 'auctionSit'}
            progress={leading ? 0.45 : 0.12}
            team={team.name}
            format="T20"
            kitRole="fielder"
            heightScale={0.88}
            updateFps={leading ? 18 : 10}
            trackBall={false}
            castShadow={false}
          />
        </Suspense>
      </CharacterErrorBoundary>

      {/* Small, realistic, neatly positioned Bidding Paddle */}
      <BidPaddle team={team} leading={leading} selected={selected} />
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
    <group ref={ref} position={[0.22, 1.44, 0.65]} rotation={[0, 0, -0.4]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.045, 0.5, 10]} />
        <meshStandardMaterial color="#8b552d" roughness={0.4} />
      </mesh>
      <mesh position={[0.24, 0, 0]}>
        <boxGeometry args={[0.24, 0.18, 0.18]} />
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
    <Html position={[0, 5.3, -4.5]} center distanceFactor={13}>
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

      {/* Auctioneer Stage Direct Key Spotlight */}
      <spotLight position={[0, 9.5, 4.0]} intensity={5.5} angle={0.45} penumbra={0.35} color="#fffaf0" target-position={[0, 1.6, -0.2]} />

      {/* Studio Floor with Concentric Glowing Stage Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[28, 72]} />
        <meshStandardMaterial color="#07142b" roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]}>
        <ringGeometry args={[8.8, 9.1, 72]} />
        <meshBasicMaterial color="#167bff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[5.2, 5.45, 72]} />
        <meshBasicMaterial color="#f5b82e" />
      </mesh>

      {/* Left & Right Wing Tiered Risers (Elevation y = 0.42m for Back Row Desks) */}
      <group position={[-2.8, 0.21, 4.15]}>
        <mesh>
          <boxGeometry args={[4.8, 0.42, 2.2]} />
          <meshStandardMaterial color="#0b1b38" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.21, 1.11]}>
          <boxGeometry args={[4.82, 0.03, 0.03]} />
          <meshBasicMaterial color="#f5b82e" />
        </mesh>
      </group>
      <group position={[2.8, 0.21, 4.15]}>
        <mesh>
          <boxGeometry args={[4.8, 0.42, 2.2]} />
          <meshStandardMaterial color="#0b1b38" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.21, 1.11]}>
          <boxGeometry args={[4.82, 0.03, 0.03]} />
          <meshBasicMaterial color="#f5b82e" />
        </mesh>
      </group>

      {/* Central Blue Stage Runner down the center aisle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 4.5]}>
        <planeGeometry args={[1.8, 8.5]} />
        <meshStandardMaterial color="#0b2452" roughness={0.6} />
      </mesh>

      {/* Central Raised Stage Dais (Radius 2.2m, Elevation y = 0.76m) */}
      <group position={[0, 0.38, 0.0]}>
        <mesh>
          <cylinderGeometry args={[2.2, 2.5, 0.76, 48]} />
          <meshStandardMaterial color="#0c234b" roughness={0.35} metalness={0.4} />
        </mesh>
        {/* Gold Stage Perimeter Ring */}
        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[2.1, 2.3, 0.04, 48]} />
          <meshBasicMaterial color="#f5b82e" />
        </mesh>
      </group>

      {/* Big Screen Backwall Architecture */}
      <mesh position={[0, 5.3, -4.8]}>
        <boxGeometry args={[14.2, 5.6, 0.65]} />
        <meshStandardMaterial color="#071633" metalness={0.65} roughness={0.24} />
      </mesh>
      <mesh position={[0, 5.3, -4.48]}>
        <boxGeometry args={[13.55, 5.15, 0.05]} />
        <meshBasicMaterial color="#102d75" />
      </mesh>
      {[-7.55, 7.55].map((x) => (
        <group key={x} position={[x, 4.2, -2.2]}>
          <mesh>
            <boxGeometry args={[0.3, 8.8, 0.5]} />
            <meshStandardMaterial color="#172d69" metalness={0.4} roughness={0.32} emissive="#123a8a" emissiveIntensity={0.45} />
          </mesh>
          <mesh position={[0, 0, 0.29]}>
            <boxGeometry args={[0.07, 8.0, 0.04]} />
            <meshBasicMaterial color="#ffbd55" />
          </mesh>
        </group>
      ))}

      {/* 3D Screen with Player Photo, Bid Status & SOLD/UNSOLD celebrations */}
      <AuctionScreen {...props} leadingTeam={leadingTeam} />

      {/* Auctioneer Podium / Lectern - Sleek, low waist-height (0.62m) standing at y=0.76 */}
      <group position={[0, 0.76, 0.6]}>
        <mesh position={[0, 0.31, 0]}>
          <boxGeometry args={[1.0, 0.62, 0.45]} />
          <meshStandardMaterial color="#071b40" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Sloped Top Lectern Rest with Gold Trim */}
        <mesh position={[0, 0.63, 0]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[1.08, 0.05, 0.5]} />
          <meshStandardMaterial color="#f5b82e" emissive="#9a6510" emissiveIntensity={0.3} metalness={0.6} />
        </mesh>
        {/* Sleek 3D Gold Inlay Bar */}
        <mesh position={[0, 0.33, 0.23]}>
          <boxGeometry args={[0.8, 0.06, 0.02]} />
          <meshStandardMaterial color="#f5b82e" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Sounding block for gavel */}
        <mesh position={[0.22, 0.66, 0.05]}>
          <cylinderGeometry args={[0.09, 0.1, 0.035, 16]} />
          <meshStandardMaterial color="#451a03" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* Auctioneer 3D Character - Elevated at y=0.76 on dais, tall commanding stature, completely unobstructed */}
      <CharacterErrorBoundary fallback={<AuctionCharacterLoading position={[0, 0.76, 0.0]} color="#f5b82e" />}>
        <Suspense fallback={<AuctionCharacterLoading position={[0, 0.76, 0.0]} color="#f5b82e" />}>
          <CharacterInstance
            modelUrl={AUCTION_CHARACTER_MODEL}
            position={[0, 0.76, 0.0]}
            yaw={0}
            action={phase === 'sold' ? 'victory' : 'auctioneerCall'}
            progress={phase === 'sold' ? 0.45 : 0.35}
            heightScale={1.12}
            updateFps={24}
            trackBall={false}
            castShadow={false}
          />
        </Suspense>
      </CharacterErrorBoundary>
      <AuctionGavel phase={phase} />

      {/* 10 IPL Franchise Desks Arranged in Two Rows (5 Front, 5 Back elevated) */}
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
        camera={{ position: [0, 5.8, 16.0], fov: 48, near: 0.1, far: 100 }}
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
