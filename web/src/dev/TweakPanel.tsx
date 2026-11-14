// Dev-only tweak panel, drawn inside the app (the /iterate bar in Claude's UI needs a client that
// can seat a pane; this works anywhere the dev server runs). It shares the control list and the
// --tw-* variables with that bar: settings go to web/__tweaks.json through the dev server, and
// src/dev/apply.js plus tweakbar.css turn them into effects. Not part of a production build.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATALOGUE, FONTS, MOODS } from './catalogue'
import type { Control } from './catalogue'
import './panel.css'

type V = number | string | boolean
type Values = Record<string, V>

const STORE = 'sitness.tweaks'
const ALL: Control[] = CATALOGUE.flatMap(g => g.controls)
const PALETTE = ['#8e71e6', '#2fb6a0', '#d89c46', '#ea6a50', '#ffffff', '#000000', '#ff3b6b', '#3b82f6', '#22c55e', '#facc15', '#a855f7', '#f97316']
// Inspection aids: left alone when randomising.
const KEEP = /^(outlines|taps|grid|baseline|center|safe|pause|no-motion|forcedark|forcelight|hc|stretch|rtl-mirror|slow-frames|sound|mood|frame|device|dir)$/

const cur = (v: Values, c: Control): V => (c.id in v ? (v[c.id] as V) : (c.def as V))
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const dp = (step: number) => (String(step).split('.')[1] ?? '').length
const snap = (n: number, step: number) => Number((Math.round(n / step) * step).toFixed(dp(step) + 1))
const pick = <T,>(l: T[]): T => l[Math.floor(Math.random() * l.length)] as T

function build(v: Values, bump: number) {
  const vars: Record<string, string> = {}
  const attrs: Record<string, string> = {}
  for (const c of ALL) {
    if (!(c.id in v) || c.type === 'button') continue
    const x = v[c.id]
    if (c.id === 'frame' && !x) continue
    if (c.type === 'range') vars[c.var as string] = `${x}${c.unit ?? ''}`
    else if (c.type === 'select' || c.type === 'color') { vars[c.var as string] = String(x); attrs[`data-tw-${c.id}`] = String(x) }
    else if (x) { attrs[c.attr as string] = ''; vars[`--tw-${c.id}`] = '1' }
  }
  if ('ease' in v) {
    vars['--tw-ease-final'] = v.ease === 'custom'
      ? `cubic-bezier(${[v.bz1 ?? 0.2, v.bz2 ?? 0.8, v.bz3 ?? 0.2, v.bz4 ?? 1].join(',')})`
      : String(v.ease)
  }
  const fx = {
    rate: Number(v.rate ?? 1), pause: !!v.pause, fps: !!v['slow-frames'], ripple: !!v.ripple,
    sound: !!v.sound, tilt: !!v.tilt, rainbow: !!v.rainbow, confetti: !!v.confetti,
  }
  return { vars, attrs, fx, replay: bump }
}

function randomise(v0: Values, amount: number, only?: string): Values {
  const v = { ...v0 }
  const pool = only ? (CATALOGUE.find(g => g.id === only)?.controls ?? []) : ALL
  for (const c of pool) {
    if (c.type === 'button' || KEEP.test(c.id)) continue
    if (c.type === 'range') {
      const span = ((c.max ?? 1) - (c.min ?? 0)) * amount
      v[c.id] = snap(clamp(Number(cur(v, c)) + (Math.random() - 0.5) * 2 * span, c.min ?? 0, c.max ?? 1), c.step ?? 1)
    } else if (c.type === 'select') {
      if (Math.random() < amount) v[c.id] = pick(c.options as string[])
    } else if (c.type === 'toggle') {
      if (Math.random() < amount * 0.25) v[c.id] = !cur(v, c)
    } else if (Math.random() < amount) v[c.id] = pick(PALETTE)
  }
  return v
}

function exportText(v: Values): string {
  const b = build(v, 0)
  const css = `:root {\n${Object.entries(b.vars).map(([k, x]) => `  ${k}: ${x};`).join('\n')}\n}`
  const attrs = Object.keys(b.attrs).filter(k => b.attrs[k] === '')
  return `${css}${attrs.length ? `\n/* html attributes: ${attrs.join(' ')} */` : ''}\n/* JSON */ ${JSON.stringify(v)}`
}

function load(): Values {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}') as Values } catch { return {} }
}

export function TweakPanel() {
  const [values, setValues] = useState<Values>(load)
  const [bump, setBump] = useState(0)
  const [open, setOpen] = useState(false)
  const [group, setGroup] = useState('sitness')
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const past = useRef<Values[]>([])
  const future = useRef<Values[]>([])
  const prev = useRef<{ vars: Record<string, string>; attrs: Record<string, string> }>({ vars: {}, attrs: {} })

  // Apply at once (so sliders feel live) and save, so a reload and the other tweak bar see the same values.
  useEffect(() => {
    const b = build(values, bump)
    const root = document.documentElement
    for (const k of Object.keys(prev.current.vars)) if (!(k in b.vars)) root.style.removeProperty(k)
    for (const k of Object.keys(prev.current.attrs)) if (!(k in b.attrs)) root.removeAttribute(k)
    for (const [k, x] of Object.entries(b.vars)) root.style.setProperty(k, x)
    for (const [k, x] of Object.entries(b.attrs)) root.setAttribute(k, x)
    prev.current = { vars: b.vars, attrs: b.attrs }
    try { localStorage.setItem(STORE, JSON.stringify(values)) } catch { /* storage unavailable */ }
    const t = setTimeout(() => {
      void fetch('/__tweaks.json', { method: 'POST', body: JSON.stringify(b) }).catch(() => { /* dev server only */ })
    }, 120)
    return () => clearTimeout(t)
  }, [values, bump])

  const commit = useCallback((next: Values, replay = false) => {
    past.current = [...past.current, values].slice(-50)
    future.current = []
    setValues(next)
    if (replay) setBump(n => n + 1)
  }, [values])

  const set = (id: string, x: V) => {
    const next: Values = { ...values, [id]: x }
    if (id === 'mood' && typeof x === 'string' && MOODS[x]) Object.assign(next, MOODS[x])
    if (id === 'forcedark' && x) next.forcelight = false
    if (id === 'forcelight' && x) next.forcedark = false
    if (id === 'device' && typeof x === 'string' && parseInt(x, 10)) next.frame = parseInt(x, 10)
    commit(next, /enter|stagger|ease|bz|delay|gravity/.test(id))
  }
  const clear = (id: string) => { const n = { ...values }; delete n[id]; commit(n) }
  const undo = () => { const p = past.current.pop(); if (p) { future.current.push(values); setValues(p) } }
  const redo = () => { const f = future.current.pop(); if (f) { past.current.push(values); setValues(f) } }

  const act = (id: string) => {
    if (id === 'replay') return setBump(n => n + 1)
    if (id === 'chaos') return commit(randomise(values, 1), true)
    if (id === 'nudge') return commit(randomise(values, 0.15), true)
    if (id === 'golden') return commit({ ...values, unit: 6.18, gap: 16.18, section: 42.4, hratio: 1.618 })
    if (id === 'night') {
      const h = new Date().getHours()
      const dark = h < 6 || h > 20
      return commit({ ...values, tintc: dark ? '#1b2a6b' : h < 11 ? '#ffd08a' : '#ffffff', tint: dark ? 0.25 : 0.08 })
    }
    if (id === 'shuffle-font') return set('font', pick(FONTS))
    if (id === 'shuffle-hue') return set('hue', Math.round(Math.random() * 360 - 180))
  }

  const copy = async () => {
    const text = exportText(values)
    try { await navigator.clipboard.writeText(text); setNote('Copied CSS + JSON') } catch { setNote('Copy failed - see the console'); console.log(text) }
    setTimeout(() => setNote(''), 2000)
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) return ALL.filter(c => `${c.label} ${c.id} ${c.tip ?? ''}`.toLowerCase().includes(q))
    return CATALOGUE.find(g => g.id === group)?.controls ?? []
  }, [query, group])

  const changed = Object.keys(values).length

  return (
    <div className="tw-root">
      <button className="tw-fab" aria-label="Open the tweak panel" onClick={() => setOpen(o => !o)}>{open ? '×' : '⚙'}</button>
      {open && (
        <div className="tw-panel" role="dialog" aria-label="Tweak panel">
          <div className="tw-bar">
            <strong>Tweaks</strong>
            <span className="tw-count">{changed ? `${changed} changed` : 'untouched'}</span>
            <span className="tw-spacer" />
            <button onClick={undo} disabled={!past.current.length} title="Undo">↶</button>
            <button onClick={redo} disabled={!future.current.length} title="Redo">↷</button>
            <button onClick={() => commit({})} disabled={!changed} title="Reset everything">Reset</button>
            <button onClick={copy} title="Copy the changes as CSS and JSON">Copy</button>
          </div>
          {note && <div className="tw-note">{note}</div>}
          <input className="tw-search" placeholder={`Search ${ALL.length} controls`} value={query} onChange={e => setQuery(e.target.value)} />
          {!query && (
            <div className="tw-tabs">
              {CATALOGUE.map(g => (
                <button key={g.id} className={g.id === group ? 'on' : ''} onClick={() => setGroup(g.id)}>{g.title}</button>
              ))}
            </div>
          )}
          <div className="tw-list">
            {!query && <div className="tw-tools">
              <button onClick={() => commit(randomise(values, 0.5, group), true)}>Shuffle group</button>
              <button onClick={() => act('nudge')}>Nudge</button>
              <button onClick={() => act('chaos')}>Chaos</button>
            </div>}
            {shown.map(c => {
              const v = cur(values, c)
              const dirty = c.id in values
              return (
                <div key={c.id} className={`tw-row${dirty ? ' dirty' : ''}`} title={c.tip}>
                  <label>{c.label}</label>
                  <div className="tw-ctl">
                    {c.type === 'range' && <>
                      <input type="range" min={c.min} max={c.max} step={c.step} value={Number(v)}
                        onChange={e => set(c.id, Number(e.target.value))} />
                      <output>{String(v)}{c.unit ?? ''}</output>
                    </>}
                    {c.type === 'toggle' && <input type="checkbox" checked={!!v} onChange={e => set(c.id, e.target.checked)} />}
                    {c.type === 'select' && (
                      <select value={String(v)} onChange={e => set(c.id, e.target.value)}>
                        {(c.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {c.type === 'color' && <input type="color" value={String(v)} onChange={e => set(c.id, e.target.value)} />}
                    {c.type === 'button' && <button onClick={() => act(c.id)}>{c.label}</button>}
                    {dirty && <button className="tw-x" onClick={() => clear(c.id)} title="Back to default">↺</button>}
                  </div>
                </div>
              )
            })}
            {!shown.length && <div className="tw-empty">Nothing matches.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
