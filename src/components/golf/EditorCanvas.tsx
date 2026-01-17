'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    TerrainType,
    ObjectType,
    LevelData,
    LevelSize,
    WindmillSize,
    TERRAIN_COLORS,
    LEVEL_SIZES,
    WINDMILL_SIZES,
    GRID_SIZE,
    createEmptyLevel,
    Position,
    GameObject,
} from '@/lib/golfTypes';
import { drawTerrainCell, clearTextureCache } from '@/lib/golf/TerrainTextures';
import { WindmillState, createWindmillState, drawWindmill, updateWindmill } from '@/lib/golf/WindmillRenderer';

type ToolMode = 'terrain' | 'object' | 'erase';

interface EditorCanvasProps {
    levelData: LevelData;
    onLevelChange: (level: LevelData) => void;
    selectedTerrain: TerrainType;
    selectedObject: ObjectType | null;
    windmillSize: WindmillSize;
    toolMode: ToolMode;
    brushSize: number;
}

export default function EditorCanvas({
    levelData,
    onLevelChange,
    selectedTerrain,
    selectedObject,
    windmillSize,
    toolMode,
    brushSize,
}: EditorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mousePos, setMousePos] = useState<Position | null>(null);
    const windmillStatesRef = useRef<WindmillState[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Initialize windmill states from level data
    useEffect(() => {
        const windmillObjects = levelData.objects.filter(obj => obj.type === ObjectType.WINDMILL);
        windmillStatesRef.current = windmillObjects.map(obj =>
            createWindmillState(obj.position, obj.size || 'medium', obj.rotation || 0)
        );
    }, [levelData.objects]);

    // Main render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw terrain grid
        for (let row = 0; row < levelData.terrain.length; row++) {
            for (let col = 0; col < levelData.terrain[row].length; col++) {
                const terrain = levelData.terrain[row][col];
                drawTerrainCell(ctx, terrain, col * GRID_SIZE, row * GRID_SIZE);
            }
        }

        // Draw grid lines (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Update and draw windmills
        for (const windmill of windmillStatesRef.current) {
            updateWindmill(windmill);
            drawWindmill(ctx, windmill);
        }

        // Draw other objects (ball start, hole)
        for (const obj of levelData.objects) {
            if (obj.type === ObjectType.BALL_START) {
                drawBallStart(ctx, obj.position);
            } else if (obj.type === ObjectType.HOLE) {
                drawHole(ctx, obj.position);
            }
        }

        // Draw brush preview
        if (mousePos) {
            drawBrushPreview(ctx, mousePos, toolMode, selectedTerrain, selectedObject, windmillSize, brushSize);
        }

        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(render);
    }, [levelData, mousePos, toolMode, selectedTerrain, selectedObject, windmillSize, brushSize]);

    // Start animation loop
    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(render);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [render]);

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = levelData.width;
            canvas.height = levelData.height;
            clearTextureCache();
        }
    }, [levelData.width, levelData.height]);

    // Paint terrain at position
    const paintTerrain = useCallback((x: number, y: number) => {
        const col = Math.floor(x / GRID_SIZE);
        const row = Math.floor(y / GRID_SIZE);

        const newTerrain = levelData.terrain.map(r => [...r]);
        const halfBrush = Math.floor(brushSize / 2);

        for (let dy = -halfBrush; dy <= halfBrush; dy++) {
            for (let dx = -halfBrush; dx <= halfBrush; dx++) {
                const targetRow = row + dy;
                const targetCol = col + dx;

                if (targetRow >= 0 && targetRow < newTerrain.length &&
                    targetCol >= 0 && targetCol < newTerrain[0].length) {
                    if (toolMode === 'erase') {
                        newTerrain[targetRow][targetCol] = TerrainType.GRASS;
                    } else {
                        newTerrain[targetRow][targetCol] = selectedTerrain;
                    }
                }
            }
        }

        onLevelChange({
            ...levelData,
            terrain: newTerrain,
        });
    }, [levelData, selectedTerrain, brushSize, toolMode, onLevelChange]);

    // Place object at position
    const placeObject = useCallback((x: number, y: number) => {
        if (!selectedObject) return;

        // Remove existing object of the same type (for ball start and hole, only one allowed)
        let newObjects = [...levelData.objects];

        if (selectedObject === ObjectType.BALL_START || selectedObject === ObjectType.HOLE) {
            newObjects = newObjects.filter(obj => obj.type !== selectedObject);
        }

        const newObj: GameObject = {
            type: selectedObject,
            position: { x, y },
        };

        if (selectedObject === ObjectType.WINDMILL) {
            newObj.size = windmillSize;
            newObj.rotation = 0;
        }

        newObjects.push(newObj);

        onLevelChange({
            ...levelData,
            objects: newObjects,
        });

        // Update windmill states if adding a windmill
        if (selectedObject === ObjectType.WINDMILL) {
            windmillStatesRef.current.push(
                createWindmillState({ x, y }, windmillSize)
            );
        }
    }, [levelData, selectedObject, windmillSize, onLevelChange]);

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (toolMode === 'object') {
            placeObject(x, y);
        } else {
            setIsDrawing(true);
            paintTerrain(x, y);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        if (isDrawing && toolMode !== 'object') {
            paintTerrain(x, y);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleMouseLeave = () => {
        setIsDrawing(false);
        setMousePos(null);
    };

    return (
        <canvas
            ref={canvasRef}
            className="border border-gray-600 rounded-lg cursor-crosshair"
            style={{ maxWidth: '100%', height: 'auto' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    );
}

// Draw ball starting position marker
function drawBallStart(ctx: CanvasRenderingContext2D, pos: Position) {
    // Outer ring
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Inner filled circle (ball preview)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ball shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(pos.x - 3, pos.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#00ff00';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('START', pos.x, pos.y + 28);
}

// Draw golf hole with flag
function drawHole(ctx: CanvasRenderingContext2D, pos: Position) {
    // Hole shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(pos.x + 2, pos.y + 2, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hole
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hole rim
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 16, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Flag pole
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x, pos.y - 60);
    ctx.stroke();

    // Flag
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 60);
    ctx.lineTo(pos.x + 25, pos.y - 50);
    ctx.lineTo(pos.x, pos.y - 40);
    ctx.closePath();
    ctx.fill();

    // Flag highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 60);
    ctx.lineTo(pos.x + 12, pos.y - 55);
    ctx.lineTo(pos.x, pos.y - 50);
    ctx.closePath();
    ctx.fill();
}

// Draw brush/tool preview
function drawBrushPreview(
    ctx: CanvasRenderingContext2D,
    pos: Position,
    toolMode: ToolMode,
    terrain: TerrainType,
    object: ObjectType | null,
    windmillSize: WindmillSize,
    brushSize: number
) {
    ctx.save();
    ctx.globalAlpha = 0.5;

    if (toolMode === 'terrain' || toolMode === 'erase') {
        const col = Math.floor(pos.x / GRID_SIZE);
        const row = Math.floor(pos.y / GRID_SIZE);
        const halfBrush = Math.floor(brushSize / 2);

        for (let dy = -halfBrush; dy <= halfBrush; dy++) {
            for (let dx = -halfBrush; dx <= halfBrush; dx++) {
                const targetCol = col + dx;
                const targetRow = row + dy;

                const x = targetCol * GRID_SIZE;
                const y = targetRow * GRID_SIZE;

                if (toolMode === 'erase') {
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
                } else {
                    ctx.fillStyle = TERRAIN_COLORS[terrain].primary;
                    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                }
            }
        }
    } else if (toolMode === 'object' && object) {
        if (object === ObjectType.BALL_START) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
            ctx.stroke();
        } else if (object === ObjectType.HOLE) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, 16, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (object === ObjectType.WINDMILL) {
            const previewState = createWindmillState(pos, windmillSize);
            drawWindmill(ctx, previewState, true);
        }
    }

    ctx.restore();
}
