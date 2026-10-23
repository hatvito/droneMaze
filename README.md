# Drone Maze Algorithm Lab (無人機迷宮演算法教學平台)

專門為高中職「演算法與資料結構 / 程式設計」設計的教學導向迷宮專案。
專案將地圖渲染、動畫核心與「演算法邏輯」完全解耦，學生只需在 `algorithms.js` 中實作特定函式，即可專注於運算思維與演算法設計。

---

## 目錄結構與架構說明

```
drone-maze-algo/
├── index.html           # 平台主頁面 (含 UI 介面、控制面板、指標統計)
├── css/
│   └── style.css        # 介面與畫布樣式
├── js/
│   ├── maze.js          # 迷宮資料結構、地圖生成 (Prim) 與關卡定義
│   ├── drone.js         # 無人機實體 (座標、姿態、路徑動畫繪製)
│   ├── algorithms.js    # 【學生主要實作區】演算法邏輯 (Right-Hand, DFS, BFS, A*)
│   ├── visualizer.js    # 動畫步進器 (Step-by-step 動畫、探索格子標記)
│   └── main.js          # 主程式入口、事件綁定與統計更新
└── README.md            # 教學指南與架構說明
```

---

## 教學指引 (Curriculum Guide)

### 關卡 1：局部探索 —— 右手法則 (Wall Follower / Right-Hand Rule)
* **適用概念**：狀態機、方向向量、相對座標。
* **任務**：實作 `solveRightHand(maze, start, end)`。
* **探討**：
  * 右手法則何時會失效？（島嶼型迷宮、終點未連外牆）。

### 關卡 2：全域搜尋與回溯 —— 深度優先搜尋 (DFS)
* **適用概念**：堆疊 (Stack)、遞迴 (Recursion)、回溯法 (Backtracking)。
* **任務**：實作 `solveDFS(maze, start, end)`。
* **探討**：
  * 如何標記造訪過節點避免無窮迴圈？
  * 走出來的路徑是否為最短路徑？

### 關卡 3：最優路徑規劃 —— 廣度優先搜尋 (BFS)
* **適用概念**：佇列 (Queue)、層序走訪、父節點回溯 (Parent pointer)。
* **任務**：實作 `solveBFS(maze, start, end)`。
* **探討**：
  * 為什麼 BFS 保證能找到最短路徑？
  * BFS 與 DFS 在記憶體消耗（空間複雜度）上的差異。

### 關卡 4：啟發式搜尋 —— A* 演算法 (A-Star)
* **適用概念**：優先佇列 (Priority Queue)、啟發式評估函式 $f(n) = g(n) + h(n)$ (曼哈頓距離)。
* **任務**：實作 `solveAStar(maze, start, end)`。
* **探討**：
  * 比較 BFS 與 A* 的探索節點數 (Visited Nodes)，觀察啟發式導航如何節省無效探索。

---

## 快速啟動
直接以瀏覽器開啟 `index.html` 即可使用。建議使用 Live Server 或一般靜態網頁伺服器運行。
