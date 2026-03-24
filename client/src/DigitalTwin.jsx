import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';

// 1. Fiziksel Donanım (Batarya) Modeli
const BatteryModel = ({ isAnomaly }) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <boxGeometry args={[2, 1.5, 1]} />
      <meshStandardMaterial 
        color={isAnomaly ? "#ef4444" : "#10b981"} 
        metalness={0.8} 
        roughness={0.2} 
      />
    </mesh>
  );
};

// 2. Ana Sahne (Dünya) - İŞTE HATAYI ÇÖZEN 'export default' BURADA
export default function DigitalTwin() {
  const [anomaly, setAnomaly] = useState(false);

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          3D Dijital İkiz (Batarya İstasyonu)
        </h2>
        
        <button 
          onClick={() => setAnomaly(!anomaly)}
          className={`px-4 py-2 rounded font-bold transition-all ${
            anomaly ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'
          }`}
        >
          {anomaly ? "Arızayı Çöz" : "Anomali (Aşırı Isınma) Simüle Et"}
        </button>
      </div>

      <div className="h-80 w-full rounded-lg overflow-hidden border border-slate-600 bg-slate-900 cursor-move">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Environment preset="city" />
          <ContactShadows position={[0, -0.5, 0]} opacity={0.7} scale={10} blur={2} far={4} />

          <BatteryModel isAnomaly={anomaly} />
          
          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>
      
      <p className="text-slate-400 text-sm mt-4 text-center">
        * Mouse ile sol tıkla çevir, sağ tıkla kaydır, tekerlek ile yakınlaş.
      </p>
    </div>
  );
}