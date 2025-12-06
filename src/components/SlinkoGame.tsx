"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Engine, Body, IEventCollision } from 'matter-js';
import { Press_Start_2P } from 'next/font/google';

const pressStart2P = Press_Start_2P({
    weight: '400',
    subsets: ['latin'],
});

export function SlinkoGame() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const [score, setScore] = useState(0);
    const [previewX, setPreviewX] = useState<number>(210);
    const engineRef = useRef<Engine | null>(null);
    const MatterRef = useRef<typeof import('matter-js') | null>(null);

    // Initial setup
    useEffect(() => {
        if (!sceneRef.current) return;

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

            // Reduce height to ensure it fits in viewport comfortably
            // Reduce width further for tighter fit -> 420px
            const width = 420;
            const height = 600;
            const center = width / 2;

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
            const rows = 8;
            const pegRadius = 8; // Increased from 6
            const startX = center;
            const startY = 100;
            const spacingX = 50;
            const spacingY = 50;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col <= row; col++) {
                    // Skip the very first peg (top of separate triangle)
                    if (row === 0 && col === 0) continue;

                    const x = startX - (row * spacingX) / 2 + (col * spacingX);
                    const y = startY + row * spacingY;
                    const peg = Bodies.circle(x, y, pegRadius, {
                        isStatic: true,
                        label: 'peg',
                        render: { fillStyle: pegColor }
                    });
                    pegs.push(peg);
                }
            }

            Composite.add(engine.world, [ground, leftWall, rightWall, ...pegs]);

            Render.run(render);
            const runner = Runner.create();
            Runner.run(runner, engine);

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

            cleanup = () => {
                Render.stop(render);
                Runner.stop(runner);
                if (render.canvas) {
                    render.canvas.remove();
                }
            };
        };

        initMatter();

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const dropBall = useCallback(() => {
        if (!engineRef.current || !MatterRef.current) return;
        const Matter = MatterRef.current;

        // Use the current preview X for the drop
        // Clamp roughly between walls (width 420)
        const dropX = Math.max(20, Math.min(400, previewX));

        const ball = Matter.Bodies.circle(dropX, 20, 8, {
            restitution: 0.8,
            friction: 0.005,
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
