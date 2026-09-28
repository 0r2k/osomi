// Paisaje sonoro de la apertura, sintetizado con Web Audio: no usa archivos.
// Siempre opcional: el visitante lo activa y puede silenciarlo en cualquier momento.

const clamp = (v: number, a = -1, b = 1) => Math.max(a, Math.min(b, v));

function noiseBuffer(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function impulse(ctx: AudioContext, seconds: number, decay: number) {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}

export class OpeningAudio {
  private ctx: AudioContext;
  private master: GainNode;
  private reverb: ConvolverNode;
  private tensionFilter: BiquadFilterNode;
  private tensionGain: GainNode;
  private tremolo: GainNode;
  private noiseGain: GainNode;
  private noiseFilter: BiquadFilterNode;
  private padGain: GainNode;
  private padFilter: BiquadFilterNode;
  private noise: AudioBuffer;
  enabled = false;

  constructor() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = impulse(ctx, 3.5, 2.6);
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = .5;
    this.reverb.connect(reverbOut).connect(this.master);

    // Cama de tensión: sierras graves desafinadas; el filtro se abre con el estrés.
    this.tensionFilter = ctx.createBiquadFilter();
    this.tensionFilter.type = 'lowpass';
    this.tensionFilter.frequency.value = 120;
    this.tensionFilter.Q.value = 7;
    this.tensionGain = ctx.createGain();
    this.tensionGain.gain.value = 0;
    for (const f of [55, 58.27, 110.6, 82.4]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f; o.connect(this.tensionFilter); o.start();
    }
    this.tensionFilter.connect(this.tensionGain).connect(this.master);
    const trem = ctx.createOscillator();
    trem.frequency.value = 6.2;
    this.tremolo = ctx.createGain();
    this.tremolo.gain.value = 0;
    trem.connect(this.tremolo).connect(this.tensionGain.gain);
    trem.start();

    // Ruido difuso de ciudad y oficina.
    const noise = ctx.createBufferSource();
    this.noise = noiseBuffer(ctx);
    noise.buffer = this.noise;
    noise.loop = true;
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 700;
    this.noiseFilter.Q.value = .7;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;
    noise.connect(this.noiseFilter).connect(this.noiseGain).connect(this.master);
    noise.start();

    // Calma: acorde de Re mayor (add9) que respira lentamente.
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 900;
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0;
    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.master);
    this.padGain.connect(this.reverb);
    [146.83, 220, 329.63, 369.99, 440].forEach((f, i) => {
      const voice = ctx.createGain();
      voice.gain.value = .12;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = .05 + i * .021;
      const depth = ctx.createGain();
      depth.gain.value = .07;
      lfo.connect(depth).connect(voice.gain);
      lfo.start();
      for (const detune of [0, 3.5]) {
        const o = ctx.createOscillator();
        o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = detune; o.connect(voice); o.start();
      }
      voice.connect(this.padFilter);
    });
  }

  async setEnabled(on: boolean) {
    this.enabled = on;
    const t = this.ctx.currentTime;
    if (on) {
      await this.ctx.resume();
      this.master.gain.setTargetAtTime(.9, this.ctx.currentTime, .4);
    } else {
      this.master.gain.setTargetAtTime(0, t, .15);
    }
  }

  /** Suspende sin perder la preferencia (pestaña oculta, página fuera de vista). */
  async hold(held: boolean) {
    if (!this.enabled) return;
    if (held) await this.ctx.suspend(); else await this.ctx.resume();
  }

  /** Mezcla continua según el estado narrativo (0–1 cada uno). */
  update(stress: number, night: number, calm: number) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime, k = .15, day = 1 - night;
    this.tensionGain.gain.setTargetAtTime(.055 * stress * day, t, k);
    this.tremolo.gain.setTargetAtTime(.03 * stress * stress * day, t, k);
    this.tensionFilter.frequency.setTargetAtTime(110 + stress * 1500 * day, t, k);
    this.noiseGain.gain.setTargetAtTime(.06 * stress * stress * day + .01 * day, t, k);
    this.noiseFilter.frequency.setTargetAtTime(600 + stress * 1800, t, k);
    this.padGain.gain.setTargetAtTime(.2 * calm, t, .6);
    this.padFilter.frequency.setTargetAtTime(500 + calm * 1400, t, .6);
  }

  private voice(pan: number, delay: number) {
    const t = this.ctx.currentTime + delay;
    const out = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = clamp(pan);
    out.connect(panner);
    return { t, out, panner };
  }

  /** Notificación que llega: más disonante cuanto mayor es el estrés. */
  ping(pan: number, index: number, stress: number, delay = 0) {
    if (!this.enabled) return;
    const calmSet = [1174.7, 1318.5, 1480, 1760], tenseSet = [1244.5, 1318.5, 1396.9, 1480, 1864.7];
    const set = stress > .5 ? tenseSet : calmSet;
    const f = set[index % set.length];
    const { t, out, panner } = this.voice(pan, delay);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(.09, t + .005);
    out.gain.exponentialRampToValueAtTime(.0001, t + .45);
    ([[f, 'sine', 1], [f * 2.01, 'sine', .35], [f * 1.5, 'triangle', .12]] as const).forEach(([fr, type, level]) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type; o.frequency.value = fr; g.gain.value = level;
      o.connect(g).connect(out); o.start(t); o.stop(t + .5);
    });
    panner.connect(this.master);
    const send = this.ctx.createGain();
    send.gain.value = .25;
    panner.connect(send).connect(this.reverb);
  }

  /** Notificación insistente del laboratorio: dos tonos brillantes, como un teléfono. */
  notify(pan: number, delay = 0) {
    if (!this.enabled) return;
    ([[1567.98, 0], [1174.66, .11]] as const).forEach(([f, offset]) => {
      const { t, out, panner } = this.voice(pan, delay + offset);
      out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(.16, t + .004);
      out.gain.exponentialRampToValueAtTime(.0001, t + .35);
      for (const [ratio, type, level] of [[1, 'sine', 1], [2, 'triangle', .25], [3.01, 'sine', .08]] as const) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.value = f * ratio; g.gain.value = level;
        o.connect(g).connect(out); o.start(t); o.stop(t + .4);
      }
      panner.connect(this.master);
      const send = this.ctx.createGain(); send.gain.value = .15; panner.connect(send).connect(this.reverb);
    });
  }

  /** Roce de papel al pasar una hoja: ruido filtrado que barre hacia agudos y un leve asentamiento. */
  pageTurn(delay = 0, weight = 1) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource(); src.buffer = this.noise;
    const band = this.ctx.createBiquadFilter(); band.type = 'bandpass'; band.Q.value = .8;
    band.frequency.setValueAtTime(700, t); band.frequency.exponentialRampToValueAtTime(3400, t + .3);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.13 * weight, t + .06); g.gain.exponentialRampToValueAtTime(.0001, t + .45);
    src.connect(band).connect(g).connect(this.master);
    src.start(t, Math.random() * 1.4, .5);
    const thump = this.ctx.createOscillator(), tg = this.ctx.createGain();
    thump.frequency.value = 95;
    tg.gain.setValueAtTime(0, t + .36); tg.gain.linearRampToValueAtTime(.05 * weight, t + .38); tg.gain.exponentialRampToValueAtTime(.0001, t + .55);
    thump.connect(tg).connect(this.master); thump.start(t + .34); thump.stop(t + .6);
  }

  /** La tapa del libro se abre: golpe grave y el roce de la guarda. */
  bookOpen() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(52, t + .3);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .4);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + .45);
    this.pageTurn(.35, 1.3);
  }

  /** Campana suave: una demanda que se deja en pausa. */
  chime(pan: number, index: number, delay = 0, level = .05) {
    if (!this.enabled) return;
    const notes = [1174.7, 987.8, 880, 740, 659.3, 587.3];
    const { t, out, panner } = this.voice(pan, delay);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(level, t + .03);
    out.gain.exponentialRampToValueAtTime(.0001, t + 3);
    const o = this.ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = notes[index % notes.length];
    o.connect(out); o.start(t); o.stop(t + 3.1);
    const wet = this.ctx.createGain(); wet.gain.value = .9; panner.connect(wet).connect(this.reverb);
    const dry = this.ctx.createGain(); dry.gain.value = .4; panner.connect(dry).connect(this.master);
  }

  close() {
    this.enabled = false;
    void this.ctx.close();
  }
}
