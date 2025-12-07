'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

// --- Types ---
type SimulationResult = {
    id: number;
    aliceChecks: number;
    bobChecks: number;
    boxes: number;
    colored: number;
    winner: 'Alice' | 'Bob' | 'Tie';
    coloredIndices: Set<number>; // Store colored indices
    aliceCheckMap: Map<number, number>; // Index -> Check Number (1-based)
    bobCheckMap: Map<number, number>;   // Index -> Check Number (1-based)
};

// --- Logic ---
function runSimulation(numBoxes: number, numColored: number): {
    aliceChecks: number;
    bobChecks: number;
    coloredIndices: Set<number>;
    aliceCheckMap: Map<number, number>;
    bobCheckMap: Map<number, number>;
} {
    // Setup boxes: 0 = empty, 1 = colored
    const indices = Array.from({ length: numBoxes }, (_, k) => k);

    // Scramble indices to pick random colored ones
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const coloredIndices = new Set(indices.slice(0, numColored));

    // Strategy Alice: Sequential 0, 1, 2, ...
    let aliceFound = 0;
    let aliceChecks = 0;
    const aliceCheckMap = new Map<number, number>();

    for (let i = 0; i < numBoxes; i++) {
        aliceChecks++;
        aliceCheckMap.set(i, aliceChecks);
        if (coloredIndices.has(i)) {
            aliceFound++;
        }
        if (aliceFound === numColored) break;
    }

    // Strategy Bob: Odds then Evens
    const checkOrder: number[] = [];
    for (let i = 0; i < numBoxes; i += 2) checkOrder.push(i);
    for (let i = 1; i < numBoxes; i += 2) checkOrder.push(i);

    let bobFound = 0;
    let bobChecks = 0;
    const bobCheckMap = new Map<number, number>();

    for (const idx of checkOrder) {
        bobChecks++;
        bobCheckMap.set(idx, bobChecks);
        if (coloredIndices.has(idx)) {
            bobFound++;
        }
        if (bobFound === numColored) break;
    }

    return { aliceChecks, bobChecks, coloredIndices, aliceCheckMap, bobCheckMap };
}

// --- Components ---
const ResultRow = ({ res }: { res: SimulationResult }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-neutral-800 rounded-xl border border-neutral-700/50 overflow-hidden transition-colors hover:bg-neutral-750">
            <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-6">
                    <button
                        className="p-1 hover:bg-neutral-700 rounded-full transition-colors text-neutral-400"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                    >
                        {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>

                    <span className="text-neutral-500 w-12 font-mono">#{res.id}</span>
                    <div className="flex flex-col">
                        <div className="text-sm text-neutral-400">
                            Alice Checks: <span className="text-white font-medium">{res.aliceChecks}</span>
                        </div>
                        <div className="text-xs text-neutral-500">Sequential</div>
                    </div>
                    <div className="flex flex-col">
                        <div className="text-sm text-neutral-400">
                            Bob Checks: <span className="text-white font-medium">{res.bobChecks}</span>
                        </div>
                        <div className="text-xs text-neutral-500">Odd → Even</div>
                    </div>
                </div>

                <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${res.winner === 'Alice' ? 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20' :
                    res.winner === 'Bob' ? 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20' :
                        'bg-neutral-600/10 text-neutral-400 ring-1 ring-neutral-600/20'
                    }`}>
                    {res.winner === 'Tie' ? 'TIE' : `${res.winner.toUpperCase()} WINS`}
                </div>
            </div>

            {isOpen && (
                <div className="px-4 pb-4 bg-neutral-900/30 border-t border-neutral-800 pt-4">
                    <h4 className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">Box Configuration ({res.boxes} boxes)</h4>
                    <div className="flex flex-wrap gap-1">
                        {Array.from({ length: res.boxes }).map((_, i) => {
                            const isColored = res.coloredIndices.has(i);
                            const aliceCheck = res.aliceCheckMap.get(i);
                            const bobCheck = res.bobCheckMap.get(i);

                            const tooltip = `Box ${i + 1} ${isColored ? '(Colored)' : ''}
Alice check: ${aliceCheck ?? '-'}
Bob check: ${bobCheck ?? '-'}`;

                            return (
                                <div
                                    key={i}
                                    title={tooltip}
                                    className={`w-3 h-3 rounded-sm transition-colors ${isColored ? 'bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.6)]' : 'bg-neutral-700/50 hover:bg-neutral-600'
                                        }`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function BoxesPage() {
    const [numBoxes, setNumBoxes] = useState(100);
    const [numColored, setNumColored] = useState(10);
    const [results, setResults] = useState<SimulationResult[]>([]);
    const [generating, setGenerating] = useState(false);

    // Locked when there is data
    const isLocked = results.length > 0;

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            const newResults: SimulationResult[] = [];
            for (let i = 0; i < 10; i++) {
                const { aliceChecks, bobChecks, coloredIndices, aliceCheckMap, bobCheckMap } = runSimulation(numBoxes, numColored);
                let winner: 'Alice' | 'Bob' | 'Tie' = 'Tie';
                if (aliceChecks < bobChecks) winner = 'Alice';
                else if (bobChecks < aliceChecks) winner = 'Bob';

                newResults.push({
                    id: results.length + i + 1,
                    aliceChecks,
                    bobChecks,
                    boxes: numBoxes,
                    colored: numColored,
                    winner,
                    coloredIndices,
                    aliceCheckMap,
                    bobCheckMap
                });
            }
            setResults(prev => [...prev, ...newResults]);
            setGenerating(false);
        }, 0);
    };

    const handleRefresh = () => {
        setResults([]);
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-8 font-sans">
            <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Boxes Simulation
            </h1>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Graph Section */}
                <div className="bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700/50 shadow-xl backdrop-blur-sm h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.3} />
                            <XAxis dataKey="id" stroke="#888" label={{ value: 'Trial #', position: 'insideBottomRight', offset: -5 }} />
                            <YAxis stroke="#888" label={{ value: 'Checks Needed', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#262626', borderColor: '#404040' }}
                                itemStyle={{ color: '#e5e5e5' }}
                            />
                            <Legend verticalAlign="top" />
                            <Line type="monotone" dataKey="aliceChecks" name="Alice" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="bobChecks" name="Bob" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Controls Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-neutral-800/30 p-6 rounded-2xl border border-neutral-700/50">
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-neutral-900/50"
                    >
                        Refresh
                    </button>

                    <button
                        onClick={handleGenerate}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-900/20 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Generate Trials
                    </button>

                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-neutral-400 flex justify-between">
                            <span>Total Boxes (N)</span>
                            <span className="text-white">{numBoxes}</span>
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="1000"
                            value={numBoxes}
                            disabled={isLocked}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setNumBoxes(val);
                                if (numColored > val) setNumColored(val);
                            }}
                            className={`w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer ${isLocked ? 'opacity-50 cursor-not-allowed' : 'accent-purple-500'}`}
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-neutral-400 flex justify-between">
                            <span>Colored Boxes (M)</span>
                            <span className="text-white">{numColored}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max={numBoxes}
                            value={numColored}
                            disabled={isLocked}
                            onChange={(e) => setNumColored(parseInt(e.target.value))}
                            className={`w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer ${isLocked ? 'opacity-50 cursor-not-allowed' : 'accent-pink-500'}`}
                        />
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold mb-4 text-neutral-300">Run History</h2>

                    {results.length === 0 ? (
                        <div className="text-center py-10 text-neutral-500 italic">
                            No data yet. Set your parameters and click Generate Trials.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {[...results].reverse().map((res) => (
                                <ResultRow key={res.id} res={res} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
