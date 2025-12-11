/**
 * page.tsx - Home page (/)
 * 
 * Landing page with game intro and navigation to Local or Online modes
 */

import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-700">
          Quoridor Online
        </p>
        <h1 className="text-4xl font-semibold text-amber-950 sm:text-5xl">
          Build walls, find paths, reach the goal first.
        </h1>
        <p className="max-w-2xl text-lg text-amber-800">
          Play a beautiful, animated Quoridor experience locally or invite a friend online.
          Walls, pathfinding, and turns are fully validated for fair play.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
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
    </main>
  );
}
