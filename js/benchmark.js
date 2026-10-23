/**
 * Benchmark.js
 * 迷宮大賽排行榜評測引擎
 */

import { DroneSimulator } from './simulator.js';
import { ALGORITHM_TEMPLATES } from './templates.js';

export class BenchmarkEngine {
  static run(maze, customCode) {
    const strategies = [
      { name: '特雷莫演算法 (Trémaux)', code: ALGORITHM_TEMPLATES.tremaux },
      { name: '增量 DFS 記憶探索', code: ALGORITHM_TEMPLATES.incrementalDfs },
      { name: '沿牆搜尋法 (Right-Hand)', code: ALGORITHM_TEMPLATES.rightHand },
      { name: '★ 自訂編輯器策略', code: customCode }
    ];

    const results = [];

    strategies.forEach(item => {
      const sim = new DroneSimulator('compCanvas');
      sim.init(maze);

      const t0 = performance.now();
      let steps = 0;
      const maxSteps = 1500;

      try {
        const fn = new Function(item.code + '\n return nextAction;')();
        while (!sim.isGoalReached() && steps < maxSteps) {
          const act = fn(sim);
          if (act === 'FORWARD') sim.moveForward();
          else if (act === 'LEFT') { sim.turnLeft(); sim.moveForward(); }
          else if (act === 'RIGHT') { sim.turnRight(); sim.moveForward(); }
          else if (act === 'U_TURN') { sim.uTurn(); sim.moveForward(); }
          steps++;
        }
        const t1 = performance.now();
        results.push({
          name: item.name,
          time: t1 - t0,
          steps: sim.steps,
          discovery: sim.getDiscoveryRate(),
          success: sim.isGoalReached()
        });
      } catch (e) {
        results.push({
          name: item.name,
          time: 0,
          steps: 0,
          discovery: 0,
          success: false,
          error: e.message
        });
      }
    });

    results.sort((a, b) => {
      if (a.success !== b.success) return b.success - a.success;
      if (a.steps !== b.steps) return a.steps - b.steps;
      return a.time - b.time;
    });

    return results;
  }
}
