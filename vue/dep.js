/*Dep类, 应该是一种事件队列机制;
* 1. 声明一个空队列subs
* 2. addSub 往空队列里添加事件
* 3. notify, 执行队列里的所有的之间sub.update;
* 4. Dep.target是啥
* 5. 看完warcher再回来;
* */


class Dep {
  constructor() {
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub);
  }

  notify() {
    this.subs.forEach(sub => sub.update());
  }
}

Dep.target = null;
