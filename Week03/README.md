学习笔记

## 词法解析

- 1. 正则匹配：利用正则匹配切分string，获得不同类型的单词。
- 2. 类型定义：定义单词类别，与正则匹配识别的单词一一对应。类型分为：数字|空格|行结束符|*|/|+|- 七种。
- 3. 词法解析：按正则匹配划分单词，并标注类型。
- 4. 标注结束：利用EOF作为结束符标注句子结束，词法解析完成。

## 语法分析

- 1. 定义：运算由 加法 AdditiveExpression 和 乘法 MultiplicativeExpression 组成
- 2. 规则：AdditiveExpression := Number 
           | MultiplicativeExpression * Number
           | MultiplicativeExpression / Number
           | AdditiveExpression + MultiplicativeExpression
           | AdditiveExpression - MultiplicativeExpression

        MultiplicativeExpression := Number
           | MultiplicativeExpression * Number
           | MultiplicativeExpression / Number
- 3. 语法分析：得到语法分析树，并将根结点标注为Expression。
- 4. 注意：把单个数字，当成一个 MultiplicativeExpression 运算。

## 迭代器 generator
- https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Generator
