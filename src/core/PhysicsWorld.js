// cannon-es 物理世界封装:材料 / 接触材料 / 步进
import * as CANNON from 'cannon-es'

export class PhysicsWorld {
  constructor(gravity = [0, -24, 0]) {
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(gravity[0], gravity[1], gravity[2]) })
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = false
    this.world.solver.iterations = 14

    this.matGround = new CANNON.Material('ground')
    this.matIce = new CANNON.Material('ice')
    this.matBall = new CANNON.Material('ball')

    this.world.addContactMaterial(new CANNON.ContactMaterial(this.matGround, this.matBall, {
      friction: 0.34, restitution: 0.1,
    }))
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.matIce, this.matBall, {
      friction: 0.018, restitution: 0.06,
    }))
    this.world.defaultContactMaterial.friction = 0.35
    this.world.defaultContactMaterial.restitution = 0.1
  }

  step(dt) {
    // 固定子步,最多 6 次,保证高速滚动稳定
    this.world.step(1 / 90, dt, 6)
  }

  addBody(body) { this.world.addBody(body) }

  // 球心向下的接地检测
  groundCheck(pos, radius) {
    const result = new CANNON.RaycastResult()
    const from = new CANNON.Vec3(pos.x, pos.y, pos.z)
    const to = new CANNON.Vec3(pos.x, pos.y - radius - 0.22, pos.z)
    this.world.raycastClosest(from, to, { skipBackfaces: true }, result)
    return {
      hit: result.hasHit,
      normal: result.hasHit ? result.hitNormalWorld : null,
    }
  }
}
