import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei/native';

function Model({ url, visible }: { url: string; visible: boolean }) {
  const { scene } = useGLTF(url);
  if (!visible) return null;
  return <primitive object={scene} scale={2} position={[0, -2, 0]} />;
}

export default function Atlas3DCanvas({ url, visible }: { url: string; visible: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <color attach="background" args={['#07090F']} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Model url={url} visible={visible} />
      <OrbitControls enablePan={false} />
      <Environment preset="city" />
      <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
    </Canvas>
  );
}
