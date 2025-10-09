import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DNA Project',
};

export default function DnaPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-4xl font-semibold mb-6">
          Welcome to DNA Polymerase Project
        </h1>
        <p className="text-white text-2xl">Ethan, Thalia, and Mubassera</p>
        <p className="text-white text-xl mt-2">this is a group project</p>
      </div>
    </main>
  );
}