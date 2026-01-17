'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    TerrainType,
    ObjectType,
    LevelData,
    LevelSize,
    WindmillSize,
    TERRAIN_COLORS,
    LEVEL_SIZES,
    WINDMILL_SIZES,
    createEmptyLevel,
} from '@/lib/golfTypes';

// Dynamic import to avoid SSR issues with canvas
const EditorCanvas = dynamic(() => import('@/components/golf/EditorCanvas'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
            <div className="text-white">Loading editor...</div>
        </div>
    ),
});

type ToolMode = 'terrain' | 'object' | 'erase';

export default function GolfEditorPage() {
    const [levelData, setLevelData] = useState<LevelData>(() => createEmptyLevel('medium', 'My Golf Level'));
    const [levelSize, setLevelSize] = useState<LevelSize>('medium');
    const [toolMode, setToolMode] = useState<ToolMode>('terrain');
    const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>(TerrainType.GRASS);
    const [selectedObject, setSelectedObject] = useState<ObjectType | null>(ObjectType.BALL_START);
    const [windmillSize, setWindmillSize] = useState<WindmillSize>('medium');
    const [brushSize, setBrushSize] = useState(1);
    const [levelName, setLevelName] = useState('My Golf Level');

    // Handle level size change
    const handleLevelSizeChange = useCallback((newSize: LevelSize) => {
        setLevelSize(newSize);
        setLevelData(createEmptyLevel(newSize, levelName));
    }, [levelName]);

    // Handle level data change
    const handleLevelChange = useCallback((newLevel: LevelData) => {
        setLevelData(newLevel);
    }, []);

    // Download level as JSON
    const downloadLevel = useCallback(() => {
        const dataToSave = {
            ...levelData,
            name: levelName,
        };

        const json = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${levelName.replace(/\s+/g, '_').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [levelData, levelName]);

    // Clear level
    const clearLevel = useCallback(() => {
        if (confirm('Are you sure you want to clear the level?')) {
            setLevelData(createEmptyLevel(levelSize, levelName));
        }
    }, [levelSize, levelName]);

    const terrainTypes = Object.values(TerrainType).filter(t => t !== TerrainType.EMPTY);
    const objectTypes = Object.values(ObjectType);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                        ⛳ Golf Level Editor
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Create custom golf courses with various terrains and obstacles
                    </p>
                </div>

                <div className="flex gap-6 flex-col lg:flex-row">
                    {/* Toolbar */}
                    <div className="lg:w-80 space-y-4">
                        {/* Level Settings */}
                        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-emerald-400">Level Settings</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Level Name</label>
                                    <input
                                        type="text"
                                        value={levelName}
                                        onChange={(e) => setLevelName(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="Enter level name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Level Size</label>
                                    <select
                                        value={levelSize}
                                        onChange={(e) => handleLevelSizeChange(e.target.value as LevelSize)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {Object.entries(LEVEL_SIZES).map(([key, value]) => (
                                            <option key={key} value={key}>{value.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tool Mode */}
                        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-emerald-400">Tool Mode</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setToolMode('terrain')}
                                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${toolMode === 'terrain'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    🎨 Terrain
                                </button>
                                <button
                                    onClick={() => setToolMode('object')}
                                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${toolMode === 'object'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    📍 Objects
                                </button>
                                <button
                                    onClick={() => setToolMode('erase')}
                                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${toolMode === 'erase'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    🧹 Erase
                                </button>
                            </div>
                        </div>

                        {/* Terrain Selection */}
                        {toolMode === 'terrain' && (
                            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold mb-3 text-emerald-400">Terrain Type</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {terrainTypes.map((terrain) => (
                                        <button
                                            key={terrain}
                                            onClick={() => setSelectedTerrain(terrain)}
                                            className={`p-3 rounded-lg border-2 transition flex items-center gap-2 ${selectedTerrain === terrain
                                                    ? 'border-emerald-500 bg-emerald-500/20'
                                                    : 'border-gray-600 hover:border-gray-500'
                                                }`}
                                        >
                                            <div
                                                className="w-6 h-6 rounded"
                                                style={{ backgroundColor: TERRAIN_COLORS[terrain].primary }}
                                            />
                                            <span className="text-sm">{TERRAIN_COLORS[terrain].name}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Brush Size: {brushSize}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-full accent-emerald-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Object Selection */}
                        {toolMode === 'object' && (
                            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold mb-3 text-emerald-400">Object Type</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedObject(ObjectType.BALL_START)}
                                        className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-2 ${selectedObject === ObjectType.BALL_START
                                                ? 'border-emerald-500 bg-emerald-500/20'
                                                : 'border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <span className="text-xl">⚪</span>
                                        <span>Ball Start Position</span>
                                    </button>

                                    <button
                                        onClick={() => setSelectedObject(ObjectType.HOLE)}
                                        className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-2 ${selectedObject === ObjectType.HOLE
                                                ? 'border-emerald-500 bg-emerald-500/20'
                                                : 'border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <span className="text-xl">🕳️</span>
                                        <span>Hole with Flag</span>
                                    </button>

                                    <button
                                        onClick={() => setSelectedObject(ObjectType.WINDMILL)}
                                        className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-2 ${selectedObject === ObjectType.WINDMILL
                                                ? 'border-emerald-500 bg-emerald-500/20'
                                                : 'border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <span className="text-xl">🌀</span>
                                        <span>Windmill</span>
                                    </button>
                                </div>

                                {selectedObject === ObjectType.WINDMILL && (
                                    <div className="mt-4">
                                        <label className="block text-sm text-gray-400 mb-2">Windmill Size</label>
                                        <div className="flex gap-2">
                                            {Object.entries(WINDMILL_SIZES).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setWindmillSize(key as WindmillSize)}
                                                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${windmillSize === key
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        }`}
                                                >
                                                    {value.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Erase Info */}
                        {toolMode === 'erase' && (
                            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold mb-3 text-red-400">Erase Mode</h3>
                                <p className="text-gray-400 text-sm">
                                    Click and drag to erase terrain back to grass.
                                </p>
                                <div className="mt-4">
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Brush Size: {brushSize}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-full accent-red-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-emerald-400">Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={downloadLevel}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    💾 Download Level JSON
                                </button>
                                <button
                                    onClick={clearLevel}
                                    className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    🗑️ Clear Level
                                </button>
                                <a
                                    href="/golf"
                                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition flex items-center justify-center gap-2"
                                >
                                    🎮 Go to Game
                                </a>
                            </div>
                        </div>

                        {/* Terrain Legend */}
                        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-emerald-400">Terrain Effects</h3>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.GRASS].primary }} />
                                    <span><strong>Grass</strong> - Normal friction</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.SAND].primary }} />
                                    <span><strong>Sand</strong> - Stops ball quickly</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.ICE].primary }} />
                                    <span><strong>Ice</strong> - No friction</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.DIRT].primary }} />
                                    <span><strong>Dirt</strong> - High friction</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.RUBBER].primary }} />
                                    <span><strong>Rubber</strong> - Extra bounce</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: TERRAIN_COLORS[TerrainType.WOOD].primary }} />
                                    <span><strong>Wood</strong> - Solid barrier</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1">
                        <div className="bg-gray-800/30 backdrop-blur rounded-xl p-4 border border-gray-700">
                            <div className="overflow-auto max-h-[80vh]">
                                <EditorCanvas
                                    levelData={levelData}
                                    onLevelChange={handleLevelChange}
                                    selectedTerrain={selectedTerrain}
                                    selectedObject={selectedObject}
                                    windmillSize={windmillSize}
                                    toolMode={toolMode}
                                    brushSize={brushSize}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
