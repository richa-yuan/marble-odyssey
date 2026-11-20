// 跟随相机:平滑追踪滚珠,Q/E 或拖动旋转视角,开场有俯冲入场动画
import * as THREE from 'three'

export class CameraRig {
  constructor(camera) {
    this.camera = camera
    this.yaw = Math.PI          // 相机朝向水平角
    this.pitch = -0.42
    this.distance = 8
    this.target = new THREE.Vector3()
    this.pos = new THREE.Vector3(0, 6, -10)
    this.lookAt = new THREE.Vector3()
    this.mode = 'follow'        // follow | intro | orbit(菜单)
    this.introT = 0
    this.introFrom = new THREE.Vector3()
    this.orbitAngle = 0
    this.manualTimer = 0        // 手动转视角后短暂停用自动跟尾
    this._desired = new THREE.Vector3()
    this._shake = 0
  }

  // 进入关卡:从高空俯冲到球后
  beginIntro(spawnPos) {
    this.mode = 'intro'
    this.introT = 0
    this.introFrom.set(spawnPos.x + 14, spawnPos.y + 22, spawnPos.z - 18)
    this.camera.position.copy(this.introFrom)
    this.target.set(spawnPos.x, spawnPos.y + 1, spawnPos.z)
    this.pos.copy(this.introFrom)
  }

  beginOrbit(center) {
    this.mode = 'orbit'
    this.orbitCenter = center.clone()
  }

  shake(amount) { this._shake = Math.min(0.5, this._shake + amount) }

  update(dt, ballPos, ballVel, input) {
    if (input) {
      const manual = input.camYawDelta !== 0 || input.camPitchDelta !== 0 ||
        (input.keys && (input.keys.has('KeyQ') || input.keys.has('KeyE')))
      this.manualTimer = manual ? 2.2 : Math.max(0, this.manualTimer - dt)
      if (input.keys.has('KeyQ')) this.yaw += 2.2 * dt
      if (input.keys.has('KeyE')) this.yaw -= 2.2 * dt
      this.yaw += input.camYawDelta
      this.pitch = THREE.MathUtils.clamp(this.pitch + input.camPitchDelta, -1.2, 0.15)
    }

    // 任天堂式自动跟尾:滚动时相机缓慢绕到速度反方向,让「上=远离相机」始终成立
    if (this.mode === 'follow' && this.manualTimer <= 0 && ballVel) {
      const hv = Math.hypot(ballVel.x, ballVel.z)
      if (hv > 2.2) {
        const targetYaw = Math.atan2(-ballVel.x, -ballVel.z)
        let d = targetYaw - this.yaw
        d = Math.atan2(Math.sin(d), Math.cos(d)) // 最短路径
        const step = Math.min(Math.abs(d), Math.min(1.5, (hv - 2.2) * 0.4) * dt)
        this.yaw += Math.sign(d) * step
      }
    }

    if (this.mode === 'orbit') {
      // 菜单背景:绕场地缓慢环绕
      this.orbitAngle += dt * 0.12
      const r = 13
      this.camera.position.set(
        this.orbitCenter.x + Math.cos(this.orbitAngle) * r,
        this.orbitCenter.y + 5.5,
        this.orbitCenter.z + Math.sin(this.orbitAngle) * r
      )
      this.camera.lookAt(this.orbitCenter.x, this.orbitCenter.y + 0.8, this.orbitCenter.z)
      return
    }

    // 目标点:球体位置(带少量速度前瞻)
    this.target.set(
      ballPos.x + ballVel.x * 0.12,
      ballPos.y + 0.9,
      ballPos.z + ballVel.z * 0.12
    )

    const cp = Math.cos(this.pitch)
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * cp,
      -Math.sin(this.pitch),
      Math.cos(this.yaw) * cp
    ).multiplyScalar(this.distance)

    if (this.mode === 'intro') {
      this.introT += dt / 1.8
      const t = this.introT
      this._desired.copy(this.target).add(offset)
      const k = t < 1 ? 1 - Math.pow(1 - t, 3) : 1 // easeOutCubic
      this.pos.lerpVectors(this.introFrom, this._desired, k)
      if (t >= 1) this.mode = 'follow'
    } else {
      this._desired.copy(this.target).add(offset)
      // 平滑追踪(帧率无关阻尼)
      const k = 1 - Math.exp(-dt * 6.5)
      this.pos.lerp(this._desired, k)
    }

    this.camera.position.copy(this.pos)
    if (this._shake > 0.001) {
      this.camera.position.x += (Math.random() - .5) * this._shake
      this.camera.position.y += (Math.random() - .5) * this._shake
      this._shake *= Math.exp(-dt * 8)
    }
    this.lookAt.lerp(this.target, 1 - Math.exp(-dt * 10))
    this.camera.lookAt(this.lookAt)
  }
}
