const {chromium}=require('C:/Users/LENOVO LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
  const output=path.resolve(__dirname,'../outputs/final-review');fs.mkdirSync(output,{recursive:true});
  try{
    const failed=await browser.newPage();await failed.route('**/app.js',r=>r.abort());await failed.goto('http://localhost:3000/');
    await failed.getByRole('heading',{name:'No llegó la señal.'}).waitFor();assert.ok(await failed.getByRole('button',{name:'Volver a cargar',exact:true}).isVisible());await failed.close();
    const page=await browser.newPage({viewport:{width:1360,height:860},reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{localStorage.setItem('astra01-final-record','5100');localStorage.setItem('astra01-preferences',JSON.stringify({quality:'normal',music:0,effects:0,reduced:false,muted:true}));});
    await page.route('**/app.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.__qa={get game(){return game},core:await import("./game-core.mjs")};'});});
    await page.goto('http://localhost:3000/');await page.getByRole('button',{name:/Despegar/}).waitFor();
    await page.locator('.topbar-actions [data-action="settings"]').click();assert.equal(await page.locator('#skin-setting option:disabled').count(),0);
    await page.locator('#skin-setting').selectOption('solar');await page.getByRole('button',{name:'Guardar y cerrar',exact:true}).click();
    await page.getByRole('button',{name:/Despegar/}).click();await page.waitForFunction(()=>window.__qa.game.skinColor==='#b17a3c');
    await page.evaluate(()=>{
      const q=window.__qa,g=q.game;for(const k of Object.keys(g))if(k.endsWith('Timer'))g[k]=10000;
      g.time=55;g.zone=1;g.theme=1;g.entities=[];g.shots=[];g.enemyShots=[];g.inventory.nmap=1;q.core.activatePowerup(g,'nmap');g.scanStarted=g.time-.5;g.pulse=.8;
      q.core.equipWeapon(g,'pierce');g.fireTimer=0;
      q.core.addEntity(g,'gate',0,0,-58,{gapX:.8,gapY:0,gapWidth:3.3,gapHeight:2.7});
      q.core.addEntity(g,'drone',-2.2,1,-24,{hp:3,warning:.8,scannedUntil:70});
      q.core.addEntity(g,'mine',2.4,-1,-32,{hp:3,scannedUntil:70});
      q.core.addEntity(g,'beacon',1.4,-.7,-16,{portState:'open',discovered:true,scannedUntil:70});
      for(let i=0;i<5;i++)q.core.addEntity(g,'shard',-1.3,.2,-18-i*4);
    });
    await page.waitForTimeout(250);await page.screenshot({path:path.join(output,'glow-combat.png'),fullPage:true});
    await page.getByRole('button',{name:'Ver controles'}).click();await page.getByRole('heading',{name:'Cómo jugar',exact:true}).waitFor();
    assert.ok(await page.getByRole('heading',{name:'Elige tu defensa',exact:true}).isVisible());
    await page.screenshot({path:path.join(output,'help.png'),fullPage:true});await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Continuar →',exact:true}).click();
    const lost=await page.evaluate(()=>{const canvas=document.querySelector('.game-canvas'),gl=canvas.getContext('webgl2'),extension=gl?.getExtension('WEBGL_lose_context');if(extension){extension.loseContext();return true;}return false;});
    if(lost)await page.getByRole('heading',{name:'El 3D necesita un reinicio.'}).waitFor();
    assert.deepEqual(errors,[]);await page.close();
    const silent=await browser.newPage();await silent.addInitScript(()=>{window.AudioContext=window.webkitAudioContext=undefined;});
    await silent.goto('http://localhost:3000/');await silent.getByRole('button',{name:/Despegar/}).click();
    await silent.getByRole('button',{name:'Abrir ajustes',exact:true}).click();assert.match(await silent.locator('#audio-availability').innerText(),/Audio no disponible/);
    await silent.close();
    const adaptive=await browser.newPage();
    await adaptive.addInitScript(()=>{
      localStorage.setItem('astra01-preferences',JSON.stringify({quality:'auto',muted:true}));
      const raf=window.requestAnimationFrame.bind(window);
      // Controlled slow frames exercise the fallback, not a real-hardware FPS benchmark.
      window.requestAnimationFrame=callback=>raf(()=>setTimeout(()=>callback(performance.now()),65));
    });
    await adaptive.route('**/app.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.__adaptive=()=>autoFluid;'});});
    await adaptive.goto('http://localhost:3000/');await adaptive.getByRole('button',{name:/Despegar/}).click();
    await adaptive.waitForFunction(()=>window.__adaptive?.()===true,null,{timeout:20000});await adaptive.close();
    console.log(JSON.stringify({loadFailure:'actionable recovery',unlockedSkin:'selected without gameplay advantage',normalGraphics:'rendered',contextLoss:lost?'recovery shown':'extension unavailable',noAudio:'playable',adaptiveQuality:'fallback activated under controlled slow frames',errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
