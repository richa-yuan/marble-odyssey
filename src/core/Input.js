// 输入系统:键盘 + 鼠标拖动转视角 + 触屏摇杆
export class Input {
  constructor(dom) {
    this.dom = dom
    this.keys = new Set()
    this.move = { x: 0, z: 0 }        // 期望移动方向(-1..1),未按相机系变换
    this.jumpPressed = false          // 本帧是否按下跳(边沿触发)
    this.jumpHeld = false
    this.camYawDelta = 0              // 本帧视角增量(由 QE/拖动产生)
    this.camPitchDelta = 0
    this.respawnPressed = false
    this.pausePressed = false

    // 触屏状态
    this.touchActive = false
    this._joyId = null
    this._camId = null
    this._camLast = null
    this._joyCenter = null

    this._bind()
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return
      const c = e.code
      this.keys.add(c)
      if (c === 'Space') { this.jumpPressed = true; this.jumpHeld = true; e.preventDefault() }
      if (c === 'KeyR') this.respawnPressed = true
      if (c === 'Escape') this.pausePressed = true
    })
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
      if (e.code === 'Space') this.jumpHeld = false
    })
    window.addEventListener('blur', () => this.keys.clear())

    // 鼠标拖动转视角(在 canvas 上按住左键拖动)
    this.dom.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') { this._touchStart(e); return }
      if (e.button === 0) { this._dragId = e.pointerId; this._dragLast = [e.clientX, e.clientY] }
    })
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') { this._touchMove(e); return }
      if (this._dragId === e.pointerId && this._dragLast) {
        this.camYawDelta -= (e.clientX - this._dragLast[0]) * 0.0042
        this.camPitchDelta -= (e.clientY - this._dragLast[1]) * 0.0032
        this._dragLast = [e.clientX, e.clientY]
      }
    })
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') { this._touchEnd(e); return }
      if (this._dragId === e.pointerId) { this._dragId = null; this._dragLast = null }
    })
    window.addEventListener('pointercancel', (e) => {
      if (e.pointerType === 'touch') this._touchEnd(e)
      if (this._dragId === e.pointerId) { this._dragId = null; this._dragLast = null }
    })

    // 触屏按钮
    const jumpBtn = document.getElementById('btn-jump')
    jumpBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.jumpPressed = true; this.jumpHeld = true })
    jumpBtn.addEventListener('pointerup', () => { this.jumpHeld = false })
  }

  _touchStart(e) {
    const joy = document.getElementById('joystick')
    const r = joy.getBoundingClientRect()
    const inJoy = e.clientX >= r.left - 30 && e.clientX <= r.right + 30 && e.clientY >= r.top - 30 && e.clientY <= r.bottom + 30
    if (inJoy && this._joyId === null) {
      this._joyId = e.pointerId
      this.touchActive = true
      this._joyCenter = [r.left + r.width / 2, r.top + r.height / 2]
    } else if (this._camId === null) {
      this._camId = e.pointerId
      this._camLast = [e.clientX, e.clientY]
    }
  }

  _touchMove(e) {
    if (e.pointerId === this._joyId && this._joyCenter) {
      const dx = e.clientX - this._joyCenter[0]
      const dy = e.clientY - this._joyCenter[1]
      const max = 52
      const len = Math.hypot(dx, dy)
      const k = len > max ? max / len : 1
      const nx = dx * k / max, ny = dy * k / max
      this.move.x = nx
      this.move.z = ny
      const knob = document.getElementById('joystick-knob')
      knob.style.transform = `translate(calc(-50% + ${nx * max}px), calc(-50% + ${ny * max}px))`
    } else if (e.pointerId === this._camId && this._camLast) {
      this.camYawDelta -= (e.clientX - this._camLast[0]) * 0.005
      this.camPitchDelta -= (e.clientY - this._camLast[1]) * 0.004
      this._camLast = [e.clientX, e.clientY]
    }
  }

  _touchEnd(e) {
    if (e.pointerId === this._joyId) {
      this._joyId = null
      this.move.x = 0; this.move.z = 0
      document.getElementById('joystick-knob').style.transform = 'translate(-50%, -50%)'
    }
    if (e.pointerId === this._camId) { this._camId = null; this._camLast = null }
  }

  // 每帧开头调用:汇总键盘方向
  sampleMove() {
    if (this._joyId !== null) return // 摇杆接管
    let x = 0, z = 0
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1
    const len = Math.hypot(x, z)
    if (len > 1) { x /= len; z /= len }
    this.move.x = x
    this.move.z = z
  }

  endFrame() {
    this.jumpPressed = false
    this.respawnPressed = false
    this.pausePressed = false
    this.camYawDelta = 0
    this.camPitchDelta = 0
  }
}
