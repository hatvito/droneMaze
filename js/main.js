/**
 * Main.js
 * 應用程式控制器與事件監聽
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mazeCanvas');
  const algoSelect = document.getElementById('algoSelect');
  const mazeTypeSelect = document.getElementById('mazeTypeSelect');
  const speedSlider = document.getElementById('speedSlider');
  const btnRun = document.getElementById('btnRun');
  const btnReset = document.getElementById('btnReset');
  const statusBanner = document.getElementById('status-banner');

  const statVisited = document.getElementById('statVisited');
  const statPathLen = document.getElementById('statPathLen');
  const statTime = document.getElementById('statTime');

  const maze = new Maze(21, 21);
  maze.generateRandom();

  const drone = new Drone(maze.start.x, maze.start.y);
  const visualizer = new Visualizer(canvas, maze, drone);
  visualizer.resize();

  // 演算法映射
  const algorithms = {
    'righthand': MazeAlgorithms.solveRightHand,
    'dfs': MazeAlgorithms.solveDFS,
    'bfs': MazeAlgorithms.solveBFS,
    'astar': MazeAlgorithms.solveAStar
  };

  // 換地圖
  mazeTypeSelect.addEventListener('change', (e) => {
    visualizer.stop();
    const type = e.target.value;
    if (type === 'random') {
      maze.cols = 21;
      maze.rows = 21;
      maze.generateRandom();
    } else {
      maze.loadPreset(type);
    }
    visualizer.resize();
    resetStats();
    statusBanner.textContent = "地圖已更新，請點擊「起飛執行」";
  });

  // 調整速度
  speedSlider.addEventListener('input', (e) => {
    // 逆向映射：數值愈大愈快，延遲愈低
    visualizer.speed = 105 - parseInt(e.target.value);
  });

  function resetStats() {
    statVisited.textContent = '0';
    statPathLen.textContent = '0';
    statTime.textContent = '0 ms';
  }

  // 執行演算法
  btnRun.addEventListener('click', () => {
    visualizer.stop();
    visualizer.resetOverlay();
    resetStats();

    const algoKey = algoSelect.value;
    const algoFunc = algorithms[algoKey];

    if (!algoFunc) {
      alert("尚未實作此演算法！");
      return;
    }

    btnRun.disabled = true;
    mazeTypeSelect.disabled = true;
    algoSelect.disabled = true;
    statusBanner.textContent = "無人機自主導航計算中與路徑巡航...";

    const tStart = performance.now();
    const result = algoFunc(maze, maze.start, maze.end);
    const tEnd = performance.now();
    const duration = (tEnd - tStart).toFixed(2);
    statTime.textContent = `${duration} ms`;

    if (!result.success) {
      statusBanner.textContent = "⚠️ 該演算法未能成功抵達終點 (受困或步數超限)";
    }

    visualizer.play(
      result,
      (progress) => {
        statVisited.textContent = progress.visitedCount;
        if (progress.pathCount > 0) {
          statPathLen.textContent = progress.pathCount;
        }
      },
      () => {
        btnRun.disabled = false;
        mazeTypeSelect.disabled = false;
        algoSelect.disabled = false;
        if (result.success) {
          statusBanner.textContent = `🎉 成功抵達終點！有效路徑長度: ${result.solutionPath.length} 步`;
          statPathLen.textContent = result.solutionPath.length;
        }
      }
    );
  });

  // 重設
  btnReset.addEventListener('click', () => {
    visualizer.stop();
    visualizer.resetOverlay();
    resetStats();
    btnRun.disabled = false;
    mazeTypeSelect.disabled = false;
    algoSelect.disabled = false;
    statusBanner.textContent = "系統就緒，請選擇演算法後起飛";
  });
});
