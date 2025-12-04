'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';

type LeaderboardEntry = {
    name: string;
    score: number;
};

const AsteroidsGame = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [showUI, setShowUI] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [lastScore, setLastScore] = useState<number | null>(null);

    // Refs for callbacks to avoid stale closures
    const playerNameRef = useRef(playerName);
    playerNameRef.current = playerName;

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

    const handleGameOver = (score: number) => {
        setLastScore(score);
        updateLeaderboardRef.current(score);
        setShowUI(true);
    };
    const handleGameOverRef = useRef(handleGameOver);
    handleGameOverRef.current = handleGameOver;

    useEffect(() => {
        const stored = localStorage.getItem('asteroids_leaderboard');
        if (stored) {
            setLeaderboard(JSON.parse(stored));
        }
    }, []);

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
            private ship!: Phaser.GameObjects.Container;
            private shipGraphics!: Phaser.GameObjects.Graphics;
            private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
            private bullets!: Phaser.Physics.Arcade.Group;
            private asteroids!: Phaser.Physics.Arcade.Group;
            private lastFired: number = 0;
            private score: number = 0;
            private scoreText!: Phaser.GameObjects.Text;
            private gameOver: boolean = false;

            constructor() {
                super({ key: 'MainScene' });
            }

            preload() {
                // No assets to preload, using graphics
            }

            create(data: { startImmediately?: boolean }) {
                this.gameOver = false;
                this.score = 0;

                // Create Ship
                this.ship = this.add.container(400, 300);
                this.shipGraphics = this.add.graphics();
                this.shipGraphics.lineStyle(2, 0xffffff);
                this.shipGraphics.strokeTriangle(-10, 10, 10, 10, 0, -15);
                this.ship.add(this.shipGraphics);

                this.physics.world.enable(this.ship);
                const body = this.ship.body as Phaser.Physics.Arcade.Body;
                body.setCircle(8, -8, -8); // Smaller circular hitbox
                body.setDrag(100);
                body.setAngularDrag(100);
                body.setMaxVelocity(200);

                // Input
                if (this.input.keyboard) {
                    this.cursors = this.input.keyboard.createCursorKeys();
                }

                // Bullets
                this.bullets = this.physics.add.group({
                    classType: Phaser.GameObjects.Graphics,
                    defaultKey: null,
                    maxSize: 30,
                    runChildUpdate: true
                });

                // Asteroids
                this.asteroids = this.physics.add.group();

                // Initial Asteroids
                for (let i = 0; i < 5; i++) {
                    this.spawnAsteroid();
                }

                // Score
                this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', color: '#fff' });

                // Collisions
                this.physics.add.overlap(this.bullets, this.asteroids, this.bulletHitAsteroid, undefined, this);
                this.physics.add.overlap(this.ship, this.asteroids, this.shipHitAsteroid, undefined, this);

                // Pause if not starting immediately
                if (!data || !data.startImmediately) {
                    this.scene.pause();
                }
            }

            update(time: number) {
                if (this.gameOver) {
                    return;
                }

                const body = this.ship.body as Phaser.Physics.Arcade.Body;

                if (this.cursors.left.isDown) {
                    body.setAngularVelocity(-300);
                } else if (this.cursors.right.isDown) {
                    body.setAngularVelocity(300);
                } else {
                    body.setAngularVelocity(0);
                }

                if (this.cursors.up.isDown) {
                    this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, 200, body.acceleration);
                } else {
                    body.setAcceleration(0);
                }

                if (this.cursors.space.isDown && time > this.lastFired) {
                    this.fireBullet(time);
                }

                this.physics.world.wrap(this.ship, 20);
                this.physics.world.wrap(this.asteroids, 20);

                // Manual bullet wrapping and cleanup
                this.bullets.children.each((b: Phaser.GameObjects.GameObject) => {
                    const bullet = b as Phaser.GameObjects.Graphics;
                    if (bullet.active) {
                        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
                            bullet.setActive(false);
                            bullet.setVisible(false);
                        }
                    }
                    return true;
                });
            }

            fireBullet(time: number) {
                const bullet = this.bullets.get();

                if (bullet) {
                    // Initialize bullet graphics if not already done
                    if (!bullet.getData('isInitialized')) {
                        // this.physics.world.enable(bullet); // Already enabled by group
                        bullet.clear();
                        bullet.fillStyle(0xffffff, 1);
                        bullet.fillCircle(0, 0, 2);
                        bullet.setData('isInitialized', true);
                    }

                    bullet.setActive(true);
                    bullet.setVisible(true);
                    bullet.setPosition(this.ship.x, this.ship.y);

                    const velocity = this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, 400);
                    bullet.body.setVelocity(velocity.x, velocity.y);

                    this.lastFired = time + 250;
                }
            }

            spawnAsteroid(x?: number, y?: number, sizeType?: 'large' | 'medium' | 'small', vx?: number, vy?: number) {
                // If x and y are not provided, pick random location
                let spawnX = x;
                let spawnY = y;

                if (spawnX === undefined || spawnY === undefined) {
                    // Try up to 10 times to find a safe spawn spot
                    for (let i = 0; i < 10; i++) {
                        const testX = Phaser.Math.Between(0, 800);
                        const testY = Phaser.Math.Between(0, 600);

                        if (Phaser.Math.Distance.Between(testX, testY, this.ship.x, this.ship.y) > 200) {
                            spawnX = testX;
                            spawnY = testY;
                            break;
                        }
                    }

                    // If we still didn't find a safe spot, just use the last random one or default
                    if (spawnX === undefined || spawnY === undefined) {
                        spawnX = Phaser.Math.Between(0, 800);
                        spawnY = Phaser.Math.Between(0, 600);
                    }
                }

                const asteroid = this.add.graphics();

                // Determine size and color
                let radius;
                let color;
                let type = sizeType;

                if (!type) {
                    const rand = Math.random();
                    if (rand < 0.2) {
                        type = 'small';
                    } else if (rand < 0.5) {
                        type = 'medium';
                    } else {
                        type = 'large';
                    }
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

                // Random polygon shape
                const points = [];
                const numPoints = Phaser.Math.Between(5, 10);
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    const r = radius + Phaser.Math.Between(-5, 5); // Reduced variation for smaller asteroids
                    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
                }
                points.push(points[0]); // Close loop

                asteroid.strokePoints(points);
                asteroid.x = spawnX;
                asteroid.y = spawnY;

                this.asteroids.add(asteroid);
                this.physics.world.enable(asteroid);
                const body = asteroid.body as Phaser.Physics.Arcade.Body;

                if (vx !== undefined && vy !== undefined) {
                    // Use provided velocity (already scaled)
                    body.setVelocity(vx * speedMultiplier, vy * speedMultiplier);
                } else {
                    const baseSpeed = Phaser.Math.Between(50, 100);
                    const speed = baseSpeed * speedMultiplier;

                    // Random velocity vector with magnitude = speed
                    const angle = Math.random() * Math.PI * 2;
                    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                }

                // Reduced hitbox (75% of visual size)
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

                // Splitting logic
                if (sizeType === 'large' || sizeType === 'medium') {
                    const nextSize = sizeType === 'large' ? 'medium' : 'small';

                    // Calculate orthogonal directions
                    // Current angle
                    const angle = Math.atan2(v.y, v.x);
                    const speed = v.length();

                    // Orthogonal angles (+90 and -90 degrees)
                    const angle1 = angle + Math.PI / 2;
                    const angle2 = angle - Math.PI / 2;

                    // Offset distance (radius of current asteroid approx)
                    const offset = sizeType === 'large' ? 40 : 25;

                    // Calculate new positions
                    const x1 = x + Math.cos(angle1) * offset;
                    const y1 = y + Math.sin(angle1) * offset;
                    const x2 = x + Math.cos(angle2) * offset;
                    const y2 = y + Math.sin(angle2) * offset;

                    // Calculate new base velocities (will be multiplied by speedMultiplier in spawnAsteroid)
                    const vx1 = Math.cos(angle1) * speed;
                    const vy1 = Math.sin(angle1) * speed;
                    const vx2 = Math.cos(angle2) * speed;
                    const vy2 = Math.sin(angle2) * speed;

                    this.spawnAsteroid(x1, y1, nextSize, vx1, vy1);
                    this.spawnAsteroid(x2, y2, nextSize, vx2, vy2);
                }

                // Spawn new random asteroids if count gets too low to keep game going
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

                // Notify React
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
                arcade: {
                    gravity: { x: 0, y: 0 }, // No gravity in space
                    debug: false
                }
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
                        <input
                            type="text"
                            placeholder="ENTER NAME"
                            className="bg-transparent border-2 border-white p-2 text-center text-xl uppercase focus:outline-none focus:border-green-400"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        />
                        <button
                            onClick={startGame}
                            className="bg-white text-black font-bold py-2 px-4 hover:bg-gray-200 transition-colors text-xl"
                        >
                            {lastScore !== null ? 'PLAY AGAIN' : 'START GAME'}
                        </button>
                    </div>

                    {leaderboard.length > 0 && (
                        <div className="mt-8 border-2 border-white p-6 rounded-lg bg-black/50">
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
