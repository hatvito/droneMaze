/**
 * Templates.js
 * 演算法範本庫 (含學生任務填空版 TODOs)
 */

export const ALGORITHM_TEMPLATES = {
  tremaux_todo: `// ★【學生任務填空】特雷莫演算法 (Trémaux's Algorithm Task)
// 提示：利用 drone.memory.visited 記錄次數，並優先挑選走過最少的方向
function nextAction(drone) {
  if (!drone.memory.visited) drone.memory.visited = {};
  const posKey = \`\${drone.x},\${drone.y}\`;
  
  // TODO 1: 當前所在格子訪問次數 + 1
  drone.memory.visited[posKey] = (drone.memory.visited[posKey] || 0) + 1;

  const candidates = [];

  // TODO 2: 依序檢查前方、右方、左方是否暢通
  if (!drone.isWallInFront()) {
    const fPos = drone.getRelativePos('FRONT');
    const fCount = drone.memory.visited[\`\${fPos.x},\${fPos.y}\`] || 0;
    candidates.push({ action: 'FORWARD', count: fCount });
  }
  if (!drone.isWallRight()) {
    // 【填空區】：請取得右方座標並加入 candidates
    const rPos = drone.getRelativePos('RIGHT');
    const rCount = drone.memory.visited[\`\${rPos.x},\${rPos.y}\`] || 0;
    candidates.push({ action: 'RIGHT', count: rCount });
  }
  if (!drone.isWallLeft()) {
    // 【填空區】：請取得左方座標並加入 candidates
    const lPos = drone.getRelativePos('LEFT');
    const lCount = drone.memory.visited[\`\${lPos.x},\${lPos.y}\`] || 0;
    candidates.push({ action: 'LEFT', count: lCount });
  }

  // TODO 3: 死胡同時的回傳動作
  if (candidates.length === 0) {
    return 'U_TURN';
  }

  // TODO 4: 根據訪問次數排序 candidates
  candidates.sort((a, b) => a.count - b.count);

  return candidates[0].action;
}`,

  tremaux: `// 特雷莫演算法 (Trémaux's Algorithm) - 未知終點/迷霧專用
function nextAction(drone) {
  if (!drone.memory.visited) drone.memory.visited = {};
  const posKey = \`\${drone.x},\${drone.y}\`;
  drone.memory.visited[posKey] = (drone.memory.visited[posKey] || 0) + 1;

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

  if (candidates.length === 0) return 'U_TURN';
  candidates.sort((a, b) => a.count - b.count);
  return candidates[0].action;
}`,

  incrementalDfs: `// 增量 DFS 記憶探索 (Incremental DFS Backtracking)
function nextAction(drone) {
  if (!drone.memory.stack) {
    drone.memory.stack = [{ x: drone.x, y: drone.y }];
    drone.memory.visited = new Set([\`\${drone.x},\${drone.y}\`]);
  }

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

  drone.memory.stack.pop();
  if (drone.memory.stack.length > 0) {
    const target = drone.memory.stack[drone.memory.stack.length - 1];
    return drone.getDirectionTo(target);
  }
  return 'FORWARD';
}`,

  rightHand: `// 沿牆搜尋法 (Right-Hand Rule)
function nextAction(drone) {
  if (!drone.isWallRight()) return "RIGHT";
  else if (!drone.isWallInFront()) return "FORWARD";
  else if (!drone.isWallLeft()) return "LEFT";
  else return "U_TURN";
}`
};
