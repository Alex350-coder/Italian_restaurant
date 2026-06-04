import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IngredientProps {
  position: [number, number, number];
  color: string;
  scale: number;
  speed: number;
  type: 'tomato' | 'basil' | 'garlic' | 'olive';
}

function Ingredient({ position, color, scale, speed, type }: IngredientProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime * speed + offset;
      meshRef.current.position.x = initialPos.x + Math.sin(t * 0.5) * 0.3;
      meshRef.current.position.y = initialPos.y + Math.sin(t * 0.7) * 0.2;
      meshRef.current.position.z = initialPos.z + Math.cos(t * 0.3) * 0.2;
      meshRef.current.rotation.x += 0.005 * speed;
      meshRef.current.rotation.y += 0.008 * speed;
    }
  });

  const getGeometry = () => {
    switch (type) {
      case 'tomato':
        return (
          <group>
            <mesh>
              <sphereGeometry args={[0.3 * scale, 16, 16]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.25 * scale, 0]}>
              <cylinderGeometry args={[0.02 * scale, 0.04 * scale, 0.1 * scale, 8]} />
              <meshStandardMaterial color="#228B22" />
            </mesh>
          </group>
        );
      case 'basil':
        return (
          <group>
            <mesh rotation={[0, 0, 0.2]}>
              <sphereGeometry args={[0.2 * scale, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            <mesh position={[0.1 * scale, 0.1 * scale, 0]} rotation={[0, 0, -0.3]}>
              <sphereGeometry args={[0.15 * scale, 8, 8]} />
              <meshStandardMaterial color="#2E8B57" roughness={0.6} />
            </mesh>
          </group>
        );
      case 'garlic':
        return (
          <group>
            <mesh>
              <sphereGeometry args={[0.2 * scale, 12, 12]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh
                key={i}
                position={[
                  Math.cos((i * Math.PI * 2) / 5) * 0.12 * scale,
                  -0.05 * scale,
                  Math.sin((i * Math.PI * 2) / 5) * 0.12 * scale,
                ]}
              >
                <sphereGeometry args={[0.08 * scale, 8, 8]} />
                <meshStandardMaterial color="#F5F5DC" roughness={0.7} />
              </mesh>
            ))}
          </group>
        );
      case 'olive':
        return (
          <group>
            <mesh>
              <sphereGeometry args={[0.15 * scale, 12, 12]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.1 * scale, 0]}>
              <sphereGeometry args={[0.03 * scale, 8, 8]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
          </group>
        );
    }
  };

  return <mesh ref={meshRef} position={position}>{getGeometry()}</mesh>;
}

function Ingredients() {
  const ingredients: IngredientProps[] = useMemo(
    () => [
      { position: [-2, 1, -1], color: '#C41E3A', scale: 1.2, speed: 0.5, type: 'tomato' },
      { position: [2.5, 0.5, -0.5], color: '#228B22', scale: 0.9, speed: 0.7, type: 'basil' },
      { position: [-1, -0.5, 1.5], color: '#F5F5DC', scale: 1, speed: 0.4, type: 'garlic' },
      { position: [1.5, 1.5, 1], color: '#2F4F2F', scale: 1.1, speed: 0.6, type: 'olive' },
      { position: [-2.5, 0, 0.5], color: '#FF6347', scale: 0.8, speed: 0.55, type: 'tomato' },
      { position: [0, 1.8, -1.5], color: '#32CD32', scale: 0.7, speed: 0.65, type: 'basil' },
      { position: [2, -0.8, -1], color: '#FFFDD0', scale: 0.9, speed: 0.45, type: 'garlic' },
      { position: [-1.5, 1.2, -0.5], color: '#556B2F', scale: 1, speed: 0.5, type: 'olive' },
    ],
    []
  );

  return (
    <>
      {ingredients.map((ing, i) => (
        <Ingredient key={i} {...ing} />
      ))}
    </>
  );
}

export default function FloatingIngredients() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <Ingredients />
      </Canvas>
    </div>
  );
}
