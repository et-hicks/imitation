'use client';

import { useMemo, useState } from 'react';
import { ThreeDMolViewer } from './ThreeDMolViewer';

const STICK_STYLE: Record<string, unknown> = {
  stick: { colorscheme: 'Jmol', radius: 0.25 },
};

const TABS = [
  {
    key: 'G68E',
    label: 'G68E',
    summary: 'Serine → Glutamic Acid',
    descriptor: 'mutation in the MHL1 gene contributes to Lynch syndrome by substituting a nonpolar amino acid with a negatively charged glutamate, which likely disrupts protein stability and impairs its normal function.  In this mutation, valine (V), a nonpolar amino acid, is replaced by glutamic acid (E) at position 68',
    reference: {
      name: 'Serine (Reference)',
      modelUrl: 'https://files.rcsb.org/ligands/download/SER_ideal.sdf',
    },
    variant: {
      name: 'Glutamic Acid (Variant)',
      modelUrl: 'https://files.rcsb.org/ligands/download/GLU_ideal.sdf',
    },
  },
  {
    key: 'v147g',
    label: 'V147G',
    summary: 'Valine → Glutamine',
    descriptor: 'Polar glutamine replaces hydrophobic valine, altering solvent exposure and helix packing.',
    reference: {
      name: 'Valine (Reference)',
      modelUrl: 'https://files.rcsb.org/ligands/download/VAL_ideal.sdf',
    },
    variant: {
      name: 'Glutamine (Variant)',
      modelUrl: 'https://files.rcsb.org/ligands/download/GLN_ideal.sdf',
    },
  },
  {
    key: 'l328m',
    label: 'L328M',
    summary: 'Lysine → Methionine',
    descriptor: 'Neutral methionine removes the lysine charge used for DNA backbone coordination.',
    reference: {
      name: 'Lysine (Reference)',
      modelUrl: 'https://files.rcsb.org/ligands/download/LYS_ideal.sdf',
    },
    variant: {
      name: 'Methionine (Variant)',
      modelUrl: 'https://files.rcsb.org/ligands/download/MET_ideal.sdf',
    },
  },
] as const;

export function MutationTabs() {
  const [activeKey, setActiveKey] = useState<(typeof TABS)[number]['key']>(TABS[0].key);
  const activeTab = useMemo(() => TABS.find(tab => tab.key === activeKey) ?? TABS[0], [activeKey]);

  return (
    <section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/30 p-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">Lynch Syndrome</h2>
        <p className="text-slate-300">
          Lynch Syndrome can occur in many different places, and can be caused from many different mutations.
          Here are a couple.
          There are pathogenic mutations, and there are non-pathogenic mutations.
        </p>
      </div>

      <div role="tablist" aria-label="Lynch Syndrome mutations" className="flex flex-wrap gap-3">
        {TABS.map(tab => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(tab.key)}
              className={[
                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                  : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-blue-400 hover:text-blue-200',
              ].join(' ')}
            >
              <span className="block text-base">{tab.label}</span>
              <span className="block text-xs text-slate-400">{tab.summary}</span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-slate-400">
        {activeTab.descriptor}
      </p>

      <div role="tabpanel" aria-label={`${activeTab.label} mutation`} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{activeTab.reference.name}</h3>
          <ThreeDMolViewer
            className="h-[320px]"
            modelUrl={activeTab.reference.modelUrl}
            format="sdf"
            style={STICK_STYLE}
            backgroundColor="#020617"
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{activeTab.variant.name}</h3>
          <ThreeDMolViewer
            className="h-[320px]"
            modelUrl={activeTab.variant.modelUrl}
            format="sdf"
            style={STICK_STYLE}
            backgroundColor="#020617"
          />
        </div>
      </div>
    </section>
  );
}
