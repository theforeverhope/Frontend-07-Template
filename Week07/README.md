学习笔记

## Expression

- Member: a.b | a\[b] | foo\`string` | super.b | super\['b'] | new.target | new Foo()
- New: new Foo
- Call: foo() | super() | foo()\['b'] | foo().b | foo()\`abc`
- Left Handside & Right Handside: a.b = c | a+b = c
- Update: a++ | a-- | ++a | --a => a illegal example: ++ a++ -> ++ (a++)
- Unary: delate a.b | void foo() | typeof a | +a | -a | ~a | !a | await a
- Exponental: ** => 3 ** 2 ** 3 -> 3 ** (2 ** 3)
- Multiplicative: * | / | %
- Additive: + | -
- Shift: << | >> | >>> 
- Relationship: < | > | <= | >= | instanceof | in
- Equality: == | != | === | !==
- Bitwise: & | ^ | |
- Logical: && | || (短路原则)
- Condition: ?:
- Reference: Object + key（Object\[key] 描述了Member运算的前半部分和后半部分）<br>
  Javascript 运行时数据类型，用于进行delete和assign操作。


## Type Convertion

|         |  Number       |    String   |  Boolean  |Undefined|  Null  |  Object  |  Symbol  |
|  ----   |     ----      |     ----    |    ----   |   ----  |  ----  |   ----   |   ----   |
| Number  |       -       |             |  0 false  |     x   |    x   |  Boxing  |     x    |
| String  |               |       -     |  "" false |     x   |    x   |  Boxing  |     x    |
| Boolean |true 1, false 0|'true''false'|      -    |     x   |    x   |  Boxing  |     x    |
|Undefined|      NaN      | 'Undefined' |    false  |     -   |    x   |     x    |     x    |
|  Null   |       0       |    'null'   |    false  |     x   |    -   |     x    |     x    |
| Object  |   valueOf     |valueOf toString|  true  |     x   |    x   |     -    |     x    |
| Symbol  |       x       |      x      |      x    |     x   |    x   |  Boxing  |     -    |

- Unboxing: ToPrimitive<br>
  Symbol.toPrimitive: 如果定义了则优先调用<br>
  toString: 属性名优先调用<br>
  valueOf: 加法优先调用 <br>

- Boxing<br>

|   类型   |           对象          |      值      |
|  ----   |           ----          |     ----    |
| Number  | new Number(1)           |      1      |
| String  | new String("a")         |     'a'     |
| Boolean | new Boolean(true)       |    true     |
| Symbol  | new Object(Symbol("a")) | Symbol("a") |


## Statement

- Completion Record<br>
  \[\[type]]: normal | break | continue | return | throw<br>
  \[\[value]]: Basic Javascript Object<br>
  \[\[target]]: label (work with break or continue)<br>

- Simple Statement<br>
  Expression Statement<br>
  Empty Statement<br>
  Debugger Statement<br>
  Throw Statement<br>
  Continue Statement<br>
  Break Statement<br>
  Return Statement<br>

- Combined Statement<br>
  Block Statement<br>
  If Statement<br>
  Switch Statement<br>
  Iteration Statement<br>
  With Statement<br>
  Labelled Statement<br>
  Try Statement: return can not break TryStatement, finally will always be performed.<br>

- Declaration<br>
  Function Declaration<br>
  Generator Declaration<br>
  Async Function Declaration<br>
  Async Generator Declaration<br>
  Variable Statement: let | const | var   and their scope<br>
  Class Declaration<br>
  Lexical Declaration<br>
  
## Runtime

- Macro Task(Job)
- Micro Task(Promise)<br>
  Event Loop: -> wait -> get code -> execute -> wait ...<br>
- Execution Context<br>
  code evaluation state: Async | Generator<br>
  Function<br>
  Script or Module<br>
  Generator: only used by Generator<br>
  Realm: the environment save built-in Object<br>
  Lexical Environment: this | new.target | super | variable<br>
  Variable Environment: variable: only used by var<br>

- Environment Records = Declarative Environment Records(=Function Environment Records + module Environment Records) + Global Environment Records + Object Environment Records
- Reference
- Direct Quanlity | Variable | this ......