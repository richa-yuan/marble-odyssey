// 交互实体:宝石 / 传送门 / 检查点 / 弹射台 / 碰碰球 / 移动平台 / 旋转护栏
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { softDot } from '../core/Textures.js'

// ---------- 宝石 ----------
export class Gem {
  constructor(scene, pos, color = '#ffd76b') {
    this.pos = new THREE.Vector3(...pos)
    this.baseY = this.pos.y
    this.collected = false
    this.collectT = 0
    this.streak = 0

    const geo = new THREE.OctahedronGeometry(0.42)
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.5),
      emissive: color, emissiveIntensity: 1.7,
      metalness: 0.4, roughness: 0.18,
    }))
    this.mesh.position.copy(this.pos)
    scene.add(this.mesh)
    // 底座光环
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.035, 8, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
    )
    this.ring.position.copy(this.pos).setY(this.baseY - 0.42)
    this.ring.rotation.x = Math.PI / 2
    scene.add(this.ring)
  }

  checkAndCollect(ballPos) {
    if (this.collected) return false
    if (this.pos.distanceToSquared(ballPos) < 1.35 * 1.35) {
      this.collected = true
      this.collectT = 0
      return true
    }
    return false
  }

  update(dt, t) {
    if (this.collected) {
      this.collectT += dt * 2.6
      const k = Math.min(1, this.collectT)
      this.mesh.scale.setScalar(1 + k * 1.6)
      this.mesh.material.emissiveIntensity = 1.7 + k * 4
      this.mesh.material.transparent = true
      this.mesh.material.opacity = 1 - k
      this.ring.material.opacity = 0.5 * (1 - k)
      this.ring.scale.setScalar(1 + k * 2)
      if (k >= 1) { this.mesh.visible = false; this.ring.visible = false }
      return
    }
    this.mesh.rotation.y = t * 2.2
    this.mesh.position.y = this.baseY + Math.sin(t * 2.5) * 0.16
    this.ring.rotation.z = t * 1.4
  }

  dispose() {
    this.mesh.geometry.dispose(); this.mesh.material.dispose()
    this.ring.geometry.dispose(); this.ring.material.dispose()
  }
}

// ---------- 传送门 ----------
const PORTAL_SWIRL_FRAG = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform float uActive;
  uniform vec3 uColor;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float a = atan(p.y, p.x);
    float swirl = sin(a * 6.0 + uTime * 3.2 - r * 14.0);
    float rings = sin(r * 26.0 - uTime * 5.0) * 0.5 + 0.5;
    float core = smoothstep(0.5, 0.0, r);
    vec3 col = uColor * (0.35 + rings * 0.5) + uColor * swirl * 0.3;
    float alpha = (0.22 + rings * 0.3 + swirl * 0.12) * uActive + core * 0.35 * uActive;
    gl_FragColor = vec4(col * (0.8 + uActive * 1.4), alpha * smoothstep(0.52, 0.4, r));
  }
`
const PORTAL_SWIRL_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

export class Portal {
  constructor(scene, pos, color = '#7fd0ff') {
    this.pos = new THREE.Vector3(...pos)
    this.active = false
    this.entered = false
    this.color = color

    const g = new THREE.Group()
    g.position.copy(this.pos)

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.16, 12, 48),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.4),
        emissive: color, emissiveIntensity: this.active ? 2.2 : 0.5,
        metalness: 0.6, roughness: 0.3, envMapIntensity: 0.15,
      })
    )
    this.ring.position.y = 1.8
    g.add(this.ring)

    this.disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.34, 48),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 }, uActive: { value: 0.25 }, uColor: { value: new THREE.Color(color) },
        },
        vertexShader: PORTAL_SWIRL_VERT,
        fragmentShader: PORTAL_SWIRL_FRAG,
      })
    )
    this.disc.position.y = 1.8
    g.add(this.disc)

    // 立柱
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#3a4152', metalness: 0.55, roughness: 0.4, envMapIntensity: 0.15 })
    for (const sx of [-1.7, 1.7]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.6, 8), pillarMat)
      p.position.set(sx, 1.3, 0)
      g.add(p)
    }
    // 底座
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.3, 24),
      new THREE.MeshStandardMaterial({ color: '#2c3242', metalness: 0.5, roughness: 0.5, envMapIntensity: 0.15 })
    )
    base.position.y = 0.15
    g.add(base)
    // 活跃光柱
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.4, 14, 20, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    )
    this.beam.position.y = 8
    g.add(this.beam)

    // 环绕粒子
    const n = 60
    const pgeo = new THREE.BufferGeometry()
    const parr = new Float32Array(n * 3)
    this.pOrbit = []
    for (let i = 0; i < n; i++) {
      this.pOrbit.push({
        a: Math.random() * Math.PI * 2, r: 1.2 + Math.random() * 0.6,
        s: 0.4 + Math.random() * 0.9, y: Math.random() * 3.6,
      })
      parr[i * 3] = this.pOrbit[i].a; parr[i * 3 + 1] = this.pOrbit[i].y; parr[i * 3 + 2] = this.pOrbit[i].r
    }
    pgeo.setAttribute('position', new THREE.BufferAttribute(parr, 3))
    this.pMat = new THREE.PointsMaterial({
      color, size: 0.14, map: softDot(), transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.particles = new THREE.Points(pgeo, this.pMat)
    g.add(this.particles)

    this.group = g
    this.t = 0
    scene.add(g)
  }

  setActive(active) {
    this.active = active
    this.ring.material.emissiveIntensity = active ? 2.4 : 0.5
    this.pMat.opacity = active ? 0.9 : 0.15
  }

  update(dt, ballPos, onEnter) {
    this.t += dt
    const u = this.disc.material.uniforms
    u.uTime.value = this.t
    u.uActive.value += ((this.active ? 1 : 0.22) - u.uActive.value) * Math.min(1, dt * 3)
    this.ring.rotation.z = this.t * 0.5
    this.disc.rotation.z = -this.t * 0.3
    this.beam.material.opacity += ((this.active ? 0.16 + Math.sin(this.t * 2) * 0.05 : 0) - this.beam.material.opacity) * Math.min(1, dt * 2)

    if (this.active || true) {
      const arr = this.particles.geometry.attributes.position.array
      for (let i = 0; i < this.pOrbit.length; i++) {
        const o = this.pOrbit[i]
        o.a += o.s * dt * (this.active ? 1.6 : 0.5)
        arr[i * 3] = Math.cos(o.a) * o.r
        arr[i * 3 + 1] = o.y + Math.sin(this.t * o.s * 2 + i) * 0.2
        arr[i * 3 + 2] = Math.sin(o.a) * o.r
      }
      this.particles.geometry.attributes.position.needsUpdate = true
    }

    if (this.active && !this.entered && ballPos) {
      const d = Math.hypot(ballPos.x - this.pos.x, ballPos.z - this.pos.z)
      if (d < 1.35 && Math.abs(ballPos.y - this.pos.y) < 2.6) {
        this.entered = true
        onEnter && onEnter(this.pos)
      }
    }
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
}

// ---------- 检查点 ----------
export class Checkpoint {
  constructor(scene, pos, accent = '#57e0a2') {
    this.pos = new THREE.Vector3(...pos)
    this.active = false
    this.accent = accent
    const g = new THREE.Group()
    g.position.copy(this.pos)
    this.pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.25, 0.18, 20),
      new THREE.MeshStandardMaterial({ color: '#5a6378', metalness: 0.5, roughness: 0.45, envMapIntensity: 0.15 })
    )
    this.pad.position.y = 0.09
    g.add(this.pad)
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.07, 8, 36),
      new THREE.MeshStandardMaterial({ color: '#46506b', emissive: accent, emissiveIntensity: 0.12, metalness: 0.4, roughness: 0.4, envMapIntensity: 0.15 })
    )
    this.ring.position.y = 0.28
    this.ring.rotation.x = Math.PI / 2
    g.add(this.ring)
    // 旗杆光点
    this.beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.4 })
    )
    this.beacon.position.set(0, 1.6, 0)
    g.add(this.beacon)
    this.pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: '#5a6378', metalness: 0.6, roughness: 0.4, envMapIntensity: 0.15 })
    )
    this.pole.position.set(0, 0.85, 0)
    g.add(this.pole)
    this.group = g
    this.t = 0
    scene.add(g)
  }

  check(ballPos) {
    if (this.active) return false
    const d = Math.hypot(ballPos.x - this.pos.x, ballPos.z - this.pos.z)
    if (d < 1.5 && Math.abs(ballPos.y - this.pos.y) < 1.6) {
      this.activate()
      return true
    }
    return false
  }

  activate() {
    this.active = true
    this.ring.material.emissiveIntensity = 2.0
    this.beacon.material.emissiveIntensity = 2.4
  }

  update(dt, t) {
    this.t = t
    if (this.active) {
      this.beacon.position.y = 1.6 + Math.sin(t * 3) * 0.1
      this.ring.material.emissiveIntensity = 1.6 + Math.sin(t * 4) * 0.5
    } else {
      this.ring.rotation.z = t * 0.8
    }
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
}

// ---------- 弹射台 ----------
export class JumpPad {
  constructor(scene, pos, power = 17, accent = '#ff9e4a') {
    this.pos = new THREE.Vector3(...pos)
    this.power = power
    this.cooldown = 0
    this.accent = accent
    const g = new THREE.Group()
    g.position.copy(this.pos)
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.15, 0.22, 20),
      new THREE.MeshStandardMaterial({ color: '#3c4356', metalness: 0.55, roughness: 0.4, envMapIntensity: 0.15 })
    )
    base.position.y = 0.11
    g.add(base)
    this.top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.82, 0.1, 20),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.6, roughness: 0.3 })
    )
    this.top.position.y = 0.26
    g.add(this.top)
    this.arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.2 })
    )
    this.arrow.position.y = 0.75
    g.add(this.arrow)
    this.group = g
    this.t = Math.random() * 6
    scene.add(g)
  }

  check(ballPos, ballBody, dt) {
    this.cooldown -= dt
    if (this.cooldown > 0) return false
    const d = Math.hypot(ballPos.x - this.pos.x, ballPos.z - this.pos.z)
    if (d < 1.0 && ballPos.y - this.pos.y > -0.2 && ballPos.y - this.pos.y < 0.9) {
      ballBody.velocity.y = Math.max(ballBody.velocity.y, this.power)
      this.cooldown = 0.4
      this.arrow.position.y = 1.3 // 弹起动画(在 update 中回落)
      return true
    }
    return false
  }

  update(dt, t) {
    this.t = t
    this.arrow.position.y += (0.75 + Math.sin(t * 4) * 0.08 - this.arrow.position.y) * Math.min(1, dt * 6)
    this.top.material.emissiveIntensity = 1.4 + Math.sin(t * 5) * 0.5
  }

  dispose() {
    this.group.traverse(o => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
}

// ---------- 碰碰球(高弹力障碍) ----------
export class Bumper {
  constructor(scene, pos, r = 0.9, color = '#ff5a8f') {
    this.pos = new THREE.Vector3(...pos)
    this.r = r
    this.cooldown = 0
    const m = new THREE.MeshStandardMaterial({ color: '#c2335f', emissive: color, emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.25, envMapIntensity: 0.15 })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m)
    this.mesh.position.copy(this.pos)
    scene.add(this.mesh)
    this.t = 0
  }

  // 反射球速并加冲击
  check(ballPos, ballBody, dt) {
    this.cooldown -= dt
    const d = ballPos.distanceTo(this.pos)
    const contact = this.r + 0.5
    if (d < contact && this.cooldown <= 0) {
      const n = new THREE.Vector3().subVectors(ballPos, this.pos).normalize()
      const v = new THREE.Vector3(ballBody.velocity.x, ballBody.velocity.y, ballBody.velocity.z)
      const vn = v.dot(n)
      if (vn < 0) {
        const push = n.clone()
        push.y = Math.max(push.y, 0.4)
        push.normalize()
        const reflected = v.addScaledVector(n, -2 * vn).addScaledVector(push, 5.5)
        ballBody.velocity.set(reflected.x, reflected.y, reflected.z)
        this.cooldown = 0.25
        this.squash = 1
        return true
      }
    }
    return false
  }

  update(dt, t) {
    this.t = t
    this.mesh.material.emissiveIntensity = 0.7 + Math.sin(t * 3.5) * 0.25
    if (this.squash > 0) {
      this.squash = Math.max(0, this.squash - dt * 4)
      const s = 1 + Math.sin(this.squash * Math.PI) * 0.22
      this.mesh.scale.setScalar(s)
      this.mesh.material.emissiveIntensity = 0.7 + this.squash * 4
    }
  }

  dispose() {
    this.mesh.geometry.dispose(); this.mesh.material.dispose()
  }
}

// ---------- 移动平台 ----------
export class MovingPlatform {
  constructor(scene, physics, { from, to, size = [3, 0.6, 3], period = 4, phase = 0, theme, style = {} }) {
    this.from = new THREE.Vector3(...from)
    this.to = new THREE.Vector3(...to)
    this.size = size
    this.period = period
    this.phase = phase
    this.t = 0
    this.prevPos = new THREE.Vector3()

    const [w, h, d] = size
    const geo = new THREE.BoxGeometry(w, h, d)
    const mats = theme.buildPlatformMats({ size, ...style })
    this.mesh = new THREE.Mesh(geo, mats)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    scene.add(this.mesh)

    const body = new CANNON.Body({
      type: CANNON.Body.KINEMATIC,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
      position: new CANNON.Vec3(this.from.x, this.from.y, this.from.z),
      material: physics.matGround,
    })
    this.body = body
    physics.addBody(body)
    this._setPath(0)
  }

  _pathK(t) {
    // 平滑往复 0..1
    const s = (Math.sin(t * Math.PI * 2 / this.period + this.phase) + 1) / 2
    return s * s * (3 - 2 * s)
  }

  _setPath(t) {
    const k = this._pathK(t)
    const p = this.from.clone().lerp(this.to, k)
    this.body.position.set(p.x, p.y, p.z)
    const k2 = this._pathK(t + 0.02)
    const p2 = this.from.clone().lerp(this.to, k2)
    const vel = p2.sub(p).multiplyScalar(50) // 0.02s 差分 → 速度
    this.body.velocity.set(vel.x, vel.y, vel.z)
    this.prevPos.copy(p)
  }

  update(dt) {
    this.t += dt
    this._setPath(this.t)
    this.mesh.position.copy(this.body.position)
    this.mesh.quaternion.copy(this.body.quaternion)
  }

  dispose() {
    this.mesh.geometry.dispose()
    const ms = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material]
    ms.forEach(m => m.dispose())
  }
}

// ---------- 旋转护栏 ----------
export class Spinner {
  constructor(scene, physics, { pos, length = 8, speed = 1.6, height = 0.55, color = '#ff6a4a' }) {
    const g = new THREE.Group()
    const [x, y, z] = pos
    const barGeo = new THREE.BoxGeometry(length, 0.5, 0.5)
    const barMat = new THREE.MeshStandardMaterial({ color: '#d84a3a', emissive: color, emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.4, envMapIntensity: 0.15 })
    const bar = new THREE.Mesh(barGeo, barMat)
    bar.castShadow = true
    g.add(bar)
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.8, 12),
      new THREE.MeshStandardMaterial({ color: '#39404f', metalness: 0.6, roughness: 0.35, envMapIntensity: 0.15 })
    )
    g.add(hub)
    g.position.set(x, y + 0.4, z)
    scene.add(g)
    this.mesh = g

    const body = new CANNON.Body({
      type: CANNON.Body.KINEMATIC,
      shape: new CANNON.Box(new CANNON.Vec3(length / 2, 0.25, 0.25)),
      position: new CANNON.Vec3(x, y + 0.4, z),
      material: physics.matGround,
    })
    body.angularVelocity.set(0, speed, 0)
    physics.addBody(body)
    this.body = body
  }

  update(dt) {
    this.mesh.position.copy(this.body.position)
    this.mesh.quaternion.copy(this.body.quaternion)
  }

  dispose() {
    this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose() })
  }
}
