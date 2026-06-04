import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

function PizzaCrust() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <cylinderGeometry args={[1, 1, 0.08, 64]} />
      <meshStandardMaterial color="#D2691E" roughness={0.8} />
    </mesh>
  );
}

function PizzaSauce() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
      <cylinderGeometry args={[0.85, 0.85, 0.02, 64]} />
      <meshStandardMaterial color="#C41E3A" roughness={0.6} />
    </mesh>
  );
}

function PizzaCheese() {
  const cheeseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (cheeseRef.current) {
      cheeseRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <mesh ref={cheeseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
      <cylinderGeometry args={[0.82, 0.82, 0.03, 64]} />
      <meshStandardMaterial
        color="#FFFDD0"
        roughness={0.4}
        metalness={0.05}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function Pepperoni({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#8B0000" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.095, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.01, 16]} />
        <meshStandardMaterial color="#A52A2A" roughness={0.6} />
      </mesh>
    </group>
  );
}

function BasilLeaf({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const leafRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (leafRef.current) {
      leafRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
    }
  });

  return (
    <group ref={leafRef} position={position}>
      <mesh rotation={[-Math.PI / 2, rotation, 0]} position={[0, 0.1, 0]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial
          color="#228B22"
          side={THREE.DoubleSide}
          roughness={0.6}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, rotation + 0.3, 0]} position={[0.03, 0.1, 0.02]}>
        <planeGeometry args={[0.08, 0.05]} />
        <meshStandardMaterial
          color="#2E8B57"
          side={THREE.DoubleSide}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

function Pizza({ onHover }: { onHover: (hovered: boolean) => void }) {
  const pizzaRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (pizzaRef.current) {
      const targetRotY = hovered ? state.clock.elapsedTime * 1.5 : 0;
      pizzaRef.current.rotation.y = THREE.MathUtils.lerp(
        pizzaRef.current.rotation.y,
        targetRotY,
        0.05
      );
      const targetScale = hovered ? 1.1 : 1;
      pizzaRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group
      ref={pizzaRef}
      onPointerOver={() => { setHovered(true); onHover(true); }}
      onPointerOut={() => { setHovered(false); onHover(false); }}
    >
      <PizzaCrust />
      <PizzaSauce />
      <PizzaCheese />
      <Pepperoni position={[0.3, 0, 0.2]} />
      <Pepperoni position={[-0.4, 0, -0.1]} />
      <Pepperoni position={[0.1, 0, -0.4]} />
      <Pepperoni position={[-0.2, 0, 0.35]} />
      <Pepperoni position={[0.45, 0, -0.25]} />
      <Pepperoni position={[-0.5, 0, 0.15]} />
      <BasilLeaf position={[0.15, 0, 0.3]} rotation={0.5} />
      <BasilLeaf position={[-0.3, 0, 0.25]} rotation={1.2} />
      <BasilLeaf position={[0.35, 0, -0.3]} rotation={2.1} />
    </group>
  );
}

export default function PizzaModel() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-full h-full cursor-pointer">
      <Canvas camera={{ position: [2, 2, 2], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-3, 3, -3]} intensity={0.3} color="#C41E3A" />
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
          <Pizza onHover={setIsHovered} />
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      {isHovered && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-noche-negro/80 text-white px-4 py-2 rounded-full text-sm font-body backdrop-blur-sm">
          🍕 Margherita DOP — €12.50
        </div>
      )}
    </div>
  );
}
