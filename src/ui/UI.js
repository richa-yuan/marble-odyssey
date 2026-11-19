// UI:主菜单 / HUD / 暂停 / 通关面板 / toast
import * as THREE from 'three'
import { LEVELS } from '../levels/index.js'

const ORBIT_CENTERS = [
  [0, 2, 6], [0, 2, 6], [0, 1, 6], [0, 5, 6], [0, 2, 6],
]

const BEST_KEY = 'marble-odyssey-best-v1'

function loadBests() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} }
}
function fmt(t) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  const d = Math.floor((t * 10) % 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`
}

export class UI {
  constructor(game) {
    this.game = game
    this.selected = 0
    this._toastTimer = null

    this.$menu = document.getElementById('menu')
    this.$hud = document.getElementById('hud')
    this.$pause = document.getElementById('pause')
    this.$win = document.getElementById('win')
    this.$levelGrid = document.getElementById('level-grid')
    this.$toast = document.getElementById('toast')
    this.$vignette = document.getElementById('vignette')
    this.$gemCount = document.getElementById('gem-count')
    this.$levelName = document.getElementById('hud-level-name')
    this.$timer = document.getElementById('hud-timer')
    this.$touch = document.getElementById('touch-ui')

    this._buildMenu()
    this._bindButtons()
    this._detectTouch()
    this.showMenu()
  }

  _detectTouch() {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) this.$touch.classList.remove('hidden')
  }

  _bindButtons() {
    document.getElementById('btn-start').addEventListener('click', () => {
      this.$menu.classList.add('hidden')
      this.game.startLevel(this.selected)
    })
    document.getElementById('btn-resume').addEventListener('click', () => this.game.resume())
    document.getElementById('btn-restart').addEventListener('click', () => { this.$pause.classList.add('hidden'); this.game.restartLevel() })
    document.getElementById('btn-to-menu').addEventListener('click', () => { this.$pause.classList.add('hidden'); this.game.toMenu() })
    document.getElementById('btn-next').addEventListener('click', () => {
      this.$win.classList.add('hidden')
      const next = Math.min(this.game.levelIndex + 1, LEVELS.length - 1)
      this.game.startLevel(next)
    })
    document.getElementById('btn-win-retry').addEventListener('click', () => { this.$win.classList.add('hidden'); this.game.restartLevel() })
    document.getElementById('btn-win-menu').addEventListener('click', () => { this.$win.classList.add('hidden'); this.game.toMenu() })
    document.getElementById('btn-mute').addEventListener('click', () => {
      this.game.audio.setMuted(!this.game.audio.muted)
      this.updateMute(this.game.audio.muted)
    })
  }

  _buildMenu() {
    const bests = loadBests()
    this.$levelGrid.innerHTML = ''
    LEVELS.forEach((lv, i) => {
      const best = bests[lv.id]
      const card = document.createElement('button')
      card.className = 'level-card' + (i === this.selected ? ' selected' : '')
      card.style.setProperty('--lc1', (lv.card?.[0] || '#4aa8ff') + '55')
      card.innerHTML = `
        <div class="lc-num">LEVEL ${String(i + 1).padStart(2, '0')}</div>
        <div class="lc-name">${lv.name}</div>
        <div class="lc-en">${lv.en}</div>
        <div class="lc-best ${best ? 'done' : ''}">${best ? `⭐ 最佳 ${fmt(best.time)}` : '未挑战'}</div>
      `
      card.addEventListener('click', () => {
        this.selected = i
        this.$levelGrid.querySelectorAll('.level-card').forEach((c, j) => c.classList.toggle('selected', j === i))
        // 切换背景预览
        this.game.loadLevel(i, true)
        const c = ORBIT_CENTERS[i] || [0, 2, 6]
        this.game.cameraRig.beginOrbit(new THREE.Vector3(c[0], c[1], c[2]))
      })
      this.$levelGrid.appendChild(card)
    })
  }

  refreshMenu() {
    this._buildMenu()
  }

  showMenu() {
    this.refreshMenu()
    this.$menu.classList.remove('hidden')
    this.$hud.classList.add('hidden')
    this.$pause.classList.add('hidden')
    this.$win.classList.add('hidden')
  }

  hideMenu() {
    this.$menu.classList.add('hidden')
  }

  showHUD(show) {
    this.$hud.classList.toggle('hidden', !show)
  }

  showPause(show) {
    this.$pause.classList.toggle('hidden', !show)
  }

  setLevelInfo(cfg, gemTotal) {
    this.$levelName.textContent = `${cfg.id} · ${cfg.name}`
    this.$gemCount.textContent = `0/${gemTotal}`
  }

  updateHUD(time, gems) {
    this.$timer.textContent = fmt(time)
    this.$gemCount.textContent = `${gems}`
  }

  popGem() {
    this.$gemCount.parentElement.classList.remove('pop')
    void this.$gemCount.parentElement.offsetWidth
    this.$gemCount.parentElement.classList.add('pop')
  }

  updateMute(muted) {
    document.getElementById('btn-mute').textContent = muted ? '🔇' : '🔊'
  }

  toast(text, duration = 1500) {
    this.$toast.textContent = text
    this.$toast.classList.add('show')
    clearTimeout(this._toastTimer)
    this._toastTimer = setTimeout(() => this.$toast.classList.remove('show'), duration)
  }

  flashVignette() {
    this.$vignette.classList.add('flash')
    setTimeout(() => this.$vignette.classList.remove('flash'), 260)
  }

  saveBest(levelIndex, time, gems, total) {
    const bests = loadBests()
    const lv = LEVELS[levelIndex]
    const prev = bests[lv.id]
    const record = { time, gems, total, full: gems === total }
    if (!prev || time < prev.time) {
      bests[lv.id] = record
      localStorage.setItem(BEST_KEY, JSON.stringify(bests))
      return { time, isNew: true, full: record.full }
    }
    return { time: prev.time, isNew: false, full: prev.full || record.full }
  }

  showWin(time, gems, total, best, levelIndex, totalLevels) {
    document.getElementById('win-time').textContent = fmt(time)
    document.getElementById('win-gems').textContent = `${gems}/${total}${gems === total ? ' ✨' : ''}`
    document.getElementById('win-best').textContent = fmt(best.time) + (best.isNew ? ' 🎉新纪录' : '')
    document.getElementById('btn-next').style.display = levelIndex < totalLevels - 1 ? '' : 'none'
    this.$win.classList.remove('hidden')
    this.$hud.classList.add('hidden')
  }
}
