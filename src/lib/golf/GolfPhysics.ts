// Golf Physics Engine
// Handles ball physics with terrain-specific behaviors

import Matter from 'matter-js';
import {
    TerrainType,
    TERRAIN_PHYSICS,
    BALL_RADIUS,
    HOLE_RADIUS,
    Position,
    LevelData,
    GRID_SIZE,
    WINDMILL_SIZES,
    WindmillSize,
} from '../golfTypes';
import { WindmillState, updateWindmill, checkBladeCollision } from './WindmillRenderer';

export interface GolfPhysicsEngine {
    engine: Matter.Engine;
    ball: Matter.Body;
    walls: Matter.Body[];
    hole: Matter.Body | null;
    windmills: WindmillState[];
    terrainGrid: TerrainType[][];
}

// Create the physics engine with a ball
export function createGolfPhysics(level: LevelData): GolfPhysicsEngine {
    const engine = Matter.Engine.create({
        gravity: { x: 0, y: 0 }, // Top-down golf
    });

    // Find ball start position
    let ballStart: Position = { x: 100, y: 100 };
    const holePositions: Position[] = [];
    const windmillConfigs: { position: Position; size: WindmillSize }[] = [];

    for (const obj of level.objects) {
        if (obj.type === 'ball_start') {
            ballStart = obj.position;
        } else if (obj.type === 'hole') {
            holePositions.push(obj.position);
        } else if (obj.type === 'windmill') {
            windmillConfigs.push({
                position: obj.position,
                size: obj.size || 'medium',
            });
        }
    }

    // Create ball
    const ball = Matter.Bodies.circle(ballStart.x, ballStart.y, BALL_RADIUS, {
        restitution: 0.5,
        friction: 0.05,
        frictionAir: 0.01,
        density: 0.001,
        label: 'ball',
    });

    Matter.Composite.add(engine.world, ball);

    // Create boundary walls
    const walls = createWalls(level.width, level.height, engine);

    // Create hole sensor
    let holeSensor: Matter.Body | null = null;
    if (holePositions.length > 0) {
        holeSensor = Matter.Bodies.circle(
            holePositions[0].x,
            holePositions[0].y,
            HOLE_RADIUS,
            {
                isStatic: true,
                isSensor: true,
                label: 'hole',
            }
        );
        Matter.Composite.add(engine.world, holeSensor);
    }

    // Create windmill states
    const windmills: WindmillState[] = windmillConfigs.map((config) => ({
        position: config.position,
        size: config.size,
        rotation: 0,
        rotationSpeed: 0.02,
    }));

    // Create wood barriers from terrain
    createTerrainBodies(level, engine);

    return {
        engine,
        ball,
        walls,
        hole: holeSensor,
        windmills,
        terrainGrid: level.terrain,
    };
}

// Create boundary walls
function createWalls(width: number, height: number, engine: Matter.Engine): Matter.Body[] {
    const wallThickness = 20;

    const walls = [
        // Top
        Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width + wallThickness * 2, wallThickness, { isStatic: true }),
        // Bottom
        Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width + wallThickness * 2, wallThickness, { isStatic: true }),
        // Left
        Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, { isStatic: true }),
        // Right
        Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, { isStatic: true }),
    ];

    walls.forEach(wall => {
        wall.restitution = 0.4;
        wall.friction = 0.5;
    });

    Matter.Composite.add(engine.world, walls);

    return walls;
}

// Create static bodies for wood terrain
function createTerrainBodies(level: LevelData, engine: Matter.Engine): void {
    const { terrain, gridSize } = level;

    for (let row = 0; row < terrain.length; row++) {
        for (let col = 0; col < terrain[row].length; col++) {
            if (terrain[row][col] === TerrainType.WOOD) {
                const body = Matter.Bodies.rectangle(
                    col * gridSize + gridSize / 2,
                    row * gridSize + gridSize / 2,
                    gridSize,
                    gridSize,
                    {
                        isStatic: true,
                        restitution: 0.4,
                        friction: 0.5,
                        label: 'wood',
                    }
                );
                Matter.Composite.add(engine.world, body);
            }
        }
    }
}

// Get the terrain type at a position
function getTerrainAt(
    x: number,
    y: number,
    terrainGrid: TerrainType[][],
    gridSize: number = GRID_SIZE
): TerrainType {
    const col = Math.floor(x / gridSize);
    const row = Math.floor(y / gridSize);

    if (row < 0 || row >= terrainGrid.length || col < 0 || col >= terrainGrid[0].length) {
        return TerrainType.EMPTY;
    }

    return terrainGrid[row][col];
}

// Update physics step
export function updateGolfPhysics(
    physics: GolfPhysicsEngine,
    deltaTime: number = 16.67
): { isInHole: boolean; velocity: number } {
    const { engine, ball, windmills, terrainGrid } = physics;

    // Update windmills
    for (const windmill of windmills) {
        updateWindmill(windmill, deltaTime);
    }

    // Get current terrain under ball
    const terrain = getTerrainAt(ball.position.x, ball.position.y, terrainGrid);
    const terrainPhysics = TERRAIN_PHYSICS[terrain];

    // Apply terrain-specific friction
    applyTerrainEffects(ball, terrain, terrainPhysics);

    // Check windmill collisions
    for (const windmill of windmills) {
        const collision = checkBladeCollision(
            windmill,
            { x: ball.position.x, y: ball.position.y },
            BALL_RADIUS
        );

        if (collision.colliding) {
            // Apply force from windmill blade
            const bladeDir = collision.bladeAngle;
            const speed = windmill.rotationSpeed * collision.distance;
            const force = {
                x: Math.cos(bladeDir + Math.PI / 2) * speed * 0.01,
                y: Math.sin(bladeDir + Math.PI / 2) * speed * 0.01,
            };
            Matter.Body.applyForce(ball, ball.position, force);
        }
    }

    // Update physics engine
    Matter.Engine.update(engine, deltaTime);

    // Check if ball is in hole
    const isInHole = checkHoleCollision(physics);

    // Get current velocity
    const velocity = Math.sqrt(
        ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y
    );

    return { isInHole, velocity };
}

// Apply terrain-specific effects to ball
function applyTerrainEffects(
    ball: Matter.Body,
    terrain: TerrainType,
    physics: { friction: number; restitution: number; airFriction: number }
): void {
    // Update ball physics properties based on terrain
    ball.friction = physics.friction;
    ball.frictionAir = physics.airFriction;
    ball.restitution = physics.restitution;

    // Special behaviors
    switch (terrain) {
        case TerrainType.SAND:
            // Sand rapidly slows down the ball
            const sandDamping = 0.95;
            Matter.Body.setVelocity(ball, {
                x: ball.velocity.x * sandDamping,
                y: ball.velocity.y * sandDamping,
            });
            break;

        case TerrainType.ICE:
            // Ice has almost no friction - ball keeps sliding
            // Already handled by low friction value
            break;

        case TerrainType.RUBBER:
            // Rubber adds a small amount of energy on each contact
            // This is handled by high restitution > 1
            break;
    }
}

// Check if ball is in the hole
function checkHoleCollision(physics: GolfPhysicsEngine): boolean {
    const { ball, hole } = physics;

    if (!hole) return false;

    const dx = ball.position.x - hole.position.x;
    const dy = ball.position.y - hole.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Ball must be moving slowly enough to fall into hole
    const velocity = Math.sqrt(
        ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y
    );

    return distance < HOLE_RADIUS - BALL_RADIUS / 2 && velocity < 2;
}

// Shoot the ball with given power and direction
export function shootBall(
    physics: GolfPhysicsEngine,
    power: number,
    angle: number
): void {
    const { ball } = physics;

    const velocity = {
        x: Math.cos(angle) * power,
        y: Math.sin(angle) * power,
    };

    Matter.Body.setVelocity(ball, velocity);
}

// Reset ball to starting position
export function resetBall(
    physics: GolfPhysicsEngine,
    position: Position
): void {
    const { ball } = physics;

    Matter.Body.setPosition(ball, position);
    Matter.Body.setVelocity(ball, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(ball, 0);
}

// Check if ball is stationary
export function isBallStationary(physics: GolfPhysicsEngine, threshold: number = 0.1): boolean {
    const { ball } = physics;

    const velocity = Math.sqrt(
        ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y
    );

    return velocity < threshold;
}

// Clean up physics engine
export function destroyGolfPhysics(physics: GolfPhysicsEngine): void {
    Matter.World.clear(physics.engine.world, false);
    Matter.Engine.clear(physics.engine);
}
