import type { Metadata } from 'next';
import { ThreeDMolViewer } from '../../components/ThreeDMolViewer';

const POLYMERASE_MODEL_URL = 'https://files.rcsb.org/download/2O8B.pdb';
const POLYMERASE_STYLE: Record<string, unknown> = {
  cartoon: { color: 'spectrum' },
};

const SERINE_MODEL_URL = 'https://files.rcsb.org/download/SER.cif';
const SERINE_STYLE: Record<string, unknown> = {
  stick: { colorscheme: 'Jmol', radius: 0.25 },
};

export const metadata: Metadata = {
  title: 'DNA Project',
};

export default function DnaPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black px-6 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-blue-300">
            DNA Polymerase Project
          </p>
          <h1 className="text-4xl font-semibold">Exploring PDB Structure 2O8B</h1>
          <p className="text-lg text-slate-300">
            A collaborative effort by Ethan, Thalia, and Mubassera to visualize and annotate a key
            polymerase enzyme. Scroll to learn more about how the structure supports DNA
            replication and the experimental insights we discovered while studying it.
          </p>
        </header>

        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">
              DNA Polymerase Viewer (PDB 2O8B)
            </h2>
            <p className="text-slate-300">
              Explore the full polymerase complex using a 3Dmol.js rendering of the PDB structure.
              Rotate and zoom to inspect the enzyme&apos;s subdomains and ligand interactions.
            </p>
          </div>
          <ThreeDMolViewer
            className="h-[480px]"
            modelUrl={POLYMERASE_MODEL_URL}
            format="pdb"
            style={POLYMERASE_STYLE}
          />
        </section>

        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">
              Serine Amino Acid (Ligand SER)
            </h2>
            <p className="text-slate-300">
              Compare the whole protein with an isolated serine residue. This viewer loads the SER
              ligand model from the RCSB ligand library and highlights atomic detail using a stick
              representation.
            </p>
          </div>
          <ThreeDMolViewer
            className="h-[360px]"
            modelUrl={SERINE_MODEL_URL}
            format="sdf"
            style={SERINE_STYLE}
            backgroundColor="#020617"
          />
        </section>
      </div>
    </main>
  );
}
