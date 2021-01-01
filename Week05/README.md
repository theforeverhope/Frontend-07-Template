学习笔记

## Reactive 响应式实现原理

reactiveObject.set -(trigger)-> dependance update(call callbacks registered by effect using new value)<br> 
reactiveObject.get -(collect)-> dependance(single callback of reactiveObject use useReactivities)<br> 
effect -(call)-> reactiveObject.get -(collect)-> dependance(register callbacks)<br> 

- 生成响应式对象，捕捉对象读取和赋值操作 <br> 
```javascript
  let originalObj = {}
  let reactiveObj = new Proxy(originalObj, {
    set(obj, prop, val) {
      obj[prop] = val;
      return obj[prop];
    }, 
    get(obj, prop) {
      return obj[prop];
    }
  })
```
  VUE 3.0[使用 Proxy:[https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy]]<br> 
  1) Proxy 针对整个data对象，而不是data对象的某个属性。<br> 
  2）Proxy 支持数组，不需要对数组的方法进行重载。<br> 

  VUE 2.0[使用 defineProperty:[https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty]]<br> 
  1）defineProperty 不能监听数组的变化，需要重写数组方法来实现数组的劫持。<br> 
  2）defineProperty 必须遍历对象的每个属性，配合Object.keys()<br> 
  3）VUE 2.0 无法监听未在data里声明的属性<br> 
  例如：对于未在data里声明的属性，没有通过defineProperty注册对于该属性的监听，从而属性的依赖不会更新。<br> 
  方案：需要手动调用注册新的对象监听this.$set(obj, prop, val)。<br> 

- 为响应式对象绑定依赖关系 <br> 
  定义全局变量收集依赖关系，并在对象属性变化的时候（执行set），触发依赖响应（执行callback）。<br> 
```javascript
  let callbacks = []; // collected dependance
  
  /* Omit some code of defining reactive object */

  effect(() => {
    return reactiveObj.a; // define dependance
  });

  function effect(callback) {
    callbacks.push(callback); // collect dependance
  }

  let reactiveObj = new Proxy(originalObj, {
    set(obj, prop, val) {
      obj[prop] = val;
      for (let cb of callbacks) {
        cb(); // call dependance
      }
      return obj[prop];
    }, 
    get(obj, prop) {
      return obj[prop];
    }
  })
```
  问题：对象的任意属性改变都会触发该对象每一个属性所绑定的依赖，即依赖没有和相应属性建立单独对应的绑定关系。会产生性能问题。<br> 

- 分别为对象的不同属性绑定对应的依赖 <br> 
  利用Map存储依赖，key为属性，value为依赖数组。<br> 
  利用callback的执行会获取其依赖对象的属性的特性，在属性的get方法里收集依赖。<br> 
  属性set触发更新，则执行该属性对应的依赖响应。<br> 
```javascript
  let callbacks = new Map(); // collected dependance
  let usedReactivities = []; // collected the dependance of a single callback

  /* Omit some code of defining reactive object and effect */

  function effect(callback) {
    usedReactivities = [];
    callback(); // trigger get to register usedReactivities
    
    for (let reactity of usedReactivities) {
      if (!callbacks.has(reactity[0]))
        callbacks.set(reactity[0], new Map()); // cus we need to collect dependance of its attributes
      if (!callbacks.get(reactity[0]).has(reactity[1]))
        callbacks.get(reactity[0]).set(reactity[1], []); // can be Array/Set/Map
      callbacks.get(reactity[0]).get(reactity[1]).push(callback);
    }
  }

  function reactive(object) {
    return new Proxy(object, {
      set(obj, prop, val) {
        obj[prop] = val; // set value first, then call dependance update

        if (callbacks.get(obj) && callbacks.get(obj).get(prop))
          for (let cb of callbacks.get(obj).get(prop)) {
            cb();
          }

        return obj[prop];
      },
      get(obj, prop) {
        usedReactivities.push([obj, prop]); // register the dependance of callback to usedReactivities
        return obj[prop];
      }
    });
  }
```
  问题：无法处理嵌套对象的响应式依赖注册，例如reactiveObj.a.c = 9，无法触发响应。<br> 

- 将嵌套对象也生成响应式<br> 
  缓存响应式对象集合。<br> 
```javascript
  let reactities = new Map(); // collected reactive objects

  let originalObj = {
    a: 1,
    b: {c: 3},
  };

  let reactiveObj = reactive(originalObj);

  /* Omit some code of effect */

  function reactive(object) {
    if (reactities.has(object))
      return reactities.get(object);

    let proxy = new Proxy(object, {
      set(obj, prop, val) {
        /* Omit some code of set */
      },
      get(obj, prop) {
        usedReactivities.push([obj, prop]); // register the dependance of callback to usedReactivities

        if (typeof obj[prop] === 'object')
          return reactive(obj[prop]); // define nesting reactive object
        
        return obj[prop];
      }
    });

    reactities.set(object, proxy); // collect reactive objects
    return proxy;
  }
```

- 双向绑定<br> 

```html
<input id="r" />
<script>
  effect(() => {
    document.getElementById("r").value = reactiveObj.r; // set value of input r to originalObj.r 
  });

  document.getElementById("r").addEventListener('input', event => reactiveObj.r = event.target.value); // set originalObj.r to value of input
</script>
```


## Dragable 不脱离文档流的拖动效果实现

- 利用 mousedown mousemove mouseup 实现拖动效果。<br> 
  mousedown：记录拖动的起始位置，并注册 mousemove mouseup  事件。<br> 
  mousemove：利用transform:translate(x,y)来实现拖动效果。<br> 
  mouseup：记录拖动的终点，即下一次拖动的起始位置，并注销 mousemove mouseup 事件。<br> 

- 将文档逐字划分 Range ，并计算离 mousemove 当前位置最近的文字节点。<br> 
  Range:[https://developer.mozilla.org/zh-CN/docs/Web/API/Range]<br> 

- 在离 mousemove 当前位置最近的文字节点后插入拖动的对象。<br> 