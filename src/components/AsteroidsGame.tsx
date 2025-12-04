'use client';

import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

const AsteroidsGame = () => {
    const gameRef = useRef<Phaser.Game | null>(null);

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

            create() {
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
            }

            update(time: number) {
                if (this.gameOver) {
                    if (this.cursors.space.isDown) {
                        this.scene.restart();
                    }
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

            spawnAsteroid() {
                const x = Phaser.Math.Between(0, 800);
                const y = Phaser.Math.Between(0, 600);

                // Don't spawn too close to ship
                if (Phaser.Math.Distance.Between(x, y, this.ship.x, this.ship.y) < 100) {
                    return;
                }

                const asteroid = this.add.graphics();

                // Determine size and color
                const rand = Math.random();
                let radius;
                let color;

                if (rand < 0.2) {
                    // Small (20%) - Red
                    radius = Phaser.Math.Between(10, 20);
                    color = 0xff0000;
                } else if (rand < 0.5) {
                    // Medium (30%) - Green
                    radius = Phaser.Math.Between(25, 40);
                    color = 0x00ff00;
                } else {
                    // Large (50%) - White
                    radius = Phaser.Math.Between(50, 70);
                    color = 0xffffff;
                }

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
                asteroid.x = x;
                asteroid.y = y;

                this.asteroids.add(asteroid);
                this.physics.world.enable(asteroid);
                const body = asteroid.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
                body.setCircle(radius); // Approximate collider
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bulletHitAsteroid(bullet: any, asteroid: any) {
                const b = bullet as Phaser.GameObjects.Graphics;
                const a = asteroid as Phaser.GameObjects.Graphics;

                b.setActive(false);
                b.setVisible(false);
                a.destroy();
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);

                // Spawn 2 new ones to keep it going
                if (this.asteroids.countActive() < 10) {
                    this.spawnAsteroid();
                    this.spawnAsteroid();
                }
            }

            shipHitAsteroid() {
                this.physics.pause();
                this.shipGraphics.clear();
                this.shipGraphics.lineStyle(2, 0xff0000);
                this.shipGraphics.strokeTriangle(-10, 10, 10, 10, 0, -15);
                this.gameOver = true;
                this.add.text(300, 250, 'GAME OVER', { fontSize: '40px', color: '#ff0000' });
                this.add.text(280, 300, 'Press Space to Restart', { fontSize: '20px', color: '#fff' });
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

        gameRef.current = new Phaser.Game(config);

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return <div id="phaser-game" className="flex justify-center items-center h-screen bg-black" />;
};

export default AsteroidsGame;
