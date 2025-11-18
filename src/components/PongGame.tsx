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
                scene: [StartScene, ConnectingScene, GameScene],
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
                .on('pointerdown', () => this.scene.start('ConnectingScene', { mode }));
        };

        createButton(height / 2, '2 Player (WASD vs Arrows)', '2player');
        createButton(height / 2 + 100, '1 Player (vs AI)', '1player');
        createButton(height / 2 + 200, 'AI vs AI', 'ai_vs_ai');

        // Keyboard shortcuts
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-ONE', () => this.scene.start('ConnectingScene', { mode: '1player' }));
            this.input.keyboard.on('keydown-TWO', () => this.scene.start('ConnectingScene', { mode: '2player' }));
            this.input.keyboard.on('keydown-A', () => this.scene.start('ConnectingScene', { mode: 'ai_vs_ai' }));
        }
    }
}

class ConnectingScene extends Phaser.Scene {
    private mode!: string;

    constructor() {
        super({ key: 'ConnectingScene' });
    }

    init(data: { mode: string }) {
        this.mode = data.mode;
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2, 'Connecting...', {
            fontSize: '60px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5);

        let socketOpen = false;
        let timerDone = false;
        let socket: WebSocket | null = null;

        const checkReady = () => {
            if (timerDone && socketOpen) {
                this.scene.start('GameScene', { mode: this.mode, socket });
            }
        };

        // Start 2s timer
        this.time.delayedCall(2000, () => {
            timerDone = true;
            checkReady();
        });

        // Connect WebSocket
        try {
            socket = new WebSocket('ws://localhost:8000/ws/game');

            socket.onopen = () => {
                console.log('WebSocket connected');
                socketOpen = true;
                checkReady();
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Proceed anyway after timeout if connection fails, or handle error?
                // For now, let's assume we proceed without socket if it fails, or just hang (as per user warning)
                // But to be safe and playable, let's treat error as "open" but null socket effectively
                socketOpen = true;
                socket = null;
                checkReady();
            };
        } catch (e) {
            console.error('WebSocket connection failed immediately:', e);
            socketOpen = true;
            checkReady();
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
    private socket: WebSocket | null = null;
    private isPaused = false;
    private pauseText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { mode: string, socket: WebSocket | null }) {
        this.mode = data.mode;
        this.socket = data.socket;
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
            .on('pointerdown', () => {
                if (this.socket) {
                    this.socket.close();
                }
                this.scene.start('StartScene');
            });

        // Pause UI
        this.pauseText = this.add.text(width / 2, height / 2, 'PAUSED', {
            fontSize: '60px',
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5).setVisible(false);

        // Pause Input
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-Q', () => this.togglePause());
            this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        }
    }

    togglePause() {
        if (this.isPaused) {
            // Unpause
            this.pauseText.setText('Reconnecting...');
            this.reconnectSocket();
        } else {
            // Pause
            this.isPaused = true;
            this.physics.pause();
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            this.pauseText.setText('PAUSED').setVisible(true);
        }
    }

    reconnectSocket() {
        try {
            this.socket = new WebSocket('ws://localhost:8000/ws/game');
            this.socket.onopen = () => {
                console.log('WebSocket reconnected');
                this.isPaused = false;
                this.physics.resume();
                this.pauseText.setVisible(false);
            };
            this.socket.onerror = (e) => {
                console.error("Reconnect failed", e);
                // If reconnect fails, we could either stay paused or let them play offline.
                // For now, let's assume we want to enforce connection or just let them wait.
                // But to avoid locking the game if server is down, let's resume offline after a short delay or error?
                // User said "upon unpausing ... should reconnect". Implicitly, wait for reconnect.
                // I'll leave it hanging on "Reconnecting..." if it fails, as that's safer than desyncing state.
            };
        } catch (e) {
            console.error(e);
        }
    }

    update() {
        if (this.isPaused) return;

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

        this.sendGameState();
    }

    printGameState() {
        const rows = 16; // 800 / 50
        const cols = 24; // 1200 / 50
        const cellSize = 50;

        // Initialize grid with '0'
        const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill('0'));

        // Helper to safely set grid value
        const setGrid = (r: number, c: number, val: string) => {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                grid[r][c] = val;
            }
        };

        // Place Ball
        const ballR = Math.floor(this.ball.y / cellSize);
        const ballC = Math.floor(this.ball.x / cellSize);
        setGrid(ballR, ballC, '.');

        // Place Paddles (height 100 = 2 cells)
        const placePaddle = (paddle: Phaser.Physics.Arcade.Image) => {
            const paddleC = Math.floor(paddle.x / cellSize);
            // Paddle origin is 0.5, so it spans y-50 to y+50
            const topR = Math.floor((paddle.y - 50) / cellSize);
            const bottomR = Math.floor((paddle.y + 49) / cellSize); // +49 to stay within the cell if exactly on boundary

            for (let r = topR; r <= bottomR; r++) {
                setGrid(r, paddleC, '|');
            }
        };

        placePaddle(this.paddleLeft);
        placePaddle(this.paddleRight);

        // Print
        console.log(grid.map(row => row.join(' ')).join('\n'));
    }

    sendGameState() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

        const rows = 16; // 800 / 50
        const cols = 24; // 1200 / 50
        const cellSize = 50;

        // Initialize grid with '0'
        const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill('0'));

        // Helper to safely set grid value
        const setGrid = (r: number, c: number, val: string) => {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                grid[r][c] = val;
            }
        };

        // Place Ball
        const ballR = Math.floor(this.ball.y / cellSize);
        const ballC = Math.floor(this.ball.x / cellSize);
        setGrid(ballR, ballC, '.');

        // Place Paddles (height 100 = 2 cells)
        const placePaddle = (paddle: Phaser.Physics.Arcade.Image) => {
            const paddleC = Math.floor(paddle.x / cellSize);
            // Paddle origin is 0.5, so it spans y-50 to y+50
            const topR = Math.floor((paddle.y - 50) / cellSize);
            const bottomR = Math.floor((paddle.y + 49) / cellSize); // +49 to stay within the cell if exactly on boundary

            for (let r = topR; r <= bottomR; r++) {
                setGrid(r, paddleC, '|');
            }
        };

        placePaddle(this.paddleLeft);
        placePaddle(this.paddleRight);

        // Send via WebSocket
        this.socket.send(grid.map(row => row.join(' ')).join('\n'));
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
