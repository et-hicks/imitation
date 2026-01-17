// Golf Game Type Definitions and Constants

export enum TerrainType {
    EMPTY = 'empty',
    GRASS = 'grass',
    SAND = 'sand',
    ICE = 'ice',
    DIRT = 'dirt',
    RUBBER = 'rubber',
    WOOD = 'wood',
}

export enum ObjectType {
    BALL_START = 'ball_start',
    HOLE = 'hole',
    WINDMILL = 'windmill',
}

export type WindmillSize = 'small' | 'medium' | 'large';
export type LevelSize = 'small' | 'medium' | 'large';

export interface Position {
    x: number;
    y: number;
}

export interface GameObject {
    type: ObjectType;
    position: Position;
    size?: WindmillSize; // Only for windmills
    rotation?: number; // Initial rotation for windmills
}

export interface LevelData {
    name: string;
    size: LevelSize;
    width: number;
    height: number;
    gridSize: number;
    terrain: TerrainType[][]; // 2D grid of terrain types
    objects: GameObject[];
    createdAt: string;
}

// Physics constants per terrain
export const TERRAIN_PHYSICS: Record<TerrainType, { friction: number; restitution: number; airFriction: number }> = {
    [TerrainType.EMPTY]: { friction: 0.05, restitution: 0.5, airFriction: 0.01 },
    [TerrainType.GRASS]: { friction: 0.05, restitution: 0.5, airFriction: 0.01 },
    [TerrainType.SAND]: { friction: 0.9, restitution: 0.1, airFriction: 0.05 },
    [TerrainType.ICE]: { friction: 0.001, restitution: 0.6, airFriction: 0.005 },
    [TerrainType.DIRT]: { friction: 0.3, restitution: 0.3, airFriction: 0.02 },
    [TerrainType.RUBBER]: { friction: 0.02, restitution: 1.2, airFriction: 0.01 },
    [TerrainType.WOOD]: { friction: 0.5, restitution: 0.4, airFriction: 0.01 },
};

// Terrain display properties
export const TERRAIN_COLORS: Record<TerrainType, { primary: string; secondary: string; name: string }> = {
    [TerrainType.EMPTY]: { primary: '#1a1a2e', secondary: '#16213e', name: 'Empty' },
    [TerrainType.GRASS]: { primary: '#2d5a27', secondary: '#1e3d1a', name: 'Grass' },
    [TerrainType.SAND]: { primary: '#d4a574', secondary: '#c4956a', name: 'Sand' },
    [TerrainType.ICE]: { primary: '#a8d8ea', secondary: '#cee5f2', name: 'Ice' },
    [TerrainType.DIRT]: { primary: '#6b4423', secondary: '#4a2f18', name: 'Dirt' },
    [TerrainType.RUBBER]: { primary: '#8b2635', secondary: '#5c1a24', name: 'Rubber' },
    [TerrainType.WOOD]: { primary: '#8b6914', secondary: '#5c4610', name: 'Wood' },
};

// Level size presets
export const LEVEL_SIZES: Record<LevelSize, { width: number; height: number; label: string }> = {
    small: { width: 800, height: 600, label: 'Small (800×600)' },
    medium: { width: 1200, height: 800, label: 'Medium (1200×800)' },
    large: { width: 1600, height: 1000, label: 'Large (1600×1000)' },
};

// Windmill size presets
export const WINDMILL_SIZES: Record<WindmillSize, { radius: number; bladeLength: number; label: string }> = {
    small: { radius: 30, bladeLength: 60, label: 'Small' },
    medium: { radius: 50, bladeLength: 100, label: 'Medium' },
    large: { radius: 75, bladeLength: 150, label: 'Large' },
};

// Grid cell size for editor
export const GRID_SIZE = 20;

// Ball properties
export const BALL_RADIUS = 10;
export const HOLE_RADIUS = 15;

// Power arrow constraints
export const MAX_POWER = 300;
export const POWER_MULTIPLIER = 0.05;

// Create empty level data
export function createEmptyLevel(size: LevelSize, name: string = 'Untitled Level'): LevelData {
    const dimensions = LEVEL_SIZES[size];
    const cols = Math.floor(dimensions.width / GRID_SIZE);
    const rows = Math.floor(dimensions.height / GRID_SIZE);

    const terrain: TerrainType[][] = [];
    for (let y = 0; y < rows; y++) {
        terrain.push(new Array(cols).fill(TerrainType.GRASS));
    }

    return {
        name,
        size,
        width: dimensions.width,
        height: dimensions.height,
        gridSize: GRID_SIZE,
        terrain,
        objects: [],
        createdAt: new Date().toISOString(),
    };
}
