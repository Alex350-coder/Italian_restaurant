import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function Table() {
  const tableRef = useRef<THREE.Group>(null);

  return (
    <group ref={tableRef} position={[0, 0, 0]}>
      <RoundedBox args={[2, 0.1, 1.2]} radius={0.02} position={[0, 0.8, 0]}>
        <meshStandardMaterial color="#8B4513" roughness={0.4} metalness={0.1} />
      </RoundedBox>
      {[[-0.8, 0, -0.45], [0.8, 0, -0.45], [-0.8, 0, 0.45], [0.8, 0, 0.45]].map((pos, i) => (
        <RoundedBox key={i} args={[0.08, 0.8, 0.08]} radius={0.02} position={[pos[0], 0.4, pos[2]]}>
          <meshStandardMaterial color="#6B3410" roughness={0.5} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.3, 0.02, 0.3]} radius={0.01} position={[0, 0.87, 0]}>
        <meshStandardMaterial color="#C41E3A" roughness={0.3} />
      </RoundedBox>
    </group>
  );
}

function Chair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.4, 0.05, 0.4]} radius={0.02} position={[0, 0.45, 0]}>
        <meshStandardMaterial color="#6B3410" roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.5, 0.05]} radius={0.02} position={[0, 0.72, -0.18]}>
        <meshStandardMaterial color="#6B3410" roughness={0.5} />
      </RoundedBox>
      {[[-0.15, 0, -0.15], [0.15, 0, -0.15], [-0.15, 0, 0.15], [0.15, 0, 0.15]].map((p, i) => (
        <RoundedBox key={i} args={[0.04, 0.45, 0.04]} radius={0.01} position={[p[0], 0.225, p[2]]}>
          <meshStandardMaterial color="#5A2D0E" roughness={0.6} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Plant() {
  const plantRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (plantRef.current) {
      plantRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  return (
    <group ref={plantRef}>
      <RoundedBox args={[0.3, 0.4, 0.3]} radius={0.05} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </RoundedBox>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshStandardMaterial color="#228B22" roughness={0.7} />
        </mesh>
        <mesh position={[0.1, 0.75, 0.05]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#2E8B57" roughness={0.7} />
        </mesh>
        <mesh position={[-0.08, 0.7, -0.05]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#32CD32" roughness={0.7} />
        </mesh>
      </Float>
    </group>
  );
}

function CandleLight({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flameRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.1 + Math.sin(state.clock.elapsedTime * 13) * 0.05;
      flameRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      <RoundedBox args={[0.06, 0.2, 0.06]} radius={0.02} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#FFFDD0" roughness={0.3} />
      </RoundedBox>
      <mesh ref={flameRef} position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial
          color="#FFA500"
          emissive="#FF6600"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight position={[0, 0.3, 0]} color="#FF8C00" intensity={0.5} distance={2} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} color="#FFF8DC" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color="#FFFDD0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 3, -2]} intensity={0.4} color="#C41E3A" />
      <pointLight position={[3, 3, 2]} intensity={0.4} color="#DAA520" />

      <Table />
      <Chair position={[-1.2, 0, 0]} rotation={Math.PI / 2} />
      <Chair position={[1.2, 0, 0]} rotation={-Math.PI / 2} />
      <Chair position={[0, 0, -1]} rotation={0} />
      <Chair position={[0, 0, 1]} rotation={Math.PI} />

      <Plant />
      <CandleLight position={[0, 0.87, 0]} />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      <Environment preset="city" />
      <OrbitControls
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}

export default function RestaurantScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 2.5, 3], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  );
}
