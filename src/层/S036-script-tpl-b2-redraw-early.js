

(function(){
'use strict';
if(window.__WL_B2_EARLY__)return;
window.__WL_B2_EARLY__=1;


var TC=(window.Node&&Object.getOwnPropertyDescriptor(Node.prototype,'textContent'))||null;
if(TC&&TC.set&&TC.configurable){
  Object.defineProperty(Node.prototype,'textContent',{
    configurable:true,enumerable:TC.enumerable,get:TC.get,
    set:function(v){
      var nv=(v==null?'':String(v));
      try{
        
        var plain=(this.nodeType===3)||
          (this.nodeType===1&&this.childNodes.length===1&&this.firstChild.nodeType===3);
        if(plain&&this.textContent===nv){
          if(window.__WL_REDRAW__)window.__WL_REDRAW__.shortCircuits++;
          return;
        }
      }catch(e){}
      return TC.set.call(this,v);
    }
  });
}


function wrap(proto,name){
  if(!proto||typeof proto[name]!=='function')return;
  var orig=proto[name];
  proto[name]=function(){
    try{
      var g=window.__WL_B2_GATE__;
      if(g&&g(this,name))return;     
    }catch(e){}
    return orig.apply(this,arguments);
  };
}
wrap(window.HTMLElement&&HTMLElement.prototype,'focus');
wrap(window.HTMLInputElement&&HTMLInputElement.prototype,'select');
wrap(window.HTMLTextAreaElement&&HTMLTextAreaElement.prototype,'select');
})();
