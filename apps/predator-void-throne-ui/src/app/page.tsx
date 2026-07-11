import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/ui/GlobalHeader";
import { SideNavigation } from "@/components/ui/SideNavigation";

const MainScene = dynamic(() => import("@/components/scene/MainScene").then(m => m.MainScene), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-black overflow-hidden">
      <GlobalHeader />
      <SideNavigation />
      
      {/* 3D Canvas Container */}
      <div className="absolute inset-0 z-0">
        <MainScene />
      </div>

      {/* Target Reticle overlay */}
      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center opacity-30">
        <div className="w-16 h-16 border-2 border-red-500 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          <div className="absolute w-20 h-px bg-red-500/50 rotate-45"></div>
          <div className="absolute w-20 h-px bg-red-500/50 -rotate-45"></div>
        </div>
      </div>
    </main>
  );
}
