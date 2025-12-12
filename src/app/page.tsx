/**
 * page.tsx - Home page (/)
 * 
 * Landing page with animated Quoridor board and navigation to Local or Online modes
 */

import Link from "next/link";
import AnimatedBoard from "@/components/AnimatedBoard";
import { BsGithub } from "react-icons/bs";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-12">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        {/* Animated Board */}
        <div className="w-full max-w-md lg:max-w-lg">
          <AnimatedBoard />
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <div className="flex flex-col gap-3">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700 font-bold font-fredoka">
              Quoridor Online
            </p>
            <h1 className="text-3xl font-bold text-amber-950 sm:text-4xl lg:text-5xl font-fredoka">
              Build walls, find paths, reach the goal first.
            </h1>
            <p className="max-w-lg text-base text-amber-800 sm:text-lg font-medium font-fredoka">
              Play a beautiful, animated Quoridor experience locally or invite a friend online.
              Walls, pathfinding, and turns are fully validated for fair play.
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center md:items-start font-fredoka">
           <div className="flex gap-4 md:gap-6">
             <Link
              href="/local"
              className="rounded-full bg-amber-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-amber-300/50 transition hover:-translate-y-0.5 hover:bg-amber-600"
            >
              Local Game
            </Link>
            <Link
              href="/online"
              className="rounded-full border border-amber-200 bg-white px-6 py-3 text-base font-semibold text-amber-900 shadow transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50"
            >
              Play Online
            </Link>
           </div>
            <a
              href="https://github.com/VrandaaGarg/quoridor-game"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-full p-3 text-amber-100 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ring-2 ring-amber-900/20"
              style={{
                background: "linear-gradient(135deg, #8B4513 0%, #6B3E0A 50%, #3D2510 100%)",
                boxShadow: "0 4px 15px rgba(61, 37, 16, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
              }}
            >
              {/* Shine effect */}
              <span 
                className="absolute inset-0 animate-shine"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255, 230, 200, 0.4) 50%, transparent 100%)",
                  transform: "skewX(-20deg)",
                }}
              />
              <BsGithub className="h-6 w-6 relative z-10 drop-shadow-sm" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
