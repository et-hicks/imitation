'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { useAuth } from '@/components/AuthProvider';
import { BACKEND_URL } from '@/lib/env';
import { useRouter } from 'next/navigation';

type LeaderboardEntry = {
    name: string;
    score: number;
};

type GlobalScore = {
    player_name: string;
    score: number;
};

const AsteroidsGame = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [showUI, setShowUI] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [globalScores, setGlobalScores] = useState<GlobalScore[]>([]);
    const [showGlobalStats, setShowGlobalStats] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);
    const { isAuthenticated, session, user } = useAuth();
    const router = useRouter();

    const playerName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ANONYMOUS';
    const playerNameRef = useRef(playerName);
    playerNameRef.current = playerName;

    const fetchGlobalScores = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/asteroid-scores`);
            if (res.ok) setGlobalScores(await res.json());
        } catch { /* ignore */ }
    }, []);

    const saveScore = useCallback(async (score: number) => {
        if (!session?.access_token) return;
        try {
            await fetch(`${BACKEND_URL}/asteroid-scores`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ score }),
            });
            fetchGlobalScores();
        } catch { /* ignore */ }
    }, [session?.access_token, fetchGlobalScores]);

    const updateLeaderboard = (score: number) => {
        const entry = { name: playerNameRef.current || 'ANONYMOUS', score };
        setLeaderboard(prev => {
            const newBoard = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, 5);
            localStorage.setItem('asteroids_leaderboard', JSON.stringify(newBoard));
            return newBoard;
        });
    };
    const updateLeaderboardRef = useRef(updateLeaderboard);
    updateLeaderboardRef.current = updateLeaderboard;

    const saveScoreRef = useRef(saveScore);
    saveScoreRef.current = saveScore;

    const handleGameOver = (score: number) => {
        setLastScore(score);
        updateLeaderboardRef.current(score);
        saveScoreRef.current(score);
        setShowUI(true);
    };
    const handleGameOverRef = useRef(handleGameOver);
    handleGameOverRef.current = handleGameOver;

    useEffect(() => {
        const stored = localStorage.getItem('asteroids_leaderboard');
        if (stored) {
            setLeaderboard(JSON.parse(stored));
        }
        fetchGlobalScores();
    }, [fetchGlobalScores]);

    const startGame = () => {
        if (!gameRef.current) return;

        const scene = gameRef.current.scene.getScene('MainScene');
        if (scene) {
            scene.scene.restart({ startImmediately: true });
            setShowUI(false);
        }
    };

    useEffect(() => {
        if (gameRef.current) return;

        class MainScene extends Phaser.Scene {
            ship!: Phaser.GameObjects.Container;
            shipGraphics!: Phaser.GameObjects.Graphics;
            cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
            bullets!: Phaser.Physics.Arcade.Group;
            asteroids!: Phaser.Physics.Arcade.Group;
            lastFired = 0;
            score = 0;
            scoreText!: Phaser.GameObjects.Text;
            gameOver = false;

            constructor() {
                super({ key: 'MainScene' });
            }

            create(data?: { startImmediately?: boolean }) {
                this.gameOver = false;
                this.score = 0;

                const ship = this.add.graphics();
                ship.lineStyle(2, 0xffffff);
                ship.strokeTriangle(-10, 10, 10, 10, 0, -15);
                this.shipGraphics = ship;

                this.ship = this.add.container(400, 300, [ship]);
                this.physics.world.enable(this.ship);
                const shipBody = this.ship.body as Phaser.Physics.Arcade.Body;
                shipBody.setCircle(8, -8, -8);

                this.cursors = this.input.keyboard!.createCursorKeys();
                this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

                this.bullets = this.physics.add.group({ maxSize: 20 });
                this.asteroids = this.physics.add.group();

                for (let i = 0; i < 7; i++) {
                    this.spawnAsteroid();
                }

                this.scoreText = this.add.text(16, 16, 'Score: 0', {
                    fontSize: '18px',
                    color: '#ffffff'
                });

                this.physics.add.overlap(
                    this.bullets,
                    this.asteroids,
                    this.bulletHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
                    undefined,
                    this
                );

                this.physics.add.overlap(
                    this.ship,
                    this.asteroids,
                    this.shipHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
                    undefined,
                    this
                );

                if (!data?.startImmediately) {
                    this.physics.pause();
                }
            }

            update(time: number) {
                if (this.gameOver) return;

                const body = this.ship.body as Phaser.Physics.Arcade.Body;

                if (this.cursors.left.isDown) {
                    this.ship.angle -= 3;
                } else if (this.cursors.right.isDown) {
                    this.ship.angle += 3;
                }

                if (this.cursors.up.isDown) {
                    const rad = Phaser.Math.DegToRad(this.ship.angle - 90);
                    body.setAcceleration(Math.cos(rad) * 200, Math.sin(rad) * 200);
                } else {
                    body.setAcceleration(0);
                    body.setDrag(50);
                }

                // Fire
                const spaceKey = this.input.keyboard!.keys[Phaser.Input.Keyboard.KeyCodes.SPACE];
                if (spaceKey?.isDown && time > this.lastFired + 250) {
                    const bullet = this.add.graphics();
                    bullet.fillStyle(0xffffff);
                    bullet.fillCircle(0, 0, 3);

                    const rad = Phaser.Math.DegToRad(this.ship.angle - 90);
                    bullet.x = this.ship.x + Math.cos(rad) * 20;
                    bullet.y = this.ship.y + Math.sin(rad) * 20;

                    this.bullets.add(bullet);
                    this.physics.world.enable(bullet);
                    const bulletBody = bullet.body as Phaser.Physics.Arcade.Body;
                    bulletBody.setVelocity(Math.cos(rad) * 400, Math.sin(rad) * 400);
                    bulletBody.setCircle(3);

                    this.lastFired = time;

                    this.time.delayedCall(1500, () => {
                        bullet.setActive(false);
                        bullet.setVisible(false);
                    });
                }

                // Screen wrapping
                this.physics.world.wrap(this.ship, 16);
                this.asteroids.getChildren().forEach(a => {
                    this.physics.world.wrap(a, 70);
                });
            }

            spawnAsteroid(x?: number, y?: number, sizeType?: string, vx?: number, vy?: number) {
                let spawnX = x;
                let spawnY = y;

                if (spawnX === undefined || spawnY === undefined) {
                    for (let i = 0; i < 10; i++) {
                        const testX = Phaser.Math.Between(0, 800);
                        const testY = Phaser.Math.Between(0, 600);
                        if (Phaser.Math.Distance.Between(testX, testY, this.ship.x, this.ship.y) > 200) {
                            spawnX = testX;
                            spawnY = testY;
                            break;
                        }
                    }
                    if (spawnX === undefined || spawnY === undefined) {
                        spawnX = Phaser.Math.Between(0, 800);
                        spawnY = Phaser.Math.Between(0, 600);
                    }
                }

                const asteroid = this.add.graphics();
                let radius;
                let color;
                let type = sizeType;

                if (!type) {
                    const rand = Math.random();
                    if (rand < 0.2) type = 'small';
                    else if (rand < 0.5) type = 'medium';
                    else type = 'large';
                }

                let speedMultiplier = 1;
                switch (type) {
                    case 'small':
                        radius = Phaser.Math.Between(10, 20);
                        color = 0xff0000;
                        speedMultiplier = 1.3;
                        break;
                    case 'medium':
                        radius = Phaser.Math.Between(25, 40);
                        color = 0x00ff00;
                        speedMultiplier = 1.1;
                        break;
                    case 'large':
                    default:
                        radius = Phaser.Math.Between(50, 70);
                        color = 0xffffff;
                        speedMultiplier = 1.0;
                        break;
                }

                asteroid.setData('sizeType', type);
                asteroid.lineStyle(2, color);

                const points = [];
                const numPoints = Phaser.Math.Between(5, 10);
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    const r = radius + Phaser.Math.Between(-5, 5);
                    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
                }
                points.push(points[0]);
                asteroid.strokePoints(points);
                asteroid.x = spawnX;
                asteroid.y = spawnY;

                this.asteroids.add(asteroid);
                this.physics.world.enable(asteroid);
                const body = asteroid.body as Phaser.Physics.Arcade.Body;

                if (vx !== undefined && vy !== undefined) {
                    body.setVelocity(vx * speedMultiplier, vy * speedMultiplier);
                } else {
                    const baseSpeed = Phaser.Math.Between(50, 100);
                    const speed = baseSpeed * speedMultiplier;
                    const angle = Math.random() * Math.PI * 2;
                    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                }

                const hitboxRadius = radius * 0.75;
                const offset = radius - hitboxRadius;
                body.setCircle(hitboxRadius, offset, offset);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bulletHitAsteroid(bullet: any, asteroid: any) {
                const b = bullet as Phaser.GameObjects.Graphics;
                const a = asteroid as Phaser.GameObjects.Graphics;
                const sizeType = a.getData('sizeType');
                const x = a.x;
                const y = a.y;
                const body = a.body as Phaser.Physics.Arcade.Body;
                const v = body.velocity;

                b.setActive(false);
                b.setVisible(false);
                a.destroy();
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);

                if (sizeType === 'large' || sizeType === 'medium') {
                    const nextSize = sizeType === 'large' ? 'medium' : 'small';
                    const angle = Math.atan2(v.y, v.x);
                    const speed = v.length();
                    const angle1 = angle + Math.PI / 2;
                    const angle2 = angle - Math.PI / 2;
                    const off = sizeType === 'large' ? 40 : 25;

                    this.spawnAsteroid(x + Math.cos(angle1) * off, y + Math.sin(angle1) * off, nextSize, Math.cos(angle1) * speed, Math.sin(angle1) * speed);
                    this.spawnAsteroid(x + Math.cos(angle2) * off, y + Math.sin(angle2) * off, nextSize, Math.cos(angle2) * speed, Math.sin(angle2) * speed);
                }

                if (this.asteroids.countActive() < 5) {
                    this.spawnAsteroid();
                }
            }

            shipHitAsteroid() {
                this.physics.pause();
                this.shipGraphics.clear();
                this.shipGraphics.lineStyle(2, 0xff0000);
                this.shipGraphics.strokeTriangle(-10, 10, 10, 10, 0, -15);
                this.gameOver = true;

                const onGameOver = this.registry.get('onGameOver');
                if (onGameOver) onGameOver(this.score);
            }
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-game',
            physics: {
                default: 'arcade',
                arcade: { gravity: { x: 0, y: 0 }, debug: false }
            },
            scene: MainScene,
            backgroundColor: '#000000'
        };

        const game = new Phaser.Game(config);
        game.registry.set('onGameOver', (score: number) => handleGameOverRef.current(score));
        gameRef.current = game;

        return () => {
            game.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return (
        <div className="relative flex justify-center items-center h-screen bg-black">
            <div id="phaser-game" />

            {showUI && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10">
                    <h1 className="text-6xl font-bold mb-8 text-white tracking-widest">ASTEROIDS</h1>

                    {lastScore !== null && (
                        <div className="mb-8 text-center">
                            <h2 className="text-4xl text-red-500 mb-2">GAME OVER</h2>
                            <p className="text-2xl">SCORE: {lastScore}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 mb-8 w-64">
                        {isAuthenticated ? (
                            <>
                                <p className="text-center text-lg text-green-400">{playerName.toUpperCase()}</p>
                                <button
                                    onClick={startGame}
                                    className="bg-white text-black font-bold py-2 px-4 hover:bg-gray-200 transition-colors text-xl"
                                >
                                    {lastScore !== null ? 'PLAY AGAIN' : 'PLAY GAME'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => router.push('/login')}
                                className="bg-white text-black font-bold py-2 px-4 hover:bg-gray-200 transition-colors text-xl"
                            >
                                LOGIN TO PLAY
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowGlobalStats(!showGlobalStats)}
                        className="mb-4 border-2 border-white px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                    >
                        {showGlobalStats ? 'HIDE STATS' : 'STATS'}
                    </button>

                    {showGlobalStats && globalScores.length > 0 && (
                        <div className="mt-2 border-2 border-white p-6 rounded-lg bg-black/50">
                            <h3 className="text-2xl font-bold mb-4 text-center border-b border-white pb-2">GLOBAL LEADERBOARD</h3>
                            <table className="w-full text-left">
                                <tbody>
                                    {globalScores.map((entry, i) => (
                                        <tr key={i} className="text-lg">
                                            <td className="pr-8 py-1 text-gray-400">#{i + 1}</td>
                                            <td className="pr-8 py-1 font-mono">{entry.player_name}</td>
                                            <td className="py-1 text-right font-mono text-green-400">{entry.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!showGlobalStats && leaderboard.length > 0 && (
                        <div className="mt-2 border-2 border-white p-6 rounded-lg bg-black/50">
                            <h3 className="text-2xl font-bold mb-4 text-center border-b border-white pb-2">TOP COMMANDERS</h3>
                            <table className="w-full text-left">
                                <tbody>
                                    {leaderboard.map((entry, i) => (
                                        <tr key={i} className="text-lg">
                                            <td className="pr-8 py-1 text-gray-400">#{i + 1}</td>
                                            <td className="pr-8 py-1 font-mono">{entry.name}</td>
                                            <td className="py-1 text-right font-mono text-green-400">{entry.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AsteroidsGame;
