// 关卡构建器:声明式 API,一键生成「三渲 mesh + cannon body」
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { fitTexture } from './Textures.js'
import { makeTree, makePine, makeRock, makeCactus, makeObelisk, makeColumn, makeCrystal, makeBuilding, makeIslandBase } from './Decorations.js'
import { Gem, Portal, Checkpoint, JumpPad, Bumper, MovingPlatform, Spinner } from '../entities/Interactives.js'

export class LevelBuilder {
  constructor(scene, physics, theme) {
    this.scene = scene
    this.physics = physics
    this.theme = theme

    this.statics = []        // { mesh, body }
    this.updaters = []       // 带 update(dt, t) 的实体
    this.gems = []
    this.checkpoints = []
    this.pads = []
    this.bumpers = []
    this.movers = []
    this.portalRef = null
    this.spawnPos = [0, 2, 0]
    this.killYPos = -20
    this._textures = []      // 需要释放的克隆贴图
    this._materials = []     // 构建器自建的材质
    this._sceneObjects = []  // 所有加入场景的对象,卸载时统一移除
  }

  _addObj(obj) {
    this.scene.add(obj)
    this._sceneObjects.push(obj)
    return obj
  }

  // 平台材质(供 box 与 mover 共用)
  buildPlatformMats({ size = [3, 0.6, 3], topTex, sideTex, colorTop, colorSide, topRough, sideRough, metal, envMapIntensity } = {}) {
    const [w, h, d] = size
    const topT = this._tex(topTex || this.theme.topTex, w, d)
    const sideT = this._tex(sideTex || this.theme.sideTex, Math.max(w, d), h)
    const rough = topRough ?? this.theme.topRough ?? 0.9
    const metalness = metal ?? this.theme.metal ?? 0.02
    const topMat = new THREE.MeshStandardMaterial({
      map: topT, color: colorTop || '#ffffff',
      roughness: rough, metalness: metalness,
      envMapIntensity: envMapIntensity ?? 0.15,
    })
    const sideMat = new THREE.MeshStandardMaterial({
      map: sideT, color: colorSide || '#ffffff',
      roughness: sideRough ?? rough + 0.05, metalness: metalness,
      envMapIntensity: 0.1,
    })
    this._materials.push(topMat, sideMat)
    // Box 面序:[+x, -x, +y, -y, +z, -z]
    return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]
  }

  // ---------- 静态平台 ----------
  box({ pos = [0, 0, 0], size = [4, 1, 4], rot = null, style = {} } = {}) {
    const [w, h, d] = size
    const geo = new THREE.BoxGeometry(w, h, d)
    const mats = this.buildPlatformMats({ size, ...style })

    const mesh = new THREE.Mesh(geo, mats)
    mesh.position.set(...pos)
    if (rot) mesh.rotation.set(...rot)
    mesh.castShadow = style.noShadow ? false : true
    mesh.receiveShadow = true
    this._addObj(mesh)

    // 霓虹描边
    if (style.neon) {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: style.neon, transparent: true, opacity: 0.95 })
      )
      mesh.add(edges)
    }

    // 物理体
    const body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
      position: new CANNON.Vec3(...pos),
      material: style.ice ? this.physics.matIce : this.physics.matGround,
    })
    if (rot) body.quaternion.setFromEuler(rot[0], rot[1], rot[2])
    this.physics.addBody(body)
    this.statics.push({ mesh, body })

    // 浮岛底座装饰
    if (style.island) {
      const depth = style.island
      const base = makeIslandBase(w, d, depth, style.islandColor || this.theme.islandColor || '#7a5230')
      base.position.set(pos[0], pos[1] - h / 2 - depth / 2 + 0.15, pos[2])
      this._addObj(base)
    }
    return mesh
  }

  // 一块平台 + 上面放东西的语法糖
  platform(x, y, z, w, d, opts = {}) {
    return this.box({ pos: [x, y, z], size: [w, opts.h ?? 1, d], ...opts })
  }

  // ---------- 动态元素 ----------
  gem(pos) {
    const gem = new Gem(this.scene, pos, this.theme.gem || '#ffd76b')
    this.gems.push(gem)
    this.updaters.push(gem)
    this._sceneObjects.push(gem.mesh, gem.ring)
    return gem
  }

  checkpoint(pos) {
    const c = new Checkpoint(this.scene, pos, this.theme.accent2 || '#57e0a2')
    this.checkpoints.push(c)
    this.updaters.push(c)
    this._sceneObjects.push(c.group)
    return c
  }

  pad(pos, power = 17) {
    const p = new JumpPad(this.scene, pos, power, this.theme.pad || '#ff9e4a')
    this.pads.push(p)
    this.updaters.push(p)
    this._sceneObjects.push(p.group)
    return p
  }

  bumper(pos, r = 0.9) {
    const b = new Bumper(this.scene, pos, r, this.theme.bumper || '#ff5a8f')
    this.bumpers.push(b)
    this.updaters.push(b)
    this._sceneObjects.push(b.mesh)
    return b
  }

  portal(pos) {
    this.portalRef = new Portal(this.scene, pos, this.theme.accent || '#7fd0ff')
    this._sceneObjects.push(this.portalRef.group)
    return this.portalRef
  }

  mover(opts) {
    const m = new MovingPlatform(this.scene, this.physics, { theme: this, ...opts })
    this.movers.push(m)
    this.updaters.push(m)
    this._sceneObjects.push(m.mesh)
    return m
  }

  spinner(opts) {
    const s = new Spinner(this.scene, this.physics, opts)
    this.updaters.push(s)
    this._sceneObjects.push(s.mesh)
    return s
  }

  spawn(pos) { this.spawnPos = pos }
  killY(y) { this.killYPos = y }

  // ---------- 装饰物 ----------
  decor(mesh, { pos = [0, 0, 0], rot = null, scale = 1, shadow = false } = {}) {
    mesh.position.set(...pos)
    if (rot) mesh.rotation.set(...rot)
    if (scale !== 1) mesh.scale.setScalar(scale)
    if (shadow) mesh.traverse(o => { if (o.isMesh) { o.castShadow = true } })
    this._addObj(mesh)
    return mesh
  }

  tree(pos, scale = 1) { return this.decor(makeTree(this.theme.treeColor || '#3f9d3a'), { pos, scale, shadow: true }) }
  pine(pos, scale = 1) { return this.decor(makePine(), { pos, scale, shadow: true }) }
  rock(pos, scale = 1) { return this.decor(makeRock(scale), { pos, rot: [0, Math.random() * 6, 0], shadow: true }) }
  cactus(pos, scale = 1) { return this.decor(makeCactus(), { pos, scale, shadow: true }) }
  obelisk(pos, scale = 1) { return this.decor(makeObelisk(scale), { pos, shadow: true }) }
  column(pos, scale = 1) { return this.decor(makeColumn(scale), { pos, rot: [0, Math.random() * 0.4, 0], shadow: true }) }
  crystal(pos, color, scale = 1, emissive) { return this.decor(makeCrystal(color || this.theme.crystal || '#7fd8ff', scale, emissive), { pos }) }
  building(pos, w, h, d, accent) { return this.decor(makeBuilding(w, h, d, accent || this.theme.accent), { pos }) }

  // ---------- 内部工具 ----------
  _tex(src, w, h) {
    const t = fitTexture(src, w, h, this.theme.texScale ?? 0.3)
    this._textures.push(t)
    return t
  }

  dispose() {
    // 先移出场景,再释放资源
    for (const o of this._sceneObjects) this.scene.remove(o)
    this._sceneObjects.length = 0
    for (const s of this.statics) s.mesh.geometry.dispose()
    this._materials.forEach(m => m.dispose())
    this._textures.forEach(t => t.dispose())
    for (const u of this.updaters) u.dispose && u.dispose()
    this.portalRef && this.portalRef.dispose()
    this.movers.forEach(m => m.dispose())
    this.statics.length = 0
    this.updaters.length = 0
    this.gems.length = 0
    this.checkpoints.length = 0
    this.pads.length = 0
    this.bumpers.length = 0
    this.movers.length = 0
  }
}
