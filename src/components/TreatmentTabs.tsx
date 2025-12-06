'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SourceTooltip } from './SourceTooltip';

export function TreatmentTabs() {
    const [activeKey, setActiveKey] = useState('drugs');

    return (
        <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
            <div className="space-y-1 mb-4">
                <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Treatment</p>
                <h3 className="text-2xl font-semibold text-white">Current Clinical Approaches</h3>
            </div>

            <div role="tablist" aria-label="Treatment options" className="flex flex-wrap gap-3 sticky top-14 z-40 bg-slate-900/95 backdrop-blur py-4 -mt-4 mb-4 transition-all will-change-transform">
                {/* Tab 1 */}
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeKey === 'drugs'}
                    onClick={() => setActiveKey('drugs')}
                    className={[
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                        activeKey === 'drugs'
                            ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-blue-400 hover:text-blue-200',
                    ].join(' ')}
                >
                    Drugs and Pharmacological
                </button>

                {/* Tab 2 */}
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeKey === 'physical'}
                    onClick={() => setActiveKey('physical')}
                    className={[
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                        activeKey === 'physical'
                            ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-blue-400 hover:text-blue-200',
                    ].join(' ')}
                >
                    Physical
                </button>

                {/* Tab 3 */}
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeKey === 'nuclear'}
                    onClick={() => setActiveKey('nuclear')}
                    className={[
                        'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                        activeKey === 'nuclear'
                            ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-blue-400 hover:text-blue-200',
                    ].join(' ')}
                >
                    Nuclear Option
                </button>
            </div>

            <div className="space-y-3 text-slate-300 leading-relaxed min-h-[100px]">
                {activeKey === 'drugs' && (
                    <div role="tabpanel">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Aspirin and Naproxen</h4>
                        <p>
                            Currently, there are two pharmacological agents that have been shown to reduce the risk of colorectal cancer in Lynch syndrome patients: Aspirin and Naproxen.
                        </p>
                        <br />
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Aspirin</h4>
                        <div className="flex justify-center">
                            <Image src="/images/Aspirin.png" alt="Aspirin and Naproxen" height={400} width={600} />
                        </div>
                        <br />
                        <p>
                            Aspirin has been found to reduce the risk of colorectal cancer in Lynch syndrome patients, by a study of 861 people, where
                            427 of them were assigned to take 600mg of aspirin per day, and 434 were assigned to take a placebo.
                            The study went on for 2 years, with another 2 years as optional follow up.
                            The cumulative incidence of colorectal cancer dropped by about 15% for between those taking the placebo,
                            and those taking aspirin after 20 years. <SourceTooltip content="Cancer prevention with aspirin in hereditary colorectal cancer (Lynch syndrome), 10-year follow-up and registry-based 20-year data in the CAPP2 study: a double-blind, randomised, placebo-controlled trial"
                                link="https://www.thelancet.com/journals/lancet/article/PIIS0140-6736%2820%2930366-4/fulltext" number={1} isLink={true} />
                        </p>
                        <p>
                            Wishing we had a better understanding as to why aspirin is so effective, but sadly we do not.
                            The above study indicates just that it is effective in reducing risk, but admits the mechanism behind it is unknown.
                            This project has given an example of three mutations in the MSH2 protein, but as Lynch Syndrome is a class of mutations on the MutSAlpha
                            protein, any one drug may be effected for a subsect of mutations, and invalid in others.
                        </p>
                        <br />
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Naproxen</h4>
                        <div className="flex justify-center">
                            <Image src="/images/Naproxen.png" alt="Naproxen" height={400} width={600} />
                        </div>
                        <br />
                        <p>
                            The main pathophysiology of Naproxen is that it promotes T cell proluferation in the colonic mucosa, and activates proliferation of resident cytotocix
                            lymphocytes in the colonic mucosa.
                            From this proliferation of T cells, it appears that the main mechanism of activation is through the increase of an immune response in the colonic mucosa.
                            However, this is speculation, and the article mentions that mecahnistic studies are lacking.
                            <SourceTooltip content="Naproxen chemoprevention induces proliferation of cytotoxic lymphocytes in Lynch Syndrome colorectal mucosa"
                                link="https://pmc.ncbi.nlm.nih.gov/articles/PMC10189148/" number={2} isLink={true} />
                        </p>
                    </div>
                )}

                {activeKey === 'physical' && (
                    <div role="tabpanel">
                        <p>
                            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        </p>
                    </div>
                )}

                {activeKey === 'nuclear' && (
                    <div role="tabpanel">
                        <p>
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam,
                            eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
