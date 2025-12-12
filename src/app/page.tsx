/**
 * page.tsx - Home page (/)
 * 
 * Landing page with animated Quoridor board and navigation to Local or Online modes
 */

import Link from "next/link";
import AnimatedBoard from "@/components/AnimatedBoard";

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

          <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-start font-fredoka">
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
        </div>
      </div>
    </main>
  );
}
