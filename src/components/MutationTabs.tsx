'use client';

import { useMemo, useState } from 'react';
import { ThreeDMolViewer } from './ThreeDMolViewer';
import { SourceTooltip } from './SourceTooltip';
import Image from 'next/image';

const STICK_STYLE: Record<string, unknown> = {
  stick: { colorscheme: 'Jmol', radius: 0.25 },
};

export function MutationTabs() {
  const [activeKey, setActiveKey] = useState('P622L');

  return (
    <section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Failure</p>
        <h3 className="text-2xl font-semibold text-white">Which Mutations Causes Lynch Syndrome?</h3>

        <div className="flex justify-center">
          <Image src="/images/p622l-table.png" alt="P622L mutation" width={600} height={400} />
        </div>

        <p className="text-sm text-slate-400">
          We see there are a couple of mutations that cause Lynch Syndrome.
          Here are some that are studied, and why they cause Lynch Syndrome.
          Noting that it is a class of disorders that are caused by mutations on four different genes, and not any one specific thing.
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
          <p className="text-sm text-slate-400">
            The MSH2 p.P622L mutation results in significantly reduced protein expression (approximately 50% of wild-type) and fails to stabilize key protein interactions with MSH3 and MSH6, preventing the mutant protein&apos;s accumulation on chromatin.
            Consequently, cells expressing this mutant are unable to perform DNA mismatch repair and display a lack of sensitivity to MNNG, failing to induce the necessary cell cycle arrest or apoptosis in response to DNA damage.
            This complete loss of repair and checkpoint signaling functions leads to the genomic instability that characterizes Lynch syndrome.
            <SourceTooltip
              link="https://pmc.ncbi.nlm.nih.gov/articles/PMC2947597/"
              isLink={true}
              content='Lynch Syndrome-associated Mutations in MSH2 Alter DNA Repair and Checkpoint Response Functions In Vivo'
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
          <p className="text-sm text-slate-400">
            The MSH2 R524P mutation causes Lynch syndrome through a different mechanism than the P622L mutation.
            While the R524P mutant protein is stably expressed (unlike P622L), it is functionally defective because it completely fails to accumulate on chromatin or form the necessary protein complexes with MLH1 and PCNA.
            Without these interactions, the protein cannot repair DNA mismatches or trigger apoptosis (cell death) in response to DNA damage.
            This allows cells with genetic errors to survive and propagate, leading to the high cancer risk associated with Lynch syndrome.
            <SourceTooltip
              link="https://pmc.ncbi.nlm.nih.gov/articles/PMC2947597/"
              isLink={true}
              content='Lynch Syndrome-associated Mutations in MSH2 Alter DNA Repair and Checkpoint Response Functions In Vivo'
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
          <p className="text-sm text-slate-400">
            Certain mutations in the MSH2 protein may not lead to increased rates of cancer, and may be benign.
            In the study, cells expressing D167H demonstrated the ability to fully restore DNA mismatch repair activity, effectively fixing the genetic errors that typically drive cancer development.
            Furthermore, the mutant protein was stable, correctly localized to the chromatin, and successfully recruited necessary partners like MLH1 to form functional repair complexes.
            Crucially, it also maintained the cellular checkpoint response, triggering cell cycle arrest and apoptosis when exposed to DNA damage, which prevents the propagation of damaged cells in a way that pathogenic variants cannot.
            <SourceTooltip
              link="https://pmc.ncbi.nlm.nih.gov/articles/PMC2947597/"
              isLink={true}
              content='Lynch Syndrome-associated Mutations in MSH2 Alter DNA Repair and Checkpoint Response Functions In Vivo'
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
      <p className="text-sm text-slate-400">As we can see, whether or not a mutation exists, does not necessarily mean that even has an increased risk of developing cancer.</p>
    </section>
  );
}
