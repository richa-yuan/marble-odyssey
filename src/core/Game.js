// 游戏主控制器:渲染管线 / 关卡加载 / 状态机 / 触发判定 / HUD 联动
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

import { PhysicsWorld } from './PhysicsWorld.js'
import { LevelBuilder } from './LevelBuilder.js'
import { CameraRig } from './CameraRig.js'
import { Input } from './Input.js'
import { AudioMgr } from './Audio.js'
import { makeSky, makeStars, makeAurora, updateSkyObjects } from './Sky.js'
import { AmbientParticles, BurstPool, BallTrail } from './Particles.js'
import { TiltControl } from './Tilt.js'
import { Ball } from '../entities/Ball.js'
import { UI } from '../ui/UI.js'
import { LEVELS } from '../levels/index.js'

const STATE = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', WIN: 'win' }

// 移动端检测:触屏或窄屏
const IS_MOBILE = (typeof window !== 'undefined') &&
  (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)

export class Game {
  constructor() {
    this.state = STATE.MENU
    this.levelIndex = 0
    this.time = 0
    this.levelTime = 0
    this.gemCount = 0
    this.gemTotal = 0
    this.streak = 0
    this.streakTimer = 0
    this.isMobile = IS_MOBILE
    this.particleScale = IS_MOBILE ? 0.55 : 1
    this._resScale = 1
    this._fpsAcc = 0
    this._fpsN = 0
    this._fpsCheckT = 0
    this._sunDir = new THREE.Vector3(0.4, 0.6, -0.5).normalize()
    this._shadowCenter = new THREE.Vector3()

    // 渲染器(移动端:降像素比,后期统一低分辨率)
    const canvas = document.getElementById('game-canvas')
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this._basePixelRatio = Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2)
    this.renderer.setPixelRatio(this._basePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.85

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000)
    this._updateFov()

    // 后期:bloom + 输出
    this.composer = new EffectComposer(this.renderer)
    this.composer.setPixelRatio(this._basePixelRatio)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.55, 0.82)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())

    // 环境反射
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.12

    // 灯光:阴影相机跟随滚珠,小范围高清晰度(移动端 1024 / 桌面 2048)
    this.hemiLight = new THREE.HemisphereLight('#ffffff', '#444444', 0.6)
    this.scene.add(this.hemiLight)
    this.sunLight = new THREE.DirectionalLight('#ffffff', 2.4)
    this.sunLight.castShadow = true
    const shadowMapSize = IS_MOBILE ? 1024 : 2048
    this.sunLight.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    this.sunLight.shadow.camera.near = 10
    this.sunLight.shadow.camera.far = 160
    const S = IS_MOBILE ? 20 : 24
    this.sunLight.shadow.camera.left = -S
    this.sunLight.shadow.camera.right = S
    this.sunLight.shadow.camera.top = S
    this.sunLight.shadow.camera.bottom = -S
    this.sunLight.shadow.bias = -0.0004
    this.sunLight.shadow.normalBias = 0.03
    this.scene.add(this.sunLight)
    this.scene.add(this.sunLight.target)

    // 子系统
    this.input = new Input(canvas)
    this.tilt = new TiltControl()
    this.audio = new AudioMgr()
    this.input.audioUnlockCb = () => this.audio.ensure()
    this.cameraRig = new CameraRig(this.camera)
    this.ui = new UI(this)
    this.trail = null
    this.burst = null
    this.ambient = null
    this.skyObjects = []

    // 关卡运行时
    this.physics = null
    this.level = null
    this.ball = null

    window.addEventListener('resize', () => this._onResize())
    this._bindGlobalKeys()

    // 启动:加载第一关作菜单背景
    this.loadLevel(0, true)
    this.cameraRig.beginOrbit(new THREE.Vector3(0, 2, 8))

    this._last = performance.now()
    requestAnimationFrame((t) => this._frame(t))
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight
    this.camera.aspect = w / h
    this._updateFov()
    this.renderer.setSize(w, h)
    this.composer.setPixelRatio(this._basePixelRatio * this._resScale)
    this.composer.setSize(w, h)
  }

  // 竖屏时拉宽视场,保证前方道路可见
  _updateFov() {
    const aspect = this.camera.aspect
    this.camera.fov = aspect < 0.75 ? 72 : aspect < 1.1 ? 64 : 55
    this.camera.updateProjectionMatrix()
  }

  _bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.audio.setMuted(!this.audio.muted)
        this.ui.updateMute(this.audio.muted)
      }
    })
  }

  // ---------------- 关卡加载 ----------------
  loadLevel(index, asMenuBackdrop = false) {
    this.levelIndex = index
    const cfg = LEVELS[index]

    // 清理旧关卡
    this._disposeLevel()

    // 物理世界
    this.physics = new PhysicsWorld([0, cfg.gravity, 0])

    // 场景氛围
    this.scene.fog = new THREE.FogExp2(cfg.fog.color, cfg.fog.density)
    this.scene.background = new THREE.Color(cfg.sky.horizon)
    this.hemiLight.color.set(cfg.light.hemi[0])
    this.hemiLight.groundColor.set(cfg.light.hemi[1])
    this.hemiLight.intensity = cfg.light.hemi[2]
    this.sunLight.color.set(cfg.light.color)
    this.sunLight.intensity = cfg.light.intensity
    this.bloom.strength = cfg.bloom

    // 天空组
    const sky = makeSky(cfg.sky)
    this.scene.add(sky)
    this.skyObjects.push(sky)
    if (cfg.stars) {
      const stars = makeStars(Math.round((index === 5 ? 1500 : 800) * Math.max(0.5, this.particleScale)))
      this.scene.add(stars)
      this.skyObjects.push(stars)
    }
    if (cfg.aurora) {
      const aur = makeAurora()
      this.scene.add(aur)
      this.skyObjects.push(aur)
    }

    // 阳光方向对齐天空太阳(阴影相机改为跟随滚珠,这里只存方向)
    this._sunDir.set(...cfg.sky.sunDir).normalize()
    this._shadowCenter.set(4, 0, 55)

    // 关卡本体
    this.level = new LevelBuilder(this.scene, this.physics, cfg.theme)
    cfg.build(this.level)
    this.gemTotal = this.level.gems.length

    // 粒子(移动端减少数量)
    const ambCfg = { ...cfg.ambient, count: Math.max(60, Math.round(cfg.ambient.count * this.particleScale)) }
    this.ambient = new AmbientParticles(ambCfg)
    this.scene.add(this.ambient.points)
    this.burst = new BurstPool(this.scene)
    this.trail = new BallTrail(this.scene)
    this.trail.setColor(cfg.trail)

    // 滚珠
    this.ball = new Ball(this.scene, this.physics, this.level.spawnPos, this.trail)

    // UI / 状态
    this.gemCount = 0
    this.levelTime = 0
    this.ui.setLevelInfo(cfg, this.gemTotal)
    this.level.portalRef.setActive(false)

    if (asMenuBackdrop) {
      this.state = STATE.MENU
    } else {
      this.state = STATE.PLAYING
      this.ui.hideMenu()
      this.ui.showHUD(true)
      this.cameraRig.beginIntro(this.ball.body.position)
      this.audio.ambient(cfg.music)
      this.ui.toast(cfg.name + ' · ' + cfg.en, 2200)
      if (this.isMobile && !this._touchHintShown) {
        this._touchHintShown = true
        setTimeout(() => this.ui.toast('左侧摇杆移动 · 右侧跳跃 · 拖动屏幕转视角', 3200), 2300)
      }
    }
  }

  _disposeLevel() {
    if (this.level) {
      this.level.dispose()
      this.level = null
    }
    if (this.ball) {
      this.scene.remove(this.ball.mesh)
      this.scene.remove(this.ball.core)
      this.ball.dispose()
      this.ball = null
    }
    if (this.ambient) { this.scene.remove(this.ambient.points); this.ambient.dispose(); this.ambient = null }
    if (this.burst) { this.scene.remove(this.burst.points); this.burst.dispose(); this.burst = null }
    if (this.trail) { this.scene.remove(this.trail.points); this.trail.dispose(); this.trail = null }
    for (const o of this.skyObjects) this.scene.remove(o)
    this.skyObjects = []
    // 清理动态/静态物理体
    if (this.physics) {
      for (const b of [...this.physics.world.bodies]) this.physics.world.removeBody(b)
      this.physics = null
    }
  }

  // ---------------- 状态切换 ----------------
  startLevel(index) {
    this.audio.ensure()
    this.loadLevel(index)
  }

  restartLevel() {
    this.loadLevel(this.levelIndex)
  }

  toMenu() {
    this.audio.stopAmbient()
    this.loadLevel(this.levelIndex, true)
    this.cameraRig.beginOrbit(new THREE.Vector3(0, 2, 8))
    this.ui.showMenu()
  }

  pause() {
    if (this.state !== STATE.PLAYING) return
    this.state = STATE.PAUSED
    this.ui.showPause(true)
  }

  resume() {
    if (this.state !== STATE.PAUSED) return
    this.state = STATE.PLAYING
    this.ui.showPause(false)
  }

  togglePause() {
    this.state === STATE.PAUSED ? this.resume() : this.pause()
  }

  respawn() {
    if (!this.ball) return
    this.ball.respawn()
    this.audio.fall()
    this.ui.flashVignette()
    this.cameraRig.shake(0.25)
    this.streak = 0
  }

  onWin() {
    this.state = STATE.WIN
    this.audio.win()
    this.burst.burst(this.ball.body.position, LEVELS[this.levelIndex].theme.accent, 60, 6)
    this.cameraRig.shake(0.2)
    const best = this.ui.saveBest(this.levelIndex, this.levelTime, this.gemCount, this.gemTotal)
    this.ui.showWin(this.levelTime, this.gemCount, this.gemTotal, best, this.levelIndex, LEVELS.length)
  }

  // ---------------- 主循环 ----------------
  _frame(now) {
    requestAnimationFrame((t) => this._frame(t))
    const dt = Math.min((now - this._last) / 1000, 0.05)
    this._last = now
    this.time += dt

    this.input.sampleMove()
    this.input.pollGamepad(dt)
    // 重力感应:无主动输入时接管方向(平滑过渡,避免抖动)
    if (this.tilt.enabled && !this.input.isManualControl()) {
      const k = 1 - Math.exp(-dt * 12)
      this.input.move.x += (this.tilt.move.x - this.input.move.x) * k
      this.input.move.z += (this.tilt.move.z - this.input.move.z) * k
    }

    // 全局按键
    if (this.input.pausePressed && this.state !== STATE.MENU && this.state !== STATE.WIN) this.togglePause()
    if (this.input.respawnPressed && this.state === STATE.PLAYING) this.respawn()

    const playing = this.state === STATE.PLAYING

    if (playing && this.ball && this.level) {
      this.levelTime += dt
      this._updateGameplay(dt)
    }

    // 通用更新
    if (this.level) {
      if (this.state !== STATE.PAUSED) {
        for (const u of this.level.updaters) u.update(dt, this.time)
        for (const m of this.level.movers) m.update(dt)
        this.level.portalRef.update(dt, playing ? this.ball.body.position : null, playing ? () => this.onWin() : null)
      }
    }
    if (this.ball && (this.state === STATE.PLAYING || this.state === STATE.WIN)) {
      if (this.state !== STATE.PAUSED) this.ball.sync(dt, this.time)
    }
    if (this.ambient && this.state !== STATE.PAUSED) this.ambient.update(dt)
    if (this.burst && this.state !== STATE.PAUSED) this.burst.update(dt)

    updateSkyObjects(this.scene, this.time)
    this.cameraRig.update(
      dt,
      this.ball ? this.ball.body.position : new THREE.Vector3(0, 2, 0),
      this.ball ? this.ball.body.velocity : new THREE.Vector3(),
      this.state === STATE.PLAYING ? this.input : null
    )

    if (this.state === STATE.PLAYING) this.ui.updateHUD(this.levelTime, this.gemCount)

    // 阴影相机跟随滚珠(小范围 → 高清晰度)
    if (this.ball) this._shadowCenter.set(this.ball.body.position.x, this.ball.body.position.y, this.ball.body.position.z)
    else this._shadowCenter.lerp(new THREE.Vector3(4, 0, 55), Math.min(1, dt * 2))
    this.sunLight.position.copy(this._shadowCenter).addScaledVector(this._sunDir, 60)
    this.sunLight.target.position.copy(this._shadowCenter)

    // 自适应分辨率:帧率过低则逐步降档,回升则升档
    this._fpsAcc += dt; this._fpsN++
    this._fpsCheckT += dt
    if (this._fpsCheckT >= 2.5 && this._fpsN > 10) {
      const avg = this._fpsN / this._fpsAcc
      if (avg < 34 && this._resScale > 0.6) {
        this._resScale = Math.max(0.6, this._resScale - 0.15)
        this.composer.setPixelRatio(this._basePixelRatio * this._resScale)
        this.composer.setSize(window.innerWidth, window.innerHeight)
      } else if (avg > 56 && this._resScale < 1) {
        this._resScale = Math.min(1, this._resScale + 0.15)
        this.composer.setPixelRatio(this._basePixelRatio * this._resScale)
        this.composer.setSize(window.innerWidth, window.innerHeight)
      }
      this._fpsAcc = 0; this._fpsN = 0; this._fpsCheckT = 0
    }

    this.composer.render()
    this.input.endFrame()
  }

  _updateGameplay(dt) {
    const ball = this.ball

    // 操控
    const { jumped, landed } = ball.applyControl(this.input, this.cameraRig.yaw, dt, this.physics)
    if (jumped) this.audio.jump()
    if (landed) this.audio.land()

    // 物理
    this.physics.step(dt)

    const pos = new THREE.Vector3(ball.body.position.x, ball.body.position.y, ball.body.position.z)

    // 宝石
    for (const gem of this.level.gems) {
      if (!gem.collected && gem.checkAndCollect(pos)) {
        this.gemCount++
        this.streakTimer = 2.2
        this.audio.collect(this.streak++)
        this.burst.burst(gem.pos, LEVELS[this.levelIndex].theme.gem, 24, 4)
        this.ui.popGem()
        if (this.gemCount === this.gemTotal) {
          this.level.portalRef.setActive(true)
          this.ui.toast('💎 全部宝石收集!传送门已开启', 2600)
          this.audio.check()
        } else if (this.gemTotal - this.gemCount > 0) {
          this.ui.toast(`💎 ${this.gemCount} / ${this.gemTotal}`, 900)
        }
      }
    }
    this.streakTimer -= dt
    if (this.streakTimer <= 0) this.streak = 0

    // 检查点
    for (const cp of this.level.checkpoints) {
      if (cp.check(pos)) {
        ball.setSpawn(cp.pos)
        this.audio.check()
        this.ui.toast('✓ 检查点已激活', 1400)
        this.burst.burst(cp.pos, '#57e0a2', 18, 3)
      }
    }

    // 弹射台 / 碰碰球
    for (const pad of this.level.pads) {
      if (pad.check(pos, ball.body, dt)) {
        this.audio.pad()
        this.burst.burst(pad.pos, LEVELS[this.levelIndex].theme.pad, 14, 3)
      }
    }
    for (const b of this.level.bumpers) {
      if (b.check(pos, ball.body, dt)) {
        this.audio.bounce()
        this.burst.burst(b.pos, LEVELS[this.levelIndex].theme.bumper, 16, 3.5)
        this.cameraRig.shake(0.12)
      }
    }

    // 坠落
    if (pos.y < this.level.killYPos) this.respawn()
  }
}
