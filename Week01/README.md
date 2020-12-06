学习笔记

## HTML标签计数

- 数据源：https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element
- 策略：观察到列表每一行有一个HTML元素，则可计算行数。但<h1>, <h2>, <h3>, <h4>, <h5>, <h6>共用一行则筛选结果要增加5。
- 代码：
```javascript
let tbs = document.getElementsByTagName('tbody');
let tbsArr = Array.from(tbs);
let count = 0;
tbsArr.forEach(item => {
  count += item.children.length;
})
// count = 149
// 总数 = 149 + 5 = 154
```

## 五子棋AI思路

- 搜索范围：以对方落棋点为中心，向外扩展出 5*5 的棋盘，以此为搜索范围。
- 搜索策略：将搜索范围拆分为多个 TicTacToe 棋盘格，复用原先解法找的最优解。
- 优化：考虑功能模块纯函数化

## 异步编程

- setTimeout callback
- Promise.then
- async await
- generator

## 知识点

- Object.create 能够使用现有的对象来提供新创建的对象，数组使用前要先转化为对象。