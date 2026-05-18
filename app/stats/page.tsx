'use client';
import Link from 'next/link';
export default function StatsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">Stats</h1>
      <p className="text-neutral-400 mb-8">Sprint 2 — coming soon</p>
      <Link href="/" className="text-red-400 underline">← Back</Link>
    </main>
  );
}
