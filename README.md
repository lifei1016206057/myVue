# 观察者模式

## 概念
	
	观察者模式(observer): 通常有被称作发布-订阅者模式, 定义了一种一对多的依赖关系.
	即当一个对象的状态发生改变的时候,所有依赖它的对象都会得到通知并自动更新.
	解决了主题对象与观察者之间功能的耦合.为了便于理解下面我们统称发布-订阅者模式.

	在这个设计模式里一般有以下几个对象

	* 被观察者 和 被观察者的状态
	* 发布者 和 发布者的订阅列表
	* 订阅者 和 订阅者的回调函数

## 例子

	我们来举个例子说明一下.有一栋楼房A, 最近他的价格有可能会下降.
	有一个中介所B等待有人来问楼房A的消息. 有一个人C,看中了楼房A, 但是觉得价格太高了, 
	打算等楼房A降价了再去买.于是C就去了中介所B, 留了电话号码,告诉中介所如果楼房A降价了就告诉他. 
	过了一段时间, 楼房A真的降价了, 于是中介所B打电话告诉了所有在中介所留了电话的人. 购买人C就来买房了.

	上面的这个例子就是一个发布-订阅者模式:

	* 楼房A: 被观察对象
	* 楼房A的价格: 被观察这的状态
	* 中介所B: 发布者
	* 购买人C: 订阅者
	* 购买人C在中介所B留了电话: 订阅者向发布者订阅事件
	* 楼房A降价了: 被观察者的状态发生改变
	* 中介所B给留了电话的人打电话: 发布者依次通知所有订阅者事件,被观察者的状态发生了改变
	* 购买人C来买房了: 订阅者执行了事件回调

## vue里面的发布-订阅者模式

	首先,使用某一种设计模式一定是为了解决. vue使用发布-订阅者模式是为了: 
	当数据模型上的某个值(比如message)发生改变时, 
	同步改变所有的dom节点中的{{message}}对应的值. 要改变的位置不确定, 数量不确定.

	vue选择的做法是:
	1. 在create阶段, 给数据模型上的每一个属性,都创建一个事件队列
	2. 给数据模型上的每一个属性用Object.defineProperty做了数据监控, 当触发了set函数时, 依次执行事件队列里面的所有的事件函数
	3. 在compile编译阶段, 用Reg.exec方法去匹配dom节点. 每找到一个数据模型上的属性, 
	就在对应的事件队列里添加一个事件函数
	4. 事件队列里的事件函数就是修改对应的dom节点

	套用发布-订阅者模式就是: 
	* data.message: 被观察者
	* data.message的值: 被观察者的状态
	* dom节点上每一个{{message}}, 都代表一个订阅者watcher, 订阅者的事件回调update,就是改变dom节点上{{message}}对应的值
	* data.message有一个发布者(dep), 用来保存订阅者列表(subs),当data.message的状态发生改变时, 
	会通知所有的订阅者(notify)
	* 在编译节点每匹配到一个{{message}}, 发布者就往订阅者列表里添加一个对应的订阅者

## 代码(缩水简化版)

### 发布者dep
	
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

	1. this.subs : 订阅者列表, 保存订阅者信息
	2. this.addSub(sub) : 把订阅者添加到订阅者列表中
	3. this.notify() : 被观察者状态发生改变, 所有的订阅者执行update()事件回调
	4. Dep.target: 订阅者的占位符

### 订阅者watcher

	 class Watcher {
	  constructor(vm, exp, cb) {
	    this.vm = vm;
	    this.exp = exp;
	    this.cb = cb;
	    this.value = this.get();
	  }

	  get() {
	    Dep.target = this;
	    const value = this.vm.data[this.exp.trim()];
	    Dep.target = null;
	    return value;
	  }

	  update() {
	    const newVal = this.vm.data[this.exp.trim()];
	    if(this.value !== newVal) {
	      this.value = newVal;
	      this.cb.call(this.vm, newVal);
	    }
	  }
	}

	1. this.vm : vue实例
	2. this.exp : vm.data[this.exp]是被观察者
	3. this.callback : 被观察者发生改变时, watcher的回调 
	4. this.get() : 获取被观察者的状态
	5. update() : 订阅者的事件回调, 修改dom节点对应的值

### 观察者Observer

	class Observer {
	  constructor(data) {
	    this.data = data;
	    this.init();
	  }

	  init() {
	    this.walk();
	  }

	  walk() {
	    Object.keys(this.data).forEach(key => {
	      this.defineReactive(key, this.data[key]);
	    });
	  }

	  defineReactive(key, val) {
	    const dep = new Dep();
	    const observeChild = observe(val);
	    Object.defineProperty(this.data, key, {
	      enumerable: true,
	      configurable: true,
	      get() {
	        if(Dep.target) {
	          dep.addSub(Dep.target);
	        }
	        return val;
	      },
	      set(newVal) {
	        if(newVal === val) {
	          return;
	        }
	        val = newVal;
	        dep.notify();
	        observe(newVal);
	      }
	    });
	  }
	}

	function observe(value, vm) {
	  if(!value || typeof value !== 'object') {
	    return;
	  }
	  return new Observer(value);
	}

	1. this.defineReactive() : 给data上每一个属性都注册一个观察者, 来监控数据变化
	2. 用Object.defineProperty方法, 对data上面的属性进行监控, 当属性值改变时, 触发发布者的发布信息事件dep.notify();
	3. new Watcher()时, 会执行this.get()函数, 先把Dep.target执行自己这个watcher,
	再获取一个属性值, 触发了数据模型的属性的get事件函数, 将watcher添加到事件队列中.

### 观察者模式的优缺点

 	1. 目标和观察者之间的抽象耦合: 一个目标只知道他有一系列的观察者(目标进行依赖手机), 
 	但不知道其中任意一个观察者属于哪一个具体的类.这样目标与观察者之间的耦合度就被降低了
 	2. 支持广播通信: 观察者里面的通信, 不想其他请求需要执行他的接受者, 
 	通知将会自动广播给所有已订阅目标的相关对象.当然目标对象也不用管到底有多少对象对他感兴趣,
 	他唯一的职责是通知他的各位观察者
 	3. 一些意外的更新: 一位一个观察者并不知道其他观察者的存在, 
 	所以他对改变目标的最终代价一无所知, 如果观察者直接在目标上做操作的话, 可能会引起一系列对观察者以及依赖于这些观察者的对象的更新
 	4. 松耦合也代表这逻辑关联不大,对可读性和易修改性带来一些麻烦