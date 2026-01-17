// Terrain Texture Generators for Canvas
// Creates realistic-looking procedural textures for each terrain type

import { TerrainType, TERRAIN_COLORS, GRID_SIZE } from '../golfTypes';

type TextureCache = Map<TerrainType, CanvasPattern | null>;

let textureCache: TextureCache | null = null;

// Seeded random for consistent noise
function seededRandom(seed: number): () => number {
    return function () {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

// Create speckled sand texture
function createSandTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const size = GRID_SIZE * 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d')!;

    // Base sand color
    tCtx.fillStyle = TERRAIN_COLORS[TerrainType.SAND].primary;
    tCtx.fillRect(0, 0, size, size);

    // Add speckles
    const rand = seededRandom(12345);
    for (let i = 0; i < 80; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = rand() * 1.5 + 0.5;
        const brightness = rand() > 0.5 ? 20 : -20;
        tCtx.fillStyle = adjustBrightness(TERRAIN_COLORS[TerrainType.SAND].primary, brightness);
        tCtx.beginPath();
        tCtx.arc(x, y, r, 0, Math.PI * 2);
        tCtx.fill();
    }

    // Add some darker grains
    for (let i = 0; i < 30; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = rand() * 1 + 0.3;
        tCtx.fillStyle = TERRAIN_COLORS[TerrainType.SAND].secondary;
        tCtx.beginPath();
        tCtx.arc(x, y, r, 0, Math.PI * 2);
        tCtx.fill();
    }

    return ctx.createPattern(canvas, 'repeat');
}

// Create shiny ice texture
function createIceTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const size = GRID_SIZE * 3;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d')!;

    // Base ice blue
    const gradient = tCtx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, TERRAIN_COLORS[TerrainType.ICE].primary);
    gradient.addColorStop(0.5, TERRAIN_COLORS[TerrainType.ICE].secondary);
    gradient.addColorStop(1, TERRAIN_COLORS[TerrainType.ICE].primary);
    tCtx.fillStyle = gradient;
    tCtx.fillRect(0, 0, size, size);

    // Add shine highlights
    const rand = seededRandom(54321);
    for (let i = 0; i < 8; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const w = rand() * 15 + 5;
        const h = rand() * 3 + 1;
        tCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        tCtx.save();
        tCtx.translate(x, y);
        tCtx.rotate(rand() * Math.PI);
        tCtx.fillRect(-w / 2, -h / 2, w, h);
        tCtx.restore();
    }

    // Add slight scratches
    tCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    tCtx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
        const x1 = rand() * size;
        const y1 = rand() * size;
        const x2 = x1 + (rand() - 0.5) * 20;
        const y2 = y1 + (rand() - 0.5) * 20;
        tCtx.beginPath();
        tCtx.moveTo(x1, y1);
        tCtx.lineTo(x2, y2);
        tCtx.stroke();
    }

    return ctx.createPattern(canvas, 'repeat');
}

// Create dirt texture with chunks
function createDirtTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const size = GRID_SIZE * 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d')!;

    // Base dirt color
    tCtx.fillStyle = TERRAIN_COLORS[TerrainType.DIRT].primary;
    tCtx.fillRect(0, 0, size, size);

    // Add dirt chunks and noise
    const rand = seededRandom(11111);
    for (let i = 0; i < 60; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = rand() * 3 + 1;
        const brightness = (rand() - 0.5) * 30;
        tCtx.fillStyle = adjustBrightness(TERRAIN_COLORS[TerrainType.DIRT].primary, brightness);
        tCtx.beginPath();
        tCtx.arc(x, y, r, 0, Math.PI * 2);
        tCtx.fill();
    }

    // Add some darker spots
    for (let i = 0; i < 20; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = rand() * 2 + 0.5;
        tCtx.fillStyle = TERRAIN_COLORS[TerrainType.DIRT].secondary;
        tCtx.beginPath();
        tCtx.arc(x, y, r, 0, Math.PI * 2);
        tCtx.fill();
    }

    return ctx.createPattern(canvas, 'repeat');
}

// Create grass texture with blade overlays
function createGrassTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const size = GRID_SIZE * 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d')!;

    // Base grass green
    tCtx.fillStyle = TERRAIN_COLORS[TerrainType.GRASS].primary;
    tCtx.fillRect(0, 0, size, size);

    // Add grass blade strokes
    const rand = seededRandom(22222);
    for (let i = 0; i < 40; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const height = rand() * 6 + 3;
        const width = rand() * 1.5 + 0.5;
        const lean = (rand() - 0.5) * 0.4;

        const brightness = (rand() - 0.5) * 40;
        tCtx.strokeStyle = adjustBrightness(TERRAIN_COLORS[TerrainType.GRASS].primary, brightness);
        tCtx.lineWidth = width;
        tCtx.lineCap = 'round';

        tCtx.beginPath();
        tCtx.moveTo(x, y);
        tCtx.quadraticCurveTo(x + lean * height, y - height / 2, x + lean * height * 1.5, y - height);
        tCtx.stroke();
    }

    // Add some darker variation
    for (let i = 0; i < 15; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = rand() * 2 + 1;
        tCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        tCtx.beginPath();
        tCtx.arc(x, y, r, 0, Math.PI * 2);
        tCtx.fill();
    }

    return ctx.createPattern(canvas, 'repeat');
}

// Create rubber texture with quilted sheen pattern
function createRubberTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const size = GRID_SIZE * 3;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d')!;

    // Base rubber red
    tCtx.fillStyle = TERRAIN_COLORS[TerrainType.RUBBER].primary;
    tCtx.fillRect(0, 0, size, size);

    // Create quilted pattern (like puffer jacket)
    const cellSize = size / 3;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const cx = col * cellSize + cellSize / 2;
            const cy = row * cellSize + cellSize / 2;

            // Add puffy highlight gradient
            const grad = tCtx.createRadialGradient(
                cx - cellSize * 0.15, cy - cellSize * 0.15, 0,
                cx, cy, cellSize * 0.6
            );
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

            tCtx.fillStyle = grad;
            tCtx.beginPath();
            tCtx.ellipse(cx, cy, cellSize * 0.45, cellSize * 0.4, 0, 0, Math.PI * 2);
            tCtx.fill();
        }
    }

    // Add subtle stitch lines
    tCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    tCtx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
        // Horizontal
        tCtx.beginPath();
        tCtx.moveTo(0, i * cellSize);
        tCtx.lineTo(size, i * cellSize);
        tCtx.stroke();
        // Vertical
        tCtx.beginPath();
        tCtx.moveTo(i * cellSize, 0);
        tCtx.lineTo(i * cellSize, size);
        tCtx.stroke();
    }

    // Add sheen highlights
    tCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    tCtx.beginPath();
    tCtx.ellipse(size * 0.3, size * 0.25, size * 0.4, size * 0.15, -0.3, 0, Math.PI * 2);
    tCtx.fill();

    return ctx.createPattern(canvas, 'repeat');
}

// Create wood texture with grain
function createWoodTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const size = GRID_SIZE * 3;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d')!;

    // Base wood color
    tCtx.fillStyle = TERRAIN_COLORS[TerrainType.WOOD].primary;
    tCtx.fillRect(0, 0, size, size);

    // Add wood grain lines
    const rand = seededRandom(33333);
    tCtx.strokeStyle = TERRAIN_COLORS[TerrainType.WOOD].secondary;
    tCtx.lineWidth = 1;

    for (let i = 0; i < 12; i++) {
        const y = rand() * size;
        const startX = rand() * 10;
        const amplitude = rand() * 3 + 1;
        const frequency = rand() * 0.1 + 0.05;

        tCtx.beginPath();
        tCtx.moveTo(0, y);
        for (let x = 0; x <= size; x += 2) {
            const yOffset = Math.sin((x + startX) * frequency) * amplitude;
            tCtx.lineTo(x, y + yOffset);
        }
        tCtx.stroke();
    }

    // Add some knots
    for (let i = 0; i < 2; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = rand() * 4 + 2;

        const grad = tCtx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, TERRAIN_COLORS[TerrainType.WOOD].secondary);
        grad.addColorStop(1, TERRAIN_COLORS[TerrainType.WOOD].primary);

        tCtx.fillStyle = grad;
        tCtx.beginPath();
        tCtx.arc(x, y, r, 0, Math.PI * 2);
        tCtx.fill();
    }

    return ctx.createPattern(canvas, 'repeat');
}

// Create empty/void texture
function createEmptyTexture(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    const size = GRID_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const tCtx = canvas.getContext('2d')!;

    // Dark background
    tCtx.fillStyle = TERRAIN_COLORS[TerrainType.EMPTY].primary;
    tCtx.fillRect(0, 0, size, size);

    // Add subtle grid pattern
    tCtx.strokeStyle = TERRAIN_COLORS[TerrainType.EMPTY].secondary;
    tCtx.lineWidth = 0.5;
    tCtx.strokeRect(0, 0, size, size);

    return ctx.createPattern(canvas, 'repeat');
}

// Helper to adjust color brightness
function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `rgb(${r}, ${g}, ${b})`;
}

// Get or create texture pattern for a terrain type
export function getTerrainPattern(
    ctx: CanvasRenderingContext2D,
    terrain: TerrainType
): CanvasPattern | string {
    // Initialize cache if needed
    if (!textureCache) {
        textureCache = new Map();
    }

    // Check cache first
    if (textureCache.has(terrain)) {
        return textureCache.get(terrain) || TERRAIN_COLORS[terrain].primary;
    }

    // Generate texture
    let pattern: CanvasPattern | null = null;

    switch (terrain) {
        case TerrainType.SAND:
            pattern = createSandTexture(ctx);
            break;
        case TerrainType.ICE:
            pattern = createIceTexture(ctx);
            break;
        case TerrainType.DIRT:
            pattern = createDirtTexture(ctx);
            break;
        case TerrainType.GRASS:
            pattern = createGrassTexture(ctx);
            break;
        case TerrainType.RUBBER:
            pattern = createRubberTexture(ctx);
            break;
        case TerrainType.WOOD:
            pattern = createWoodTexture(ctx);
            break;
        case TerrainType.EMPTY:
            pattern = createEmptyTexture(ctx);
            break;
    }

    // Cache and return
    textureCache.set(terrain, pattern);
    return pattern || TERRAIN_COLORS[terrain].primary;
}

// Clear texture cache (call when context changes)
export function clearTextureCache(): void {
    textureCache = null;
}

// Draw a single terrain cell with texture
export function drawTerrainCell(
    ctx: CanvasRenderingContext2D,
    terrain: TerrainType,
    x: number,
    y: number,
    width: number = GRID_SIZE,
    height: number = GRID_SIZE
): void {
    const pattern = getTerrainPattern(ctx, terrain);

    ctx.save();
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
}
