学习笔记

## 产生式

- 0型，无限制文法：?::=?
- 1型，上下文无关文法：?< A >?::=?< B >?，A/B前面的部分和后面的部分要对应相等。
- 2型，上下文无关文法：< A >::=?
- 3型，正则文法：< A >::=< A >?，只能往后添加匹配。

## 编程语言性质

- 图灵完备性
  1）命令式-图灵机<br>
     goto | if 和 while<br>
  2）声明式-lambda<br>

## 一般命令式编程语言的设计方式

- Atom: Identifier,Literal
- Expression: Atom, Operator, Punctuator
- Statement: Expression, Keyword, Punctuator(Turing Completeness)
- Structure: Function, Class, Process, Namespace, ......
- Program: Program, Module, Package, Library
编程 = 语法 -语义-> 运行时，即通过一定语法形成语义，改变运行时的状态。

## 基本类型

- Number: IEEE 754 Double Float
  Sign(1) + Exponent(11) + [ hiding 1 ] + Fraction(52) => (Sign) Fraction * 2^Exponent
  符号位 + 指数位 + 精度位
- String: 各种编码方式，一般都会兼容ASCII。
  ASCII: 常用的127个字符
  Unicode: 全世界通用字符集合
  USC: Unicode和另一个标准化组织合并扩展字符集
  UTF编码方式: 见UTF8_Encoding.html
  GB: 国标字符集
  ISO: 东欧国家字符集
  BIG5: 台湾字符集
- Boolean: true & false都是关键字
- Object: prototype原型链
- Null: 表示定义了但没有赋值的变量值，是关键字。
- Undefined: 表示没有定义的变量，不是关键字，可以被重新定义，可以用 void 0替代。
- Symbol: 只能够通过变量去引用，无法仅根据名字引用。从而实现属性访问的权限控制。

parseInt(num,8);   //八进制转十进制
parseInt(num,16);   //十六进制转十进制
parseInt(num).toString(8)  //十进制转八进制
parseInt(num).toString(16)   //十进制转十六进制
parseInt(num,2).toString(8)   //二进制转八进制
parseInt(num,2).toString(16)  //二进制转十六进制
parseInt(num,8).toString(2)   //八进制转二进制
parseInt(num,8).toString(16)  //八进制转十六进制
parseInt(num,16).toString(2)  //十六进制转二进制
parseInt(num,16).toString(8)  //十六进制转八进制

## 特殊对象

- Function: 当标识符后跟着()时，会尝试调用对象的[[ call ]]属性进行方法调用。
- Array: length属性根据最大的下标自动发生变化。
- Object.prototype: 所有对象的默认原型，无法再给它设置原型。
- string: 非负整数访问会去字符串里查找，类似codeAt()。
- arguments: ES5非负整数型下标属性跟对应的变量联动。
- namespace: 特殊地方很多，跟一般对象完全不一样，尽量只用于 import 吧。
- bind后的function: 跟原来的函数相关联。
- 类型数组和数组缓冲区: 跟内存块相关联，下标运算比较特殊。
- Symbol.toStringTag | class: 决定 Object.protptype.toString 返回值的属性。