/**
 * Templates.js
 * 演算法範本庫 (含糖果屋麵包屑引導任務 TODOs)
 */

export const ALGORITHM_TEMPLATES = {
  // 🍞 麵包屑 1：調校優先順序 (完全不需寫變數，只改陣列順序)
  breadcrumbs_step1: `// 🍞【麵包屑任務 1】：無人機探險家的優先順序
// 任務目標：無人機每到一個路口，會按照這個清單由左到右決定「最想走的方向」
// 思考：目前預設是右手法則 ["RIGHT", "FORWARD", "LEFT", "U_TURN"]
// 請試著調整順序（例如將 "LEFT" 放到最前面變成左手法則），觀察路徑變化！

const priorityList = ["RIGHT", "FORWARD", "LEFT", "U_TURN"];

function nextAction(drone) {
  for (let act of priorityList) {
    if (act === "RIGHT" && !drone.isWallRight()) return "RIGHT";
    if (act === "FORWARD" && !drone.isWallInFront()) return "FORWARD";
    if (act === "LEFT" && !drone.isWallLeft()) return "LEFT";
    if (act === "U_TURN") return "U_TURN";
  }
}`,

  // 🍞 麵包屑 2：死胡同與決策填空
  breadcrumbs_step2: `// 🍞【麵包屑任務 2】：逃離死胡同
// 提示：動作只有四個字串："FORWARD"、"RIGHT"、"LEFT"、"U_TURN"
// 請跟隨麵包屑註解，將底線 ___ 替換為正確動作：

function nextAction(drone) {
  // 🍞 麵包屑 A：如果右方沒有牆壁，優先右轉
  if (!drone.isWallRight()) {
    return "RIGHT";
  }
  
  // 🍞 麵包屑 B：如果右方碰壁，但前方是暢通的走廊，應該怎麼做？
  else if (!drone.isWallInFront()) {
    return "FORWARD"; // 請確認是否向前
  }
  
  // 🍞 麵包屑 C：右邊與前面都撞牆了，左邊有路，應該往哪轉？
  else if (!drone.isWallLeft()) {
    return "LEFT"; // 填寫此處
  }
  
  // 🍞 麵包屑 D：前、右、左三面全都是牆（死路）！無人機必須掉頭！
  else {
    return "U_TURN"; // 填寫調頭動作
  }
}`,

  // 🍞 麵包屑 3：開盲盒記憶探索 (簡易版特雷莫)
  tremaux_simple: `// 🍞【麵包屑任務 3】：記憶開盲盒（尋找沒走過的新路）
// 系統已封裝好：drone.getVisitCount("方向") 會回傳該方向走過幾次 (0 代表全新沒走過的路)
function nextAction(drone) {
  // 🍞 麵包屑 1：只要發現沒走過的路 (次數 === 0)，立刻搶先探索！
  if (!drone.isWallInFront() && drone.getVisitCount("FRONT") === 0) {
    return "FORWARD";
  }
  if (!drone.isWallRight() && drone.getVisitCount("RIGHT") === 0) {
    return "RIGHT";
  }
  if (!drone.isWallLeft() && drone.getVisitCount("LEFT") === 0) {
    return "LEFT";
  }

  // 🍞 麵包屑 2：如果周圍都走過了，就按照通行的路退回
  if (!drone.isWallRight()) return "RIGHT";
  if (!drone.isWallInFront()) return "FORWARD";
  if (!drone.isWallLeft()) return "LEFT";

  // 🍞 麵包屑 3：撞到死路掉頭
  return "U_TURN";
}`,

  // 4. 特雷莫演算法 (完整統計版)
  tremaux: `// 特雷莫演算法 (Trémaux's Algorithm) - 未知終點/迷霧專用
function nextAction(drone) {
  if (!drone.memory.visited) drone.memory.visited = {};
  const posKey = drone.x + ',' + drone.y;
  drone.memory.visited[posKey] = (drone.memory.visited[posKey] || 0) + 1;

  const candidates = [];
  if (!drone.isWallInFront()) {
    const fPos = drone.getRelativePos('FRONT');
    candidates.push({ action: 'FORWARD', count: drone.memory.visited[fPos.x + ',' + fPos.y] || 0 });
  }
  if (!drone.isWallRight()) {
    const rPos = drone.getRelativePos('RIGHT');
    candidates.push({ action: 'RIGHT', count: drone.memory.visited[rPos.x + ',' + rPos.y] || 0 });
  }
  if (!drone.isWallLeft()) {
    const lPos = drone.getRelativePos('LEFT');
    candidates.push({ action: 'LEFT', count: drone.memory.visited[lPos.x + ',' + lPos.y] || 0 });
  }

  if (candidates.length === 0) return 'U_TURN';
  candidates.sort((a, b) => a.count - b.count);
  return candidates[0].action;
}`,

  // 5. 增量 DFS 記憶探索
  incrementalDfs: `// 增量 DFS 記憶探索 (Incremental DFS Backtracking)
function nextAction(drone) {
  if (!drone.memory.stack) {
    drone.memory.stack = [{ x: drone.x, y: drone.y }];
    drone.memory.visited = new Set([drone.x + ',' + drone.y]);
  }

  const checkDirection = (action, getPosFn) => {
    const p = getPosFn();
    const key = p.x + ',' + p.y;
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

  // 6. 沿牆搜尋法
  rightHand: `// 沿牆搜尋法 (Right-Hand Rule)
function nextAction(drone) {
  if (!drone.isWallRight()) return "RIGHT";
  else if (!drone.isWallInFront()) return "FORWARD";
  else if (!drone.isWallLeft()) return "LEFT";
  else return "U_TURN";
}`
};
