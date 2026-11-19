// 粒子系统:环境漂浮粒子(萤火/雪/沙尘/星光)+ 收集爆发 + 滚珠拖尾
import * as THREE from 'three'
import { softDot } from './Textures.js'

// 环境粒子:在一个包围盒内循环漂移
export class AmbientParticles {
  constructor({
    count = 260,
    color = '#ffffff',
    size = 0.18,
    opacity = 0.75,
    speed = 0.6,
    spread = [60, 14, 60],
    center = [0, 4, 0],
    drift = 'rise',   // rise | fall | sway | float
    additive = true,
  }) {
    this.count = count
    this.drift = drift
    this.speed = speed
    this.center = new THREE.Vector3(...center)
    this.spread = spread

    const geo = new THREE.BufferGeometry()
    this.positions = new Float32Array(count * 3)
    this.phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      this.positions[i * 3] = (Math.random() - .5) * spread[0]
      this.positions[i * 3 + 1] = (Math.random() - .5) * spread[1]
      this.positions[i * 3 + 2] = (Math.random() - .5) * spread[2]
      this.phases[i] = Math.random() * Math.PI * 2
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size,
      map: softDot(),
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    })
    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    this._t = 0
  }

  update(dt) {
    this._t += dt
    const { positions, count, spread } = this
    for (let i = 0; i < count; i++) {
      const ix = i * 3, ph = this.phases[i]
      if (this.drift === 'fall') {
        positions[ix + 1] -= this.speed * (0.6 + 0.4 * Math.sin(ph)) * dt
        positions[ix] += Math.sin(this._t * 1.4 + ph) * dt * 0.5
        if (positions[ix + 1] < -spread[1] / 2) positions[ix + 1] += spread[1]
      } else if (this.drift === 'rise') {
        positions[ix + 1] += this.speed * (0.5 + 0.5 * Math.sin(ph)) * dt
        positions[ix] += Math.sin(this._t * 0.9 + ph) * dt * 0.35
        if (positions[ix + 1] > spread[1] / 2) positions[ix + 1] -= spread[1]
      } else if (this.drift === 'sway') {
        positions[ix] += Math.sin(this._t * 0.5 + ph) * dt * this.speed
        positions[ix + 2] += Math.cos(this._t * 0.4 + ph * 1.3) * dt * this.speed
      } else { // float
        positions[ix] += Math.sin(this._t * 0.6 + ph) * dt * this.speed * 0.6
        positions[ix + 1] += Math.cos(this._t * 0.5 + ph * 2.0) * dt * this.speed * 0.4
        positions[ix + 2] += Math.cos(this._t * 0.55 + ph) * dt * this.speed * 0.6
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true
    const m = this.points.material
    m.opacity = m.userData.baseOpacity ?? (m.userData.baseOpacity = m.opacity)
    m.opacity = m.userData.baseOpacity * (0.75 + 0.25 * Math.sin(this._t * 2))
  }

  dispose() {
    this.points.geometry.dispose()
    this.points.material.dispose()
  }
}

// 爆发粒子池:收集宝石 / 过门时的进发效果
export class BurstPool {
  constructor(scene, max = 400) {
    this.max = max
    this.positions = new Float32Array(max * 3)
    this.velocities = new Float32Array(max * 3)
    this.life = new Float32Array(max)       // 剩余寿命
    this.maxLife = new Float32Array(max)
    this.colors = new Float32Array(max * 3)
    this.cursor = 0
    this.alive = 0

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geo = geo
    this.mat = new THREE.PointsMaterial({
      size: 0.28,
      map: softDot(),
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.points = new THREE.Points(geo, this.mat)
    this.points.frustumCulled = false
    scene.add(this.points)
    this._tmpColor = new THREE.Color()
  }

  burst(pos, color, count = 22, power = 4) {
    this._tmpColor.set(color)
    for (let n = 0; n < count; n++) {
      const i = this.cursor
      this.cursor = (this.cursor + 1) % this.max
      this.alive = Math.min(this.max, this.alive + 1)
      this.positions[i * 3] = pos.x; this.positions[i * 3 + 1] = pos.y; this.positions[i * 3 + 2] = pos.z
      const dir = new THREE.Vector3().randomDirection()
      dir.y = Math.abs(dir.y) * 0.8 + 0.3
      const sp = power * (0.4 + Math.random() * 0.9)
      this.velocities[i * 3] = dir.x * sp
      this.velocities[i * 3 + 1] = dir.y * sp
      this.velocities[i * 3 + 2] = dir.z * sp
      this.life[i] = 0.7 + Math.random() * 0.4
      this.maxLife[i] = this.life[i]
      const shade = 0.7 + Math.random() * 0.5
      this.colors[i * 3] = this._tmpColor.r * shade
      this.colors[i * 3 + 1] = this._tmpColor.g * shade
      this.colors[i * 3 + 2] = this._tmpColor.b * shade
    }
    this.geo.attributes.color.needsUpdate = true
  }

  update(dt) {
    if (this.alive === 0) return
    let living = 0
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue
      this.life[i] -= dt
      this.velocities[i * 3 + 1] -= 6.5 * dt
      this.positions[i * 3] += this.velocities[i * 3] * dt
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt
      living++
    }
    this.alive = living
    this.geo.attributes.position.needsUpdate = true
    this.mat.opacity = Math.max(0, Math.min(1, living / 30))
  }

  dispose() {
    this.geo.dispose()
    this.mat.dispose()
  }
}

// 滚珠拖尾:环形缓冲的发光点串
export class BallTrail {
  constructor(scene, length = 46) {
    this.length = length
    this.positions = new Float32Array(length * 3)
    this.strength = new Float32Array(length)
    this.cursor = 0

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('aStrength', new THREE.BufferAttribute(this.strength, 1))
    this.geo = geo
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#7fc4ff') },
        uMap: { value: softDot() },
      },
      vertexShader: /* glsl */`
        attribute float aStrength;
        varying float vS;
        void main() {
          vS = aStrength;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (4.0 + aStrength * 14.0) * (36.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */`
        varying float vS;
        uniform vec3 uColor;
        uniform sampler2D uMap;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(uColor * 1.6, tex.a * vS * 0.55);
        }
      `,
    })
    this.points = new THREE.Points(geo, this.mat)
    this.points.frustumCulled = false
    scene.add(this.points)
    // 初始化为远离场景的点,避免开局闪现
    for (let i = 0; i < length; i++) {
      this.positions[i * 3] = 0; this.positions[i * 3 + 1] = -1000; this.positions[i * 3 + 2] = 0
    }
  }

  setColor(hex) { this.mat.uniforms.uColor.value.set(hex) }

  reset() {
    for (let i = 0; i < this.length; i++) {
      this.positions[i * 3 + 1] = -1000
      this.strength[i] = 0
    }
  }

  push(pos, speed01) {
    const i = this.cursor
    this.cursor = (this.cursor + 1) % this.length
    this.positions[i * 3] = pos.x
    this.positions[i * 3 + 1] = pos.y
    this.positions[i * 3 + 2] = pos.z
    this.strength[i] = 0.35 + speed01 * 0.65
    this.geo.attributes.position.needsUpdate = true
    this.geo.attributes.aStrength.needsUpdate = true
  }

  update(dt) {
    // 强度衰减
    let changed = false
    for (let i = 0; i < this.length; i++) {
      if (this.strength[i] > 0) {
        this.strength[i] = Math.max(0, this.strength[i] - dt * 0.9)
        changed = true
      }
    }
    if (changed) this.geo.attributes.aStrength.needsUpdate = true
  }

  dispose() {
    this.geo.dispose()
    this.mat.dispose()
  }
}
