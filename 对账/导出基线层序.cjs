const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT='/data/workspace/Vite分模块工程',PORT=8913,HOST='http://127.0.0.1:'+PORT;
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);fs.readFile(path.join(ROOT,p),(e,b)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':p.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});r.end(b)})});
(async()=>{
 await new Promise(r=>srv.listen(PORT,'127.0.0.1',r));
 const b=await chromium.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'/usr/bin/google-chrome-stable',args:['--no-sandbox','--disable-dev-shm-usage']});
 const p=await b.newPage();await p.route('**/*',x=>x.request().url().startsWith(HOST)?x.continue():x.abort());
 await p.goto(HOST+'/对账/基线原件.html',{waitUntil:'load',timeout:60000});await p.waitForTimeout(1300);
 const r=await p.evaluate(()=>({
   层:window.TPL._layers().map(x=>({i:x.i,tag:x.tag,id:x.id,era:x.era,role:x.role,immutable:x.immutable,note:x.note})),
   冻结时刻DOM:[...document.querySelectorAll('style[id],script[id]')].map(e=>({tag:e.tagName.toLowerCase(),id:e.id})),
 }));
 fs.writeFileSync(path.join(ROOT,'对账/基线冻结层序.json'),JSON.stringify(r,null,2),'utf-8');
 console.log('冻结层',r.层.length,'项；当前 DOM',r.冻结时刻DOM.length,'项');
 console.log('运行时代入的层（不在 TPL._layers() 里）:',r.冻结时刻DOM.filter(x=>!r.层.some(y=>y.id===x.id)).map(x=>x.id));
 await b.close();srv.close();
})().catch(e=>{console.error('FATAL',e);srv.close();process.exit(1)});
