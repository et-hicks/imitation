import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const MolstarViewer = dynamic(
  () => import('../../components/MolstarViewer').then((mod) => mod.MolstarViewer),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'DNA Project',
};

export default function DnaPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black flex items-center justify-center px-6 py-12">
      <div className="max-w-5xl w-full flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-white text-4xl font-semibold mb-6">
            Welcome to DNA Polymerase Project
          </h1>
          <p className="text-white text-2xl">Ethan, Thalia, and Mubassera</p>
          <p className="text-white text-xl mt-2">this is a group project</p>
          <p className="text-slate-300 text-base mt-6">
            Explore the Mol* viewer below to interact with the DNA polymerase protein structure
            from the RCSB Protein Data Bank (PDB ID: 2O8B).
          </p>
        </div>
        <MolstarViewer />
      </div>
    </main>
  );
}
