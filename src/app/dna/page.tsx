import type { Metadata } from 'next';
import { ThreeDMolViewer } from '../../components/ThreeDMolViewer';
import { MutationTabs } from '../../components/MutationTabs';
import { SourceTooltip } from '../../components/SourceTooltip';
import { IsolatedProteinViewer } from '../../components/IsolatedProteinViewer';

const POLYMERASE_MODEL_URL = 'https://files.rcsb.org/download/2O8B.pdb';
// const POLYMERASE_MODEL_URL = 'https://files.rcsb.org/download/P43246.pdb';
const POLYMERASE_STYLE: Record<string, unknown> = {
  cartoon: { color: 'spectrum' },
};

export const metadata: Metadata = {
  title: 'DNA Project',
};

export default function DnaPage() {

  const Background = () => {
    const sources = [
      {
        content: 'MD Anderson Cancer Center',
        link: 'https://www.mdanderson.org/cancerwise/qa-understanding-and-managing-lynch-syndrome.h00-158589789.html',
        isLink: true,
      },
      {
        content: 'citation needed',
        link: '',
        isLink: false,
      },
      {
        content: 'MD Anderson Cancer Center',
        link: 'https://www.mdanderson.org/cancerwise/qa-understanding-and-managing-lynch-syndrome.h00-158589789.html',
        isLink: true,
      }
    ];

    return (
      <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
        <div className="space-y-1">
          {/* <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Background</p> */}
          <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Hereditary Non-Polyposis Colorectal Cancer</p>
          <h3 className="text-2xl font-semibold text-white">Background</h3>
        </div>
        <div className="space-y-3 text-slate-300 leading-relaxed">
          <p className="text-slate-300">
            Lynch syndrome, previously known as hereditary nonpolyposis colorectal cancer (HNPCC), is the most common inherited form of colorectal cancer (CRC), affecting more than one million people in the United States
            <SourceTooltip
              link={sources[0].link}
              isLink={sources[0].isLink}
              content={sources[0].content}
              number={1}
            />.
            It results from harmful germline mutations in one of the four DNA mismatch repair (MMR) genes—MLH1, MSH2 (or EPCAM deletions affecting MSH2), MSH6, or PMS2.
            Among these, mutations in MLH1 and MSH2 account for over half of all confirmed cases
            <SourceTooltip
              link={sources[1].link}
              isLink={sources[1].isLink}
              content={sources[1].content}
              number={2}
            />.
            Individuals with Lynch syndrome have substantially elevated cancer risks: depending on the specific MMR gene involved, the lifetime risk of CRC can approach 60 - 80% for men, and 40 - 60% for women, and risks for additional cancers, including endometrial, ovarian, urinary tract, and several gastrointestinal cancers
            are also significantly increased
            <SourceTooltip
              link={sources[2].link}
              isLink={sources[2].isLink}
              content={sources[2].content}
              number={3}
            />.
          </p>
          <p>
            Lynch syndrome “mutation-positive” refers to individuals who carry a pathogenic germline MMR gene alteration confirmed through clinical genetic testing.
            We also classify a related group as having “mutation-negative” Lynch syndrome, or Lynch-like syndrome.
            These individuals meet clinical criteria for Lynch syndrome, present with non-sporadic MSI-high tumors (demonstrating microsatellite instability but without MLH1 promoter hypermethylation or a BRAF mutation), yet have either negative, inconclusive, or likely benign results on genetic testing or they may have declined genetic testing altogether.
          </p>
          <p>
            Although they lack an identifiable pathogenic variant, individuals with Lynch-like syndrome require close clinical monitoring due to their elevated cancer risk.
            As a result, they typically undergo intensified surveillance, which often includes annual or semiannual colonoscopy as well as additional screening based on personal and family history.
          </p>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">References</h4>
          <ol className="space-y-2 text-xs text-slate-400">
            {sources.map((source, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-blue-400 font-medium whitespace-nowrap">[{index + 1}]</span>
                <span>
                  {source.isLink ? (
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-300 hover:underline transition-colors"
                    >
                      {source.content}
                    </a>
                  ) : (
                    source.content
                  )}
                  {source.isLink && source.link && (
                    <span className="block text-slate-500 mt-0.5 break-all">{source.link}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

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
              Below is the fully formed, quaternary structure of the Mismatch Repair (MMR) protein MSH2/MSH6.
              Mutations on the DNA that encode this protein can lead to Lynch Syndrome, a hereditary form of colorectal cancer.
              Mutations in the folding of the protein also contribute to Lynch Syndrome.
              When we talk about and discuss these mutations, we are referring to specific amino acid changes in the protein, which affects the structure as a whole.
            </p>
            <p className="text-slate-300">
              It is important to note the difference between the mutation on the protein, and the use/function of the protein.
              The complex works to ensure that pieces of DNA are replicated accurately, and that any mutations are caught and repaired.
              Mutations on the protein itself can lead to Lynch Syndrome (which does affect the job it performs).
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
          <h2 className="text-2xl font-semibold text-white">
            Subunit Analysis
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xl font-medium text-blue-300">MSH2 (Chain A)</h3>
              <IsolatedProteinViewer
                pdbUrl={POLYMERASE_MODEL_URL}
                targetChain="A"

              />
            </div>
            <div>
              <h3 className="mb-2 text-xl font-medium text-blue-300">MSH6 (Chain B)</h3>
              <IsolatedProteinViewer
                pdbUrl={POLYMERASE_MODEL_URL}
                targetChain="B"

              />
            </div>
          </div>
          <p className="text-slate-300">
            It is the combination of these two subunits that allows the complex to perform MMR.
          </p>
        </section>

        <Background />

        <MutationTabs />

        <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Science</p>
            <h3 className="text-2xl font-semibold text-white">MMR Proteins, Functions, and Cancer</h3>
          </div>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              With MMR proteins have a few tools at their disposal.
              find and replace: https://pmc.ncbi.nlm.nih.gov/articles/PMC5976031/pdf/fow071.pdf
              signal and unwind: ibid
              apoptosis: https://pmc.ncbi.nlm.nih.gov/articles/PMC3389999/
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
    </main >
  );
}
