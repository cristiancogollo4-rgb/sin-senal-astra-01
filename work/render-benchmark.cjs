const { chromium } = require('C:/Users/LENOVO LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1100,height:750}});
    await page.route('**/app.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
    await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});
    const result=await page.evaluate(async()=>{
      const {createFlightRenderer}=await import('/flight-renderer.mjs'); const {createGame}=await import('/game-core.mjs');
      const mount=document.querySelector('#app'); mount.style.cssText='width:960px;height:540px;padding:0';
      const world=createFlightRenderer();world.attach(mount);const game=createGame();
      for(let i=0;i<10;i++){world.draw(game,1/60);await new Promise(requestAnimationFrame);}
      const before=performance.now();const frames=45;
      for(let i=0;i<frames;i++){game.travel+=29/60;world.draw(game,1/60);await new Promise(requestAnimationFrame);}
      const elapsed=performance.now()-before;const metrics=world.metrics();world.dispose();
      return {frames,elapsedMs:Math.round(elapsed),averageFrameMs:Math.round(elapsed/frames),...metrics};
    });console.log(JSON.stringify(result));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
