/**
 * Templates.js
 * 演算法範本庫 (包含標準版與課堂學生練習使用的【挖空任務版】)
 */

export const ALGORITHM_TEMPLATES = {
  // 1. 特雷莫演算法 (Trémaux)
  tremaux: `// 特雷莫演算法 (Trémaux's Algorithm) - 未知終點/迷霧專用
// 策略：在地圖節點做記號(訪問次數)。優先走沒走過的路；若撞死胡同或舊路，則退回標記2次並尋找新通道
function nextAction(drone) {
  if (!drone.memory.visited) drone.memory.visited = {};
  const posKey = \`\${drone.x},\${drone.y}\`;
  drone.memory.visited[posKey] = (drone.memory.visited[posKey] || 0) + 1;

  // 取得四個方向中未撞牆且訪問次數最少的方向
  const candidates = [];
  
  if (!drone.isWallInFront()) {
    const fPos = drone.getRelativePos('FRONT');
    candidates.push({ action: 'FORWARD', count: drone.memory.visited[\`\${fPos.x},\${fPos.y}\`] || 0 });
  }
  if (!drone.isWallRight()) {
    const rPos = drone.getRelativePos('RIGHT');
    candidates.push({ action: 'RIGHT', count: drone.memory.visited[\`\${rPos.x},\${rPos.y}\`] || 0 });
  }
  if (!drone.isWallLeft()) {
    const lPos = drone.getRelativePos('LEFT');
    candidates.push({ action: 'LEFT', count: drone.memory.visited[\`\${lPos.x},\${lPos.y}\`] || 0 });
  }

  if (candidates.length === 0) return 'U_TURN'; // 死胡同

  // 排序：優先選取訪問次數最少(未開圖)的方向
  candidates.sort((a, b) => a.count - b.count);
  return candidates[0].action;
}`,

  // 2. 特雷莫演算法【挖空任務版】
  tremaux_todo: `// 【學生任務】特雷莫演算法填空 (Trémaux's Algorithm Task)
// 提示：利用 drone.memory.visited 記錄走過次數，並在岔路時優先挑選 count 最低的路徑
function nextAction(drone) {
  if (!drone.memory.visited) drone.memory.visited = {};
  const posKey = \`\${drone.x},\${drone.y}\`;
  
  // TODO 1: 將當前所在格子的訪問計數 +1
  drone.memory.visited[posKey] = (drone.memory.visited[posKey] || 0) + 1;

  const candidates = [];

  // TODO 2: 檢查前方、右方、左方是否沒有牆壁，若通行則記錄其訪問次數
  if (!drone.isWallInFront()) {
    const fPos = drone.getRelativePos('FRONT');
    const fCount = drone.memory.visited[\`\${fPos.x},\${fPos.y}\`] || 0;
    candidates.push({ action: 'FORWARD', count: fCount });
  }
  if (!drone.isWallRight()) {
    // 【填空區】：請取得右方座標並 push 進 candidates
    const rPos = drone.getRelativePos('RIGHT');
    const rCount = drone.memory.visited[\`\${rPos.x},\${rPos.y}\`] || 0;
    candidates.push({ action: 'RIGHT', count: rCount });
  }
  if (!drone.isWallLeft()) {
    // 【填空區】：請取得左方座標並 push 進 candidates
    const lPos = drone.getRelativePos('LEFT');
    const lCount = drone.memory.visited[\`\${lPos.x},\${lPos.y}\`] || 0;
    candidates.push({ action: 'LEFT', count: lCount });
  }

  // TODO 3: 當無路可走 (死路) 時，應回傳何種轉向指令？
  if (candidates.length === 0) {
    return 'U_TURN';
  }

  // TODO 4: 將 candidates 由小到大排序 (優先挑選 count 最小者)
  candidates.sort((a, b) => a.count - b.count);

  return candidates[0].action;
}`,

  // 3. 增量 DFS 記憶探索
  incrementalDfs: `// 增量 DFS 記憶探索 (Incremental DFS Backtracking)
// 策略：在無人機記憶體中維護一個探索 Stack，當前方無新路時自動回溯
function nextAction(drone) {
  if (!drone.memory.stack) {
    drone.memory.stack = [{ x: drone.x, y: drone.y }];
    drone.memory.visited = new Set([\`\${drone.x},\${drone.y}\`]);
  }

  // 檢查鄰近是否有未訪問過的格子
  const checkDirection = (action, getPosFn) => {
    const p = getPosFn();
    const key = \`\${p.x},\${p.y}\`;
    if (!drone.memory.visited.has(key)) {
      drone.memory.visited.add(key);
      drone.memory.stack.push(p);
      return action;
    }
    return null;
  };

  if (!drone.isWallInFront()) {
    const act = checkDirection('FORWARD', () => drone.getRelativePos('FRONT'));
    if (act) return act;
  }
  if (!drone.isWallRight()) {
    const act = checkDirection('RIGHT', () => drone.getRelativePos('RIGHT'));
    if (act) return act;
  }
  if (!drone.isWallLeft()) {
    const act = checkDirection('LEFT', () => drone.getRelativePos('LEFT'));
    if (act) return act;
  }

  // 若周圍皆已走過，觸發 Backtrack 回溯
  drone.memory.stack.pop();
  if (drone.memory.stack.length > 0) {
    const target = drone.memory.stack[drone.memory.stack.length - 1];
    return drone.getDirectionTo(target);
  }

  return 'FORWARD';
}`,

  // 4. 沿牆搜尋法 (Right-Hand Rule)
  rightHand: `// 沿牆搜尋法 (Right-Hand Rule)
function nextAction(drone) {
  if (!drone.isWallRight()) return "RIGHT";
  else if (!drone.isWallInFront()) return "FORWARD";
  else if (!drone.isWallLeft()) return "LEFT";
  else return "U_TURN";
}`,

  // 5. 隨機探索
  random: `// 隨機探索 (Random Explorer)
function nextAction(drone) {
  const options = [];
  if (!drone.isWallInFront()) options.push('FORWARD');
  if (!drone.isWallRight()) options.push('RIGHT');
  if (!drone.isWallLeft()) options.push('LEFT');
  if (options.length === 0) return 'U_TURN';
  return options[Math.floor(Math.random() * options.length)];
}`,

  // 6. A* 啟發式搜尋 (已知終點模式)
  astar: `// A* 啟發式搜尋 (已知終點模式)
function planPath(maze, start, goal) {
  function h(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  const openSet = [{ node: start, path: [start], g: 0, f: h(start, goal) }];
  const visited = new Map();

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const { node, path, g } = openSet.shift();
    if (node.x === goal.x && node.y === goal.y) return path;

    const key = \`\${node.x},\${node.y}\`;
    if (visited.has(key) && visited.get(key) <= g) continue;
    visited.set(key, g);

    const dirs = [{x:0, y:-1}, {x:1, y:0}, {x:0, y:1}, {x:-1, y:0}];
    for (const d of dirs) {
      const nx = node.x + d.x, ny = node.y + d.y;
      if (nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length && maze[ny][nx] === 0) {
        const nextNode = { x: nx, y: ny };
        const nextG = g + 1;
        openSet.push({ node: nextNode, path: [...path, nextNode], g: nextG, f: nextG + h(nextNode, goal) });
      }
    }
  }
  return [];
}`,

  // 7. BFS 最短路徑搜尋
  bfs: `// 廣度優先搜尋 (BFS 最短路)
function planPath(maze, start, goal) {
  const queue = [[start]];
  const visited = new Set([\`\${start.x},\${start.y}\`]);
  const dirs = [{x:0, y:-1}, {x:1, y:0}, {x:0, y:1}, {x:-1, y:0}];

  while (queue.length > 0) {
    const path = queue.shift();
    const curr = path[path.length - 1];
    if (curr.x === goal.x && curr.y === goal.y) return path;

    for (const d of dirs) {
      const nx = curr.x + d.x, ny = curr.y + d.y;
      if (nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length && maze[ny][nx] === 0) {
        if (!visited.has(\`\${nx},\${ny}\`)) {
          visited.add(\`\${nx},\${ny}\`);
          queue.push([...path, {x: nx, y: ny}]);
        }
      }
    }
  }
  return [];
}`
};
