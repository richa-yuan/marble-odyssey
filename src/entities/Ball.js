// 滚珠:物理球体 + 大理石外观 + 接地/跳跃/受力 + 着陆压扁动画
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { marbleBall } from '../core/Textures.js'

const MAX_SPEED = 8.5       // 地面最大水平速度
const ACCEL_K = 11          // 速度趋近系数(1/s)
const MAX_FORCE = 62        // 力上限
const AIR_K = 0.45          // 空中操控系数
const JUMP_V = 9.6
const COYOTE = 0.12

export class Ball {
  constructor(scene, physics, spawn, trail) {
    this.radius = 0.5
    this.trail = trail

    this.body = new CANNON.Body({
      mass: 1.1,
      shape: new CANNON.Sphere(this.radius),
      position: new CANNON.Vec3(spawn[0], spawn[1], spawn[2]),
      material: physics.matBall,
      linearDamping: 0.1,
      angularDamping: 0.35,
    })
    this.body.allowSleep = false
    physics.addBody(this.body)

    const tex = marbleBall()
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, 32, 24),
      new THREE.MeshPhysicalMaterial({
        map: tex,
        metalness: 0.25,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.2,
      })
    )
    this.mesh.castShadow = true
    scene.add(this.mesh)

    // 状态
    this.grounded = false
    this.groundNormal = null
    this.coyote = 0
    this.prevVy = 0
    this.squash = 0
    this.landSpeed = 0
    this.spawnPoint = new THREE.Vector3(...spawn)

    // 内嵌光点(发光核心,随 bloom 有玻璃珠感)
    this.core = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius * 0.55, 16, 12),
      new THREE.MeshBasicMaterial({ color: '#9fd4ff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
    )
    scene.add(this.core)
  }

  respawn() {
    this.body.position.set(this.spawnPoint.x, this.spawnPoint.y, this.spawnPoint.z)
    this.body.velocity.set(0, 0, 0)
    this.body.angularVelocity.set(0, 0, 0)
    this.body.quaternion.set(0, 0, 0, 1)
    this.trail && this.trail.reset()
  }

  setSpawn(pos) {
    this.spawnPoint.set(pos.x, pos.y + 0.6, pos.z)
  }

  jump() {
    this.body.velocity.y = Math.max(this.body.velocity.y, JUMP_V)
  }

  // 输入受力:相机系 → 世界系,速度趋近式驱动
  applyControl(input, camYaw, dt, physics) {
    const gc = physics.groundCheck(this.body.position, this.radius)
    const wasGrounded = this.grounded
    this.grounded = gc.hit
    if (gc.hit) {
      this.groundNormal = gc.normal
      this.coyote = COYOTE
    } else {
      this.groundNormal = null
      this.coyote -= dt
    }

    // 着陆检测(压扁 + 音效由 Game 处理)
    let landed = false
    if (!wasGrounded && this.grounded && this.prevVy < -6) {
      this.squash = 1
      this.landSpeed = Math.min(1, -this.prevVy / 16)
      landed = this.landSpeed > 0.25
    }
    this.prevVy = this.body.velocity.y

    // 跳跃
    if (input.jumpPressed && this.coyote > 0) {
      this.jump()
      this.coyote = 0
      return { jumped: true }
    }

    // 移动力
    let ix = input.move.x
    let iz = input.move.z
    const ilen = Math.hypot(ix, iz)
    if (ilen > 0.001) {
      const fx = -Math.sin(camYaw)
      const fz = -Math.cos(camYaw)
      // right = up × forward = (fz, 0, -fx)
      const rx = fz, rz = -fx
      const wdx = fx * (-iz) + rx * ix
      const wdz = fz * (-iz) + rz * ix

      const v = this.body.velocity
      const targetX = wdx * MAX_SPEED
      const targetZ = wdz * MAX_SPEED
      const k = (this.grounded ? ACCEL_K : ACCEL_K * AIR_K)
      let Fx = (targetX - v.x) * k * this.body.mass
      let Fz = (targetZ - v.z) * k * this.body.mass

      const mag = Math.hypot(Fx, Fz)
      const cap = MAX_FORCE * this.body.mass
      if (mag > cap) { Fx *= cap / mag; Fz *= cap / mag }
      this.body.applyForce(new CANNON.Vec3(Fx, 0, Fz), this.body.position)
    }
    return { landed }
  }

  sync(dt, t) {
    this.mesh.position.copy(this.body.position)
    this.mesh.quaternion.copy(this.body.quaternion)
    this.core.position.copy(this.body.position)
    this.core.material.opacity = 0.25 + Math.sin(t * 2.4) * 0.08

    // 着陆压扁恢复
    if (this.squash > 0) {
      this.squash = Math.max(0, this.squash - dt * 5)
      const k = Math.sin(this.squash * Math.PI)
      this.mesh.scale.set(1 + k * 0.22, 1 - k * 0.3, 1 + k * 0.22)
    } else {
      this.mesh.scale.set(1, 1, 1)
    }

    // 拖尾
    if (this.trail) {
      const hv = Math.hypot(this.body.velocity.x, this.body.velocity.z)
      this.trail.push(this.body.position, Math.min(1, hv / MAX_SPEED))
      this.trail.update(dt)
    }
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.map = null
    this.mesh.material.dispose()
    this.core.geometry.dispose()
    this.core.material.dispose()
  }
}
