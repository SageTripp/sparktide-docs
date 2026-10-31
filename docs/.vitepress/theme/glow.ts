import type { Directive } from 'vue'

const cleanups = new WeakMap<HTMLElement, () => void>()

// 每张玻璃独立透出随指针移动的柔光，离开后淡出。
export const vGlow: Directive<HTMLElement> = {
  mounted(element) {
    let frame = 0
    let x = 0, y = 0
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      x = event.clientX; y = event.clientY
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const rect = element.getBoundingClientRect()
        element.style.setProperty('--glow-x', `${x - rect.left}px`)
        element.style.setProperty('--glow-y', `${y - rect.top}px`)
        element.style.setProperty('--glow-active', '1')
      })
    }
    const leave = () => {
      cancelAnimationFrame(frame)
      frame = 0
      element.style.setProperty('--glow-active', '0')
    }
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', leave)
    cleanups.set(element, () => {
      leave()
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', leave)
    })
  },
  unmounted(element) {
    cleanups.get(element)?.()
    cleanups.delete(element)
  }
}
