import { useRef } from 'react'
import type { TouchEvent } from 'react'

/** Starts this close to a screen edge are left alone: Android uses the edges for its own back gesture. */
const EDGE_PX = 24
const MIN_DISTANCE_PX = 70
const MAX_MS = 700
/**
 * Things that use horizontal drags themselves, so a swipe that starts on them is not a screen swipe.
 * Popups render elsewhere in the page, but React still bubbles their touches up to the screen, so they are listed too.
 */
const DEFAULT_IGNORE = 'input, textarea, .slider-row, .adm-selector, .adm-popup, .adm-mask, .adm-center-popup, [data-no-swipe]'

interface Options {
  /** A swipe towards the left (the content moves left). */
  onLeft?: () => void
  /** A swipe towards the right (the content moves right). */
  onRight?: () => void
  ignore?: string
}

/**
 * Touch handlers for a screen-level horizontal swipe. Spread the result on the screen's root element.
 * Directions follow the screens' layout: Stats sits left of Home and Settings right of it, so swiping
 * left on Home opens Settings, swiping right on Home opens Stats, and the way back is the opposite swipe.
 */
export function useSwipe({ onLeft, onRight, ignore = DEFAULT_IGNORE }: Options) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  return {
    onTouchStart(e: TouchEvent) {
      const p = e.touches[0]
      const ignored = (e.target as Element | null)?.closest?.(ignore)
      start.current = e.touches.length === 1 && !ignored && p.clientX > EDGE_PX && p.clientX < window.innerWidth - EDGE_PX
        ? { x: p.clientX, y: p.clientY, t: Date.now() }
        : null
    },
    onTouchEnd(e: TouchEvent) {
      const s = start.current
      start.current = null
      if (!s) return
      const p = e.changedTouches[0]
      const dx = p.clientX - s.x
      const dy = p.clientY - s.y
      if (Date.now() - s.t > MAX_MS || Math.abs(dx) < MIN_DISTANCE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return
      if (dx < 0) onLeft?.()
      else onRight?.()
    },
    onTouchCancel() { start.current = null },
  }
}
