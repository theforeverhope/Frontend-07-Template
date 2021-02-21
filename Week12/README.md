学习笔记

## BFC 合并

- Block
  - Block Container: 里面有BFC（能容纳正常流的盒，里面就有BFC）
  - Block-level Box: 外面有BFC
  - Block Box = Block Container + Block-level Box: 里外都有BFC


- Block Container
  - block
  - inline-block
  - table-cell
  - flex item
  - grid cell
  - table-caption


- Block-level Box
  Block Level<br>
  - display: block
  - display: flex
  - display: table
  - display: grid
  - ......
  Inline Level<br>
  - display: inline-block
  - display: inline-flex
  - display: inline-table
  - display: inline-grid
  - ......


- 设立 BFC
  - floats
  - absolutely positioned elements
  - block containers (such as inline-blocks, table-cells, and table-captions) that are not block boxes, <br>
    • flex items<br>
    • grid cell<br>
    • ......<br>
  - and block boxes with 'overflow' other than 'visible'


- BFC 合并 (block box && overflow: visible)
  - BFC合并与float
  - BFC合并与边距折叠