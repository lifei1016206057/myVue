/*
1. 在constructor把option挂载到this上;
2. init初始化函数
3. proxy, 修改this上的值相当与修改this.data上的值
4. observer , 监控this.data;
5. compile编译dom
6. 执行生命周期mounted;

*/

class Vue {
  constructor(options) {
    this.data = options.data;
    this.methods = options.methods;
    this.mounted = options.mounted;
    this.el = options.el;

    this.init();
  }

  init() {
    // 代理 data
    Object.keys(this.data).forEach(key => {
      this.proxy(key);
    });
    // 监听 data
    observe(this.data, this);
    const compile = new Compile(this.el, this);
    // 生命周期其实就是在完成一些操作后调用的函数,
    // 所以有些属性或者实例在一些 hook 里其实还没有初始化，
    // 也就拿不到相应的值
    this.callHook('mounted');
  }

  proxy(key) {
    Object.defineProperty(this, key, {
      enumerable: false,
      configurable: true,
      get: function() {
        return this.data[key]
      },
      set: function(newVal) {
        this.data[key] = newVal;
      }
    });
  }

  callHook(lifecycle) {
    this[lifecycle]();
  }
}
