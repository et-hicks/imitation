'use client';

import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { LevelData, createEmptyLevel } from '@/lib/golfTypes';

// Dynamic import to avoid SSR issues with canvas
const GameCanvas = dynamic(() => import('@/components/golf/GameCanvas'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
            <div className="text-white">Loading game...</div>
        </div>
    ),
});

export default function GolfGamePage() {
    const [levelData, setLevelData] = useState<LevelData | null>(null);
    const [strokes, setStrokes] = useState(0);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                setLevelData(json as LevelData);
                setStrokes(0);
                setGameState('playing');
            } catch (error) {
                alert('Invalid level file. Please upload a valid JSON level.');
            }
        };
        reader.readAsText(file);
    }, []);

    // Handle stroke
    const handleStroke = useCallback(() => {
        setStrokes(prev => prev + 1);
    }, []);

    // Handle win
    const handleWin = useCallback(() => {
        setGameState('won');
    }, []);

    // Handle reset
    const handleReset = useCallback(() => {
        // Don't reset strokes, just the ball position
    }, []);

    // Restart game
    const restartGame = useCallback(() => {
        setStrokes(0);
        setGameState('playing');
        // Re-set level data to trigger re-initialization
        if (levelData) {
            setLevelData({ ...levelData });
        }
    }, [levelData]);

    // Load demo level
    const loadDemoLevel = useCallback(() => {
        const demoLevel = createEmptyLevel('medium', 'Demo Level');

        // Add some terrain variety
        for (let row = 15; row < 20; row++) {
            for (let col = 20; col < 35; col++) {
                demoLevel.terrain[row][col] = 'sand' as any;
            }
        }

        for (let row = 10; row < 18; row++) {
            for (let col = 40; col < 50; col++) {
                demoLevel.terrain[row][col] = 'ice' as any;
            }
        }

        for (let row = 5; row < 15; row++) {
            for (let col = 5; col < 8; col++) {
                demoLevel.terrain[row][col] = 'wood' as any;
            }
        }

        for (let row = 25; row < 30; row++) {
            for (let col = 15; col < 25; col++) {
                demoLevel.terrain[row][col] = 'rubber' as any;
            }
        }

        // Add objects
        demoLevel.objects = [
            { type: 'ball_start' as any, position: { x: 100, y: 400 } },
            { type: 'hole' as any, position: { x: 1100, y: 200 } },
            { type: 'windmill' as any, position: { x: 600, y: 400 }, size: 'medium' as any },
        ];

        setLevelData(demoLevel);
        setStrokes(0);
        setGameState('playing');
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                            ⛳ Mini Golf
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Click and drag on the ball to aim, release to shoot!
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {gameState === 'playing' && (
                            <div className="bg-gray-800/50 backdrop-blur px-6 py-3 rounded-xl border border-gray-700">
                                <span className="text-gray-400">Strokes:</span>
                                <span className="ml-2 text-2xl font-bold text-emerald-400">{strokes}</span>
                            </div>
                        )}

                        <a
                            href="/golf-editor"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
                        >
                            ✏️ Level Editor
                        </a>
                    </div>
                </div>

                {/* Game Area */}
                <div className="flex gap-6 flex-col lg:flex-row">
                    {/* Sidebar */}
                    <div className="lg:w-72 space-y-4">
                        {/* Load Level */}
                        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-emerald-400">Load Level</h3>

                            <div className="space-y-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    📁 Upload Level JSON
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                <button
                                    onClick={loadDemoLevel}
                                    className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    🎮 Load Demo Level
                                </button>
                            </div>
                        </div>

                        {/* Game Status */}
                        {levelData && (
                            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold mb-3 text-emerald-400">Level Info</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Name:</span>
                                        <span className="text-white">{levelData.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Size:</span>
                                        <span className="text-white">{levelData.width}×{levelData.height}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Strokes:</span>
                                        <span className="text-emerald-400 font-bold">{strokes}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={restartGame}
                                    className="w-full mt-4 py-2 px-4 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium transition"
                                >
                                    🔄 Restart Level
                                </button>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-emerald-400">How to Play</h3>
                            <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                                <li>Click and hold on the ball</li>
                                <li>Drag away to aim (arrow shows direction)</li>
                                <li>Longer drag = more power</li>
                                <li>Release to shoot!</li>
                                <li>Get the ball in the hole 🏆</li>
                            </ol>
                        </div>

                        {/* Terrain Legend */}
                        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-emerald-400">Terrain Effects</h3>
                            <div className="space-y-2 text-xs text-gray-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-700" />
                                    <span>Grass - Normal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d4a574' }} />
                                    <span>Sand - Stops quickly</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#a8d8ea' }} />
                                    <span>Ice - Slides freely</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6b4423' }} />
                                    <span>Dirt - High friction</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b2635' }} />
                                    <span>Rubber - Bouncy!</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b6914' }} />
                                    <span>Wood - Barrier</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Game Canvas */}
                    <div className="flex-1">
                        <div className="bg-gray-800/30 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <div className="overflow-auto max-h-[80vh]">
                                <GameCanvas
                                    levelData={levelData}
                                    onStroke={handleStroke}
                                    onWin={handleWin}
                                    onReset={handleReset}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Win Modal */}
                {gameState === 'won' && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-600 shadow-2xl">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-3xl font-bold text-emerald-400 mb-2">Hole in... {strokes}!</h2>
                            <p className="text-gray-400 mb-6">
                                {strokes === 1 && "Incredible! A hole in one!"}
                                {strokes === 2 && "Amazing! An eagle!"}
                                {strokes === 3 && "Great shot! A birdie!"}
                                {strokes > 3 && strokes <= 5 && "Nice work!"}
                                {strokes > 5 && "You made it!"}
                            </p>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={restartGame}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition"
                                >
                                    🔄 Play Again
                                </button>
                                <button
                                    onClick={() => {
                                        setGameState('idle');
                                        setLevelData(null);
                                    }}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                                >
                                    📁 Load New Level
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
