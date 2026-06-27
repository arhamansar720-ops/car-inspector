"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { BodyType, DefectFinding } from "@/lib/types";
import { findDefectPosition } from "@/lib/car-models";

// ─── Procedural car geometry ────────────────────────────────────────────────

interface CarBodyProps {
  bodyType: BodyType;
  bodyColor: string;
  openDoors: Set<string>;
}

function CarBody({ bodyType, bodyColor, openDoors }: CarBodyProps) {
  const color = new THREE.Color(bodyColor);
  const paintMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.6,
    roughness: 0.25,
    envMapIntensity: 1.2,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#b8d4e8",
    metalness: 0.0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.45,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: "#111111", roughness: 0.7 });
  const chromeMaterial = new THREE.MeshStandardMaterial({ color: "#cccccc", metalness: 0.9, roughness: 0.1 });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.9 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: "#888888", metalness: 0.8, roughness: 0.2 });

  // Body proportions by type
  const dims = {
    sedan:    { bw: 1.9, bh: 0.75, bl: 4.6, rw: 1.75, rh: 0.6, rl: 2.4, ry: 0.72 },
    coupe:    { bw: 1.9, bh: 0.72, bl: 4.4, rw: 1.75, rh: 0.52, rl: 2.6, ry: 0.70 },
    suv:      { bw: 2.0, bh: 0.9, bl: 4.7, rw: 1.85, rh: 0.85, rl: 3.0, ry: 0.85 },
    truck:    { bw: 2.1, bh: 0.85, bl: 3.2, rw: 1.95, rh: 0.75, rl: 2.0, ry: 0.80 },
    hatchback:{ bw: 1.85, bh: 0.7, bl: 4.2, rw: 1.7, rh: 0.68, rl: 2.5, ry: 0.68 },
    minivan:  { bw: 2.0, bh: 1.05, bl: 4.8, rw: 1.85, rh: 1.0, rl: 3.2, ry: 1.0 },
  }[bodyType];

  const wheelY = -dims.bh / 2 - 0.05;
  const wheelRadius = 0.38;
  const wheelWidth = 0.22;
  const wheelPositions: [number, number, number][] = [
    [dims.bw / 2 + wheelWidth / 2, wheelY, 1.45],
    [-dims.bw / 2 - wheelWidth / 2, wheelY, 1.45],
    [dims.bw / 2 + wheelWidth / 2, wheelY, -1.35],
    [-dims.bw / 2 - wheelWidth / 2, wheelY, -1.35],
  ];

  // Door references for animation
  const doorFL = useRef<THREE.Group>(null);
  const doorFR = useRef<THREE.Group>(null);

  useFrame(() => {
    if (doorFL.current) {
      const target = openDoors.has("fl") ? -Math.PI * 0.42 : 0;
      doorFL.current.rotation.y = THREE.MathUtils.lerp(doorFL.current.rotation.y, target, 0.1);
    }
    if (doorFR.current) {
      const target = openDoors.has("fr") ? Math.PI * 0.42 : 0;
      doorFR.current.rotation.y = THREE.MathUtils.lerp(doorFR.current.rotation.y, target, 0.1);
    }
  });

  return (
    <group position={[0, wheelRadius, 0]}>
      {/* Main body */}
      <mesh material={paintMaterial} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[dims.bw, dims.bh, dims.bl]} />
      </mesh>

      {/* Cabin / roof */}
      <mesh material={paintMaterial} position={[0, dims.bh / 2 + dims.rh / 2 - 0.04, bodyType === "truck" ? 0.5 : 0]} castShadow>
        <boxGeometry args={[dims.rw, dims.rh, dims.rl]} />
      </mesh>

      {/* Windshield */}
      <mesh
        material={glassMaterial}
        position={[0, dims.bh / 2 + dims.rh * 0.3, bodyType === "truck" ? 0.5 + dims.rl / 2 - 0.05 : dims.rl / 2 - 0.05]}
        rotation={[Math.PI * 0.18, 0, 0]}
      >
        <boxGeometry args={[dims.rw - 0.15, dims.rh * 0.7, 0.06]} />
      </mesh>

      {/* Rear window */}
      <mesh
        material={glassMaterial}
        position={[0, dims.bh / 2 + dims.rh * 0.3, bodyType === "truck" ? 0.5 - dims.rl / 2 + 0.05 : -dims.rl / 2 + 0.05]}
        rotation={[-Math.PI * 0.18, 0, 0]}
      >
        <boxGeometry args={[dims.rw - 0.15, dims.rh * 0.65, 0.06]} />
      </mesh>

      {/* Side windows */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          material={glassMaterial}
          position={[side * (dims.rw / 2 + 0.01), dims.bh / 2 + dims.rh * 0.35, bodyType === "truck" ? 0.5 : 0]}
        >
          <boxGeometry args={[0.06, dims.rh * 0.6, dims.rl * 0.85]} />
        </mesh>
      ))}

      {/* Front bumper */}
      <mesh material={darkMaterial} position={[0, -dims.bh * 0.15, dims.bl / 2 + 0.08]} castShadow>
        <boxGeometry args={[dims.bw * 0.95, dims.bh * 0.35, 0.18]} />
      </mesh>

      {/* Rear bumper */}
      <mesh material={darkMaterial} position={[0, -dims.bh * 0.15, -dims.bl / 2 - 0.08]} castShadow>
        <boxGeometry args={[dims.bw * 0.95, dims.bh * 0.35, 0.18]} />
      </mesh>

      {/* Headlights */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (dims.bw * 0.38), dims.bh * 0.1, dims.bl / 2 + 0.05]}>
          <boxGeometry args={[0.35, 0.14, 0.06]} />
          <meshStandardMaterial color="#fffff0" emissive="#ffffd0" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* Tail lights */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (dims.bw * 0.38), dims.bh * 0.08, -dims.bl / 2 - 0.05]}>
          <boxGeometry args={[0.3, 0.12, 0.05]} />
          <meshStandardMaterial color="#ff2200" emissive="#cc1100" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Grille */}
      <mesh material={darkMaterial} position={[0, dims.bh * 0.05, dims.bl / 2 + 0.1]}>
        <boxGeometry args={[dims.bw * 0.55, dims.bh * 0.28, 0.06]} />
      </mesh>

      {/* Chrome trim strip */}
      <mesh material={chromeMaterial} position={[0, -dims.bh * 0.45, 0]}>
        <boxGeometry args={[dims.bw + 0.02, 0.04, dims.bl + 0.04]} />
      </mesh>

      {/* Door panels (animated) */}
      {/* Front-left door */}
      <group position={[-dims.bw / 2, 0, 0.55]}>
        <group ref={doorFL}>
          <mesh material={paintMaterial} position={[-0.04, 0, 0]} castShadow>
            <boxGeometry args={[0.08, dims.bh * 0.85, 1.1]} />
          </mesh>
          {/* Window */}
          <mesh material={glassMaterial} position={[-0.04, dims.bh * 0.43, 0]}>
            <boxGeometry args={[0.07, dims.rh * 0.55, 0.92]} />
          </mesh>
          {/* Handle */}
          <mesh material={chromeMaterial} position={[-0.1, 0.05, 0.1]}>
            <boxGeometry args={[0.06, 0.04, 0.22]} />
          </mesh>
        </group>
      </group>

      {/* Front-right door */}
      <group position={[dims.bw / 2, 0, 0.55]}>
        <group ref={doorFR}>
          <mesh material={paintMaterial} position={[0.04, 0, 0]} castShadow>
            <boxGeometry args={[0.08, dims.bh * 0.85, 1.1]} />
          </mesh>
          <mesh material={glassMaterial} position={[0.04, dims.bh * 0.43, 0]}>
            <boxGeometry args={[0.07, dims.rh * 0.55, 0.92]} />
          </mesh>
          <mesh material={chromeMaterial} position={[0.1, 0.05, 0.1]}>
            <boxGeometry args={[0.06, 0.04, 0.22]} />
          </mesh>
        </group>
      </group>

      {/* Rear doors (static) */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (dims.bw / 2), 0, -0.65]}>
          <mesh material={paintMaterial} position={[side * 0.04, 0, 0]} castShadow>
            <boxGeometry args={[0.08, dims.bh * 0.85, 1.0]} />
          </mesh>
          <mesh material={glassMaterial} position={[side * 0.04, dims.bh * 0.43, 0]}>
            <boxGeometry args={[0.07, dims.rh * 0.52, 0.84]} />
          </mesh>
        </group>
      ))}

      {/* Truck bed */}
      {bodyType === "truck" && (
        <>
          <mesh material={darkMaterial} position={[0, -dims.bh * 0.05, -1.6]} castShadow>
            <boxGeometry args={[dims.bw, dims.bh * 0.85, 1.9]} />
          </mesh>
          <mesh material={paintMaterial} position={[0, dims.bh * 0.4, -2.55]}>
            <boxGeometry args={[dims.bw, 0.06, 0.1]} />
          </mesh>
        </>
      )}

      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <group key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={tireMaterial} castShadow>
            <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 32]} />
          </mesh>
          <mesh material={rimMaterial} position={[0, i % 2 === 0 ? wheelWidth * 0.45 : -wheelWidth * 0.45, 0]}>
            <cylinderGeometry args={[wheelRadius * 0.62, wheelRadius * 0.62, wheelWidth * 0.15, 16]} />
          </mesh>
          {/* Spokes */}
          {[0, 1, 2, 3, 4].map((s) => (
            <mesh
              key={s}
              material={rimMaterial}
              position={[0, i % 2 === 0 ? wheelWidth * 0.46 : -wheelWidth * 0.46, 0]}
              rotation={[(Math.PI * 2 * s) / 5, 0, 0]}
            >
              <boxGeometry args={[wheelRadius * 0.09, wheelWidth * 0.1, wheelRadius * 0.55]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Defect marker ────────────────────────────────────────────────────────────

function DefectMarker({ position, severity, label, active }: {
  position: [number, number, number];
  severity: string;
  label: string;
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = severity === "major" ? "#ef4444" : severity === "moderate" ? "#f97316" : "#eab308";

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(active ? 1 + Math.sin(clock.getElapsedTime() * 4) * 0.2 : 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 2 : 0.8} transparent opacity={0.9} />
      </mesh>
      {/* Ring */}
      <mesh>
        <torusGeometry args={[0.12, 0.015, 8, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ─── Camera preset controller ─────────────────────────────────────────────────

type CameraPreset = "exterior" | "driver" | "passenger" | "rear";

const CAMERA_PRESETS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  exterior: { position: [4, 2.5, 5], target: [0, 0.5, 0] },
  driver:   { position: [-0.6, 1.5, 0.3], target: [0, 1.2, 1.5] },
  passenger:{ position: [0.6, 1.5, 0.3], target: [0, 1.2, 1.5] },
  rear:     { position: [0, 1.5, -0.8], target: [0, 1.0, -2.0] },
};

function CameraController({ preset }: { preset: CameraPreset }) {
  const { camera } = useThree();

  useEffect(() => {
    const { position, target } = CAMERA_PRESETS[preset];
    camera.position.set(...position);
    camera.lookAt(...target);
  }, [preset, camera]);

  return null;
}

// ─── Main viewer export ───────────────────────────────────────────────────────

interface CarViewerProps {
  bodyType: BodyType;
  bodyColor: string;
  findings: DefectFinding[];
  selectedFinding: number | null;
}

export default function CarViewer({ bodyType, bodyColor, findings, selectedFinding }: CarViewerProps) {
  const [openDoors, setOpenDoors] = useState<Set<string>>(new Set());
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("exterior");

  const toggleDoor = (door: string) => {
    setOpenDoors((prev) => {
      const next = new Set(prev);
      if (next.has(door)) next.delete(door);
      else next.add(door);
      return next;
    });
  };

  const activeSeverities = (["major", "moderate", "minor"] as const).filter((s) =>
    findings.some((f) => f.severity === s)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Canvas */}
      <div className="relative flex-1">
        <Canvas shadows camera={{ position: [4, 2.5, 5], fov: 45 }} style={{ background: "#0a0a0a" }}>
          <CameraController preset={cameraPreset} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow shadow-mapSize={1024} />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />

          <Suspense fallback={null}>
            <Environment preset="city" />
            <CarBody bodyType={bodyType} bodyColor={bodyColor} openDoors={openDoors} />

            {findings.map((f, i) => (
              <DefectMarker
                key={i}
                position={findDefectPosition(f.location)}
                severity={f.severity}
                label={f.location}
                active={selectedFinding === i}
              />
            ))}

            <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={12} blur={2} far={6} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={12}
            minPolarAngle={0}
            maxPolarAngle={Math.PI * 0.52}
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>

        {/* Defect legend — absolute overlay */}
        {activeSeverities.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md border border-white/[0.08] rounded-[10px] px-3 py-2.5 space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/30 mb-1">Markers</p>
            {activeSeverities.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${s === "major" ? "bg-[#ff453a]" : s === "moderate" ? "bg-[#ff9f0a]" : "bg-[#ffd60a]"}`} />
                <span className="text-[11px] text-white/45 capitalize">{s}</span>
              </div>
            ))}
            <p className="text-[9px] text-white/20 pt-0.5">Positions approximate</p>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-4 bg-[#0a0a0a]">
        {/* View presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/20 mr-1">View</span>
          {(["exterior", "driver", "passenger", "rear"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setCameraPreset(preset)}
              className={`h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors capitalize ${
                cameraPreset === preset
                  ? "bg-[#0a84ff] text-white"
                  : "bg-white/[0.05] text-white/35 hover:bg-white/[0.09] hover:text-white/60"
              }`}
              >
                {preset}
              </button>
            ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/[0.07] shrink-0" />

        {/* Door toggles */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/20 mr-1">Doors</span>
          {(["fl", "fr"] as const).map((key) => {
            const open = openDoors.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleDoor(key)}
                className={`h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors ${
                  open
                    ? "bg-[#30d158]/15 text-[#30d158]"
                    : "bg-white/[0.05] text-white/35 hover:bg-white/[0.09] hover:text-white/60"
                }`}
              >
                {key === "fl" ? "Front L" : "Front R"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
