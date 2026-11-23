const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT='/data/workspace/Vite分模块工程',PORT=8911,HOST='http://127.0.0.1:'+PORT;
const M={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/dist/index.html';fs.readFile(path.join(ROOT,p),(e,b)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':M[path.extname(p)]||'application/octet-stream'});r.end(b)})});
const 取=async(p,url)=>{
 await p.goto(HOST+url,{waitUntil:'load',timeout:60000});await p.waitForTimeout(1300);
 return p.evaluate(()=>{
  const T=window.TPL,L=T._layers();
  return {
   层数:L.length,
   层id:L.map(x=>x.id),
   DOM带id:[...document.querySelectorAll('style[id],script[id]')].map(e=>e.id),
   注册表:(window.__WL_LAYER_REGISTRY__||[]).length,
   层检查:T._layersCheck().ok,
   回归:(()=>{const x=T._regressionRun();return {pass:x.pass,total:x.total,failed:(x.failed||[]).map(y=>y.id)}})(),
   MOD:(()=>{try{const m=window.__MOD__.自检();return {通过:m.通过,失败:m.项.filter(x=>!x.通过).map(x=>x.名)}}catch(e){return null}})(),
  };
 });
};
(async()=>{
 await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const b=await chromium.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'/usr/bin/google-chrome-stable',args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage();let errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.route('**/*',x=>x.request().url().startsWith(HOST)?x.continue():x.abort());
 const A=await 取(p,'/对账/基线原件.html');
 const B=await 取(p,'/dist/index.html');
 console.log('页面错误',JSON.stringify(errs));
 console.log('基线页 层数',A.层数,'层检查',A.层检查,'回归',JSON.stringify(A.回归));
 console.log('构建页 层数',B.层数,'层检查',B.层检查,'回归',JSON.stringify(B.回归),'注册表',B.注册表,'MOD',JSON.stringify(B.MOD));
 console.log('层数一致',A.层数===B.层数,'层id逐项一致',JSON.stringify(A.层id)===JSON.stringify(B.层id));
 if(JSON.stringify(A.层id)!==JSON.stringify(B.层id)){
   console.log('仅基线有',JSON.stringify(A.层id.filter(x=>!B.层id.includes(x))));
   console.log('仅构建有',JSON.stringify(B.层id.filter(x=>!A.层id.includes(x))));
   for(let i=0;i<Math.min(A.层id.length,B.层id.length);i++) if(A.层id[i]!==B.层id[i]){console.log('首个顺序差异 @',i,A.层id[i],'vs',B.层id[i]);break}
 }
 console.log('基线 DOM带id',A.DOM带id.length,'构建 DOM带id',B.DOM带id.length);
 await b.close();srv.close();
})().catch(e=>{console.error('FATAL',e);srv.close();process.exit(1)});
