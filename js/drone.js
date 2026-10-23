/**
 * Drone.js
 * 虛擬無人機模型繪製與姿態運算
 */

class Drone {
  constructor(x = 1, y = 1) {
    this.x = x;
    this.y = y;
    this.angle = 0; // 航向角 (弧度, 0 為向右/東)
    this.propellerAngle = 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setHeading(angle) {
    this.angle = angle;
  }

  // 繪製頂視角無人機 (四軸飛行器圖形)
  render(ctx, cellSize) {
    const cx = (this.x + 0.5) * cellSize;
    const cy = (this.y + 0.5) * cellSize;
    const radius = cellSize * 0.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);

    // 1. 機臂 (X 形結構)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(2, cellSize * 0.1);
    ctx.beginPath();
    ctx.moveTo(-radius, -radius);
    ctx.lineTo(radius, radius);
    ctx.moveTo(-radius, radius);
    ctx.lineTo(radius, -radius);
    ctx.stroke();

    // 2. 四個旋翼馬達與旋轉葉片
    this.propellerAngle += 0.4;
    const motorOffsets = [
      { x: -radius, y: -radius },
      { x: radius, y: -radius },
      { x: -radius, y: radius },
      { x: radius, y: radius }
    ];

    motorOffsets.forEach((pos, idx) => {
      // 馬達座
      ctx.fillStyle = idx < 2 ? '#38bdf8' : '#94a3b8'; // 前端馬達以藍色標識
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // 旋轉動態葉片 (虛擬光環)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 3. 中心機身主板
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.4, -radius * 0.4, radius * 0.8, radius * 0.8, 4);
    ctx.fill();
    ctx.stroke();

    // 4. 前向方向指示燈 (LED 箭頭)
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
