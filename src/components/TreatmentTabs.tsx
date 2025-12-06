'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SourceTooltip } from './SourceTooltip';

export function TreatmentTabs() {
    const sources = [
        {
            content: "Cancer prevention with aspirin in hereditary colorectal cancer (Lynch syndrome), 10-year follow-up and registry-based 20-year data in the CAPP2 study: a double-blind, randomised, placebo-controlled trial",
            link: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736%2820%2930366-4/fulltext",
            isLink: true,
        },
        {
            content: "Naproxen chemoprevention induces proliferation of cytotoxic lymphocytes in Lynch Syndrome colorectal mucosa",
            link: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10189148/",
            isLink: true,
        },
        {
            content: "Mayo Clinic Lynch Syndrome",
            link: "https://www.mayoclinic.org/diseases-conditions/lynch-syndrome/diagnosis-treatment/drc-20374719",
            isLink: true,
        }
    ];

    const [activeKey, setActiveKey] = useState('drugs');

    return (
        <section className="space-y-4 rounded-lg border border-slate-800 bg-gradient-to-tr from-slate-900/60 to-slate-800/30 p-6 shadow-lg">
            <div className="space-y-1 mb-4">
                <p className="text-xs uppercase tracking-[0.35em] text-blue-300">Treatment</p>
                <h3 className="text-2xl font-semibold text-white">Current Clinical Approaches</h3>
            </div>

            <div role="tablist" aria-label="Treatment options" className="flex flex-wrap gap-3 sticky top-14 z-40 backdrop-blur-xl py-4 -mt-4 mb-4 transition-all will-change-transform">
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
                            and those taking aspirin after 20 years. <SourceTooltip
                                link={sources[0].link}
                                isLink={sources[0].isLink}
                                content={sources[0].content}
                                number={1}
                            />
                        </p>
                        <p>
                            Wishing we had a better understanding as to why aspirin is so effective, but sadly we do not.
                            The above study indicates just that it is effective in reducing risk.
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
                            <SourceTooltip
                                link={sources[1].link}
                                isLink={sources[1].isLink}
                                content={sources[1].content}
                                number={2}
                            />
                        </p>
                    </div>
                )}

                {activeKey === 'physical' && (
                    <div role="tabpanel">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Physical Screening</h4>
                        <p>
                            While a genetic test is is required for diagnosing Lynch Syndrome, there are a number of physical screenings that can be done to monitor for colorectal cancer.
                            The best and most common is Colonoscopy, which is a procedure where a camera is inserted into the colon to check for any abnormalities.
                            Colonoscopies can remove any polyps, meaning that the same screening can both diagnose and prevent colorectal cancer.
                        </p>
                        <br />
                        <p>
                            Other screenings for other locations that can cause cancers include biopsies of endometrial lining, a stomach endoscopy, urine tests, and skin exams.
                            The Mayo Clinic provides a list of physcial screenings, that dont include pharmacological treatments, or drugs of any kind.
                            <SourceTooltip
                                link={sources[2].link}
                                isLink={sources[2].isLink}
                                content={sources[2].content}
                                number={3}
                            />
                        </p>
                    </div>
                )}

                {activeKey === 'nuclear' && (
                    <div role="tabpanel">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Nuclear Option</h4>
                        <p>
                            The nuclear, surgical option to reduce the risk of colorectal cancer, ovarian cancer, and endometrial cancer is to remove these.
                            Reccomendations for this are outside the scope of this project, but we cannot believe it to be anywhere close to being a reccomendation.
                            <SourceTooltip
                                link={sources[2].link}
                                isLink={sources[2].isLink}
                                content={sources[2].content}
                                number={3}
                            />
                        </p>
                    </div>
                )}
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
