import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function Bottle({ isHovered }: { isHovered: boolean }) {
  const bottleRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);

  useFrame((state) => {
    if (bottleRef.current) {
      targetRotation.current = isHovered ? -0.3 : 0;
      bottleRef.current.rotation.x = THREE.MathUtils.lerp(
        bottleRef.current.rotation.x,
        targetRotation.current,
        0.05
      );
      if (!isHovered) {
        bottleRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      }
    }
  });

  return (
    <group ref={bottleRef}>
      <RoundedBox args={[0.18, 0.6, 0.18]} radius={0.04} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#1a3a1a"
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </RoundedBox>

      <RoundedBox args={[0.1, 0.3, 0.1]} radius={0.03} position={[0, 0.42, 0]}>
        <meshStandardMaterial
          color="#1a3a1a"
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </RoundedBox>

      <RoundedBox args={[0.12, 0.06, 0.12]} radius={0.02} position={[0, 0.58, 0]}>
        <meshStandardMaterial
          color="#1a3a1a"
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </RoundedBox>

      <RoundedBox args={[0.14, 0.08, 0.14]} radius={0.03} position={[0, 0.65, 0]}>
        <meshStandardMaterial color="#DAA520" roughness={0.3} metalness={0.6} />
      </RoundedBox>

      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.08, 16]} />
        <meshStandardMaterial color="#DAA520" roughness={0.3} metalness={0.6} />
      </mesh>

      <RoundedBox args={[0.14, 0.2, 0.001]} radius={0.01} position={[0, 0.05, 0.092]}>
        <meshStandardMaterial color="#FFFDD0" roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

function WineGlass() {
  const glassRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (glassRef.current) {
      glassRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={glassRef} position={[0.5, -0.2, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.2, 16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.2}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.15}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.13, 0.1, 0.15, 16]} />
        <meshStandardMaterial
          color="#722F37"
          transparent
          opacity={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

export default function WineBottle() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="w-full h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas camera={{ position: [1.5, 0.5, 1.5], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 3]} intensity={0.8} color="#FFF8DC" />
        <pointLight position={[-2, 2, -2]} intensity={0.3} color="#C41E3A" />
        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
          <Bottle isHovered={isHovered} />
        </Float>
        <WineGlass />
      </Canvas>
    </div>
  );
}
