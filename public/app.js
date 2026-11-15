import {createGame, stepGame, activatePowerup, POWERUPS, POWERUP_TYPES, WEAPONS, PORTS, ZONES, addEntity, PLAYER_Z} from './game-core.mjs';
import {createAudio} from './audio.mjs';

const app=document.querySelector('#app'), help=document.querySelector('#help-dialog'), settingsDialog=document.querySelector('#settings-dialog');
const keys=new Set(), requests=[], audio=createAudio();
const reducedPreference=matchMedia('(prefers-reduced-motion: reduce)').matches;
const SKINS=[{id:'astra',name:'Astra · original',color:'#5f819c',score:0},{id:'solar',name:'Solar · 1500 puntos',color:'#b17a3c',score:1500},{id:'umbra',name:'Umbra · 5000 puntos',color:'#8572bd',score:5000}];
let world, game=createGame(), view='title', highScore=readNumber('astra01-final-record'), settings=readSettings();
let lastTime=performance.now(), hudTime=0, lastStatus='', fatalError='', toastUntil=0, pickupUntil=0;
const slotFlashes=new Map();
let pickupCoins=0,pickupPoints=0,pickupLastTime=0,pickupPowerUntil=0,runSaved=false,autoFluid=false,slowFrames=0;
let dialogTrigger=null;
const preview=createGame(); preview.player.x=-.3;preview.player.y=-.65;preview.weapon='triple';
addEntity(preview,'powerup',1.9,1,-16,{powerType:'nmap'});
addEntity(preview,'drone',-2,1.2,-27,{hp:2});
addEntity(preview,'beacon',0,-.7,-14,{portState:'open',discovered:true,scannedUntil:100000});
addEntity(preview,'shard',0,-.7,-8);

function readNumber(key){try{const n=Number(localStorage.getItem(key));return Number.isFinite(n)?Math.max(0,n):0;}catch{return 0;}}
function readSettings(){
  let s={};try{s=JSON.parse(localStorage.getItem('astra01-preferences')||'{}')||{};}catch{}
  const volume=(n,fallback)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;
  return {music:volume(s.music,.22),effects:volume(s.effects,.4),muted:typeof s.muted==='boolean'?s.muted:reducedPreference,reduced:typeof s.reduced==='boolean'?s.reduced:reducedPreference,quality:['auto','normal','fluid'].includes(s.quality)?s.quality:'auto',skin:SKINS.some(k=>k.id===s.skin)?s.skin:'astra'};
}
function skin(){return SKINS.find(s=>s.id===settings.skin&&highScore>=s.score)||SKINS[0];}
function persistSettings(){try{localStorage.setItem('astra01-preferences',JSON.stringify(settings));}catch{}}
function configure(){
  audio.configure(settings);world?.configure({reduced:settings.reduced,quality:settings.quality==='auto'?(autoFluid?'fluid':'normal'):settings.quality});
  game.skinColor=preview.skinColor=skin().color;document.body.classList.toggle('reduced-effects',settings.reduced);
  document.querySelector('#sound-toggle').setAttribute('aria-pressed',String(settings.muted));
  document.querySelector('#sound-toggle').textContent=settings.muted?'Sonido: no':'Sonido: sí';
}
function saveRecord(){
  if(runSaved)return;runSaved=true;highScore=Math.max(highScore,Math.floor(game.score));
  try{localStorage.setItem('astra01-final-record',String(highScore));}catch{}
}
const score=n=>String(Math.floor(n)).padStart(6,'0');
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0');
function icon(name){
  const paths={
    nmap:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12l6-6"/>',
    firewall:'<path d="M12 3l7 3v5c0 5-7 10-7 10S5 16 5 11V6z"/><path d="M8 9h8m-8 4h8m-4-6v9"/>',
    honeypot:'<path d="M12 3L3 20l9-4 9 4z" stroke-dasharray="3 2"/><path d="M12 8v6"/>',
    backup:'<path d="M4 6a8 8 0 1 1-1 9M4 2v5h5"/><path d="M12 7v5l3 2"/>'
  };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+(paths[name]||paths.nmap)+'</svg>';
}
function renderTitle(){
  return `<section class="title-view"><div class="title-copy"><span class="mission-tag">Edición final · Arcade 3D infinito</span><h1>Sin <em>señal.</em><br>Sigue volando.</h1>
  <p>Pilota, esquiva y rompe tu récord. Explora servicios con Nmap, consigue suministros y elige cuándo usar tus defensas.</p>
  <div class="title-actions"><button class="start-button" data-action="start" type="button" ${!world?'disabled':''}>${world?'Despegar':'Preparando motores…'} <span>→</span></button><button class="link-button" data-action="help" type="button">Cómo jugar</button></div>
  <div class="control-strip"><span><kbd>WASD / FLECHAS</kbd> PILOTAR</span><span><kbd>1 2 3 4</kbd> COMODINES</span><span>DISPARO AUTOMÁTICO</span></div>
  <div class="title-meta"><div><span>Vuelo</span><strong>Sin fin</strong></div><div><span>Arsenal</span><strong>3 armas</strong></div><div><span>Tu récord</span><strong>${score(highScore)}</strong></div></div>
  <div class="learning-preview"><span>Reconoce · filtra · distrae · recupera</span>${POWERUP_TYPES.map(t=>`<p style="--power-color:${POWERUPS[t].color}">${icon(t)}${POWERUPS[t].name}</p>`).join('')}</div>
  <p class="hangar-tip">Monedas = puntos. Cruces verdes = reparación. Cápsulas = armas temporales. Sin preguntas ni misiones.</p></div>
  <div class="title-art" id="preview-mount"><div class="art-caption"><span>Astra-01 · Reconocimiento en vuelo</span><strong>Observa. Decide. Sobrevive.</strong></div></div></section>`;
}
function renderGame(){
  return `<section class="flight-view endless-view final-view"><div class="flight-header"><div><span class="mission-tag">Vuelo infinito</span><h1>Corredor <span>Astra-01</span></h1></div><div class="flight-header-actions"><button class="pause-button" data-action="settings" type="button" aria-label="Abrir ajustes">Ajustes</button><button class="pause-button" data-action="fullscreen" type="button">Ampliar</button><button class="pause-button" data-action="pause" id="pause-button" type="button">Pausa · P</button></div></div>
  <div class="flight-frame" id="flight-mount" tabindex="-1">
    <div class="game-hud"><div class="hud-cell score"><span>PUNTOS</span><strong id="hud-score">000000</strong></div><div class="hud-cell combo"><span>COMBO</span><strong id="hud-combo">×1</strong></div><div class="hud-cell"><span>MONEDAS</span><strong id="hud-coins">0</strong></div><div class="hud-cell"><span>TIEMPO</span><strong id="hud-time">00:00</strong></div><div class="hud-cell energy-cell"><span>ENERGÍA</span><div class="energy-bar"><span id="hud-energy-fill"></span></div><strong class="energy-value" id="hud-energy">100%</strong></div></div>
    <div class="weapon-hud"><span>ARMA <strong id="weapon-name">Láser</strong></span><span id="weapon-timer">∞</span><progress id="weapon-progress" max="12" value="0" aria-label="Duración del arma"></progress></div>
    <aside class="scan-panel" id="scan-panel" aria-label="Reconocimiento Nmap"><div class="scan-title">${icon('nmap')}<strong>Nmap</strong><span id="scan-timer">En espera</span></div><p id="scan-summary">1 o Espacio: escanear</p><div id="scan-services"></div></aside>
    <div class="protection-hud" id="protection-hud"></div>
    <div class="flight-hint endless-hint"><strong id="flight-message"></strong></div>
    <div class="pickup-feedback" id="pickup-feedback" role="status" aria-live="polite"></div>
    <div class="powerup-belt" aria-label="Inventario de comodines">${POWERUP_TYPES.map(t=>`<button class="power-slot" id="slot-${t}" data-power="${t}" style="--power-color:${POWERUPS[t].color}" type="button" disabled><span class="slot-key">${POWERUPS[t].key}</span>${icon(t)}<span class="slot-name">${POWERUPS[t].name}</span><strong class="slot-count" id="count-${t}">0</strong><small id="status-${t}">Por recoger</small></button>`).join('')}</div>
    <div class="touch-controls" aria-label="Controles táctiles"><button class="up" data-key="ArrowUp" aria-label="Subir" type="button">↑</button><button class="boost" data-key="Shift" aria-label="Acelerar" type="button">⇥</button><button class="left" data-key="ArrowLeft" aria-label="Izquierda" type="button">←</button><button class="down" data-key="ArrowDown" aria-label="Bajar" type="button">↓</button><button class="right" data-key="ArrowRight" aria-label="Derecha" type="button">→</button></div>
    <div class="damage-vignette" id="damage-vignette" aria-hidden="true"></div><div class="hit-direction" id="hit-direction" aria-hidden="true">▲</div><div id="overlay-root"></div>
  </div><div class="flight-footer"><span><kbd>WASD</kbd> Mover <kbd>1–4</kbd> Comodines <kbd>SHIFT</kbd> Impulso</span><span id="flight-distance"></span></div></section>`;
}
function renderResults(){
  const effectiveness={nmap:game.stats.services+' servicios identificados · '+game.stats.supplies+' suministros obtenidos',firewall:game.stats.filtered+' proyectiles filtrados',honeypot:game.stats.diverted+' ataques desviados',backup:game.stats.restored+' recuperaciones'};
  return `<section class="results-view"><div class="results-heading"><span class="mission-tag">Bitácora de vuelo</span><h1>Una ruta más.<br><em>Una decisión mejor.</em></h1><p>${clock(game.time)} · ${Math.floor(game.travel)} m. Último impacto: ${game.lastHit}.</p></div>
  <div class="results-grid"><section class="score-panel"><h2>Tu puntuación</h2><div class="final-score"><strong>${score(game.score)}</strong><span>puntos</span></div>
  <div class="result-stats"><div><span>Récord</span><strong>${score(highScore)}</strong></div><div><span>Combo máximo</span><strong>×${game.maxCombo}</strong></div><div><span>Monedas</span><strong>${game.stats.coins}</strong></div><div><span>Enemigos destruidos</span><strong>${game.stats.destroyed}</strong></div><div><span>Esquivas ajustadas</span><strong>${game.stats.nearMisses}</strong></div><div><span>Armas recogidas</span><strong>${game.stats.weapons}</strong></div></div>
  <div class="title-actions"><button class="start-button" data-action="start" type="button">Volver a volar →</button><button class="link-button" data-action="home" type="button">Hangar</button></div><p class="analogy-note">Diseños de nave: Solar a 1500 puntos; Umbra a 5000. Solo cambian la apariencia.</p></section>
  <section class="report-panel"><h2>Ciberseguridad en tus decisiones</h2><div class="lesson-results">${POWERUP_TYPES.map(t=>`<article>${icon(t)}<div><strong>${POWERUPS[t].name} · ${game.uses[t]} usos · ${effectiveness[t]}</strong><p>${POWERUPS[t].fact}</p></div></article>`).join('')}</div><p class="analogy-note">Los suministros y el combate son ficción. Este registro describe acciones; no es una evaluación académica. Solo se explora la red simulada autorizada.</p></section></div></section>`;
}
function updateHeader(){
  document.querySelector('#header-high-score').textContent=score(highScore);
  document.querySelector('#header-status').textContent=view==='title'?'HANGAR EN ESPERA':view==='results'?'BITÁCORA DE VUELO':game.status==='paused'?'VUELO EN PAUSA':game.status==='dead'?'SEÑAL INTERRUMPIDA':'VUELO INFINITO';
}
function render(){
  document.body.dataset.view=view;app.innerHTML=view==='title'?renderTitle():view==='results'?renderResults():renderGame();
  if(world&&view!=='results')world.attach(document.querySelector(view==='title'?'#preview-mount':'#flight-mount'));
  bindTouch();updateHeader();if(view==='game'){updateHud();updateOverlay();}
}
function updateOverlay(){
  const root=document.querySelector('#overlay-root');if(!root)return;lastStatus=game.status;
  const b=document.querySelector('#pause-button');b.disabled=game.status==='dead';b.textContent=game.status==='paused'?'Continuar · P':'Pausa · P';
  if(game.status==='playing')root.innerHTML='';
  if(game.status==='paused')root.innerHTML='<div class="game-overlay"><div class="overlay-card"><span class="mission-tag">Vuelo en pausa</span><h2>Retoma tu ruta.</h2><p>El tiempo, las armas y los comodines están detenidos.</p><button class="start-button" data-action="pause" type="button">Continuar →</button><button class="link-button" data-action="help" type="button">Cómo jugar</button><button class="link-button" data-action="settings" type="button">Sonido y gráficos</button><button class="link-button" data-action="home" type="button">Volver al hangar</button></div></div>';
  if(game.status==='dead'){
    saveRecord();root.innerHTML=`<div class="game-overlay"><div class="overlay-card"><span class="mission-tag">${clock(game.time)} · ${Math.floor(game.travel)} m</span><h2>Vuelve a intentarlo.</h2><p>${score(game.score)} puntos · récord ${score(highScore)}.</p><p class="last-hit">Último impacto: ${game.lastHit}.</p><button class="start-button" data-action="start" type="button">Reintentar →</button><button class="link-button" data-action="report" type="button">Ver bitácora</button><button class="link-button" data-action="home" type="button">Hangar</button></div></div>`;
  }
  if(game.status!=='playing')root.querySelector('button')?.focus({preventScroll:true});updateHeader();
}
function updateScan(){
  const active=game.active.nmap>0,panel=document.querySelector('#scan-panel');panel.classList.toggle('is-scanning',active);
  document.querySelector('#scan-timer').textContent=active?Math.ceil(game.active.nmap)+' s':game.inventory.nmap?'Listo':'En espera';
  const beacons=game.entities.filter(e=>e.kind==='beacon'&&e.z<PLAYER_Z).slice(0,3);
  document.querySelector('#scan-summary').textContent=active?'Busca + ABIERTO para obtener suministros':game.inventory.nmap?'1 o Espacio: revela los servicios':'Recoge un comodín Nmap';
  document.querySelector('#scan-services').innerHTML=beacons.map((e,i)=>{
    const known=e.scannedUntil>=game.time,p=known?PORTS[e.portState]:{symbol:'?',label:'SIN ESCANEAR',color:'#a9bacb'};
    const lane=e.x<-.8?'Izq.':e.x>.8?'Der.':'Centro';
    return `<div class="service-row" data-state="${known?e.portState:'unknown'}" style="--port-color:${p.color}"><b>${p.symbol}</b><span>${lane} · ${p.label}</span><small>${Math.max(0,Math.round(PLAYER_Z-e.z))} m</small></div>`;
  }).join('');
}
function updateHud(){
  if(view!=='game')return;
  document.querySelector('#hud-score').textContent=score(game.score);document.querySelector('#hud-combo').textContent='×'+game.combo;
  document.querySelector('#hud-coins').textContent=game.stats.coins;document.querySelector('#hud-time').textContent=clock(game.time);
  document.querySelector('#hud-energy').textContent=game.energy+'%';
  const bar=document.querySelector('#hud-energy-fill');bar.style.width=game.energy+'%';bar.style.background=game.energy<35?'#ff668b':'#62efd3';
  document.querySelector('.energy-cell').classList.toggle('energy-low',game.energy<35);
  for(const t of POWERUP_TYPES){
    const active=t==='backup'?game.backupEnergy>0:game.active[t]>0,b=document.querySelector('#slot-'+t);
    b.disabled=game.status!=='playing'||game.inventory[t]===0||active;b.classList.toggle('is-active',active);b.classList.toggle('is-loaded',game.inventory[t]>0);
    b.setAttribute('aria-label',POWERUPS[t].name+', '+game.inventory[t]+' cargas'+(active?', activo':', tecla '+POWERUPS[t].key));
    document.querySelector('#count-'+t).textContent='×'+game.inventory[t];document.querySelector('#status-'+t).textContent=active?t==='backup'?'Preparado':Math.ceil(game.active[t])+' s':game.inventory[t]?'Activar':'Por recoger';
  }
  document.querySelector('#weapon-name').textContent=WEAPONS[game.weapon].name;document.querySelector('#weapon-name').style.color=WEAPONS[game.weapon].color;
  document.querySelector('#weapon-timer').textContent=game.weaponTime?Math.ceil(game.weaponTime)+' s':'∞';document.querySelector('#weapon-progress').value=game.weaponTime;document.querySelector('#weapon-progress').hidden=!game.weaponTime;
  document.querySelector('#flight-message').textContent=game.messageTime>0?game.message:game.inventory.nmap&&!game.active.nmap?'Balizas delante: usa Nmap con 1 o Espacio.':'Monedas: puntos. Cruz verde: reparación.';
  document.querySelector('#flight-distance').textContent=ZONES[game.zone]+' · '+Math.floor(game.travel)+' m · presión '+game.intensity;
  document.querySelector('#damage-vignette').style.opacity=game.damageFlash;
  const direction=document.querySelector('#hit-direction');direction.style.opacity=game.damageFlash?1:0;
  direction.style.transform='translate(-50%,-50%) rotate('+Math.atan2(game.hitDirection.x,game.hitDirection.y)*180/Math.PI+'deg)';
  document.querySelector('#protection-hud').innerHTML=POWERUP_TYPES.filter(t=>t!=='nmap'&&(t==='backup'?game.backupEnergy>0:game.active[t]>0)).map(t=>'<span style="color:'+POWERUPS[t].color+'">'+icon(t)+POWERUPS[t].name+' · '+(t==='backup'?'Preparado':Math.ceil(game.active[t])+' s')+'</span>').join('');
  updateScan();
}
function message(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');toastUntil=performance.now()+2400;}
function showPickupFeedback(events){
  const collected=events.filter(e=>e.kind==='collect'),feedback=document.querySelector('#pickup-feedback');if(!collected.length||!feedback)return;
  const now=performance.now();if(now-pickupLastTime>900){pickupCoins=0;pickupPoints=0;}pickupLastTime=now;
  for(const e of collected)if(e.coin){pickupCoins++;pickupPoints+=e.points||0;}
  const special=collected.findLast(e=>!e.coin);
  if(!special&&now<pickupPowerUntil){updateHud();return;}
  let color='#ffd17d',text=pickupCoins+' '+(pickupCoins===1?'moneda':'monedas')+' · +'+pickupPoints;
  if(special){
    pickupPowerUntil=now+1500;
    if(special.type){const p=POWERUPS[special.type];text=special.stored===false?p.name+': 2 cargas · puntos extra':p.name+' recogido · tecla '+p.key;color=p.color;const s=document.querySelector('#slot-'+special.type);s?.classList.add('just-collected');if(s)slotFlashes.set(s,now+650);}
    if(special.weapon){text=WEAPONS[special.weapon].name+' equipado · 12 s';color=WEAPONS[special.weapon].color;}
    if(special.repair){text='Reparación · +20 de energía';color='#8df2c0';}
    if(special.supply){text='Servicio abierto · +12 de energía';color='#62efd3';}
  }
  feedback.textContent=text;feedback.style.setProperty('--feedback-color',color);feedback.classList.add('show');pickupUntil=now+1500;updateHud();
}
function start(){
  if(!world)return;game=createGame();game.skinColor=skin().color;runSaved=false;keys.clear();requests.length=0;
  pickupCoins=pickupPoints=pickupLastTime=pickupPowerUntil=pickupUntil=0;slotFlashes.clear();world.reset();view='game';lastStatus='';lastTime=performance.now();render();
  document.querySelector('#flight-mount').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});audio.unlock();
}
function home(){keys.clear();requests.length=0;view='title';audio.update(false);world?.reset();render();}
function pause(force=false){
  if(view!=='game'||game.status==='dead')return;
  if(force&&game.status==='paused')return;
  game.status=game.status==='playing'?'paused':'playing';keys.clear();requests.length=0;audio.update(false);updateOverlay();updateHud();
  if(game.status==='playing'){lastTime=performance.now();document.querySelector('#flight-mount').focus({preventScroll:true});audio.unlock();}
}
function openDialog(dialog,trigger){
  if(view==='game')pause(true);dialogTrigger=trigger||document.activeElement;
  if(dialog===settingsDialog){
    document.querySelector('#music-volume').value=Math.round(settings.music*100);document.querySelector('#effects-volume').value=Math.round(settings.effects*100);
    document.querySelector('#mute-setting').checked=settings.muted;document.querySelector('#reduced-setting').checked=settings.reduced;document.querySelector('#quality-setting').value=settings.quality;
    document.querySelector('#skin-setting').innerHTML=SKINS.map(s=>'<option value="'+s.id+'" '+(highScore<s.score?'disabled':'')+'>'+s.name+'</option>').join('');
    document.querySelector('#skin-setting').value=skin().id;
    document.querySelector('#audio-availability').textContent=audio.available?'El sonido empieza al despegar. Puedes jugar completamente en silencio.':'Audio no disponible: el vuelo y las señales visuales siguen funcionando.';
  }
  if(!dialog.open)dialog.showModal();
}
function bindTouch(){
  app.querySelectorAll('[data-key]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.key));
  });
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button,[data-action]');if(!b)return;
  if(b.dataset.power){requests.push(b.dataset.power);document.querySelector('#flight-mount')?.focus({preventScroll:true});}
  const action=b.dataset.action;
  if(action==='start')start();if(action==='home')home();if(action==='pause')pause();
  if(action==='help')openDialog(help,b);if(action==='settings')openDialog(settingsDialog,b);
  if(action==='close-help')help.close();if(action==='close-settings')settingsDialog.close();
  if(action==='mute'){settings.muted=!settings.muted;persistSettings();configure();audio.unlock();}
  if(action==='report'){saveRecord();view='results';render();app.querySelector('h1')?.scrollIntoView({block:'start'});}
  if(action==='reload')location.reload();
  if(action==='fullscreen')try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('#flight-mount').requestFullscreen();}catch{message('Amplía la ventana del navegador para ver mejor el vuelo.');}
});
document.querySelector('#help-button').addEventListener('click',e=>openDialog(help,e.currentTarget));
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();home();});
for(const dialog of [help,settingsDialog])dialog.addEventListener('close',()=>{if(dialogTrigger?.isConnected)dialogTrigger.focus({preventScroll:true});else document.querySelector('#pause-button')?.focus({preventScroll:true});});
settingsDialog.addEventListener('input',e=>{
  const id=e.target.id;
  if(id==='music-volume')settings.music=Number(e.target.value)/100;
  if(id==='effects-volume')settings.effects=Number(e.target.value)/100;
  if(id==='mute-setting')settings.muted=e.target.checked;
  if(id==='reduced-setting')settings.reduced=e.target.checked;
  if(id==='quality-setting'){settings.quality=e.target.value;autoFluid=false;slowFrames=0;}
  if(id==='skin-setting')settings.skin=e.target.value;
  persistSettings();configure();audio.unlock();
});
function normalizeKey(e){return e.code==='Space'?'Space':e.key.length===1?e.key.toLowerCase():e.key;}
window.addEventListener('keydown',e=>{
  if(help.open||settingsDialog.open||e.target.matches('input,select,textarea'))return;
  const key=normalizeKey(e);
  if(view==='game'&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','1','2','3','4'].includes(key))e.preventDefault();
  if(e.repeat&&['p','Escape','Enter','Space','1','2','3','4'].includes(key))return;
  if(key==='p'||key==='Escape'){pause();return;}
  if(key==='Enter'&&view==='game'&&game.status==='dead'&&!e.target.closest('button')){start();return;}
  if(key==='Enter'&&view==='title'&&!e.target.closest('button,a')){start();return;}
  if(view==='game'&&game.status==='playing'){
    if(key==='Space')requests.push('nmap');const t=POWERUP_TYPES.find(t=>POWERUPS[t].key===key);if(t)requests.push(t);
    keys.add(key);
  }
});
window.addEventListener('keyup',e=>keys.delete(normalizeKey(e)));
window.addEventListener('blur',()=>{keys.clear();if(view==='game'&&game.status==='playing')pause(true);audio.update(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(view==='game'&&game.status==='playing')pause(true);audio.update(false);}});
window.addEventListener('pagehide',()=>audio.dispose());
function loop(now){
  const dt=Math.min(.15,Math.max(0,(now-lastTime)/1000));lastTime=now;
  if(toastUntil&&now>=toastUntil){document.querySelector('#toast').classList.remove('show');toastUntil=0;}
  if(pickupUntil&&now>=pickupUntil){document.querySelector('#pickup-feedback')?.classList.remove('show');pickupUntil=0;}
  for(const [slot,until] of slotFlashes)if(now>=until){slot.classList.remove('just-collected');slotFlashes.delete(slot);}
  if(world&&!fatalError){
    if(view==='title'){preview.travel+=dt*6;world.draw(preview,dt,true);audio.update(false);}
    if(view==='game'){
      const active=game.status==='playing';
      if(active)for(const t of requests.splice(0))activatePowerup(game,t);
      const input={left:keys.has('a')||keys.has('ArrowLeft'),right:keys.has('d')||keys.has('ArrowRight'),up:keys.has('w')||keys.has('ArrowUp'),down:keys.has('s')||keys.has('ArrowDown'),boost:keys.has('Shift')};
      for(let remaining=dt;remaining>0;remaining-=1/60)stepGame(game,input,Math.min(remaining,1/60));
      if(game.events.length){world.consume(game.events);audio.consume(game.events);showPickupFeedback(game.events);game.events.length=0;}
      world.draw(game,active?dt:0);audio.update(game.status==='playing',game.intensity,game.boost);
      if(lastStatus!==game.status)updateOverlay();hudTime+=dt;if(hudTime>.09){updateHud();hudTime=0;}
      if(active&&settings.quality==='auto'&&!autoFluid){slowFrames=dt>.04?slowFrames+1:Math.max(0,slowFrames-1);if(slowFrames>45){autoFluid=true;configure();}}
    }
    if(view==='results')audio.update(false);
  }
  requestAnimationFrame(loop);
}
function showGraphicsError(error){
  fatalError=String(error?.message||error);audio.update(false);
  app.innerHTML='<section class="graphics-error"><span class="mission-tag">No se pudo iniciar el vuelo</span><h1>El 3D necesita un reinicio.</h1><p>Activa la aceleración gráfica del navegador y vuelve a cargar el juego.</p><button class="start-button" data-action="reload" type="button">Volver a intentar</button></section>';
}
document.querySelector('#powerup-guide').innerHTML='<h2 class="guide-heading">Elige tu defensa</h2>'+POWERUP_TYPES.map(t=>`<article style="--power-color:${POWERUPS[t].color}"><h3>${icon(t)}<kbd>${POWERUPS[t].key}</kbd>${POWERUPS[t].name}</h3><p>${POWERUPS[t].effect}</p><strong>${POWERUPS[t].concept}</strong><small>${POWERUPS[t].fact}</small></article>`).join('');
render();configure();
try{const {createFlightRenderer}=await import('./flight-renderer.mjs');world=createFlightRenderer(()=>showGraphicsError(new Error('Contexto 3D perdido')));configure();render();requestAnimationFrame(loop);}catch(e){console.error('No se pudo preparar Astra-01:',e);showGraphicsError(e);}
