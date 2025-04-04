# 六角跳棋游戏需求文档 (Hexagonal Checkers/Halma)

## 游戏概述
这是一款2-6人策略棋盘游戏，在六角形网格棋盘上进行。
玩家需要将自己的所有棋子从起始区域移动到棋盘对面的目标区域。

## 功能需求
1. 游戏设置
   - 支持2-6名玩家
   - 可选择不同颜色棋子
   - 显示当前玩家回合

2. 棋盘
   - 六角形棋盘布局 (半径为8格)
   - 每个玩家15个棋子 (适用于2人游戏模式，其他模式待定)
   - 清晰的视觉区分不同玩家区域

3. 游戏规则
   - 单步移动：向相邻空位移动
   - 跳跃移动：跳过相邻棋子到对称空位
   - 连续跳跃：允许单次操作中连续跳跃
   - 胜利条件：所有棋子最先到达对面目标区域

4. UI功能
   - 点击选择棋子
   - 高亮显示合法移动位置
   - 动画效果移动棋子
   - 游戏状态显示

## 技术实现
- 使用HTML5 Canvas绘制棋盘
- JavaScript实现游戏逻辑
- CSS美化界面
- 响应式设计适配不同屏幕

## 开发计划
1. 创建基本HTML结构和CSS样式
2. 实现棋盘绘制
3. 实现棋子移动逻辑
4. 添加游戏状态管理
5. 完善UI交互