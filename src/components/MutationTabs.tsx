'use client';

import { useMemo, useState } from 'react';
import { ThreeDMolViewer } from './ThreeDMolViewer';
import { SourceTooltip } from './SourceTooltip';
import Image from 'next/image';

const STICK_STYLE: Record<string, unknown> = {
  stick: { colorscheme: 'Jmol', radius: 0.25 },
};

export function MutationTabs() {
  const sources = [
    {
      content: 'Lynch Syndrome-associated Mutations in MSH2 Alter DNA Repair and Checkpoint Response Functions In Vivo',
      link: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2947597/',
      isLink: true,
    }
  ];

  const [activeKey, setActiveKey] = useState('P622L');

  return (
    <section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Failure</p>
        <h3 className="text-2xl font-semibold text-white">Which Mutations Causes Lynch Syndrome?</h3>

        <div className="flex justify-center">
          <Image src={"/images/p622l-table.png"} alt="P622L mutation" width={600} height={400} unoptimized />
        </div>

        <p className="text-slate-300">
          In Lynch syndrome, many pathogenic variants arise from mutations in DNA mismatch-repair proteins such as MSH2 and MSH6, and these mutations often impair function by destabilizing protein structure.
          Mutations that alter the chemical nature of amino acids can significantly disrupt protein stability. When a polar amino acid is replaced with a nonpolar one, the local environment loses important hydrogen-bond donors and acceptors, weakening interactions that help the protein fold correctly.
          Similarly, glycine or proline substitutions often destabilize secondary structures; glycine&apos;s flexibility and proline&apos;s rigid ring frequently distort helices and beta-strands, breaking the surrounding hydrogen-bond networks that keep these structures intact.
        </p>
        <p className="text-slate-300">
          These disruptions can lead to local unfolding in key regions of a protein, including beta-strands, alpha-helices, and structural loops such as the P-loop.
          Mutations may also interfere with salt bridges—electrostatic interactions between positively charged residues (Lys, Arg) and negatively charged ones (Asp, Glu).
          When these stabilizing interactions are lost or altered, the protein can become less stable, misfold, or lose proper function, ultimately weakening DNA mismatch repair and contributing to the development of Lynch-associated cancers.
        </p>

      </div>

      <div role="tablist" aria-label="Lynch Syndrome mutations" className="flex flex-wrap gap-3">
        {/* Tab 1 */}
        <button
          type="button"
          role="tab"
          aria-selected={activeKey === 'P622L'}
          onClick={() => setActiveKey('P622L')}
          className={[
            'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            activeKey === 'P622L'
              ? 'border-blue-400 bg-blue-500/10 text-blue-200'
              : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-blue-400 hover:text-blue-200',
          ].join(' ')}
        >
          <span className="block text-base">P622L</span>
          <span className="block text-xs text-slate-400">Proline → Leucine</span>
        </button>

        {/* Tab 2 */}
        <button
          type="button"
          role="tab"
          aria-selected={activeKey === 'R524P'}
          onClick={() => setActiveKey('R524P')}
          className={[
            'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            activeKey === 'R524P'
              ? 'border-blue-400 bg-blue-500/10 text-blue-200'
              : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-blue-400 hover:text-blue-200',
          ].join(' ')}
        >
          <span className="block text-base">R524P</span>
          <span className="block text-xs text-slate-400">Arginine → Proline</span>
        </button>

        {/* Tab 3 */}
        <button
          type="button"
          role="tab"
          aria-selected={activeKey === 'D167H'}
          onClick={() => setActiveKey('D167H')}
          className={[
            'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            activeKey === 'D167H'
              ? 'border-blue-400 bg-blue-500/10 text-blue-200'
              : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-blue-400 hover:text-blue-200',
          ].join(' ')}
        >
          <span className="block text-base">D167H</span>
          <span className="block text-xs text-slate-400">Aspartic Acid → Histidine</span>
        </button>
      </div>

      {/* Content for P622L */}
      {activeKey === 'P622L' && (
        <>
          <p className="text-slate-300">
            The MSH2 p.P622L mutation results in significantly reduced protein expression (approximately 50% of wild-type) and fails to stabilize key protein interactions with MSH3 and MSH6, preventing the mutant protein&apos;s accumulation on chromatin.
            Consequently, cells expressing this mutant are unable to perform DNA mismatch repair and display a lack of sensitivity to MNNG, failing to induce the necessary cell cycle arrest or apoptosis in response to DNA damage.
            This complete loss of repair and checkpoint signaling functions leads to the genomic instability that characterizes Lynch syndrome.
            <SourceTooltip
              link={sources[0].link}
              isLink={sources[0].isLink}
              content={sources[0].content}
              number={1}
            />.
          </p>

          <div role="tabpanel" aria-label="P622L mutation" className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Proline (Reference)</h3>
              <ThreeDMolViewer
                className="h-[320px]"
                modelUrl="https://files.rcsb.org/ligands/download/PRO_ideal.sdf"
                format="sdf"
                style={STICK_STYLE}
                backgroundColor="#020617"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Leucine (Variant)</h3>
              <ThreeDMolViewer
                className="h-[320px]"
                modelUrl="https://files.rcsb.org/ligands/download/LEU_ideal.sdf"
                format="sdf"
                style={STICK_STYLE}
                backgroundColor="#020617"
              />
            </div>
          </div>
        </>
      )}

      {/* Content for V147G */}
      {activeKey === 'R524P' && (
        <>
          <p className="text-slate-300">
            The MSH2 R524P mutation causes Lynch syndrome through a different mechanism than the P622L mutation.
            While the R524P mutant protein is stably expressed (unlike P622L), it is functionally defective because it completely fails to accumulate on chromatin or form the necessary protein complexes with MLH1 and PCNA.
            Without these interactions, the protein cannot repair DNA mismatches or trigger apoptosis (cell death) in response to DNA damage.
            This allows cells with genetic errors to survive and propagate, leading to the high cancer risk associated with Lynch syndrome.
            <SourceTooltip
              link={sources[0].link}
              isLink={sources[0].isLink}
              content={sources[0].content}
              number={1}
            />.
          </p>

          <div role="tabpanel" aria-label="R524P mutation" className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Arginine (Reference)</h3>
              <ThreeDMolViewer
                className="h-[320px]"
                modelUrl="https://files.rcsb.org/ligands/download/ARG_ideal.sdf"
                format="sdf"
                style={STICK_STYLE}
                backgroundColor="#020617"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Proline (Variant)</h3>
              <ThreeDMolViewer
                className="h-[320px]"
                modelUrl="https://files.rcsb.org/ligands/download/PRO_ideal.sdf"
                format="sdf"
                style={STICK_STYLE}
                backgroundColor="#020617"
              />
            </div>
          </div>
        </>
      )}

      {/* Content for L328M */}
      {activeKey === 'D167H' && (
        <>
          <p className="text-slate-300">
            Certain mutations in the MSH2 protein may not lead to increased rates of cancer, and may be benign.
            In the study, cells expressing D167H demonstrated the ability to fully restore DNA mismatch repair activity, effectively fixing the genetic errors that typically drive cancer development.
            Furthermore, the mutant protein was stable, correctly localized to the chromatin, and successfully recruited necessary partners like MLH1 to form functional repair complexes.
            Crucially, it also maintained the cellular checkpoint response, triggering cell cycle arrest and apoptosis when exposed to DNA damage, which prevents the propagation of damaged cells in a way that pathogenic variants cannot.
            <SourceTooltip
              link={sources[0].link}
              isLink={sources[0].isLink}
              content={sources[0].content}
              number={1}
            />.
          </p>

          <div role="tabpanel" aria-label="D167H mutation" className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Aspartic Acid (Reference)</h3>
              <ThreeDMolViewer
                className="h-[320px]"
                modelUrl="https://files.rcsb.org/ligands/download/ASP_ideal.sdf"
                format="sdf"
                style={STICK_STYLE}
                backgroundColor="#020617"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Histidine (Variant)</h3>
              <ThreeDMolViewer
                className="h-[320px]"
                modelUrl="https://files.rcsb.org/ligands/download/HIS_ideal.sdf"
                format="sdf"
                style={STICK_STYLE}
                backgroundColor="#020617"
              />
            </div>
          </div>
        </>
      )}
      <p className="text-slate-300">
        As we can see, whether or not a mutation exists, does not necessarily mean that even has an increased risk of developing cancer.
      </p>

      {/* 3. Replace the `// numbers here` comment with the references list loop. */}
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
                    className="hover:text-blue-300 hover:underline transition-colors block"
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
  );
}
