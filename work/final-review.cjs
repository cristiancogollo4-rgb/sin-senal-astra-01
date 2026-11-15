const {chromium}=require('C:/Users/LENOVO LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');

(async()=>{
  const output=path.resolve(__dirname,'../outputs/final-review');fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
  const errors=[],results={};
  async function prepare(page,blockedStorage=false){
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    // Test-only observability: production source contains no debug globals or cheat API.
    await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__qa={get game(){return game},get audio(){return audio},get settings(){return settings},core:await import("./game-core.mjs")};'});});
    await page.addInitScript(({blockedStorage})=>{
      Math.random=()=>.5;
      if(blockedStorage){Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new Error('Storage unavailable');};}
      else localStorage.setItem('astra01-preferences',JSON.stringify({quality:'fluid',muted:false,music:0,effects:.1}));
    },{blockedStorage});
    await page.goto('http://localhost:3000/?version=final',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>!!window.__qa);
  }
  try{
    const page=await browser.newPage({viewport:{width:1380,height:900}});await prepare(page);
    await page.screenshot({path:path.join(output,'hangar.png'),fullPage:true});
    await page.getByRole('button',{name:/Despegar/}).click();
    await page.locator('#slot-nmap:not([disabled])').waitFor({timeout:20000});
    await page.keyboard.press('Space');
    await page.locator('#scan-panel.is-scanning').waitFor();
    await page.locator('.service-row[data-state="open"]').waitFor();
    for(const state of ['closed','filtered'])assert.equal(await page.locator('.service-row[data-state="'+state+'"]').count(),1);
    await page.screenshot({path:path.join(output,'nmap-services.png'),fullPage:true});
    await page.waitForFunction(()=>window.__qa.game.stats.supplies===1,null,{timeout:12000});
    assert.equal(await page.evaluate(()=>window.__qa.audio.state),'running');
    results.naturalRecon=await page.evaluate(()=>({services:window.__qa.game.stats.services,supplies:window.__qa.game.stats.supplies,coins:window.__qa.game.stats.coins}));
    const before=await page.evaluate(()=>window.__qa.game.player.x);await page.keyboard.down('d');await page.waitForTimeout(150);await page.keyboard.up('d');
    assert.ok(await page.evaluate(()=>window.__qa.game.player.x)>before);
    // Controlled fixtures isolate integration behavior from random survival.
    await page.evaluate(()=>{const q=window.__qa,g=q.game;for(const k of Object.keys(g))if(k.endsWith('Timer'))g[k]=10000;g.entities=[];g.shots=[];g.enemyShots=[];g.bursts=[];g.player.x=0;g.player.y=-.7;for(const type of Object.keys(q.core.POWERUPS))q.core.addEntity(g,'powerup',0,-.7,2.5,{powerType:type});});
    await page.waitForFunction(()=>Object.values(window.__qa.game.inventory).every(n=>n>0));
    await page.keyboard.press('2');await page.locator('#slot-firewall.is-active').waitFor();
    await page.evaluate(()=>{const q=window.__qa;q.core.spawnPacket(q.game);q.game.enemyShots[0].z=1.2;});
    await page.waitForFunction(()=>window.__qa.game.stats.filtered>0);
    await page.keyboard.press('3');await page.locator('#slot-honeypot.is-active').waitFor();
    await page.evaluate(()=>{const q=window.__qa;q.core.spawnPacket(q.game);q.game.enemyShots.at(-1).z=-3;});
    await page.waitForFunction(()=>window.__qa.game.stats.diverted>0);
    await page.keyboard.press('4');await page.locator('#status-backup').filter({hasText:'Preparado'}).waitFor();
    await page.evaluate(()=>{const q=window.__qa;q.core.addEntity(q.game,'weapon',0,-.7,2.5,{weaponType:'triple'});q.game.fireTimer=0;});
    await page.locator('#weapon-name').filter({hasText:'Triple'}).waitFor();
    await page.screenshot({path:path.join(output,'triple-and-defenses.png'),fullPage:true});
    await page.keyboard.press('p');await page.getByRole('heading',{name:'Retoma tu ruta.'}).waitFor();
    const frozen=await page.evaluate(()=>({time:window.__qa.game.time,weapon:window.__qa.game.weaponTime,energy:window.__qa.game.energy,score:window.__qa.game.score}));await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(()=>({time:window.__qa.game.time,weapon:window.__qa.game.weaponTime,energy:window.__qa.game.energy,score:window.__qa.game.score})),frozen);
    await page.getByRole('button',{name:'Sonido y gráficos',exact:true}).click();
    await page.locator('#effects-volume').evaluate(el=>{el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#music-volume').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#reduced-setting').check();await page.locator('#quality-setting').selectOption('fluid');
    assert.equal(await page.locator('#skin-setting option:disabled').count(),2);
    await page.screenshot({path:path.join(output,'settings.png'),fullPage:true});
    await page.keyboard.press('Escape');assert.equal(await page.locator('#settings-dialog').isVisible(),false);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('astra01-preferences')).effects),.25);
    await page.getByRole('button',{name:'Continuar →',exact:true}).click();
    await page.evaluate(()=>{const q=window.__qa;q.core.addEntity(q.game,'weapon',0,-.7,2.5,{weaponType:'pierce'});});
    await page.locator('#weapon-name').filter({hasText:'Perforante'}).waitFor();
    await page.evaluate(()=>{const q=window.__qa;q.game.energy=20;q.game.invulnerable=0;q.core.addEntity(q.game,'mine',0,-.7,2.5);});
    await page.waitForFunction(()=>window.__qa.game.stats.restored===1);
    await page.evaluate(()=>{const q=window.__qa;q.game.energy=20;q.game.invulnerable=0;q.core.addEntity(q.game,'mine',0,-.7,2.5);});
    await page.getByRole('heading',{name:'Vuelve a intentarlo.'}).waitFor();
    await page.screenshot({path:path.join(output,'game-over.png'),fullPage:true});
    await page.getByRole('button',{name:'Ver bitácora',exact:true}).click();await page.getByRole('heading',{name:'Ciberseguridad en tus decisiones'}).waitFor();
    assert.match(await page.locator('.report-panel').innerText(),/1 suministros obtenidos/);
    await page.screenshot({path:path.join(output,'report.png'),fullPage:true});
    await page.getByRole('button',{name:'Volver a volar →',exact:true}).click();
    assert.equal(await page.locator('#weapon-name').innerText(),'Láser');assert.equal(await page.locator('#hud-coins').innerText(),'0');
    await page.keyboard.press('p');await page.getByRole('button',{name:'Volver al hangar',exact:true}).click();
    results.desktop='scan / all four powers / both weapons / pause / settings / restore / death / report / restart passed';
    await page.close();

    results.responsive=[];
    for(const viewport of [{width:320,height:640},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]){
      const mobile=await browser.newPage({viewport,hasTouch:true});await prepare(mobile);
      await mobile.getByRole('button',{name:/Despegar/}).click();await mobile.locator('#slot-nmap:not([disabled])').waitFor({timeout:20000});await mobile.locator('#slot-nmap').tap();
      await mobile.locator('#scan-panel.is-scanning').waitFor();
      assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const up=await mobile.getByRole('button',{name:'Subir',exact:true}).boundingBox(),slot=await mobile.locator('#slot-nmap').boundingBox();
      assert.ok(up.width>=44&&up.height>=44&&slot.width>=44&&slot.height>=44);
      const y=await mobile.evaluate(()=>window.__qa.game.player.y),cdp=await mobile.context().newCDPSession(mobile);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:up.x+up.width/2,y:up.y+up.height/2}]});await mobile.waitForTimeout(140);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.ok(await mobile.evaluate(()=>window.__qa.game.player.y)>y);
      await mobile.screenshot({path:path.join(output,'mobile-'+viewport.width+'x'+viewport.height+'.png'),fullPage:true});
      results.responsive.push({viewport,overflow:false,touchMovement:true,minTouch:Math.min(up.width,up.height,slot.width,slot.height)});await mobile.close();
    }
    const blocked=await browser.newPage({viewport:{width:1200,height:800}});await prepare(blocked,true);await blocked.getByRole('button',{name:/Despegar/}).click();await blocked.locator('#slot-nmap:not([disabled])').waitFor({timeout:20000});results.blockedStorage='playable';await blocked.close();
    assert.deepEqual(errors,[]);console.log(JSON.stringify({...results,errors,screenshots:output},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
