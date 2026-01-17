// Windmill Renderer for Golf Game
// Draws animated windmills with rotating blades

import { WindmillSize, WINDMILL_SIZES, Position } from '../golfTypes';

export interface WindmillState {
    position: Position;
    size: WindmillSize;
    rotation: number; // Current rotation in radians
    rotationSpeed: number; // Radians per frame
}

// Create a new windmill state
export function createWindmillState(
    position: Position,
    size: WindmillSize,
    initialRotation: number = 0
): WindmillState {
    return {
        position,
        size,
        rotation: initialRotation,
        rotationSpeed: 0.02, // ~1.15 degrees per frame at 60fps
    };
}

// Update windmill rotation (call each frame)
export function updateWindmill(windmill: WindmillState, deltaTime: number = 16.67): void {
    windmill.rotation += windmill.rotationSpeed * (deltaTime / 16.67);
    if (windmill.rotation > Math.PI * 2) {
        windmill.rotation -= Math.PI * 2;
    }
}

// Draw windmill on canvas
export function drawWindmill(
    ctx: CanvasRenderingContext2D,
    windmill: WindmillState,
    isPreview: boolean = false
): void {
    const { position, size, rotation } = windmill;
    const sizeConfig = WINDMILL_SIZES[size];
    const { radius, bladeLength } = sizeConfig;

    ctx.save();

    // Draw base/pole
    const poleWidth = radius * 0.3;
    const poleHeight = radius * 1.5;

    // Pole shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(
        position.x - poleWidth / 2 + 3,
        position.y + 3,
        poleWidth,
        poleHeight
    );

    // Pole
    const poleGradient = ctx.createLinearGradient(
        position.x - poleWidth / 2,
        position.y,
        position.x + poleWidth / 2,
        position.y
    );
    poleGradient.addColorStop(0, '#4a4a4a');
    poleGradient.addColorStop(0.5, '#6a6a6a');
    poleGradient.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = poleGradient;
    ctx.fillRect(
        position.x - poleWidth / 2,
        position.y,
        poleWidth,
        poleHeight
    );

    // Draw center hub
    const hubGradient = ctx.createRadialGradient(
        position.x - radius * 0.1,
        position.y - radius * 0.1,
        0,
        position.x,
        position.y,
        radius * 0.4
    );
    hubGradient.addColorStop(0, '#888');
    hubGradient.addColorStop(1, '#444');

    ctx.fillStyle = hubGradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Draw bolt in center
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw 4 blades
    for (let i = 0; i < 4; i++) {
        const bladeRotation = rotation + (i * Math.PI / 2);
        drawBlade(ctx, position, bladeLength, bladeRotation, isPreview);
    }

    ctx.restore();
}

// Draw a single windmill blade
function drawBlade(
    ctx: CanvasRenderingContext2D,
    center: Position,
    length: number,
    rotation: number,
    isPreview: boolean
): void {
    const bladeWidth = length * 0.18;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(rotation);

    // Blade shape - tapered rectangle
    ctx.beginPath();
    ctx.moveTo(0, -bladeWidth * 0.3);
    ctx.lineTo(length, -bladeWidth * 0.15);
    ctx.lineTo(length, bladeWidth * 0.15);
    ctx.lineTo(0, bladeWidth * 0.3);
    ctx.closePath();

    // Blade gradient
    const bladeGradient = ctx.createLinearGradient(0, -bladeWidth, 0, bladeWidth);
    bladeGradient.addColorStop(0, '#f0f0f0');
    bladeGradient.addColorStop(0.3, '#ffffff');
    bladeGradient.addColorStop(0.7, '#e0e0e0');
    bladeGradient.addColorStop(1, '#c0c0c0');

    ctx.fillStyle = isPreview ? 'rgba(255, 255, 255, 0.5)' : bladeGradient;
    ctx.fill();

    // Blade outline
    ctx.strokeStyle = isPreview ? 'rgba(100, 100, 100, 0.5)' : '#888';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red tip
    const tipLength = length * 0.15;
    ctx.beginPath();
    ctx.moveTo(length - tipLength, -bladeWidth * 0.15);
    ctx.lineTo(length, -bladeWidth * 0.15);
    ctx.lineTo(length, bladeWidth * 0.15);
    ctx.lineTo(length - tipLength, bladeWidth * 0.15);
    ctx.closePath();

    const tipGradient = ctx.createLinearGradient(0, -bladeWidth, 0, bladeWidth);
    tipGradient.addColorStop(0, '#cc3333');
    tipGradient.addColorStop(0.5, '#ff4444');
    tipGradient.addColorStop(1, '#aa2222');

    ctx.fillStyle = isPreview ? 'rgba(200, 50, 50, 0.5)' : tipGradient;
    ctx.fill();

    ctx.restore();
}

// Get blade collision points for physics
export function getBladeCollisionPoints(
    windmill: WindmillState,
    numPoints: number = 8
): Position[] {
    const points: Position[] = [];
    const { position, size, rotation } = windmill;
    const bladeLength = WINDMILL_SIZES[size].bladeLength;

    for (let blade = 0; blade < 4; blade++) {
        const bladeRotation = rotation + (blade * Math.PI / 2);

        for (let i = 1; i <= numPoints / 4; i++) {
            const distance = (bladeLength * i) / (numPoints / 4);
            points.push({
                x: position.x + Math.cos(bladeRotation) * distance,
                y: position.y + Math.sin(bladeRotation) * distance,
            });
        }
    }

    return points;
}

// Check if a point is colliding with any blade
export function checkBladeCollision(
    windmill: WindmillState,
    point: Position,
    pointRadius: number = 10
): { colliding: boolean; bladeAngle: number; distance: number } {
    const { position, size, rotation } = windmill;
    const bladeLength = WINDMILL_SIZES[size].bladeLength;
    const bladeWidth = bladeLength * 0.18;

    // Check distance from center first
    const dx = point.x - position.x;
    const dy = point.y - position.y;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);

    // Too far from windmill
    if (distFromCenter > bladeLength + pointRadius) {
        return { colliding: false, bladeAngle: 0, distance: distFromCenter };
    }

    // Too close to center hub
    const hubRadius = WINDMILL_SIZES[size].radius * 0.35;
    if (distFromCenter < hubRadius + pointRadius) {
        return { colliding: true, bladeAngle: rotation, distance: distFromCenter };
    }

    // Check each blade
    const pointAngle = Math.atan2(dy, dx);

    for (let blade = 0; blade < 4; blade++) {
        const bladeAngle = rotation + (blade * Math.PI / 2);
        let angleDiff = pointAngle - bladeAngle;

        // Normalize angle difference
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Check if within blade angle range
        const maxAngleWidth = Math.atan2(bladeWidth / 2 + pointRadius, distFromCenter);

        if (Math.abs(angleDiff) < maxAngleWidth && distFromCenter < bladeLength + pointRadius) {
            return { colliding: true, bladeAngle, distance: distFromCenter };
        }
    }

    return { colliding: false, bladeAngle: 0, distance: distFromCenter };
}
