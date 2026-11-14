import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { Popup } from 'antd-mobile'
import { pad2 } from '../format'

const FALLBACK_ITEM = 44 // px per row before it can be measured; the real height is 2.75rem and scales
const COPIES = 9         // the numbers are repeated so a hard fling never reaches an end
const MID = Math.floor(COPIES / 2)

/** One notch of a mouse wheel reports about 100px, far more than a row; anything this big counts as one step. */
const NOTCH_PX = 50
/** Trackpads send a stream of small deltas; this much adds up to one step. */
const TRACKPAD_STEP_PX = 40
/** How long a mouse flick keeps coasting, in ms of its release speed. */
const COAST_MS = 220

/**
 * One wheel of 0..count-1 that wraps around: after 23 comes 00, after 59 comes 00 (and the
 * other way). The list is repeated COPIES times and quietly moved back to the middle copy
 * whenever it comes to rest near an edge, so it never has an end.
 *
 * Touch uses the browser's own scrolling. Mouse input is handled here so that it behaves like
 * a wheel: one row per notch, drag to turn it, flick to spin it, click a number to pick it,
 * arrow keys to step.
 */
function Wheel({ count, value, label, onChange }: {
  count: number
  value: number
  label: string
  onChange: (v: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number>()
  const target = useRef(0)                       // row index the wheel is heading for
  const suppressClick = useRef(false)
  const drag = useRef<{ y: number; top: number; moved: boolean; samples: { t: number; y: number }[] } | null>(null)
  const [selected, setSelected] = useState(value)
  const [dragging, setDragging] = useState(false)
  const total = COPIES * count

  // The row height in real pixels. It follows the interface scale, so it is measured, not assumed.
  const rowPx = () => ref.current?.querySelector('.wheel-item')?.getBoundingClientRect().height || FALLBACK_ITEM

  const goTo = (index: number, smooth = true) => {
    const el = ref.current
    if (!el) return
    const i = Math.max(0, Math.min(total - 1, index))
    target.current = i
    el.scrollTo({ top: i * rowPx(), behavior: smooth ? 'smooth' : 'auto' })
  }

  useLayoutEffect(() => {
    target.current = MID * count + value
    if (ref.current) ref.current.scrollTop = target.current * rowPx()
    return () => window.clearTimeout(settleTimer.current)
    // Only the starting position matters; after that the wheel owns its own scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mouse wheel: one row per notch. Needs a non-passive listener so the page's own scroll is cancelled.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 200 : e.deltaY
      if (Math.abs(px) >= NOTCH_PX) {
        acc = 0
        goTo(target.current + Math.sign(px))
      } else {
        acc += px
        if (Math.abs(acc) >= TRACKPAD_STEP_PX) { goTo(target.current + Math.sign(acc)); acc = 0 }
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // goTo only reads refs and `total`, which is fixed for a given count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const onScroll = () => {
    const el = ref.current
    if (!el) return
    const row = rowPx()
    const index = Math.round(el.scrollTop / row)
    const v = ((index % count) + count) % count
    setSelected(v)
    onChange(v)

    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      const r = rowPx()
      const idx = Math.round(el.scrollTop / r)
      if (idx < 2 * count || idx >= (COPIES - 2) * count) {
        el.scrollTop = (MID * count + (((idx % count) + count) % count)) * r
      }
      target.current = Math.round(el.scrollTop / r)
    }, 140)
  }

  // Mouse and pen drag. Touch is left to native scrolling (touch-action: pan-y).
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || e.button !== 0) return
    drag.current = { y: e.clientY, top: ref.current!.scrollTop, moved: false, samples: [{ t: e.timeStamp, y: e.clientY }] }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* no active pointer to capture */ }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.y
    if (!d.moved && Math.abs(dy) > 4) { d.moved = true; setDragging(true) }
    if (d.moved) {
      ref.current!.scrollTop = d.top - dy
      d.samples.push({ t: e.timeStamp, y: e.clientY })
      if (d.samples.length > 8) d.samples.shift()
    }
  }

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || !d.moved) return
    setDragging(false)
    suppressClick.current = true
    window.setTimeout(() => { suppressClick.current = false }, 0)

    // Coast on from the speed at release, then settle on a row.
    const recent = d.samples.filter(s => e.timeStamp - s.t < 120)
    const a = recent[0]
    const b = recent[recent.length - 1]
    const v = a && b && b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0       // px per ms, positive = dragged down
    const top = ref.current!.scrollTop - v * COAST_MS
    goTo(Math.round(top / rowPx()))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); goTo(target.current + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); goTo(target.current - 1) }
  }

  return (
    <div
      className={'wheel' + (dragging ? ' dragging' : '')}
      ref={ref}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label={label}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          role="option"
          aria-selected={i % count === selected}
          className={'wheel-item' + (i % count === selected ? ' on' : '')}
          onClick={() => { if (!suppressClick.current) goTo(i) }}
        >
          {pad2(i % count)}
        </div>
      ))}
    </div>
  )
}

/** Bottom sheet with an hour wheel and a minute wheel. Mount it when editing, unmount when done. */
export function TimeWheelPopup({ title, minutes, onConfirm, onCancel }: {
  title: string
  /** Minute of day to start on. */
  minutes: number
  onConfirm: (minutes: number) => void
  onCancel: () => void
}) {
  const hour = useRef(Math.floor(minutes / 60))
  const minute = useRef(minutes % 60)

  return (
    <Popup visible onMaskClick={onCancel} bodyClassName="wheel-sheet">
      <div className="wheel-head">
        <button className="wheel-btn" onClick={onCancel}>Cancel</button>
        <span className="wheel-title">{title}</span>
        <button className="wheel-btn confirm" onClick={() => onConfirm(hour.current * 60 + minute.current)}>Confirm</button>
      </div>
      <div className="wheel-body">
        <div className="wheel-band" />
        <Wheel count={24} value={hour.current} label="Hour" onChange={v => { hour.current = v }} />
        <div className="wheel-colon">:</div>
        <Wheel count={60} value={minute.current} label="Minute" onChange={v => { minute.current = v }} />
      </div>
    </Popup>
  )
}
