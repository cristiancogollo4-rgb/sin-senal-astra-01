// Original synthesized sounds: no downloads, recording or third-party audio.
export function createAudio() {
  let context, musicGain, effectsGain, nextBeat = 0, beat = 0, lastEffect = 0, lastBoost = false;
  let options = {music: .22, effects: .4, muted: false};
  let available = true;
  const notes = [130.81, 164.81, 196, 261.63, 196, 164.81, 146.83, 196];
  function apply() {
    if (!context) return;
    const t = context.currentTime;
    musicGain.gain.setTargetAtTime(options.muted ? 0 : options.music * .3, t, .04);
    effectsGain.gain.setTargetAtTime(options.muted ? 0 : options.effects * .35, t, .025);
  }
  async function unlock() {
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) { available = false; return false; }
        context = new Audio();
        musicGain = context.createGain(); effectsGain = context.createGain();
        musicGain.connect(context.destination); effectsGain.connect(context.destination); apply();
      }
      if (context.state === 'suspended') await context.resume();
      return context.state === 'running';
    } catch { available = false; return false; }
  }
  function tone(frequency, end, duration, type, gain, bus) {
    if (!context || context.state !== 'running') return;
    const at = context.currentTime;
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
    envelope.gain.setValueAtTime(.001, at); envelope.gain.exponentialRampToValueAtTime(gain, at + .008);
    envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
    oscillator.connect(envelope); envelope.connect(bus);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(at); oscillator.stop(at + duration + .01);
  }
  function consume(events) {
    if (!context || context.state !== 'running' || options.muted) return;
    for (const e of events) {
      const t = context.currentTime;
      if (e.kind === 'collect' && e.coin) {
        if (t - lastEffect < .075) continue;
        lastEffect = t; tone(850, 1150, .07, 'sine', .2, effectsGain);
      } else if (e.kind === 'collect') tone(440, e.weapon ? 980 : 1320, .2, 'triangle', .25, effectsGain);
      else if (e.kind === 'powerup') tone(e.type === 'nmap' ? 220 : 330, 1000, .35, 'sine', .25, effectsGain);
      else if (e.kind === 'hit') tone(150, 50, .2, 'triangle', .5, effectsGain);
      else if (e.kind === 'warning') tone(520, 370, .18, 'sine', .24, effectsGain);
      else if (e.kind === 'restore') tone(240, 1200, .5, 'triangle', .3, effectsGain);
      else if (e.kind === 'near') tone(600, 900, .1, 'triangle', .2, effectsGain);
      else if (e.kind === 'destroy' && t - lastEffect > .12) { lastEffect = t; tone(110, 35, .1, 'triangle', .3, effectsGain); }
    }
  }
  function update(active, intensity = 1, boost = false) {
    if (!context || context.state !== 'running') return;
    if (!active) { musicGain.gain.setTargetAtTime(0, context.currentTime, .03); nextBeat = 0; lastBoost = false; return; }
    apply();
    if (boost && !lastBoost && !options.muted) tone(90, 240, .3, 'triangle', .25, effectsGain);
    lastBoost = boost;
    if (!options.music || options.muted) return;
    if (context.currentTime < nextBeat) return;
    nextBeat = context.currentTime + Math.max(.16, .25 - intensity * .007);
    const n = notes[beat++ % notes.length];
    tone(n, n, .14, 'triangle', .3, musicGain);
    if (intensity > 2 && beat % 2 === 0) tone(n * 2, n * 2, .08, 'sine', .15, musicGain);
    if (beat % 4 === 0) tone(100, 40, .13, 'sine', .35, musicGain);
  }
  return {
    unlock, consume, update,
    configure(next) { options = {...options, ...next}; apply(); },
    get available() { return available; },
    get state() { return context?.state || 'not-started'; },
    dispose() { context?.close().catch(() => {}); }
  };
}
