import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stage, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Component for "Fake 3D" using image texture mapped to a card
function Fake3DCard({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);
  const meshRef = useRef<THREE.Mesh>(null);

  // Auto-rotate slowly
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* BoxGeometry: width, height, depth */}
      {/* Making it look like a thin card or box */}
      <boxGeometry args={[3, 3, 0.1]} />
      {/* Apply texture to all faces. For better results, you can use an array of materials */}
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

interface Product3DViewerProps {
  imageUrl: string;
}

export default function Product3DViewer({ imageUrl }: Product3DViewerProps) {
  return (
    <div className="w-full h-full relative group">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <Fake3DCard imageUrl={imageUrl} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={2} />
      </Canvas>

      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-neutral-600 shadow-sm border border-white/50 pointer-events-none">
        2.5D Preview
      </div>
    </div>
  );
}
