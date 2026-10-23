/**
 * Drone.js
 * 四軸無人機模型繪製與旋翼動畫
 */

export class Drone {
  constructor(x = 1, y = 1) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.propellerAngle = 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setHeading(angle) {
    this.angle = angle;
  }

  render(ctx, cellSize) {
    const cx = (this.x + 0.5) * cellSize;
    const cy = (this.y + 0.5) * cellSize;
    const radius = cellSize * 0.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(2, cellSize * 0.1);
    ctx.beginPath();
    ctx.moveTo(-radius, -radius);
    ctx.lineTo(radius, radius);
    ctx.moveTo(-radius, radius);
    ctx.lineTo(radius, -radius);
    ctx.stroke();

    this.propellerAngle += 0.4;
    const motors = [
      { x: -radius, y: -radius },
      { x: radius, y: -radius },
      { x: -radius, y: radius },
      { x: radius, y: radius }
    ];

    motors.forEach((pos, idx) => {
      ctx.fillStyle = idx < 2 ? '#38bdf8' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.4, -radius * 0.4, radius * 0.8, radius * 0.8, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(radius * 0.35, 0);
    ctx.lineTo(-radius * 0.1, -radius * 0.2);
    ctx.lineTo(-radius * 0.1, radius * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
