/**
 * Algorithms.js
 * 【學生核心實作檔案】
 * 
 * 每一套演算法的職責：接收 maze、start、end 參數，
 * 回傳以下物件格式：
 * {
 *   visitedOrder: [{x, y}, ...], // 演算法走訪/探索過的格子順序 (用於動畫呈現搜尋過程)
 *   solutionPath: [{x, y}, ...], // 最終成功脫離迷宮的最優/解題路徑
 *   success: true/false
 * }
 */

const MazeAlgorithms = {

  // ==========================================
  // 1. 右手法則 (Wall Follower / Right-Hand Rule)
  // 概念：局部決策。優先往右手邊走，其次直走，再其次左轉，最後迴轉。
  // ==========================================
  solveRightHand: function(maze, start, end) {
    const visitedOrder = [];
    const solutionPath = [];

    // 方向向量：0: 東(Right), 1: 南(Down), 2: 西(Left), 3: 北(Up)
    const dirs = [
      { dx: 1, dy: 0 },  // 0: 東
      { dx: 0, dy: 1 },  // 1: 南
      { dx: -1, dy: 0 }, // 2: 西
      { dx: 0, dy: -1 }  // 3: 北
    ];

    let cx = start.x;
    let cy = start.y;
    let currentDir = 0; // 起始預設朝東
    const maxSteps = maze.cols * maze.rows * 4; // 防止環狀死循環步數限制
    let stepCount = 0;

    solutionPath.push({ x: cx, y: cy });

    while ((cx !== end.x || cy !== end.y) && stepCount < maxSteps) {
      stepCount++;
      visitedOrder.push({ x: cx, y: cy });

      // 右手法則優先權：右邊 (dir + 1) -> 前方 (dir) -> 左邊 (dir + 3) -> 後方 (dir + 2)
      let moved = false;
      const turnOrder = [1, 0, 3, 2];

      for (const turn of turnOrder) {
        const nextDir = (currentDir + turn) % 4;
        const nx = cx + dirs[nextDir].dx;
        const ny = cy + dirs[nextDir].dy;

        if (maze.isWalkable(nx, ny)) {
          cx = nx;
          cy = ny;
          currentDir = nextDir;
          solutionPath.push({ x: cx, y: cy });
          moved = true;
          break;
        }
      }

      if (!moved) break; // 無路可走
    }

    const success = (cx === end.x && cy === end.y);
    return { visitedOrder, solutionPath, success };
  },

  // ==========================================
  // 2. 深度優先搜尋 (DFS - Depth First Search)
  // 概念：運用 Stack 或遞迴，一路走到底，碰壁回溯。
  // ==========================================
  solveDFS: function(maze, start, end) {
    const visitedOrder = [];
    const solutionPath = [];
    const visited = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(false));

    const dirs = [
      { dx: 0, dy: -1 }, // 上
      { dx: 1, dy: 0 },  // 右
      { dx: 0, dy: 1 },  // 下
      { dx: -1, dy: 0 }  // 左
    ];

    function dfs(x, y) {
      visited[y][x] = true;
      visitedOrder.push({ x, y });
      solutionPath.push({ x, y });

      if (x === end.x && y === end.y) {
        return true;
      }

      for (const d of dirs) {
        const nx = x + d.dx;
        const ny = y + d.dy;

        if (maze.isWalkable(nx, ny) && !visited[ny][nx]) {
          if (dfs(nx, ny)) return true;
        }
      }

      // 回溯 (Backtrack)：此路不通，從路徑中彈出
      solutionPath.pop();
      return false;
    }

    const success = dfs(start.x, start.y);
    return { visitedOrder, solutionPath, success };
  },

  // ==========================================
  // 3. 廣度優先搜尋 (BFS - Breadth First Search)
  // 概念：運用 Queue 逐層擴散，保證找到「步數最少」的最短路徑。
  // ==========================================
  solveBFS: function(maze, start, end) {
    const visitedOrder = [];
    const queue = [];
    const visited = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(false));
    
    // 記錄父節點以回溯最優路徑 parentGrid[y][x] = {x, y}
    const parentGrid = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(null));

    queue.push({ x: start.x, y: start.y });
    visited[start.y][start.x] = true;

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    let found = false;

    while (queue.length > 0) {
      const current = queue.shift();
      visitedOrder.push({ x: current.x, y: current.y });

      if (current.x === end.x && current.y === end.y) {
        found = true;
        break;
      }

      for (const d of dirs) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;

        if (maze.isWalkable(nx, ny) && !visited[ny][nx]) {
          visited[ny][nx] = true;
          parentGrid[ny][nx] = { x: current.x, y: current.y };
          queue.push({ x: nx, y: ny });
        }
      }
    }

    // 回溯重建最優解路徑
    const solutionPath = [];
    if (found) {
      let curr = { x: end.x, y: end.y };
      while (curr) {
        solutionPath.unshift(curr);
        curr = parentGrid[curr.y][curr.x];
      }
    }

    return { visitedOrder, solutionPath, success: found };
  },

  // ==========================================
  // 4. A* 啟發式搜尋 (A-Star Algorithm)
  // 概念：f(n) = g(n) + h(n)，透過曼哈頓距離啟發無人機朝終點探索。
  // ==========================================
  solveAStar: function(maze, start, end) {
    const visitedOrder = [];
    const openSet = [];
    const closedSet = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(false));

    const gScore = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(Infinity));
    const fScore = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(Infinity));
    const parentGrid = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(null));

    // 啟發式函數：曼哈頓距離 (Manhattan Distance)
    const heuristic = (x, y) => Math.abs(x - end.x) + Math.abs(y - end.y);

    gScore[start.y][start.x] = 0;
    fScore[start.y][start.x] = heuristic(start.x, start.y);
    openSet.push({ x: start.x, y: start.y, f: fScore[start.y][start.x] });

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    let found = false;

    while (openSet.length > 0) {
      // 選取 fScore 最小的節點
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      if (closedSet[current.y][current.x]) continue;
      closedSet[current.y][current.x] = true;
      visitedOrder.push({ x: current.x, y: current.y });

      if (current.x === end.x && current.y === end.y) {
        found = true;
        break;
      }

      for (const d of dirs) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;

        if (maze.isWalkable(nx, ny) && !closedSet[ny][nx]) {
          const tentativeG = gScore[current.y][current.x] + 1;
          if (tentativeG < gScore[ny][nx]) {
            parentGrid[ny][nx] = { x: current.x, y: current.y };
            gScore[ny][nx] = tentativeG;
            fScore[ny][nx] = tentativeG + heuristic(nx, ny);
            openSet.push({ x: nx, y: ny, f: fScore[ny][nx] });
          }
        }
      }
    }

    const solutionPath = [];
    if (found) {
      let curr = { x: end.x, y: end.y };
      while (curr) {
        solutionPath.unshift(curr);
        curr = parentGrid[curr.y][curr.x];
      }
    }

    return { visitedOrder, solutionPath, success: found };
  }
};
