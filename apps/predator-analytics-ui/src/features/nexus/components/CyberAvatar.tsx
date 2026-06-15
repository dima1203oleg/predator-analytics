import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import { EffectComposer, Bloom, Scanline, ChromaticAberration } from "@react-three/postprocessing";
import { Vector2 } from "three";
import { HoloFaceModel } from "./HoloFaceModel";

interface CyberAvatarProps {
  audioAnalyser: AnalyserNode | null;
  systemStatus: "HEALTHY" | "RISK";
}

export const CyberAvatar: React.FC<CyberAvatarProps> = ({ audioAnalyser, systemStatus }) => {
  // Адаптивний колір матриці контуру
  const neonColor = systemStatus === "RISK" ? "#bd00ff" : "#00f5ff";

  return (
    <div className="w-full h-full bg-[#020408] relative overflow-hidden">
      {/* Декоративна тактильна сітка на задньому плані UI через CSS */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 transition-colors duration-500"
        style={{
          backgroundImage: `linear-gradient(${neonColor} 1px, transparent 1px), linear-gradient(90deg, ${neonColor} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full"
      >
        <color attach="background" args={["#020408"]} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={neonColor} />
        <directionalLight position={[-5, 5, 2]} intensity={1.0} color="#ffffff" />

        <Suspense fallback={null}>
          <Center top>
            <HoloFaceModel audioAnalyser={audioAnalyser} systemStatus={systemStatus} />
          </Center>

          {/* Інтерактивна графова платформа-проектор під обличчям */}
          <gridHelper 
            args={[10, 20, neonColor, "#111827"]} 
            position={[0, -1.2, 0]} 
          />
        </Suspense>

        <OrbitControls 
          enableZoom={true} 
          maxDistance={8} 
          minDistance={2} 
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Шар кінематографічного пост-процесингу військового термінала */}
        <EffectComposer>
          <Bloom 
            intensity={2.5} 
            luminanceThreshold={0.1} 
            luminanceSmoothing={0.9} 
            mipmapBlur
          />
          <ChromaticAberration 
            offset={new Vector2(0.0004, 0.0004)} 
          />
          <Scanline 
            density={1.2} 
            opacity={0.03} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
