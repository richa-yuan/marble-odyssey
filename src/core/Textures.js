// 程序化贴图:全部用 Canvas 2D 生成,零外部素材依赖。
import * as THREE from 'three'

const cache = new Map()

function canvasTexture(key, size, draw, repeat = 1) {
  if (cache.has(key)) return cache.get(key)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.repeat.set(repeat, repeat)
  cache.set(key, tex)
  return tex
}

function speckle(ctx, s, colors, count, rMin = 1, rMax = 3) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0]
    const r = rMin + Math.random() * (rMax - rMin)
    ctx.beginPath()
    ctx.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---- 草地:翠绿底 + 深浅色块斑点 + 细草簇 ----
export const grass = () => canvasTexture('grass', 256, (ctx, s) => {
  ctx.fillStyle = '#5da03f'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#549238', '#67ad48', '#4c8833', '#71b851'], 380, 2, 7)
  ctx.strokeStyle = 'rgba(45,80,30,0.5)'; ctx.lineWidth = 1.5
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * s, y = Math.random() * s
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - .5) * 3, y - 4 - Math.random() * 4); ctx.stroke()
  }
})

// ---- 泥土(平台侧面) ----
export const dirt = () => canvasTexture('dirt', 256, (ctx, s) => {
  ctx.fillStyle = '#7a5230'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#6b4527', '#8a6238', '#5d3d22', '#93703f'], 300, 2, 9)
  ctx.fillStyle = 'rgba(60,38,20,.35)'
  for (let i = 0; i < 20; i++) {
    ctx.beginPath(); ctx.arc(Math.random() * s, Math.random() * s, 8 + Math.random() * 14, 0, Math.PI * 2); ctx.fill()
  }
})

// ---- 沙地:暖沙底 + 波纹 ----
export const sand = () => canvasTexture('sand', 256, (ctx, s) => {
  ctx.fillStyle = '#d9a86a'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#cf9d60', '#e2b476', '#c79355'], 260, 1.5, 5)
  ctx.strokeStyle = 'rgba(160,115,60,.5)'; ctx.lineWidth = 2
  for (let y = 0; y < s; y += 26) {
    ctx.beginPath()
    for (let x = 0; x <= s; x += 8) ctx.lineTo(x, y + Math.sin(x * .05 + y * .13) * 6)
    ctx.stroke()
  }
})

// ---- 砂岩(遗迹石块侧面) ----
export const sandstone = () => canvasTexture('sandstone', 256, (ctx, s) => {
  ctx.fillStyle = '#c2a377'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#b39468', '#cdb086', '#a8895c'], 200, 2, 6)
  ctx.strokeStyle = 'rgba(120,92,55,.55)'; ctx.lineWidth = 2
  for (let y = 0; y <= s; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke() }
  for (let y = 0; y < s; y += 64) {
    const off = (y / 64) % 2 ? 32 : 0
    for (let x = 32; x < s; x += 64) { ctx.beginPath(); ctx.moveTo(x + off, y); ctx.lineTo(x + off, Math.min(y + 64, s)); ctx.stroke() }
  }
})

// ---- 大理石砖(石板路) ----
export const stoneTile = () => canvasTexture('stoneTile', 256, (ctx, s) => {
  ctx.fillStyle = '#a9b0bc'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#9ea5b2', '#b4bbc7', '#969daa'], 160, 2, 8)
  ctx.strokeStyle = 'rgba(70,78,92,.7)'; ctx.lineWidth = 3
  ctx.strokeRect(1, 1, s - 2, s - 2)
  ctx.strokeStyle = 'rgba(70,78,92,.35)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2); ctx.stroke()
})

// ---- 冰面:冷蓝 + 裂纹 ----
export const ice = () => canvasTexture('ice', 256, (ctx, s) => {
  const g = ctx.createLinearGradient(0, 0, s, s)
  g.addColorStop(0, '#bfe3ff'); g.addColorStop(.5, '#a8d4f5'); g.addColorStop(1, '#cdeaff')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5
  for (let i = 0; i < 14; i++) {
    let x = Math.random() * s, y = Math.random() * s
    ctx.beginPath(); ctx.moveTo(x, y)
    for (let j = 0; j < 5; j++) { x += (Math.random() - .5) * 60; y += (Math.random() - .5) * 60; ctx.lineTo(x, y) }
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(130,190,235,.6)'
  for (let i = 0; i < 10; i++) {
    let x = Math.random() * s, y = Math.random() * s
    ctx.beginPath(); ctx.moveTo(x, y)
    for (let j = 0; j < 4; j++) { x += (Math.random() - .5) * 50; y += (Math.random() - .5) * 50; ctx.lineTo(x, y) }
    ctx.stroke()
  }
})

// ---- 积雪 ----
export const snow = () => canvasTexture('snow', 256, (ctx, s) => {
  ctx.fillStyle = '#eef4fb'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#ffffff', '#e2eaf5', '#f6faff', '#d8e4f2'], 300, 2, 8)
  speckle(ctx, s, ['#cddcec'], 60, 6, 14)
})

// ---- 霓虹格板:深色底 + 发光格线(同时当 emissiveMap) ----
export const neonGrid = (lineColor = '#3af0ff') => canvasTexture(`neonGrid_${lineColor}`, 256, (ctx, s) => {
  ctx.fillStyle = '#141828'; ctx.fillRect(0, 0, s, s)
  ctx.strokeStyle = lineColor; ctx.lineWidth = 3
  ctx.shadowColor = lineColor; ctx.shadowBlur = 10
  ctx.strokeRect(2, 2, s - 4, s - 4)
  ctx.lineWidth = 1.5; ctx.shadowBlur = 6
  ctx.globalAlpha = .5
  ctx.beginPath(); ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2); ctx.stroke()
  ctx.globalAlpha = 1
  speckle(ctx, s, [lineColor + '18', '#ffffff10'], 40, 1, 2)
})

// ---- 深色金属面板(霓虹楼体) ----
export const darkPanel = () => canvasTexture('darkPanel', 128, (ctx, s) => {
  ctx.fillStyle = '#1a1e30'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#161a2a', '#1f2438'], 80, 2, 6)
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2
  for (let y = 0; y <= s; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke() }
})

// ---- 霓虹楼窗户(自发光) ----
export const neonWindows = () => canvasTexture('neonWindows', 128, (ctx, s) => {
  ctx.fillStyle = '#0b0e18'; ctx.fillRect(0, 0, s, s)
  const cols = ['#3af0ff', '#ff5ad0', '#ffe86b', '#7bff8a']
  for (let y = 8; y < s - 6; y += 16) {
    for (let x = 8; x < s - 6; x += 16) {
      if (Math.random() < .42) {
        ctx.fillStyle = cols[(Math.random() * cols.length) | 0]
        ctx.globalAlpha = .35 + Math.random() * .65
        ctx.fillRect(x, y, 7, 9)
      }
    }
  }
  ctx.globalAlpha = 1
})

// ---- 岩石(小行星/陨石) ----
export const rockTex = () => canvasTexture('rockTex', 256, (ctx, s) => {
  ctx.fillStyle = '#8d8f9c'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#7d7f8c', '#9a9caa', '#6f7180', '#a5a7b5'], 320, 2, 10)
  ctx.fillStyle = 'rgba(50,52,64,.3)'
  for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(Math.random() * s, Math.random() * s, 10 + Math.random() * 18, 0, Math.PI * 2); ctx.fill() }
})

// ---- 金属板(发射台/检查点底座) ----
export const metalPlate = () => canvasTexture('metalPlate', 128, (ctx, s) => {
  ctx.fillStyle = '#6d7688'; ctx.fillRect(0, 0, s, s)
  speckle(ctx, s, ['#616a7c', '#79839a'], 100, 1, 4)
  ctx.strokeStyle = 'rgba(30,36,48,.6)'; ctx.lineWidth = 3
  ctx.strokeRect(2, 2, s - 4, s - 4)
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1
  ctx.strokeRect(7, 7, s - 14, s - 14)
})

// ---- 木板(草坡 ramp) ----
export const wood = () => canvasTexture('wood', 256, (ctx, s) => {
  ctx.fillStyle = '#9c7043'; ctx.fillRect(0, 0, s, s)
  for (let x = 0; x < s; x += 42) {
    ctx.fillStyle = ['#946740', '#a4794c', '#8a5f38', '#ac7f52'][(x / 42 | 0) % 4]
    ctx.fillRect(x, 0, 40, s)
    ctx.strokeStyle = 'rgba(60,38,18,.7)'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(x + 40, 0); ctx.lineTo(x + 40, s); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(70,45,22,.45)'; ctx.lineWidth = 1.5
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * s
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 4, s * .3, x - 4, s * .6, x + 2, s); ctx.stroke()
  }
})

// ---- 滚珠外观:大理石漩涡纹(让滚动可见) ----
export const marbleBall = () => canvasTexture('marbleBall', 512, (ctx, s) => {
  const g = ctx.createRadialGradient(s * .4, s * .35, 10, s * .5, s * .5, s * .6)
  g.addColorStop(0, '#eef7ff'); g.addColorStop(1, '#cfe4f2')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  // 彩色漩涡带
  const swirl = (cx, cy, r, color, alpha, width) => {
    ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = width
    ctx.beginPath()
    for (let a = 0; a < Math.PI * 6; a += .05) {
      const rr = r * (a / (Math.PI * 6))
      const x = cx + Math.cos(a * 1.4 + rr * .06) * rr
      const y = cy + Math.sin(a * 1.4 + rr * .06) * rr
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  swirl(s * .30, s * .32, s * .30, '#2f6fe0', .85, 26)
  swirl(s * .72, s * .60, s * .34, '#d84fa8', .8, 22)
  swirl(s * .55, s * .18, s * .22, '#ffb84f', .75, 16)
  ctx.globalAlpha = .5; ctx.strokeStyle = '#1d3a8f'; ctx.lineWidth = 10
  swirl(s * .45, s * .75, s * .26, '#1d3a8f', .45, 18)
  ctx.globalAlpha = 1
  // 高光小白点
  speckle(ctx, s, ['rgba(255,255,255,.9)'], 26, 1, 3)
})

// ---- 软粒子圆点(粒子系统 sprite) ----
export const softDot = () => canvasTexture('softDot', 64, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 1, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(.4, 'rgba(255,255,255,.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
})

// ---- 星星(夜空) ----
export const starDot = () => canvasTexture('starDot', 32, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, '#ffffff'); g.addColorStop(.3, '#dfeaff'); g.addColorStop(1, 'rgba(160,200,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
})

// 根据 box 尺寸设置纹理重复,保持世界尺度一致
export function fitTexture(tex, w, h, scale = 0.35) {
  tex = tex.clone()
  tex.needsUpdate = true
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(Math.max(1, Math.round(w * scale * 2) / 2), Math.max(1, Math.round(h * scale * 2) / 2))
  return tex
}
