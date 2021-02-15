function ZVue(options) {
    this.$options = options
    this.observe(options.data)
    this.proxy(this)
    let root = document.querySelector(options.el)
    this.compile(root, this)
}
ZVue.prototype.proxy = function (vm) {
    for (let key in vm.$options.data) {
        Object.defineProperty(vm, key, {
            get: function () {
                return vm.$options.data[key]
            },
            set: function (value) {
                vm.$options.data[key] = value
            }
        })
    }
}
ZVue.prototype.observe = function (obj) {
    if (typeof obj != "object") {
        return
    }
    for (let key in obj) {
        this.defineProperty(obj, key, obj[key])
    }
}

ZVue.prototype.defineProperty = function (obj, key, value) {
    if (typeof value == "object") {
        this.observe(value)
    }
    let dep=new Dep()
    Object.defineProperty(obj, key, {
        get: function () {
            Dep.target&&dep.addWatcher(Dep.target)
            return value
        },
        set: function (val) {
            value = val
            //更新
            dep.notify()
        }
    })
}

ZVue.prototype.compile = function (root, vm) {
    root.childNodes.forEach(child => {
        if (child.nodeType == 3 && /\{\{(.*)\}\}/.test(child.textContent)) {
            console.log(RegExp.$1, "文本节点", child.textContent, vm)
            new Watcher(this,RegExp.$1,(key)=>{
                this.textUpdate(child,vm[key])
            })
            this.textUpdate(child,vm[RegExp.$1])
        }
        else if (child.nodeType == 1) {
            let childAttrs = child.attributes
            if (childAttrs.length) {
                Array.from(childAttrs).forEach(attr => {
                    if (attr.name.indexOf("z-") != -1) {
                        let functionName=attr.name.substring(2)
                        this[functionName+"Update"](child,vm[attr.value])
                        new Watcher(this,attr.value,(key)=>{
                            this[functionName+"Update"](child,vm[key])
                        })
                    }
                    else if (attr.name=="@click") {
                        this.$options.methods[attr.value]
                        child.addEventListener("click",()=>{
                            this.$options.methods[attr.value].call(this)
                        })
                    }
                })
            }
            console.log(child, "元素节点",childAttrs)
        }
        if (child.childNodes && child.childNodes.length) {
            this.compile(child, vm)
        }
    })
}
ZVue.prototype.textUpdate=function(node,value){
    node.textContent=value
}

ZVue.prototype.htmlUpdate=function(node,value){
    node.innerHTML=value
}
function Dep(){
    this.watchers=[]
}
Dep.prototype.addWatcher=function(watcher){
    this.watchers.push(watcher)
}
Dep.prototype.notify=function(){
    this.watchers.forEach(wather=>{
        wather.update()
    })
}
function Watcher(vm,key,callback){
    this.callback=callback
    this.vm=vm
    this.key=key
    Dep.target=this
    vm[key]
    Dep.target=null
}
Watcher.prototype.update=function(){
    this.callback.call(this.vm,this.key)
}


