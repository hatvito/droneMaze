/**
 * Algorithms.js
 * 教學演示核心演算法庫 (右手法則、DFS、BFS、A*)
 */

export const MazeAlgorithms = {
  solveRightHand: function(maze, start, end) {
    const visitedOrder = [];
    const solutionPath = [];
    const dirs = [
      { dx: 1, dy: 0 },  // 0: 東
      { dx: 0, dy: 1 },  // 1: 南
      { dx: -1, dy: 0 }, // 2: 西
      { dx: 0, dy: -1 }  // 3: 北
    ];

    let cx = start.x;
    let cy = start.y;
    let currentDir = 0;
    const maxSteps = maze.cols * maze.rows * 4;
    let stepCount = 0;

    solutionPath.push({ x: cx, y: cy });

    while ((cx !== end.x || cy !== end.y) && stepCount < maxSteps) {
      stepCount++;
      visitedOrder.push({ x: cx, y: cy });

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
      if (!moved) break;
    }

    const success = (cx === end.x && cy === end.y);
    return { visitedOrder, solutionPath, success };
  },

  solveDFS: function(maze, start, end) {
    const visitedOrder = [];
    const solutionPath = [];
    const visited = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(false));
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

    function dfs(x, y) {
      visited[y][x] = true;
      visitedOrder.push({ x, y });
      solutionPath.push({ x, y });

      if (x === end.x && y === end.y) return true;

      for (const d of dirs) {
        const nx = x + d.dx, ny = y + d.dy;
        if (maze.isWalkable(nx, ny) && !visited[ny][nx]) {
          if (dfs(nx, ny)) return true;
        }
      }

      solutionPath.pop();
      return false;
    }

    const success = dfs(start.x, start.y);
    return { visitedOrder, solutionPath, success };
  },

  solveBFS: function(maze, start, end) {
    const visitedOrder = [];
    const queue = [];
    const visited = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(false));
    const parentGrid = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(null));

    queue.push({ x: start.x, y: start.y });
    visited[start.y][start.x] = true;
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    let found = false;

    while (queue.length > 0) {
      const current = queue.shift();
      visitedOrder.push({ x: current.x, y: current.y });

      if (current.x === end.x && current.y === end.y) {
        found = true;
        break;
      }

      for (const d of dirs) {
        const nx = current.x + d.dx, ny = current.y + d.dy;
        if (maze.isWalkable(nx, ny) && !visited[ny][nx]) {
          visited[ny][nx] = true;
          parentGrid[ny][nx] = { x: current.x, y: current.y };
          queue.push({ x: nx, y: ny });
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
  },

  solveAStar: function(maze, start, end) {
    const visitedOrder = [];
    const openSet = [];
    const closedSet = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(false));
    const gScore = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(Infinity));
    const parentGrid = Array(maze.rows).fill(null).map(() => Array(maze.cols).fill(null));

    const heuristic = (x, y) => Math.abs(x - end.x) + Math.abs(y - end.y);

    gScore[start.y][start.x] = 0;
    openSet.push({ x: start.x, y: start.y, f: heuristic(start.x, start.y) });
    const dirs = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];
    let found = false;

    while (openSet.length > 0) {
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
        const nx = current.x + d.dx, ny = current.y + d.dy;
        if (maze.isWalkable(nx, ny) && !closedSet[ny][nx]) {
          const tentativeG = gScore[current.y][current.x] + 1;
          if (tentativeG < gScore[ny][nx]) {
            parentGrid[ny][nx] = { x: current.x, y: current.y };
            gScore[ny][nx] = tentativeG;
            openSet.push({ x: nx, y: ny, f: tentativeG + heuristic(nx, ny) });
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
