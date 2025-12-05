import type { Metadata } from 'next';
import { ThreeDMolViewer } from '../../components/ThreeDMolViewer';
import { MutationTabs } from '../../components/MutationTabs';

const POLYMERASE_MODEL_URL = 'https://files.rcsb.org/download/2O8B.pdb';
const POLYMERASE_STYLE: Record<string, unknown> = {
  cartoon: { color: 'spectrum' },
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
          <p className="text-sm uppercase tracking-wide text-blue-300">
            Thalia Matos - Mubassera Subah - Ethan Hicks
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
              Background
            </h2>
            <p className="text-slate-300">
              Lynch syndrome, previously known as hereditary nonpolyposis colorectal cancer (HNPCC), is the most common inherited form of colorectal cancer (CRC), affecting more than one million people in the United States (CITATION). 
              It results from harmful germline mutations in one of the four DNA mismatch repair (MMR) genes—MLH1, MSH2 (or EPCAM deletions affecting MSH2), MSH6, or PMS2. 
              Among these, mutations in MLH1 and MSH2 account for over half of all confirmed cases (2). Individuals with Lynch syndrome have substantially elevated cancer risks: depending on the specific MMR gene involved, the lifetime risk of CRC can approach 70%, and risks for additional cancers, including endometrial, ovarian, urinary tract, and several gastrointestinal cancers are also significantly increased (Citation).
            </p>
          </div>
        </section>

        <MutationTabs />

        <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Background</p>
            <h3 className="text-2xl font-semibold text-white">Why polymerase MLH1 matters</h3>
          </div>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              MLH1 is a mismatch-repair protein that safeguards DNA replication. When mutations weaken this safeguard,
              replication errors accumulate and create the genetic instability associated with Lynch Syndrome.
            </p>
            <p>
              Our project highlights how structural shifts at residues G68, V147, and L328 may destabilize the mismatch-repair complex
              and increase cancer risk.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Science</p>
            <h3 className="text-2xl font-semibold text-white">Structural and biochemical insights</h3>
          </div>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              Residue swaps that change charge or polarity (Ser→Glu, Val→Gln, Lys→Met) alter electrostatic pockets used for DNA binding.
              These shifts can disrupt the precise positioning of catalytic residues needed for mismatch repair.
            </p>
            <p>
              3Dmol visualizations show how local disruptions propagate through the MLH1 scaffold, misaligning active sites and lowering repair fidelity.
              We use the viewer to demonstrate how small molecular changes cascade into functional defects.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Treatment</p>
            <h3 className="text-2xl font-semibold text-white">Current clinical approaches</h3>
          </div>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              Patients with confirmed MLH1 mutations undergo regular colonoscopies, endometrial screening, and lab testing
              to detect lesions before they progress. Preventive surgeries are discussed for high-risk individuals.
            </p>
            <p>
              Targeted therapies, including checkpoint inhibitors and PARP inhibitors, are being tested to complement surgical interventions
              for Lynch-associated tumors. Treatment plans remain highly individualized.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Prognosis</p>
            <h3 className="text-2xl font-semibold text-white">Risk outlook with surveillance</h3>
          </div>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              Early diagnosis paired with routine screening dramatically reduces mortality. Localized tumors often carry a five-year survival rate above 90%
              when detected before metastasis.
            </p>
            <p>
              Genetic counseling helps families understand inherited risk, document variants, and enroll in surveillance programs.
              Informed monitoring remains the key to improving long-term outcomes.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
