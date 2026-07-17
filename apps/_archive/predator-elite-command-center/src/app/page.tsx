import { SceneWrapper } from "@/components/SceneWrapper";
import { CommandOverlay } from "@/components/ui/CommandOverlay";

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-rose-500/30">
      {/* 3D Environment Layer */}
      <div className="absolute inset-0 z-0">
        <SceneWrapper />
      </div>

      {/* HTML UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <CommandOverlay />
      </div>
    </main>
  );
}
