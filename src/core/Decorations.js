// 场景装饰物工厂:树木 / 岩石 / 仙人掌 / 方尖碑 / 石柱 / 水晶 / 霓虹楼 / 浮岛底座
// 全部为轻量 low-poly 组合体,带风格化配色
import * as THREE from 'three'
import { rockTex, neonWindows, darkPanel } from './Textures.js'

const _matCache = new Map()
function mat(color, opts = {}) {
  const key = `m_${color}_${JSON.stringify(opts)}`
  if (_matCache.has(key)) return _matCache.get(key)
  const m = new THREE.MeshStandardMaterial({ color, envMapIntensity: 0.12, ...opts })
  if (opts.envMapIntensity === undefined) m.envMapIntensity = 0.12
  _matCache.set(key, m)
  return m
}

// 圆锥树(草地)
export function makeTree(theme = '#3f9d3a') {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 1.1, 7),
    mat('#7a4f2a', { roughness: 1 })
  )
  trunk.position.y = 0.55
  g.add(trunk)
  const shades = [theme, new THREE.Color(theme).offsetHSL(0, 0, 0.06).getStyle(), new THREE.Color(theme).offsetHSL(0, 0, -0.08).getStyle()]
  let y = 1.1
  const radii = [0.95, 0.72, 0.46]
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(radii[i], 1.0, 8),
      mat(shades[i], { roughness: 0.95 })
    )
    cone.position.y = y + 0.5
    y += 0.62
    g.add(cone)
  }
  return g
}

// 松树(雪原)
export function makePine() {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.2, 0.9, 7),
    mat('#5c4028', { roughness: 1 })
  )
  trunk.position.y = 0.45
  g.add(trunk)
  const greens = ['#2e6b4f', '#35795a', '#3e8763']
  let y = 0.9
  const radii = [0.85, 0.62, 0.4, 0.24]
  for (let i = 0; i < 4; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radii[i], 0.85, 8), mat(greens[i % 3], { roughness: 0.9 }))
    cone.position.y = y + 0.4
    y += 0.52
    g.add(cone)
    // 积雪裙边
    const snowCone = new THREE.Mesh(new THREE.ConeGeometry(radii[i] * 0.88, 0.22, 8), mat('#f2f7fd', { roughness: 1 }))
    snowCone.position.y = y - 0.28
    g.add(snowCone)
  }
  return g
}

// 岩石
export function makeRock(scale = 1) {
  const geo = new THREE.IcosahedronGeometry(scale, 1)
  const posAttr = geo.attributes.position
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setXYZ(i,
      posAttr.getX(i) * (0.8 + Math.random() * 0.45),
      posAttr.getY(i) * (0.7 + Math.random() * 0.5),
      posAttr.getZ(i) * (0.8 + Math.random() * 0.45)
    )
  }
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, mat('#8d8f9c', { roughness: 0.95, flatShading: true }))
  return mesh
}

// 仙人掌(沙漠)
export function makeCactus() {
  const g = new THREE.Group()
  const green = mat('#5e8f5a', { roughness: 0.9 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.3, 4, 10), green)
  body.position.y = 0.85
  g.add(body)
  const armGeo = new THREE.CapsuleGeometry(0.14, 0.5, 4, 8)
  const armL = new THREE.Mesh(armGeo, green)
  armL.position.set(-0.4, 1.0, 0)
  armL.rotation.z = 1.2
  g.add(armL)
  const armLUp = new THREE.Mesh(armGeo, green)
  armLUp.position.set(-0.62, 1.35, 0)
  armLUp.rotation.z = 0.1
  g.add(armLUp)
  const armR = new THREE.Mesh(armGeo, green)
  armR.position.set(0.38, 0.75, 0)
  armR.rotation.z = -1.2
  g.add(armR)
  const armRUp = new THREE.Mesh(armGeo, green)
  armRUp.position.set(0.58, 1.1, 0)
  armRUp.rotation.z = -0.05
  g.add(armRUp)
  return g
}

// 方尖碑(沙漠地标,顶贴金)
export function makeObelisk(scale = 1) {
  const g = new THREE.Group()
  const h = 5.5 * scale
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * scale, 0.62 * scale, h, 4),
    mat('#b09468', { roughness: 0.85 })
  )
  body.position.y = h / 2
  body.rotation.y = Math.PI / 4
  g.add(body)
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.42 * scale, 0.9 * scale, 4),
    mat('#e8c66a', { roughness: 0.4, metalness: 0.6, emissive: '#a87c1f', emissiveIntensity: 0.35 })
  )
  tip.position.y = h + 0.42 * scale
  tip.rotation.y = Math.PI / 4
  g.add(tip)
  return g
}

// 断裂石柱(遗迹)
export function makeColumn(scale = 1) {
  const g = new THREE.Group()
  const stone = mat('#c2a377', { roughness: 0.9 })
  const h = (2 + Math.random() * 2.2) * scale
  const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * scale, 0.46 * scale, h, 10), stone)
  seg.position.y = h / 2
  g.add(seg)
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2 * scale, 0.35 * scale, 1.2 * scale), stone)
  base.position.y = 0.17 * scale
  g.add(base)
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.15 * scale, 0.3 * scale, 1.15 * scale), stone)
  cap.position.y = h + 0.12 * scale
  cap.rotation.y = 0.3 * Math.random()
  g.add(cap)
  return g
}

// 水晶簇(冰原/星空)
export function makeCrystal(color = '#7fd8ff', scale = 1, emissive = 1.6) {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({
    color, roughness: 0.15, metalness: 0.1,
    emissive: color, emissiveIntensity: emissive, flatShading: true, envMapIntensity: 0.25,
  })
  const n = 3 + (Math.random() * 3 | 0)
  for (let i = 0; i < n; i++) {
    const h = (0.6 + Math.random() * 1.4) * scale
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.16 * scale * (0.6 + Math.random() * 0.5), h, 5), m)
    c.position.set((Math.random() - .5) * 0.5 * scale, h / 2 - 0.08 * scale, (Math.random() - .5) * 0.5 * scale)
    c.rotation.set((Math.random() - .5) * 0.4, Math.random() * Math.PI, (Math.random() - .5) * 0.4)
    g.add(c)
  }
  return g
}

// 霓虹大楼(城市剪影,自发光窗户)
export function makeBuilding(w, h, d, accent = '#3af0ff') {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({
    map: darkPanel(), roughness: 0.7, metalness: 0.35, color: '#888ca0', envMapIntensity: 0.12,
  })
  const winMat = new THREE.MeshStandardMaterial({
    map: neonWindows(), emissiveMap: neonWindows(), emissive: '#ffffff', emissiveIntensity: 1.1,
    color: '#222438', roughness: 0.6, envMapIntensity: 0.1,
  })
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat)
  body.position.y = h / 2
  g.add(body)
  // 四面窗户贴片
  const winPlane = (pw, ph, pos, ry) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), winMat)
    p.position.copy(pos)
    p.rotation.y = ry
    g.add(p)
  }
  winPlane(w * 0.9, h * 0.92, new THREE.Vector3(0, h / 2, d / 2 + 0.02), 0)
  winPlane(w * 0.9, h * 0.92, new THREE.Vector3(0, h / 2, -d / 2 - 0.02), Math.PI)
  winPlane(d * 0.9, h * 0.92, new THREE.Vector3(w / 2 + 0.02, h / 2, 0), Math.PI / 2)
  winPlane(d * 0.9, h * 0.92, new THREE.Vector3(-w / 2 - 0.02, h / 2, 0), -Math.PI / 2)
  // 屋顶霓虹描边
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w * 1.001, h, d * 1.001)),
    new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.85 })
  )
  edge.position.y = h / 2
  g.add(edge)
  return g
}

// 浮岛底座(倒锥岩体,让悬空平台不突兀)
export function makeIslandBase(w, d, depth, color = '#7a5230') {
  const geo = new THREE.ConeGeometry(Math.min(w, d) * 0.52, depth, 7, 1)
  const posAttr = geo.attributes.position
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setXYZ(i,
      posAttr.getX(i) * (0.85 + Math.random() * 0.3),
      posAttr.getY(i),
      posAttr.getZ(i) * (0.85 + Math.random() * 0.3)
    )
  }
  geo.computeVertexNormals()
  geo.rotateX(Math.PI) // 尖朝下
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 1, flatShading: true }))
  return mesh
}

export function disposeDecorationMatCache() {
  _matCache.forEach(m => m.dispose())
  _matCache.clear()
}
