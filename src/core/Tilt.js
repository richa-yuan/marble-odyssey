// 重力感应控制:倾斜手机 = 倾斜滚珠赛道(经典 labyrinth 玩法)
// - iOS 13+ 需在用户手势中调用 DeviceOrientationEvent.requestPermission()
// - 以开启瞬间(或手动校准)的握姿为「水平面」,倾角相对基准计算
// - 按屏幕方向(竖/横屏)换算 beta/gamma 到屏幕坐标
const MAX_TILT = 20    // 达到该倾角(度)即全速
const DEADZONE = 2.5   // 死区(度)
const CURVE = 1.3      // 响应曲线(小倾角更细腻)

export class TiltControl {
  constructor() {
    this.supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
    this.enabled = false
    this.move = { x: 0, z: 0 }   // 与 Input.move 同语义:z 负 = 屏幕前方
    this._base = null            // 校准基准 { beta, gamma, angle }
    this._onOrientation = this._onOrientation.bind(this)
  }

  async enable() {
    if (!this.supported) return { ok: false, reason: 'unsupported' }
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission()
        if (res !== 'granted') return { ok: false, reason: 'denied' }
      } catch (e) {
        return { ok: false, reason: 'denied' }
      }
    }
    window.addEventListener('deviceorientation', this._onOrientation)
    this.enabled = true
    this._base = null   // 首个事件到达时以当前握姿自动校准
    this.move.x = 0; this.move.z = 0
    return { ok: true }
  }

  disable() {
    window.removeEventListener('deviceorientation', this._onOrientation)
    this.enabled = false
    this.move.x = 0; this.move.z = 0
  }

  // 以当前握姿为水平面
  calibrate() {
    this.move.x = 0; this.move.z = 0
    // _base 置空后,下一个事件到来时按当前读数重新取基准
    this._pendingCalibrate = true
  }

  _onOrientation(e) {
    if (e.beta == null || e.gamma == null) return
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0
    if (this._pendingCalibrate || !this._base || this._base.angle !== angle) {
      this._base = { beta: e.beta, gamma: e.gamma, angle }
      this._pendingCalibrate = false
      return
    }
    const dg = e.gamma - this._base.gamma
    const db = e.beta - this._base.beta
    // 换算到屏幕坐标:sx 正 = 右缘向下(向右倾),sy 正 = 顶缘朝向用户(向后倾)
    let sx, sy
    switch (angle) {
      case 90:  sx = -db; sy = dg; break
      case 180: sx = -dg; sy = -db; break
      case 270: sx = db;  sy = -dg; break
      default:  sx = dg;  sy = db
    }
    const map = (v) => {
      const a = Math.abs(v)
      if (a < DEADZONE) return 0
      const s = Math.min(1, (a - DEADZONE) / (MAX_TILT - DEADZONE))
      return Math.sign(v) * Math.pow(s, CURVE)
    }
    // move.x 正 = 向屏幕右滚;move.z 正 = 向屏幕后(顶缘朝向用户为后倾)
    this.move.x = map(sx)
    this.move.z = map(sy)
  }
}
