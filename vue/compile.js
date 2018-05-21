/*
* 1. document.createDocumentFragment()创建一个空白的dom文档;
*       可以向这个空白文档里面添加标签;与document.createElement("div")类似
*       但是,createElement("div")创建的是div节点, 而createDocumentFragment()
*       创建的是空白的节点;
*
* 2. /\{\{(.*)\}\}/.exec(text)[1]: reg.exec()方法返回的数组
*       第0个元素是与正则表达式相匹配的文本,
*       第一个元素是与正则表达式的第一个子表达式相匹配的文本
*       也就是正则中第一个括号(.*)相匹配的文本,即双大括号{{}}里面的文本;
* */


const nodeType = {
  isElement(node) {
    return node.nodeType === 1;
  },
  isText(node) {
    return node.nodeType === 3;
  },
  isInput(node) {
    return node.nodeName === "INPUT";
  }
};


const updater = {
  text(node, val) {
    node.textContent = val;
  },
  value(node, val) {
    node.value = val;
  },

};


//dom更新
let vmUpdater = {
  textUpdater: function(node, value) {
    node.textContent = typeof value == "undefined" ? "" : value;
  },
  htmlUpdater: function(node, value) {
    node.innerHTML = typeof value == "undefined" ? "" : value;
  },
  classUpdater: function(node, value, oldValue) {
    var className = node.className;
    className = className.replace(oldValue, "").replace(/\s$/,"");
    var space = className && String(value) ? " " : "";
    node.className = className + space + value;
  },
  modelUpdater: function(node, value, oldValue) {
    node.value = typeof value == "undefined" ? "" : value;
  }
}

//指令处理集合
var compileUtil = {

  bind: function(node, vm, exp, dir) {
    var updaterFn = updater[dir + "Updater"];
    updaterFn && updaterFn(node, this._getVMVal(vm, exp));

    new Watcher(vm, exp, function(value, oldValue) {
      updaterFn && updaterFn(node, value, oldValue)
    })
  },
  _getVMVal: function(vm, exp) {
    var val = vm;
    exp = exp.split(".")
    exp.forEach(function(k) {
      val = val[k];
    })
    return val;
  }
}

class Compile {
  constructor(el, vm) {
    this.vm = vm;
    this.el = document.querySelector(el);
    this.fragment = null;
    this.init();
  }

  init() {
    if(this.el) {
      this.fragment = this.nodeToFragment(this.el);
      this.compileElement(this.fragment);
      this.el.appendChild(this.fragment);
    }
  }

  nodeToFragment(el) {
    const fragment = document.createDocumentFragment();
    let child = el.firstChild;

    debugger;
    // 将原生节点转移到 fragment
    while(child) {
      fragment.appendChild(child);
      child = el.firstChild;
    }
    return fragment;
  }

  compileElement(el) {
    const childNodes = el.childNodes;
    
    [].slice.call(childNodes).forEach((node) => {
      const reg = /\{\{(.*)\}\}/;
      const text = node.textContent;

      // 根据不同的 node 类型，进行编译，分别编译指令以及文本节点
      if(nodeType.isElement(node)) {
        this.compileEl(node);
      } else if(nodeType.isText(node) && reg.test(text)) {
        this.compileText(node, reg.exec(text)[1]);
      }

      // 递归的对元素节点进行深层编译
      if(node.childNodes && node.childNodes.length) {
        this.compileElement(node);
      }
    });
  }

  compileText(node, exp) {
    const value = this.vm[exp.trim()];
    updater.text(node, value);
    new Watcher(this.vm, exp, val => {
      updater.text(node, val);
    });
  }

  compileEl(node) {
    const attrs = node.attributes;
    Object.values(attrs).forEach(attr => {
      var name = attr.name;
      if(name.indexOf('v-') >= 0) {
        const exp = attr.value;

        //事件绑定
        const eventDir = name.substring(2);
        if(eventDir.indexOf('on') >= 0) {
          this.compileEvent(node, eventDir, exp);
        }

        //双向数据绑定
        if(eventDir.indexOf('model') >= 0) {

        }

        //数据绑定
        this.compileInput(node, exp)
      }
    });
  }

  compileEvent(node, dir, exp) {
    const eventType = dir.split(':')[1];
    const cb = this.vm.methods[exp];

    if(eventType && cb) {
      node.addEventListener(eventType, cb.bind(this.vm));
    }
  }

  compileInput(node, exp) {
    if (nodeType.isInput(node)) {
        node.oninput = function(e) {
          var value = node.value;
          updater.value(node, value);
        }
    }
  }


}
