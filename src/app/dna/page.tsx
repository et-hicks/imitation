import type { Metadata } from 'next';
import { MolstarViewer } from '../../components/MolstarViewer';

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

        <section className="flex flex-col items-stretch gap-12 lg:flex-row">
          <div className="flex-1 space-y-6 text-slate-200">
            <p>
              DNA polymerase is responsible for synthesizing new strands of DNA by adding
              nucleotides to a growing chain. The structure represented here captures the enzyme in
              complex with DNA and a nucleotide, offering a snapshot of the replication machinery in
              action.
            </p>
            <p>
              Use the interactive Mol* canvas to rotate, zoom, and highlight the active site. We
              recommend toggling representations to observe how the polymerase clamps around the DNA
              duplex and positions the incoming nucleotide for catalysis.
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Active site residues coordinate the incoming dNTP and catalyze phosphodiester bond formation.</li>
              <li>Metal ions stabilize the reaction intermediate and align the reactive groups.</li>
              <li>The thumb domain secures the DNA template, ensuring replication fidelity.</li>
            </ul>
          </div>
          <div className="w-full min-w-[200px] lg:max-w-[50%]">
            <MolstarViewer className="h-[420px]" />
          </div>
        </section>

        <section className="grid gap-10 text-slate-200 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Visualization Notes</h2>
            <p>
              The representation defaults to a cartoon view to emphasize secondary structure. You
              can switch to surface or ball-and-stick modes to investigate detailed interactions.
              Adjust the coloring schemes to highlight domains, ligand proximity, or temperature
              factors for deeper insights.
            </p>
            <p>
              If the canvas appears blank, give the viewer a moment to load resources from the RCSB
              server. A stable network connection is required to stream the mmCIF data into the
              browser.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Research Context</h2>
            <p>
              Structure 2O8B was resolved using X-ray crystallography at a resolution of 2.3 Angstrom,
              capturing a high-fidelity model of the enzyme&apos;s catalytic cycle. This dataset
              informed our hypotheses about error-checking and the coordination of accessory
              proteins during replication.
            </p>
            <p>
              Our next steps include comparing this structure to mutated variants associated with
              disease states to understand how subtle changes impair polymerase activity.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/30 p-6 text-slate-200">
          <h2 className="text-2xl font-semibold text-white">Further Reading &amp; Resources</h2>
          <ul className="list-disc space-y-2 pl-6 text-slate-300">
            <li>
              RCSB PDB entry{' '}
              <a
                href="https://www.rcsb.org/structure/2O8B"
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:text-blue-200"
              >
                2O8B
              </a>{' '}
              - experimental data, annotations, and related literature.
            </li>
            <li>
              Mol* documentation for tips on advanced representations and state management.
            </li>
            <li>
              Review articles on DNA polymerase fidelity mechanisms and their role in genome
              stability.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
