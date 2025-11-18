'use client';

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

export default function PongGame() {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && gameContainer.current && !gameInstance.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 1200,
                height: 800,
                parent: gameContainer.current,
                backgroundColor: '#000000',
                fps: {
                    target: 30,
                    forceSetTimeOut: true
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false,
                    },
                },
                scene: [StartScene, GameScene],
            };

            gameInstance.current = new Phaser.Game(config);
        }

        return () => {
            if (gameInstance.current) {
                gameInstance.current.destroy(true);
                gameInstance.current = null;
            }
        };
    }, []);

    return <div ref={gameContainer} className="flex justify-center items-center min-h-screen bg-gray-900" />;
}

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 4, 'PONG', {
            fontSize: '100px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        const createButton = (y: number, text: string, mode: string) => {
            const button = this.add.text(width / 2, y, text, {
                fontSize: '40px',
                color: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 },
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => button.setStyle({ color: '#00ff00' }))
                .on('pointerout', () => button.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => this.scene.start('GameScene', { mode }));
        };

        createButton(height / 2, '2 Player (WASD vs Arrows)', '2player');
        createButton(height / 2 + 100, '1 Player (vs AI)', '1player');
        createButton(height / 2 + 200, 'AI vs AI', 'ai_vs_ai');

        // Keyboard shortcuts
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-ONE', () => this.scene.start('GameScene', { mode: '1player' }));
            this.input.keyboard.on('keydown-TWO', () => this.scene.start('GameScene', { mode: '2player' }));
            this.input.keyboard.on('keydown-A', () => this.scene.start('GameScene', { mode: 'ai_vs_ai' }));
        }
    }
}

class GameScene extends Phaser.Scene {
    private paddleLeft!: Phaser.Physics.Arcade.Image;
    private paddleRight!: Phaser.Physics.Arcade.Image;
    private ball!: Phaser.Physics.Arcade.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: { w: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key };
    private scoreLeftText!: Phaser.GameObjects.Text;
    private scoreRightText!: Phaser.GameObjects.Text;
    private scoreLeft = 0;
    private scoreRight = 0;
    private mode!: string;
    private paddleSpeed = 600;
    private initialBallSpeed = 600;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { mode: string }) {
        this.mode = data.mode;
        this.scoreLeft = 0;
        this.scoreRight = 0;
    }

    preload() {
        // Create simple graphics for textures
        const graphics = this.make.graphics({ x: 0, y: 0 });

        // Paddle texture
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 20, 100);
        graphics.generateTexture('paddle', 20, 100);

        // Ball texture
        graphics.clear();
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 20, 20);
        graphics.generateTexture('ball', 20, 20);
    }

    create() {
        const { width, height } = this.scale;

        // Center line
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 0.5);
        graphics.beginPath();
        for (let y = 0; y < height; y += 40) {
            graphics.moveTo(width / 2, y);
            graphics.lineTo(width / 2, y + 20);
        }
        graphics.strokePath();

        // Paddles
        this.paddleLeft = this.physics.add.image(50, height / 2, 'paddle').setTint(0x00ff00).setImmovable(true);
        this.paddleRight = this.physics.add.image(width - 50, height / 2, 'paddle').setTint(0x800080).setImmovable(true);

        this.paddleLeft.setCollideWorldBounds(true);
        this.paddleRight.setCollideWorldBounds(true);

        // Ball
        this.ball = this.physics.add.image(width / 2, height / 2, 'ball');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(1, 1);

        // Disable collision on left and right walls so ball can pass through
        this.physics.world.setBoundsCollision(false, false, true, true);

        // Collisions
        this.physics.add.collider(this.ball, this.paddleLeft, this.hitPaddle as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        this.physics.add.collider(this.ball, this.paddleRight, this.hitPaddle as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

        // Input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys = {
                w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            };
        }

        // Score
        this.scoreLeftText = this.add.text(width / 4, 50, '0', { fontSize: '80px', color: '#ffffff' }).setOrigin(0.5);
        this.scoreRightText = this.add.text(width * 3 / 4, 50, '0', { fontSize: '80px', color: '#ffffff' }).setOrigin(0.5);

        // Start ball
        this.resetBall();

        // Back button
        this.add.text(20, 20, 'Back to Menu', { color: '#ffffff' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('StartScene'));
    }

    update() {
        // Left Paddle Control
        if (this.mode === '2player' || this.mode === '1player') {
            // Player control
            if (this.keys.w.isDown) {
                this.paddleLeft.setVelocityY(-this.paddleSpeed);
            } else if (this.keys.s.isDown) {
                this.paddleLeft.setVelocityY(this.paddleSpeed);
            } else {
                this.paddleLeft.setVelocityY(0);
            }
        } else {
            // AI control for Left
            this.aiControl(this.paddleLeft);
        }

        // Right Paddle Control
        if (this.mode === '2player') {
            // Player control
            if (this.cursors.up.isDown) {
                this.paddleRight.setVelocityY(-this.paddleSpeed);
            } else if (this.cursors.down.isDown) {
                this.paddleRight.setVelocityY(this.paddleSpeed);
            } else {
                this.paddleRight.setVelocityY(0);
            }
        } else {
            // AI control for Right
            this.aiControl(this.paddleRight);
        }

        // Scoring
        if (this.ball.x < 0) {
            this.scoreRight++;
            this.scoreRightText.setText(this.scoreRight.toString());
            this.resetBall();
        } else if (this.ball.x > this.scale.width) {
            this.scoreLeft++;
            this.scoreLeftText.setText(this.scoreLeft.toString());
            this.resetBall();
        }
    }

    aiControl(paddle: Phaser.Physics.Arcade.Image) {
        const diff = this.ball.y - paddle.y;
        const speed = 400; // AI speed slightly slower than max paddle speed to be beatable

        if (Math.abs(diff) < 10) {
            paddle.setVelocityY(0);
        } else if (diff < 0) {
            paddle.setVelocityY(-speed);
        } else {
            paddle.setVelocityY(speed);
        }
    }

    hitPaddle(ball: Phaser.Physics.Arcade.Image, paddle: Phaser.Physics.Arcade.Image) {

        // Add some angle based on where it hits the paddle
        if (ball.y < paddle.y) {
            // Ball is above paddle center
            ball.setVelocityY(-10 * (paddle.y - ball.y));
        } else if (ball.y > paddle.y) {
            // Ball is below paddle center
            ball.setVelocityY(10 * (ball.y - paddle.y));
        }

        // Change color based on which paddle hit it
        if (paddle === this.paddleLeft) {
            ball.setTint(0x00ff00); // Green
        } else if (paddle === this.paddleRight) {
            ball.setTint(0x800080); // Purple
        }

        // Maintain constant speed
        const currentVel = (ball.body as Phaser.Physics.Arcade.Body).velocity;
        const vec = new Phaser.Math.Vector2(currentVel.x, currentVel.y).normalize().scale(this.initialBallSpeed);
        ball.setVelocity(vec.x, vec.y);
    }

    resetBall() {
        this.ball.clearTint(); // Reset color
        this.ball.setPosition(this.scale.width / 2, this.scale.height / 2);
        const angle = Phaser.Math.Between(-45, 45);
        const direction = Math.random() < 0.5 ? 1 : -1;
        const vec = this.physics.velocityFromAngle(angle, this.initialBallSpeed * direction);
        this.ball.setVelocity(vec.x, vec.y);
    }
}
