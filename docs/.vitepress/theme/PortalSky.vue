<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ page: number }>()
const canvas = ref<HTMLCanvasElement>()
const meteor = ref<Record<string, string> | null>(null)
type Point = { x: number; y: number }
type Star = Point & { from: Point; to: Point; size: number; alpha: number; phase: number; dust: boolean; spread: Point; weight: number; offset: Point; velocity: Point; free: boolean; pull: number; duration: number; delay: number }
let stars: Star[] = []
let context: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let frame = 0
let lastFrame = 0
let lastDraw = 0
let transitionStart = 0
let timer: ReturnType<typeof setTimeout> | undefined
let motion: MediaQueryList | undefined
const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, strength: 0, speed: 0 }
const noise = (index: number) => (Math.sin(index * 127.1 + 3) * 43758.5453 % 1 + 1) % 1

function movePointer(event: PointerEvent) {
  if (event.pointerType === 'touch' || motion?.matches) return
  if (!pointer.active && pointer.strength < .01) {
    pointer.x = event.clientX; pointer.y = event.clientY
  }
  pointer.targetX = event.clientX; pointer.targetY = event.clientY
  pointer.active = true
}
function leavePointer() { pointer.active = false }

// 在柔软的曲面与云团内采样，不沿边缘等距排点；每颗星尘保留自己的散逸方向。
function destination(index: number): Point & { weight: number } {
  if (!stars[index].dust || stars[index].free) return { x: noise(index * 3), y: noise(index * 3 + 1), weight: 1 }
  const u = noise(index * 11 + 2)
  const v = noise(index * 11 + 3)
  const fuzz = (noise(index * 11 + 4) + noise(index * 11 + 5) + noise(index * 11 + 6) - 1.5)
  let x = 0, y = 0
  // 边缘逐渐消隐，不出现齐整的裁切边界。
  let weight = .35 + .65 * Math.pow(Math.sin(v * Math.PI), .5)
  switch (props.page) {
    case 1: {
      // 对话框由宽窄不一的星尘带和稀疏内层组成，尾部融入下缘。
      if (index % 9 === 0) {
        x = -.55 + u * .32
        y = .5 + u * .35 + (v - .5) * .13
      } else {
        const angle = u * Math.PI * 2
        const radius = index % 4 === 0 ? Math.sqrt(v) : .8 + v * .2
        x = Math.sign(Math.cos(angle)) * Math.pow(Math.abs(Math.cos(angle)), .45) * radius
        y = Math.sign(Math.sin(angle)) * Math.pow(Math.abs(Math.sin(angle)), .45) * radius * .65
      }
      break
    }
    case 2: {
      const leaf = u < .5 ? -1 : 1
      const across = Math.abs(u * 2 - 1)
      const bottom = .58 - Math.sin(across * Math.PI) * .27 - across * .2
      x = leaf * across
      y = bottom - (1 - v) * (.6 + across * .4) - (leaf === 1 ? across * .15 : 0)
      weight *= .55 + .45 * Math.sin(across * Math.PI)
      break
    }
    case 3: {
      // 两个倾斜、交叠的宽星尘环，留出链环的内部空间。
      const side = index % 2 === 0 ? -1 : 1
      const angle = u * Math.PI * 2
      const radius = .72 + v * .28
      const localX = Math.cos(angle) * .56 * radius
      const localY = Math.sin(angle) * .32 * radius
      x = side * .38 + localX * .86 - localY * .5
      y = -side * .24 + localX * .5 + localY * .86
      break
    }
    case 4: {
      // 银河：疏松旋臂、弥散盘面和明亮但不刺眼的中央核球。
      const core = index % 5 === 0
      const radius = core ? Math.pow(u, 1.6) * .24 : .18 + Math.pow(u, .75) * .82
      const angle = core ? v * Math.PI * 2 : index % 3 * Math.PI * 2 / 3 + radius * 4.5 + fuzz * .45
      x = Math.cos(angle) * radius
      y = Math.sin(angle) * radius * .72
      weight *= core ? 1 : 1 - u * .3
      break
    }
    default: {
      // 四芒星的内凹曲面，以星尘密度形成星芒，不描边。
      const angle = u * Math.PI * 2
      const radius = Math.sqrt(v)
      x = Math.pow(Math.cos(angle), 3) * radius
      y = Math.pow(Math.sin(angle), 3) * radius
      weight *= .65 + v * .35
    }
  }
  // 扭曲和不对称散点让密度自然过渡，降低具象轮廓的存在感。
  x += fuzz * .09 + Math.sin(y * 3) * .045
  y += (noise(index * 13 + 4) - .5) * .08
  const mobile = width < 768
  // 单个主图案的包围面积约占一屏三分之一，分布宽松，不再摆放两侧小图标。
  const scaleX = mobile ? .56 : .35
  const scaleY = mobile ? .3 : props.page === 0 ? .43 : .37
  return {
    x: (mobile ? .5 : props.page === 1 ? .4 : .5) + x * scaleX,
    y: (props.page === 2 ? .63 : .57) + y * scaleY,
    weight
  }
}

function retarget(immediate = false) {
  transitionStart = performance.now()
  stars.forEach((star, index) => {
    // 背景星与游离星尘保持各自锚点，只有主体星尘参与图案切换。
    if (!star.dust || star.free) return
    star.from = { x: star.x, y: star.y }
    star.duration = 3400 + noise(index * 19 + props.page * 71) * 2800
    star.delay = noise(index * 23 + props.page * 43) * 700
    const target = destination(index)
    star.to = target
    star.weight = target.weight
    if (immediate || motion?.matches) {
      star.x = star.to.x; star.y = star.to.y
      star.from = { ...star.to }
    }
  })
  if (motion?.matches) draw(transitionStart)
}
function resize() {
  width = window.innerWidth
  height = window.innerHeight
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.value!.width = Math.round(width * ratio)
  canvas.value!.height = Math.round(height * ratio)
  context!.setTransform(ratio, 0, 0, ratio, 0, 0)
  const count = width < 768 ? 900 : 4200
  stars = Array.from({ length: count }, (_, index) => {
    const point = { x: noise(index * 3), y: noise(index * 3 + 1) }
    const dust = index % 13 !== 0
    const angle = noise(index + 12) * Math.PI * 2
    const spread = 10 + Math.pow(noise(index + 17), 2) * 42
    return {
      ...point, from: point, to: point, dust, weight: 1,
      free: dust && index % 7 === 0, pull: 0, duration: 3400, delay: 0,
      offset: { x: 0, y: 0 }, velocity: { x: 0, y: 0 },
      size: dust ? .65 + Math.pow(noise(index + 9), 1.4) * .65 : index % 11 === 0 ? 1.5 : .7,
      alpha: dust ? .45 + noise(index + 4) * .45 : .38 + noise(index + 4) * .42,
      phase: noise(index + 5) * Math.PI * 2,
      spread: { x: Math.cos(angle) * spread, y: Math.sin(angle) * spread }
    }
  })
  retarget(true)
}
function draw(time: number) {
  const dt = Math.min((time - lastDraw) / 1000, .05)
  lastDraw = time
  context!.clearRect(0, 0, width, height)
  pointer.strength += ((pointer.active && !motion?.matches ? 1 : 0) - pointer.strength) * .08
  const pointerDX = pointer.targetX - pointer.x, pointerDY = pointer.targetY - pointer.y
  pointer.x = pointer.targetX; pointer.y = pointer.targetY
  const speed = pointer.active && !motion?.matches ? Math.min(1600, Math.hypot(pointerDX, pointerDY) / Math.max(dt, .001)) : 0
  pointer.speed += (speed - pointer.speed) * (1 - Math.exp(-7 * dt))
  const scatter = Math.min(1, pointer.speed / 950)
  stars.forEach((star, index) => {
    if (star.dust && !star.free && !motion?.matches) {
      const progress = Math.min(1, Math.max(0, (time - transitionStart - star.delay) / star.duration))
      const ease = progress * progress * (3 - 2 * progress)
      const travel = Math.min(1, Math.hypot(star.to.x - star.from.x, star.to.y - star.from.y) * 5)
      const arc = Math.sin(progress * Math.PI) * (noise(index + 13) - .5) * .1 * travel
      star.x = star.from.x + (star.to.x - star.from.x) * ease + arc
      star.y = star.from.y + (star.to.y - star.from.y) * ease + arc * .6
    }
    const twinkle = motion?.matches ? .8 : .74 + Math.sin(time / (1700 + index % 8 * 300) + star.phase) * .22
    // 低频流场让停留时的星群也轻轻涌动，幅度远小于翻页聚合。
    const driftScale = star.dust ? 1 : .12
    const driftX = motion?.matches ? 0 : (Math.sin(time / 4200 + star.y * 6) * 9 + Math.sin(time / 6700 + star.phase) * 4) * driftScale
    const driftY = motion?.matches ? 0 : (Math.cos(time / 5100 + star.x * 5) * 8 + Math.sin(time / 3800 + star.phase) * 3) * driftScale
    const release = star.dust ? (motion?.matches ? .38 : .18 + Math.pow((Math.sin(time / 6400 + star.phase) + 1) / 2, 3) * .9) : 0
    let x = star.x * width + driftX + star.spread.x * release
    let y = star.y * height + driftY + star.spread.y * release
    let attraction = 0
    if (star.dust && !motion?.matches) {
      // 小范围内牵引主体与游离星尘，远处图案继续保持完整。
      // 慢移时承接指针位移；快移时保留不同程度的惯性，星群自然散开。
      const carry = .85 - scatter * (.15 + noise(index + 51) * .2)
      star.offset.x += pointerDX * star.pull * carry
      star.offset.y += pointerDY * star.pull * carry
      const dx = pointer.x - (x + star.offset.x), dy = pointer.y - (y + star.offset.y)
      const distance = Math.hypot(dx, dy)
      const reach = Math.min(width * .16, 190)
      const proximity = Math.min(1, Math.max(0, (1 - distance / reach) * 2))
      attraction = proximity * proximity * (3 - 2 * proximity) * pointer.strength
      const unitX = dx / Math.max(distance, 1), unitY = dy / Math.max(distance, 1)
      const orbitRadius = 28 + noise(index + 81) * 55 + scatter * (24 + noise(index + 91) * 56)
      const inward = (distance - orbitRadius) * 14
      star.pull = attraction
      // 中心吸引与切向力共同形成松散旋流；失去引力后缓缓回到图案。
      const returnForce = 3.2 * (1 - attraction)
      star.velocity.x += ((unitX * inward - unitY * 46) * attraction - star.offset.x * returnForce) * dt
      star.velocity.y += ((unitY * inward + unitX * 46) * attraction - star.offset.y * returnForce) * dt
      const damping = Math.exp(-5.8 * dt)
      star.velocity.x *= damping; star.velocity.y *= damping
      star.offset.x += star.velocity.x * dt; star.offset.y += star.velocity.y * dt
      // 主图案允许局部松动，但不会被鼠标一路拖离原来的位置。
      if (!star.free) {
        const displacement = Math.hypot(star.offset.x, star.offset.y)
        if (displacement > 90) {
          star.offset.x *= 90 / displacement; star.offset.y *= 90 / displacement
        }
      }
      x += star.offset.x; y += star.offset.y
    } else if (motion?.matches) {
      star.offset.x = 0; star.offset.y = 0
      star.velocity.x = 0; star.velocity.y = 0
      star.pull = 0
    }
    const shimmer = motion?.matches ? 0 : Math.pow(Math.max(0, Math.sin(time / 2700 - index * .28)), 14) * .16
    context!.globalAlpha = Math.min(1, (star.alpha * twinkle + shimmer * (star.dust ? .2 : 1)) * star.weight * (1 - release * .3)) * (1 - attraction * .2)
    context!.fillStyle = star.dust ? (index % 5 === 0 ? '#d3d9eb' : '#a9cce3') : '#d5efff'
    context!.beginPath()
    context!.arc(x, y, star.size, 0, Math.PI * 2)
    context!.fill()
    if (!star.dust && index % 11 === 0) {
      const glow = context!.createRadialGradient(x, y, 0, x, y, 7)
      glow.addColorStop(0, '#94d8ff55'); glow.addColorStop(1, '#94d8ff00')
      context!.fillStyle = glow
      context!.fillRect(x - 7, y - 7, 14, 14)
    }
  })

}
function animate(time: number) {
  // 背景以约 30 帧更新，文字和滚动保持浏览器原生刷新频率。
  if (time - lastFrame >= 30) { draw(time); lastFrame = time }
  frame = requestAnimationFrame(animate)
}
function scheduleMeteor() {
  clearTimeout(timer)
  meteor.value = null
  if (document.hidden || motion?.matches) return
  timer = setTimeout(() => {
    const distance = 240 + Math.random() * 180
    meteor.value = { left: `${48 + Math.random() * 48}%`, top: `${6 + Math.random() * 58}%`, width: `${100 + Math.random() * 80}px`, animationDuration: `${1 + Math.random() * .6}s`, '--travel-x': `${-distance}px`, '--travel-y': `${distance * .67}px` }
  }, 4000 + Math.random() * 5000)
}
function syncMotion() {
  cancelAnimationFrame(frame)
  leavePointer()
  pointer.strength = 0
  pointer.speed = 0
  scheduleMeteor()
  if (document.hidden) return
  retarget(true)
  if (!motion?.matches) frame = requestAnimationFrame(animate)
}
watch(() => props.page, () => { if (context) retarget() })
onMounted(() => {
  context = canvas.value!.getContext('2d')
  if (!context) return
  motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  resize()
  syncMotion()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', movePointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', leavePointer)
  window.addEventListener('blur', leavePointer)
  motion.addEventListener('change', syncMotion)
  document.addEventListener('visibilitychange', syncMotion)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearTimeout(timer)
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', movePointer)
  document.documentElement.removeEventListener('pointerleave', leavePointer)
  window.removeEventListener('blur', leavePointer)
  motion?.removeEventListener('change', syncMotion)
  document.removeEventListener('visibilitychange', syncMotion)
})
</script>

<template>
  <div class="portal-sky" :data-page="page" aria-hidden="true">
    <div class="sky-nebula" :style="{ filter: `hue-rotate(${page * 8}deg)` }"></div>
    <div class="sky-lights">
      <canvas ref="canvas" class="sky-stars"></canvas>
      <i v-if="meteor" class="sky-meteor" :style="meteor" @animationend="scheduleMeteor"></i>
    </div>
  </div>
</template>

<style scoped>
.portal-sky { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: #070e1c; }
.sky-nebula { position: absolute; inset: -12%; background: radial-gradient(ellipse at 76% 24%,#087fab25,transparent 38%),radial-gradient(ellipse at 47% 76%,#5850ac1f,transparent 43%),radial-gradient(ellipse at 17% 50%,#164c7122,transparent 35%); transition: filter 1.6s ease; animation: nebula-drift 24s ease-in-out infinite alternate; }
/* 正文区域降低星光亮度，图案在留白处若隐若现。 */
.sky-lights { position: absolute; inset: 0; mask-image: linear-gradient(90deg,#000 5%,#000a 24%,#000a 76%,#000 95%); }
.sky-stars { position: absolute; inset: 0; width: 100%; height: 100%; }
.sky-meteor { position: absolute; height: 1px; opacity: 0; background: linear-gradient(90deg,#d7f6ff,transparent); transform: rotate(-34deg); animation: meteor-pass 1.3s ease-out both; }
.sky-meteor::before { content: ''; position: absolute; left: 0; top: -1px; width: 3px; height: 3px; border-radius: 50%; background: #d7f6ff; box-shadow: 0 0 9px 1px #aee4ff60; }
@keyframes nebula-drift { from { transform: translate(-1%,0) scale(1); } to { transform: translate(1.5%,1%) scale(1.035); } }
@keyframes meteor-pass { 0% { opacity: 0; transform: translate(0,0) rotate(-34deg); } 15% { opacity: .8; } 100% { opacity: 0; transform: translate(var(--travel-x),var(--travel-y)) rotate(-34deg); } }
@media(prefers-reduced-motion:reduce) { .sky-nebula { transition: none; animation: none; }.sky-meteor { display: none; animation: none; } }
@media(max-width:767px) { .sky-lights { opacity: .65; mask-image: none; } }
</style>
