// WebAudio 合成音效:零音频素材,全部实时合成
export class AudioMgr {
  constructor() {
    this.ctx = null
    this.master = null
    this.muted = false
    this._padNodes = null
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return false
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return true
  }

  setMuted(m) {
    this.muted = m
    if (this.master) this.master.gain.value = m ? 0 : 0.5
  }

  _env(gainNode, t0, attack, peak, decay) {
    const g = gainNode.gain
    g.setValueAtTime(0.0001, t0)
    g.exponentialRampToValueAtTime(peak, t0 + attack)
    g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay)
  }

  blip(freq, dur = 0.15, type = 'sine', peak = 0.25, slideTo = null) {
    if (!this.ensure() || this.muted) return
    const t0 = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
    this._env(g, t0, 0.008, peak, dur)
    osc.connect(g).connect(this.master)
    osc.start(t0); osc.stop(t0 + dur + 0.05)
  }

  noise(dur = 0.2, freq = 400, peak = 0.2) {
    if (!this.ensure() || this.muted) return
    const t0 = this.ctx.currentTime
    const len = Math.max(1, (this.ctx.sampleRate * dur) | 0)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = freq
    const g = this.ctx.createGain()
    g.gain.value = peak
    src.connect(filter).connect(g).connect(this.master)
    src.start(t0)
  }

  collect(streak = 0) {
    const base = 740 * Math.pow(1.0595, Math.min(streak, 7) * 2)
    this.blip(base, 0.12, 'sine', 0.22)
    setTimeout(() => this.blip(base * 1.5, 0.16, 'sine', 0.18), 70)
  }

  jump()    { this.blip(300, 0.14, 'triangle', 0.16, 520) }
  bounce()  { this.blip(180, 0.22, 'sawtooth', 0.18, 80); this.noise(0.08, 300, 0.1) }
  land()    { this.noise(0.1, 250, 0.14) }
  check()   { this.blip(660, 0.1, 'sine', 0.16); setTimeout(() => this.blip(990, 0.18, 'sine', 0.16), 90) }
  fall()    { this.blip(340, 0.4, 'sawtooth', 0.15, 90) }
  pad()     { this.blip(220, 0.18, 'square', 0.14, 660) }

  win() {
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => setTimeout(() => this.blip(f, 0.32, 'triangle', 0.2), i * 110))
  }

  // 环境底噪 pad:按关卡换和弦
  ambient(chordFreqs) {
    this.stopAmbient()
    if (!this.ensure() || this.muted || !chordFreqs) return
    const t0 = this.ctx.currentTime
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(0.045, t0 + 2.5)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 700; filter.Q.value = 0.8
    const lfo = this.ctx.createOscillator()
    const lfoG = this.ctx.createGain()
    lfo.frequency.value = 0.08; lfoG.gain.value = 220
    lfo.connect(lfoG).connect(filter.frequency)
    lfo.start()
    const oscs = chordFreqs.map((f, i) => {
      const o = this.ctx.createOscillator()
      o.type = i === 0 ? 'sine' : 'triangle'
      o.frequency.value = f
      o.detune.value = (Math.random() - .5) * 14
      o.connect(filter)
      o.start()
      return o
    })
    filter.connect(g).connect(this.master)
    this._padNodes = { g, oscs, lfo }
  }

  stopAmbient() {
    if (!this._padNodes) return
    const { g, oscs, lfo } = this._padNodes
    const t0 = this.ctx.currentTime
    g.gain.cancelScheduledValues(t0)
    g.gain.setValueAtTime(g.gain.value, t0)
    g.gain.linearRampToValueAtTime(0.0001, t0 + 0.8)
    setTimeout(() => { oscs.forEach(o => o.stop()); lfo.stop() }, 900)
    this._padNodes = null
  }
}
