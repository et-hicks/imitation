'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    TerrainType,
    ObjectType,
    LevelData,
    GRID_SIZE,
    BALL_RADIUS,
    HOLE_RADIUS,
    MAX_POWER,
    POWER_MULTIPLIER,
    Position,
} from '@/lib/golfTypes';
import { drawTerrainCell, clearTextureCache } from '@/lib/golf/TerrainTextures';
import { WindmillState, createWindmillState, drawWindmill, updateWindmill } from '@/lib/golf/WindmillRenderer';
import {
    GolfPhysicsEngine,
    createGolfPhysics,
    updateGolfPhysics,
    shootBall,
    resetBall,
    isBallStationary,
    destroyGolfPhysics,
} from '@/lib/golf/GolfPhysics';

interface GameCanvasProps {
    levelData: LevelData | null;
    onStroke: () => void;
    onWin: () => void;
    onReset: () => void;
}

export default function GameCanvas({ levelData, onStroke, onWin, onReset }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const physicsRef = useRef<GolfPhysicsEngine | null>(null);
    const windmillStatesRef = useRef<WindmillState[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);

    const [isAiming, setIsAiming] = useState(false);
    const [aimStart, setAimStart] = useState<Position | null>(null);
    const [aimEnd, setAimEnd] = useState<Position | null>(null);
    const [canShoot, setCanShoot] = useState(true);
    const [ballPosition, setBallPosition] = useState<Position | null>(null);
    const [startPosition, setStartPosition] = useState<Position | null>(null);

    // Initialize physics when level changes
    useEffect(() => {
        if (!levelData) return;

        // Clean up previous physics
        if (physicsRef.current) {
            destroyGolfPhysics(physicsRef.current);
        }

        // Create new physics
        physicsRef.current = createGolfPhysics(levelData);

        // Find start position
        const startObj = levelData.objects.find(obj => obj.type === ObjectType.BALL_START);
        if (startObj) {
            setStartPosition(startObj.position);
            setBallPosition(startObj.position);
        }

        // Initialize windmill states
        const windmillObjects = levelData.objects.filter(obj => obj.type === ObjectType.WINDMILL);
        windmillStatesRef.current = windmillObjects.map(obj =>
            createWindmillState(obj.position, obj.size || 'medium', obj.rotation || 0)
        );

        // Clear texture cache for new context
        clearTextureCache();

        setCanShoot(true);

        return () => {
            if (physicsRef.current) {
                destroyGolfPhysics(physicsRef.current);
                physicsRef.current = null;
            }
        };
    }, [levelData]);

    // Main game loop
    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        const physics = physicsRef.current;

        if (!canvas || !physics || !levelData) {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        // Update physics
        const { isInHole, velocity } = updateGolfPhysics(physics);

        // Update windmill states
        for (const windmill of windmillStatesRef.current) {
            updateWindmill(windmill);
        }

        // Sync windmill states with physics
        physics.windmills = windmillStatesRef.current;

        // Update ball position for state
        setBallPosition({ x: physics.ball.position.x, y: physics.ball.position.y });

        // Check if ball stopped
        if (!canShoot && isBallStationary(physics)) {
            setCanShoot(true);
        }

        // Check for win
        if (isInHole) {
            onWin();
        }

        // Render
        render(ctx, canvas, physics, levelData);

        // Draw power arrow if aiming
        if (isAiming && aimStart && aimEnd) {
            drawPowerArrow(ctx, aimStart, aimEnd);
        }

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [levelData, isAiming, aimStart, aimEnd, canShoot, onWin]);

    // Start game loop
    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameLoop]);

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && levelData) {
            canvas.width = levelData.width;
            canvas.height = levelData.height;
            clearTextureCache();
        }
    }, [levelData]);

    // Render the game
    function render(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        physics: GolfPhysicsEngine,
        level: LevelData
    ) {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw terrain
        for (let row = 0; row < level.terrain.length; row++) {
            for (let col = 0; col < level.terrain[row].length; col++) {
                const terrain = level.terrain[row][col];
                drawTerrainCell(ctx, terrain, col * GRID_SIZE, row * GRID_SIZE);
            }
        }

        // Draw hole
        const holeObj = level.objects.find(obj => obj.type === ObjectType.HOLE);
        if (holeObj) {
            drawHole(ctx, holeObj.position);
        }

        // Draw windmills
        for (const windmill of windmillStatesRef.current) {
            drawWindmill(ctx, windmill);
        }

        // Draw ball
        drawBall(ctx, physics.ball.position);

        // Draw start marker (subtle)
        const startObj = level.objects.find(obj => obj.type === ObjectType.BALL_START);
        if (startObj) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(startObj.position.x, startObj.position.y, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canShoot || !physicsRef.current) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ballPos = physicsRef.current.ball.position;

        // Check if clicking on ball
        const dx = x - ballPos.x;
        const dy = y - ballPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < BALL_RADIUS * 3) {
            setIsAiming(true);
            setAimStart({ x: ballPos.x, y: ballPos.y });
            setAimEnd({ x, y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isAiming) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setAimEnd({ x, y });
    };

    const handleMouseUp = () => {
        if (!isAiming || !aimStart || !aimEnd || !physicsRef.current) {
            setIsAiming(false);
            return;
        }

        // Calculate power and direction (opposite of drag)
        const dx = aimStart.x - aimEnd.x;
        const dy = aimStart.y - aimEnd.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const power = Math.min(distance, MAX_POWER) * POWER_MULTIPLIER;
            const angle = Math.atan2(dy, dx);

            shootBall(physicsRef.current, power, angle);
            setCanShoot(false);
            onStroke();
        }

        setIsAiming(false);
        setAimStart(null);
        setAimEnd(null);
    };

    // Reset ball to start
    const handleReset = useCallback(() => {
        if (physicsRef.current && startPosition) {
            resetBall(physicsRef.current, startPosition);
            setCanShoot(true);
            onReset();
        }
    }, [startPosition, onReset]);

    if (!levelData) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-gray-400 text-center">
                    <p className="text-xl mb-2">No level loaded</p>
                    <p className="text-sm">Upload a level JSON file to play</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="border border-gray-600 rounded-lg cursor-crosshair"
                style={{ maxWidth: '100%', height: 'auto' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            {/* Reset button overlay */}
            <button
                onClick={handleReset}
                className="absolute top-4 right-4 px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg font-medium backdrop-blur transition"
            >
                🔄 Reset Ball
            </button>

            {/* Aiming indicator */}
            {!canShoot && (
                <div className="absolute top-4 left-4 px-4 py-2 bg-yellow-600/80 text-white rounded-lg font-medium backdrop-blur">
                    ⏳ Ball in motion...
                </div>
            )}
        </div>
    );
}

// Draw the golf ball
function drawBall(ctx: CanvasRenderingContext2D, pos: Position) {
    // Ball shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(pos.x + 2, pos.y + 2, BALL_RADIUS, BALL_RADIUS * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball gradient
    const gradient = ctx.createRadialGradient(
        pos.x - BALL_RADIUS * 0.3,
        pos.y - BALL_RADIUS * 0.3,
        0,
        pos.x,
        pos.y,
        BALL_RADIUS
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#f0f0f0');
    gradient.addColorStop(1, '#d0d0d0');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Ball outline
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(pos.x - BALL_RADIUS * 0.3, pos.y - BALL_RADIUS * 0.3, BALL_RADIUS * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

// Draw golf hole with flag
function drawHole(ctx: CanvasRenderingContext2D, pos: Position) {
    // Hole shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(pos.x + 2, pos.y + 2, HOLE_RADIUS + 2, HOLE_RADIUS * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hole
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, HOLE_RADIUS, HOLE_RADIUS * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hole rim
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, HOLE_RADIUS, HOLE_RADIUS * 0.6, 0, 0, Math.PI * 2);
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 60);
    ctx.lineTo(pos.x + 12, pos.y - 55);
    ctx.lineTo(pos.x, pos.y - 50);
    ctx.closePath();
    ctx.fill();
}

// Draw power arrow while aiming
function drawPowerArrow(ctx: CanvasRenderingContext2D, start: Position, end: Position) {
    const dx = start.x - end.x;
    const dy = start.y - end.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const cappedDistance = Math.min(distance, MAX_POWER);
    const angle = Math.atan2(dy, dx);

    // Power percentage for color
    const powerPct = cappedDistance / MAX_POWER;

    // Arrow line (in shooting direction)
    const arrowEndX = start.x + Math.cos(angle) * cappedDistance;
    const arrowEndY = start.y + Math.sin(angle) * cappedDistance;

    // Color gradient from green (low power) to red (high power)
    const r = Math.floor(255 * powerPct);
    const g = Math.floor(255 * (1 - powerPct));
    const color = `rgb(${r}, ${g}, 50)`;

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();

    // Draw arrowhead
    const headLength = 15;
    const headAngle = Math.PI / 6;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(
        arrowEndX - headLength * Math.cos(angle - headAngle),
        arrowEndY - headLength * Math.sin(angle - headAngle)
    );
    ctx.lineTo(
        arrowEndX - headLength * Math.cos(angle + headAngle),
        arrowEndY - headLength * Math.sin(angle + headAngle)
    );
    ctx.closePath();
    ctx.fill();

    // Power text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        `${Math.round(powerPct * 100)}%`,
        start.x + Math.cos(angle) * (cappedDistance / 2),
        start.y + Math.sin(angle) * (cappedDistance / 2) - 15
    );

    // Draw drag indicator (where you're pulling from)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
}
