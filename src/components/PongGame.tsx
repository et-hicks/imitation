'use client';

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

const DEBUG_MODE = true;
type AllowedDirection = 'up' | 'down' | 'neutral';
type CommandPayload = {
    type: 'paddle_commands';
    green: AllowedDirection;
    purple: AllowedDirection;
};
const ALLOWED_DIRECTIONS = new Set<AllowedDirection>(['up', 'down', 'neutral']);

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
                    target: 15,
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
    private pauseOptionsText!: Phaser.GameObjects.Text;
    private lastScoreEvent: 'no_score' | 'purple_scored' | 'green_scored' = 'no_score';
    private ballTouchedBy: 'green' | 'purple' | null = null;
    private aiPaddleCommands: { left: -1 | 0 | 1; right: -1 | 0 | 1 } = { left: 0, right: 0 };

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { mode: string, socket: WebSocket | null }) {
        this.mode = data.mode;
        this.socket = data.socket;
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.lastScoreEvent = 'no_score';
        this.ballTouchedBy = null;
        this.aiPaddleCommands = { left: 0, right: 0 };
        this.registerSocketMessageHandler();
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
        this.pauseOptionsText = this.add.text(width / 2, height / 2 + 120, '1 - Resume\n2 - Exit to Menu', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            align: 'center',
        }).setOrigin(0.5).setVisible(false);

        // Pause Input
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-Q', () => this.togglePause());
            this.input.keyboard.on('keydown-ESC', () => this.togglePause());
            this.input.keyboard.on('keydown-ONE', () => this.handlePauseSelection(1));
            this.input.keyboard.on('keydown-NUMPAD_ONE', () => this.handlePauseSelection(1));
            this.input.keyboard.on('keydown-TWO', () => this.handlePauseSelection(2));
            this.input.keyboard.on('keydown-NUMPAD_TWO', () => this.handlePauseSelection(2));
        }
    }

    togglePause() {
        if (this.isPaused) return;

        this.isPaused = true;
        this.physics.pause();
        this.pauseText.setText('PAUSED').setVisible(true);
        this.pauseOptionsText.setVisible(true);
    }

    reconnectSocket() {
        try {
            this.socket = new WebSocket('ws://localhost:8000/ws/game');
            this.registerSocketMessageHandler();
            this.socket.onopen = () => {
                console.log('WebSocket reconnected');
                this.isPaused = false;
                this.physics.resume();
                this.pauseText.setVisible(false);
                this.pauseOptionsText.setVisible(false);
            };
            this.socket.onerror = (e) => {
                console.error("Reconnect failed", e);
                this.pauseText.setText('Reconnect failed. Press 1 to retry or 2 to exit.').setVisible(true);
                this.pauseOptionsText.setVisible(true);
            };
        } catch (e) {
            console.error(e);
        }
    }

    private handlePauseSelection(option: 1 | 2) {
        if (!this.isPaused || !this.pauseOptionsText.visible) return;

        if (option === 1) {
            this.resumeGameFromPause();
        } else {
            this.exitToMenuFromPause();
        }
    }

    private resumeGameFromPause() {
        this.pauseOptionsText.setVisible(false);
        this.pauseText.setText('Reconnecting...').setVisible(true);

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.reconnectSocket();
    }

    private exitToMenuFromPause() {
        this.pauseOptionsText.setVisible(false);
        this.pauseText.setVisible(false);

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.isPaused = false;
        this.physics.resume();
        this.scene.start('StartScene');
    }

    private registerSocketMessageHandler() {
        if (!this.socket) return;

        this.socket.onmessage = (event) => {
            if (this.mode !== 'ai_vs_ai' || typeof event.data !== 'string') {
                return;
            }

            try {
                const parsed = JSON.parse(event.data);
                if (!this.isValidCommandPayload(parsed)) {
                    return;
                }

                this.aiPaddleCommands = {
                    left: this.directionToCommand(parsed.green),
                    right: this.directionToCommand(parsed.purple),
                };
            } catch (error) {
                console.error('Failed to parse AI control payload', error);
            }
        };
    }

    private isValidCommandPayload(data: unknown): data is CommandPayload {
        if (!data || typeof data !== 'object') return false;

        const payload = data as Partial<CommandPayload>;
        return payload.type === 'paddle_commands'
            && this.isAllowedDirection(payload.green)
            && this.isAllowedDirection(payload.purple);
    }

    private isAllowedDirection(value: unknown): value is AllowedDirection {
        if (typeof value !== 'string') return false;
        return ALLOWED_DIRECTIONS.has(value.toLowerCase() as AllowedDirection);
    }

    private directionToCommand(direction: AllowedDirection): -1 | 0 | 1 {
        const normalized = direction.toLowerCase() as AllowedDirection;
        switch (normalized) {
            case 'up':
                return -1;
            case 'down':
                return 1;
            case 'neutral':
            default:
                return 0;
        }
    }

    update() {
        if (this.isPaused) return;

        // Left Paddle Control
        if (this.mode === 'ai_vs_ai') {
            this.applyServerCommand(this.paddleLeft, this.aiPaddleCommands.left);
        } else if (this.mode === '2player' || this.mode === '1player') {
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
        if (this.mode === 'ai_vs_ai') {
            this.applyServerCommand(this.paddleRight, this.aiPaddleCommands.right);
        } else if (this.mode === '2player') {
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
            if (this.hasBallBeenTouched()) {
                this.scoreRight++;
                this.scoreRightText.setText(this.scoreRight.toString());
                this.lastScoreEvent = 'purple_scored';
            }
            this.resetBall();
        } else if (this.ball.x > this.scale.width) {
            if (this.hasBallBeenTouched()) {
                this.scoreLeft++;
                this.scoreLeftText.setText(this.scoreLeft.toString());
                this.lastScoreEvent = 'green_scored';
            }
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

        // Send via WebSocket with score and scored status metadata
        const payload = {
            matrix: grid,
            score: {
                green: this.scoreLeft,
                purple: this.scoreRight,
            },
            scored: this.lastScoreEvent,
            debug: DEBUG_MODE,
        };

        this.socket.send(JSON.stringify(payload));
        this.lastScoreEvent = 'no_score';
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
            this.ballTouchedBy = 'green';
        } else if (paddle === this.paddleRight) {
            ball.setTint(0x800080); // Purple
            this.ballTouchedBy = 'purple';
        }

        // Maintain constant speed
        const currentVel = (ball.body as Phaser.Physics.Arcade.Body).velocity;
        const vec = new Phaser.Math.Vector2(currentVel.x, currentVel.y).normalize().scale(this.initialBallSpeed);
        ball.setVelocity(vec.x, vec.y);
    }

    private applyServerCommand(paddle: Phaser.Physics.Arcade.Image, command: -1 | 0 | 1) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.aiControl(paddle);
            return;
        }

        if (command === -1) {
            paddle.setVelocityY(-this.paddleSpeed);
        } else if (command === 1) {
            paddle.setVelocityY(this.paddleSpeed);
        } else {
            paddle.setVelocityY(0);
        }
    }

    private hasBallBeenTouched(): boolean {
        return this.ballTouchedBy === 'green' || this.ballTouchedBy === 'purple';
    }

    resetBall() {
        this.ball.clearTint(); // Reset color
        this.ballTouchedBy = null;
        this.ball.setPosition(this.scale.width / 2, this.scale.height / 2);
        const angle = Phaser.Math.Between(-45, 45);
        const direction = Math.random() < 0.5 ? 1 : -1;
        const vec = this.physics.velocityFromAngle(angle, this.initialBallSpeed * direction);
        this.ball.setVelocity(vec.x, vec.y);
    }
}
