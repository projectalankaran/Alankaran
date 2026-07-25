import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Float } from "@react-three/drei";
import * as THREE from "three";
import { isWebGLAvailable } from "@/lib/webgl";

/** Zero-React pointer channel: the hero writes into `.current`, the frame loop reads it. */
export type PointerRef = React.MutableRefObject<{ x: number; y: number }>;

function FallingPetal({ 
  position, 
  scale, 
  speed, 
  rotationSpeed 
}: { 
  position: [number, number, number]; 
  scale: number; 
  speed: number;
  rotationSpeed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initialY = position[1];
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y -= speed;
    ref.current.position.x += Math.sin(state.clock.elapsedTime * 0.5 + initialY) * 0.005;
    ref.current.rotation.x += rotationSpeed;
    ref.current.rotation.y += rotationSpeed * 0.5;
    
    // Reset position when it goes out of view
    if (ref.current.position.y < -12) {
      ref.current.position.y = 12;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <boxGeometry args={[1, 1, 0.05]} />
      <meshStandardMaterial 
        color="#c9a96e" 
        metalness={0.9} 
        roughness={0.1} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

function LightOrb({ 
  position, 
  scale, 
  color 
}: { 
  position: [number, number, number]; 
  scale: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.5;
    ref.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * 0.3 + position[1]) * 0.3;
  });

  return (
    <Sphere ref={ref} position={position} args={[1, 16, 16]} scale={scale}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={0.3}
      />
    </Sphere>
  );
}

function GoldDust({ isMobile }: { isMobile: boolean }) {
  // Mobile: 200 particles — enough for the gold-dust effect without GPU overload
  // Desktop: 800 particles — cinematic density
  const count = isMobile ? 200 : 800;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.008;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        color="#f5e6d8" 
        size={isMobile ? 0.03 : 0.015} 
        transparent 
        opacity={0.3} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function MouseLight({ pointer }: { pointer: PointerRef }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (!lightRef.current) return;
    const { x, y } = pointer.current;
    lightRef.current.position.x += (x * 8 - lightRef.current.position.x) * 0.05;
    lightRef.current.position.y += (-y * 6 - lightRef.current.position.y) * 0.05;
  });
  return (
    <pointLight ref={lightRef} color="#f5e0c0" intensity={5} distance={20} />
  );
}

function Scene({ pointer, isMobile }: { pointer: PointerRef; isMobile: boolean }) {
  const petals = useMemo(() => {
    const count = isMobile ? 12 : 30;
    return Array.from({ length: count }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 30,
        Math.random() * 20 - 10,
        (Math.random() - 0.5) * 10
      ] as [number, number, number],
      scale: 0.05 + Math.random() * 0.1,
      speed: 0.01 + Math.random() * 0.02,
      rotationSpeed: 0.01 + Math.random() * 0.03
    }));
  }, [isMobile]);

  return (
    <>
      <ambientLight intensity={0.5} color="#f5e6d8" />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#fdf0e0" />
      <MouseLight pointer={pointer} />
      
      <group>
        {petals.map((p, i) => (
          <FallingPetal key={i} {...p} />
        ))}
        <LightOrb position={[-5, 3, -5]} scale={0.4} color="#f5e6d8" />
        <LightOrb position={[6, -4, -8]} scale={0.6} color="#c9a96e" />
        <LightOrb position={[2, 5, -12]} scale={0.8} color="#fdf0e0" />
      </group>

      <GoldDust isMobile={isMobile} />
    </>
  );
}

interface HeroCanvasProps {
  pointer: PointerRef;
  isMobile?: boolean;
}

/**
 * The WebGL layer. Lifecycle (mount/unmount by capability + on-screen + tab-visible) is owned by the
 * caller (HeroSection) via the global animation capability, so this component's mere existence already
 * implies "we should render." The only gate kept here is the final WebGL-context availability check —
 * a device-level fact the capability heuristic can't know. When unmounted, the r3f render loop is torn
 * down entirely: zero RAF, zero GPU while offscreen or hidden.
 */
export default function HeroCanvas({ pointer, isMobile = false }: HeroCanvasProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(isWebGLAvailable());
  }, []);

  if (webglOk === null || !webglOk) return null;

  return (
    <Suspense fallback={null}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        dpr={isMobile ? 1 : [1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <Scene pointer={pointer} isMobile={isMobile} />
      </Canvas>
    </Suspense>
  );
}
