"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Engine, Body, IEventCollision } from 'matter-js';
import { Press_Start_2P } from 'next/font/google';

const pressStart2P = Press_Start_2P({
    weight: '400',
    subsets: ['latin'],
});

enum PegType {
    CIRCLE,
    SQUARE,
    TRIANGLE_ROTATING,
    SQUARE_ROTATING
}

const CURRENT_PEG_TYPE: PegType = PegType.TRIANGLE_ROTATING;

// Shared board constants used by both init and dropBall
const BOARD_ROWS = 11;
const SPACING_X = 50;
const SPACING_Y = 50;
const START_Y = 100;
const BOTTOM_CLEARANCE = 100;
const BOARD_WIDTH = (BOARD_ROWS - 1) * SPACING_X + 60;
const BOARD_HEIGHT = START_Y + (BOARD_ROWS - 1) * SPACING_Y + BOTTOM_CLEARANCE;
const BOARD_CENTER = BOARD_WIDTH / 2;

export function SlinkoGame() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const [score, setScore] = useState(0);
    const [previewX, setPreviewX] = useState<number>(255);
    const engineRef = useRef<Engine | null>(null);
    const MatterRef = useRef<typeof import('matter-js') | null>(null);

    // Initial setup
    useEffect(() => {
        if (!sceneRef.current) return;
        // Prevent double-initialization (React Strict Mode runs effects twice)
        if (sceneRef.current.querySelector('canvas')) return;

        let cleanup: (() => void) | undefined;

        const initMatter = async () => {
            const MatterModule = await import('matter-js');
            const Matter = MatterModule.default || MatterModule;
            MatterRef.current = Matter;

            const Engine = Matter.Engine,
                Render = Matter.Render,
                Runner = Matter.Runner,
                Bodies = Matter.Bodies,
                Composite = Matter.Composite,
                Events = Matter.Events;

            const engine = Engine.create();
            engineRef.current = engine;

            const rows = BOARD_ROWS;
            const spacingX = SPACING_X;
            const spacingY = SPACING_Y;
            const width = BOARD_WIDTH;
            const height = BOARD_HEIGHT;
            const startY = START_Y;
            const center = BOARD_CENTER;

            const render = Render.create({
                element: sceneRef.current!,
                engine: engine,
                options: {
                    width: width,
                    height: height,
                    wireframes: false,
                    background: '#000000',
                }
            });

            const wallColor = '#00ff00';
            const pegColor = '#ff00ff';
            const groundColor = '#00ff00';

            // Adjust bounds for new dimensions
            const ground = Bodies.rectangle(center, height + 10, width + 20, 60, {
                isStatic: true,
                render: { fillStyle: groundColor }
            });
            const leftWall = Bodies.rectangle(-10, height / 2, 20, height, {
                isStatic: true,
                render: { fillStyle: wallColor }
            });
            const rightWall = Bodies.rectangle(width + 10, height / 2, 20, height, {
                isStatic: true,
                render: { fillStyle: wallColor }
            });

            const pegs: Body[] = [];
            const pegRotations = new Map<number, number>(); // Store rotation speed for each peg
            const pegRadius = 8;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col <= row; col++) {
                    // Skip the very first peg (top of separate triangle)
                    if (row === 0 && col === 0) continue;

                    const x = center - (row * spacingX) / 2 + (col * spacingX);
                    const y = startY + row * spacingY;

                    let peg: Body;

                    switch (CURRENT_PEG_TYPE) {
                        case PegType.CIRCLE:
                            peg = Bodies.circle(x, y, pegRadius, {
                                isStatic: true,
                                label: 'peg',
                                render: { fillStyle: pegColor }
                            });
                            break;

                        case PegType.SQUARE:
                            // Square rotated 45deg (diamond) for better physics
                            peg = Bodies.rectangle(x, y, pegRadius * 2, pegRadius * 2, {
                                isStatic: true,
                                label: 'peg',
                                angle: Math.PI / 4,
                                render: { fillStyle: pegColor }
                            });
                            break;

                        case PegType.SQUARE_ROTATING:
                            // Square rotated 45deg initially
                            peg = Bodies.rectangle(x, y, pegRadius * 2, pegRadius * 2, {
                                isStatic: true,
                                label: 'peg',
                                angle: Math.PI / 4,
                                render: { fillStyle: pegColor }
                            });
                            break;

                        case PegType.TRIANGLE_ROTATING:
                        default:
                            // Triangle
                            peg = Bodies.polygon(x, y, 3, pegRadius + 2, {
                                isStatic: true,
                                label: 'peg',
                                render: { fillStyle: pegColor }
                            });
                            break;
                    }

                    // Add rotation logic if enabled
                    if (CURRENT_PEG_TYPE === PegType.TRIANGLE_ROTATING || CURRENT_PEG_TYPE === PegType.SQUARE_ROTATING) {
                        // Alternate rotation direction per row
                        // Row 0 skipped. Row 1: CW, Row 2: CCW...
                        const speed = (row % 2 === 0 ? 1 : -1) * 0.02;
                        pegRotations.set(peg.id, speed);
                    }

                    pegs.push(peg);
                }
            }

            Composite.add(engine.world, [ground, leftWall, rightWall, ...pegs]);

            Render.run(render);
            const runner = Runner.create();
            Runner.run(runner, engine);

            // Rotate pegs on every frame if enabled
            if (CURRENT_PEG_TYPE === PegType.TRIANGLE_ROTATING || CURRENT_PEG_TYPE === PegType.SQUARE_ROTATING) {
                Events.on(engine, 'beforeUpdate', () => {
                    pegs.forEach(peg => {
                        const speed = pegRotations.get(peg.id);
                        if (speed) {
                            Matter.Body.setAngle(peg, peg.angle + speed);
                        }
                    });
                });
            }

            Events.on(engine, 'collisionStart', (event: IEventCollision<Engine>) => {
                const pairs = event.pairs;
                for (const pair of pairs) {
                    if ((pair.bodyA.label === 'ball' && pair.bodyB.label === 'peg') ||
                        (pair.bodyB.label === 'ball' && pair.bodyA.label === 'peg')) {
                        const pegBody = pair.bodyA.label === 'peg' ? pair.bodyA : pair.bodyB;

                        setScore(s => s + 10);

                        pegBody.render.fillStyle = '#ffffff';
                        setTimeout(() => {
                            pegBody.render.fillStyle = pegColor;
                        }, 100);
                    }
                }
            });

            // Energy Boost Logic
            Events.on(engine, 'collisionEnd', (event: IEventCollision<Engine>) => {
                const pairs = event.pairs;
                for (const pair of pairs) {
                    // Check if ball (A or B)
                    const bodyA = pair.bodyA;
                    const bodyB = pair.bodyB;
                    let ballBody: Body | null = null;

                    if (bodyA.label === 'ball') ballBody = bodyA;
                    else if (bodyB.label === 'ball') ballBody = bodyB;

                    if (ballBody) {
                        // If ball is moving upwards (negative Y velocity)
                        if (ballBody.velocity.y < 0) {
                            // 30% chance gain energy
                            if (Math.random() < 0.45) {
                                // Multiply velocity to add energy
                                Matter.Body.setVelocity(ballBody, {
                                    x: ballBody.velocity.x * 1.5, // Boost speed
                                    y: ballBody.velocity.y * 1.8
                                });
                            }
                        }
                    }
                }
            });

            cleanup = () => {
                Render.stop(render);
                Runner.stop(runner);
                if (render.canvas) {
                    render.canvas.remove();
                }
            };
        };

        // Initialize state to roughly center based on likely width (510)
        setPreviewX(255);
        initMatter();

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const dropBall = useCallback(() => {
        if (!engineRef.current || !MatterRef.current) return;
        const Matter = MatterRef.current;

        // Clamp within walls (20px margin)
        const dropX = Math.max(20, Math.min(BOARD_WIDTH - 20, previewX));

        const ball = Matter.Bodies.circle(dropX, 20, 8, {
            restitution: 0.9,
            friction: 0.001,
            label: 'ball',
            render: {
                fillStyle: '#00ffff'
            }
        });

        Matter.Composite.add(engineRef.current.world, ball);
    }, [previewX]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (sceneRef.current) {
            const rect = sceneRef.current.getBoundingClientRect();
            // Calculate X relative to the canvas
            // The canvas is centered in the 600px wide game area
            // Ideally we track cursor relative to the canvas element itself
            const rawX = e.clientX - rect.left;
            setPreviewX(rawX);
        }
    };

    const handleAreaClick = () => {
        dropBall();
    };

    const reset = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScore(0);
        if (engineRef.current && MatterRef.current) {
            const bodies = MatterRef.current.Composite.allBodies(engineRef.current.world);
            const balls = bodies.filter((b: Body) => b.label === 'ball');
            MatterRef.current.Composite.remove(engineRef.current.world, balls);
        }
    };

    return (
        <div
            className={`w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none ${pressStart2P.className}`}
        >
            <div className="flex flex-col items-center w-full z-10 pointer-events-none mb-2">
                <h1 className="text-2xl text-[#00ff00] mb-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,255,0,0.7)]">
                    Slinko-8
                </h1>

                <div className="border-2 border-[#ff00ff] bg-black px-4 py-1 shadow-[2px_2px_0px_0px_#00ff00]">
                    <span className="text-sm text-[#00ffff]">SCORE: {score.toString().padStart(6, '0')}</span>
                </div>
            </div>

            <div
                className="relative border-4 border-[#00ff00] shadow-[0_0_20px_rgba(0,255,0,0.3)] cursor-pointer"
                onClick={handleAreaClick}
                onMouseMove={handleMouseMove}
            >
                {/* 
                  Wrapper div for canvas.
                  We handle mouse events here to track cursor over the game area.
                */}
                <div ref={sceneRef} />

                {/* Preview Ball */}
                <div
                    className="absolute top-[20px] w-4 h-4 rounded-full bg-[#00ffff] opacity-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#00ffff]"
                    style={{ left: previewX }}
                />

                {/* Scanline overlay effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[5] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
            </div>

            <div className="w-full text-center mt-2 pointer-events-none">
                <p className="text-[#00ff00] text-[10px] animate-pulse">CLICK TO DROP</p>
            </div>

            <button
                onClick={reset}
                className="absolute top-4 right-4 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] border border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-y-1 active:shadow-none transition-all"
            >
                RESET
            </button>
        </div>
    );
}
