// 表单块 · 公式引擎（按四块重组第一阶段，从 S038 主 IIFE 抽离）
// 零外部依赖：只调用 Math / Number / Object / isFinite 等内建对象。
// 原挂载点 window.__WL_FORMULA__ 仍由 S038 在原位置执行。
export const Formula = (function(){
  function toks(src){
    const out=[], str=String(src==null?'':src); let i=0;
    while(i<str.length){
      const c=str[i];
      if(/\s/.test(c)){i++;continue;}
      if(/[0-9]/.test(c)||(c==='.'&&/[0-9]/.test(str[i+1]||''))){
        let j=i; while(j<str.length&&/[0-9.]/.test(str[j]))j++;
        out.push({t:'num',v:parseFloat(str.slice(i,j))}); i=j; continue;
      }
      if(/[A-Za-z_$]/.test(c)){
        let j=i; while(j<str.length&&/[A-Za-z0-9_$.]/.test(str[j]))j++;
        out.push({t:'id',v:str.slice(i,j)}); i=j; continue;
      }
      const two=str.slice(i,i+2);
      if(['<=','>=','==','!=','&&','||'].indexOf(two)>=0){out.push({t:'op',v:two});i+=2;continue;}
      if('+-*/(),<>!%'.indexOf(c)>=0){out.push({t:'op',v:c});i++;continue;}
      if(c==='"'||c==="'"||c==='&'||c==='|'){i++;continue;}  
      i++;
    }
    return out;
  }
  const num = x => { const n=Number(x); return isFinite(n)?n:0; };
  function roundN(v,n){ const f=Math.pow(10,Math.max(0,Math.min(8,+n||0))); return Math.round((num(v)+Number.EPSILON)*f)/f; }
  function evalExpr(src,ctx,rows,prec){
    const tk=toks(src); let p=0; ctx=ctx||{}; rows=rows||[];
    const peek=()=>tk[p]||{}, eat=v=>{ if(peek().v===v){p++;return true;} return false; };
    const resolve=n=>{
      if(Object.prototype.hasOwnProperty.call(ctx,n))return num(ctx[n]);
      if(n.indexOf('.')>0){ let o=ctx; n.split('.').forEach(q=>{ o=(o&&typeof o==='object')?o[q]:undefined; }); return num(o); }
      return 0;
    };
    function call(name,args){
      const A=args.map(a=>a.val), nm=(args[0]&&args[0].name)||'';
      if(name==='sum'&&nm) return rows.reduce((a,r)=>a+num(r&&r[nm]),0);
      if(name==='round') return roundN(A[0],A[1]);
      if(name==='min') return Math.min.apply(null,A.length?A:[0]);
      if(name==='max') return Math.max.apply(null,A.length?A:[0]);
      if(name==='abs') return Math.abs(num(A[0]));
      if(name==='number') return num(A[0]);
      return 0;
    }
    function primary(){
      const t=peek();
      if(t.t==='num'){p++;return t.v;}
      if(t.t==='id'){
        p++; const name=t.v;
        if(eat('(')){
          const args=[];
          if(peek().v!==')'){
            const st=p, val=expr();
            args.push({val:val,name:(tk[st]&&tk[st].t==='id'&&p===st+1)?tk[st].v:null});
            while(eat(',')) args.push({val:expr()});
          }
          eat(')'); return call(name,args);
        }
        return resolve(name);
      }
      if(t.v==='('){p++;const v=expr();eat(')');return v;}
      if(t.v==='-'){p++;return -primary();}
      if(t.v==='+'){p++;return primary();}
      if(t.v==='!'){p++;return primary()?0:1;}
      p++; return 0;
    }
    function mul(){ let v=primary(); for(;;){ const o=peek().v;
      if(o==='*'){p++;v=v*primary();} else if(o==='/'){p++;const d=primary();v=d?v/d:0;}
      else if(o==='%'){p++;const d=primary();v=d?v%d:0;} else break; } return v; }
    function add(){ let v=mul(); for(;;){ const o=peek().v;
      if(o==='+'){p++;v=v+mul();} else if(o==='-'){p++;v=v-mul();} else break; } return v; }
    function cmp(){ let v=add(); for(;;){ const o=peek().v;
      if(['<','>','<=','>=','==','!='].indexOf(o)<0)break;
      p++; const r=add();
      v=(o==='<'?v<r:o==='>'?v>r:o==='<='?v<=r:o==='>='?v>=r:o==='=='?v===r:v!==r)?1:0; } return v; }
    function land(){ let v=cmp(); while(peek().v==='&&'){p++;const r=cmp();v=(v&&r)?1:0;} return v; }
    function expr(){ let v=land(); while(peek().v==='||'){p++;const r=land();v=(v||r)?1:0;} return v; }
    let out=0; try{ out=expr(); }catch(e){ out=0; }
    if(!isFinite(out))out=0;
    if(prec!==undefined&&prec!==null&&prec!=='')out=roundN(out,prec);
    return out;
  }
  return {eval:evalExpr,round:roundN,tokens:toks};
})();
