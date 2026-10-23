/**
 * Benchmark.js
 * 多演算法同場競技引擎，負責沙盒隔離執行與成績排行榜排序
 */

import { DroneSimulator } from './droneSimulator.js';
import { ALGORITHM_TEMPLATES } from './templates.js';

export class BenchmarkEngine {
  constructor() {}

  static run(mazeData, gameMode, customUserCode) {
    const algos = [
      { name: '特雷莫演算法 (Trémaux)', code: ALGORITHM_TEMPLATES.tremaux },
      { name: '增量 DFS 記憶探索', code: ALGORITHM_TEMPLATES.incrementalDfs },
      { name: '沿牆搜尋法 (Right-Hand)', code: ALGORITHM_TEMPLATES.rightHand },
      { name: '★ 當前編輯器自訂策略', code: customUserCode }
    ];

    const results = [];

    algos.forEach(item => {
      // 建立獨立的虛擬測試機體
      const sim = new DroneSimulator('drone-canvas');
      sim.init(mazeData, gameMode);

      const t0 = performance.now();
      const maxSteps = 1500;
      let steps = 0;

      try {
        const fn = new Function(
          `${item.code}\n return { nextAction: typeof nextAction !== 'undefined' ? nextAction : null, planPath: typeof planPath !== 'undefined' ? planPath : null };`
        )();

        if (fn.planPath && gameMode === 'known') {
          const path = fn.planPath(mazeData.grid, mazeData.start, mazeData.goal);
          const t1 = performance.now();
          results.push({
            name: item.name,
            time: t1 - t0,
            steps: path.length,
            discovery: 100,
            success: path.length > 0
          });
        } else if (fn.nextAction) {
          while (!sim.isGoalReached() && steps < maxSteps) {
            const act = fn.nextAction(sim);
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
        }
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

    // 依成就進行天梯排名：成功抵達 > 步數最少 > 耗時最短
    results.sort((a, b) => {
      if (a.success !== b.success) return b.success - a.success;
      if (a.steps !== b.steps) return a.steps - b.steps;
      return a.time - b.time;
    });

    return results;
  }
}
