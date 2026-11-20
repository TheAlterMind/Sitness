import { Fragment, useRef, useState } from 'react'
import { CheckList, Collapse, Dialog, List, Picker, Popup, Selector, Slider, Switch, Toast } from 'antd-mobile'
import { api } from '../bridge'
import { friendlyError } from '../errors'
import { useSwipe } from '../swipe'
import { PageTitle } from '../components/PageTitle'
import { TimeWheelPopup } from '../components/TimeWheel'
import { daySlots, minuteOfDay } from '../format'
import { FONT_CHOICES, getUserFont, setUserFont } from '../fonts'
import { confirmResetStats } from '../resetStats'
import { SCALE_CHOICES, getUserScale, setUserScale } from '../scale'
import { GROUPS, labelFor } from '../settingsSchema'
import type { ActionId, Item } from '../settingsSchema'
import type { SettingKey, Settings } from '../types'

/**
 * A slider that follows the finger smoothly (no stepping while dragging), shows the nearest
 * step as a live number, glides to that step on release, and only then tells the app.
 */
function SliderRow({ item, value, onCommit, disabled }: {
  item: Extract<Item, { kind: 'slider' }>
  value: number
  onCommit: (v: number) => void
  disabled?: boolean
}) {
  const [drag, setDrag] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const settle = useRef<ReturnType<typeof setTimeout>>()
  const step = item.step ?? 1
  const one = (v: number | [number, number]) => (Array.isArray(v) ? v[0] : v)
  const snap = (v: number) => Math.min(item.max, Math.max(item.min, item.min + Math.round((v - item.min) / step) * step))
  const raw = drag ?? value
  const rowRef = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)

  /** Snap to the nearest step, save, and let the thumb glide there. */
  const finish = (v: number) => {
    const to = snap(v)
    clearTimeout(settle.current)
    setDragging(false)
    setDrag(to)
    onCommit(to)
    settle.current = setTimeout(() => setDrag(null), 250)
  }

  // antd listens for touch events only when the browser reports touch support (touchscreen laptops,
  // touch mode), which leaves a mouse unable to drag. So mouse and pen drags on the thumb are handled
  // here; touch still goes through antd.
  const onThumbPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'touch' || e.button !== 0) return
    if (!(e.target as Element).closest('.adm-slider-thumb-container')) return
    const track = rowRef.current?.querySelector('.adm-slider-track')
    if (!track) return
    e.stopPropagation()
    e.preventDefault()
    clearTimeout(settle.current)
    const width = track.getBoundingClientRect().width
    const startX = e.clientX
    const startRaw = raw
    let last = raw
    let moved = false
    const move = (ev: PointerEvent) => {
      moved = true
      last = Math.min(item.max, Math.max(item.min, startRaw + ((ev.clientX - startX) / width) * (item.max - item.min)))
      setDragging(true)
      setDrag(last)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      suppressClick.current = true // the click that follows must not jump the thumb to the cursor
      setTimeout(() => { suppressClick.current = false }, 100)
      if (moved) finish(last)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return (
    <div
      ref={rowRef}
      className={`slider-row${drag !== null && !dragging ? ' settling' : ''}`}
      onPointerDownCapture={onThumbPointerDown}
      onClickCapture={e => { if (suppressClick.current) e.stopPropagation() }}
    >
      <div className="slider-value">{snap(raw)}{item.unit ? ` ${item.unit}` : ''}</div>
      <Slider
        min={item.min} max={item.max} step={(item.max - item.min) / 1000} value={raw} disabled={disabled}
        onChange={v => { clearTimeout(settle.current); setDragging(true); setDrag(one(v)) }}
        onAfterChange={v => finish(one(v))}
      />
    </div>
  )
}

export function SettingsScreen({ onChanged, onBack }: { onChanged: () => void; onBack: () => void }) {
  const [s, setS] = useState<Settings | null>(() => {
    try { return api.getSettings() } catch { return null }
  })
  const [timeEdit, setTimeEdit] = useState<{ key: SettingKey; title: string; value: number } | null>(null)
  const [uiScale, setUiScale] = useState(getUserScale)
  const [font, setFont] = useState(getUserFont)
  const [fontOpen, setFontOpen] = useState(false)
  // Settings sits right of Home, so the way back is a swipe towards the right.
  const swipe = useSwipe({ onRight: onBack })
  if (!s) return <div className="page" />

  const use24h = s.time_format === '24'

  // Show the fixed break times these settings produce, so what will happen is never a surprise.
  const slots = daySlots(s.day_start, s.day_end, s.interval_minutes)
  const shown = slots.slice(0, 10).map(m => minuteOfDay(m, use24h))
  const schedule = shown.join(' · ') + (slots.length > shown.length ? ` · … (${slots.length} a day)` : '')

  const save = (key: SettingKey, value: unknown) => {
    try {
      setS(api.setSetting(key, value))
      onChanged()
    } catch (e) {
      Toast.show({ icon: 'fail', content: friendlyError(e, 'save that setting') })
      try { setS(api.getSettings()) } catch { /* keep what we have */ }
    }
  }

  const pickSelect = async (item: Extract<Item, { kind: 'select' }>) => {
    const v = await Picker.prompt({
      title: item.title,
      mouseWheel: true,
      columns: [item.options.map(o => ({ label: o.label, value: o.value }))],
      defaultValue: [String(s[item.key])],
    })
    if (v && v[0] != null) save(item.key, v[0])
  }

  // How large the interface is drawn. A preference of this screen only, so it lives on the page, not in the app.
  const pickScale = async () => {
    const v = await Picker.prompt({
      title: 'Interface size',
      mouseWheel: true,
      columns: [SCALE_CHOICES.map(c => ({ label: c.label, value: c.value }))],
      defaultValue: [uiScale],
    })
    if (v && v[0] != null) { setUserScale(Number(v[0])); setUiScale(Number(v[0])) }
  }

  const chooseFont = (v: string) => { setUserFont(v); setFont(v); setFontOpen(false) }

  const pickTime =(item: Extract<Item, { kind: 'time' }>) =>
    setTimeEdit({ key: item.key, title: item.title, value: s[item.key] as number })

  const confirmThen = async (title: string, content: string, confirmText: string, run: () => void) => {
    const ok = await Dialog.confirm({ title, content, confirmText, cancelText: 'Cancel' })
    if (ok) run()
  }

  const runAction = (id: ActionId) => {
    try {
      switch (id) {
        case 'exact_alarm': case 'battery': case 'notifications': api.openSystem(id); break
        case 'export': api.exportStats(); break
        case 'reset_stats': void confirmResetStats(); break
        case 'reset_settings':
          void confirmThen('Reset all settings?', 'Everything returns to the defaults, including the font and interface size. Your statistics are kept.', 'Reset',
            () => {
              setS(api.resetSettings()); onChanged()
              setUserFont('system'); setFont('system')
              setUserScale(1); setUiScale(1)
            })
          break
      }
    } catch (e) {
      Toast.show({ icon: 'fail', content: friendlyError(e, id === 'export' ? 'export your statistics' : id === 'reset_settings' ? 'reset the settings' : 'open the phone settings') })
    }
  }

  // A greyed-out row says what to turn on, instead of just looking broken.
  const parentTitle = (key: SettingKey) => GROUPS.flatMap(g => g.items).find(i => 'key' in i && i.key === key)?.title

  const row = (item: Item) => {
    const disabled = !!item.dependsOn && !s[item.dependsOn]
    // Dimmed, and marked disabled for assistive tech; the controls inside are switched off too (not blocked with pointer-events).
    const common = { className: disabled ? 'disabled' : '', disabled, 'aria-disabled': disabled ? true : undefined }
    const note = disabled && item.dependsOn ? `Turn on "${parentTitle(item.dependsOn) ?? 'the setting above'}" to change this` : item.desc
    switch (item.kind) {
      case 'switch':
        return (
          <List.Item {...common} description={note}
            extra={<Switch checked={s[item.key] as boolean} disabled={disabled} onChange={v => save(item.key, v)} />}>
            {item.title}
          </List.Item>
        )
      case 'slider':
        return (
          <List.Item {...common} description={<>{note && <div>{note}</div>}
            <SliderRow item={item} value={s[item.key] as number} disabled={disabled} onCommit={v => save(item.key, v)} /></>}>
            {item.title}
          </List.Item>
        )
      case 'select':
        return (
          <List.Item {...common} description={note} extra={labelFor(item, s)} onClick={() => void pickSelect(item)}>
            {item.title}
          </List.Item>
        )
      case 'time':
        return (
          <List.Item {...common} description={note} extra={minuteOfDay(s[item.key] as number, use24h)} onClick={() => pickTime(item)}>
            {item.title}
          </List.Item>
        )
      case 'multi':
        return (
          <List.Item {...common} description={<>{item.desc && <div>{item.desc}</div>}
            <Selector
              multiple showCheckMark={false} columns={item.columns ?? 2} options={item.options} value={s[item.key] as string[]} disabled={disabled}
              onChange={arr => {
                if (arr.length === 0) { Toast.show({ content: 'Keep at least one selected' }); return }
                save(item.key, arr)
              }}
            /></>}>
            {item.title}
          </List.Item>
        )
      case 'action':
        return (
          <List.Item {...common} description={item.desc} arrowIcon={false} onClick={() => runAction(item.id)}>
            {item.title}
          </List.Item>
        )
    }
  }

  return (
    <div className="page scrolling" {...swipe}>
      <PageTitle onBack={onBack}>Settings</PageTitle>
      <section className="card schedule">
        <div className="caption">YOUR BREAK TIMES</div>
        <div className="schedule-times">{schedule}</div>
        <div className="dim small">The same every day. Pause and snooze never move them.</div>
      </section>
      <Collapse accordion defaultActiveKey="Rhythm" className="settings-groups">
        {GROUPS.map(g => (
          <Collapse.Panel key={g.title} title={g.title}>
            <List>
              {g.items.map(item => <Fragment key={item.title}>{row(item)}</Fragment>)}
              {g.title === 'Appearance' && (
                <>
                  <List.Item
                    description="Makes everything larger or smaller. Automatic follows the size of the window, so a big screen gets a bigger interface."
                    extra={SCALE_CHOICES.find(c => c.value === uiScale)?.label ?? 'Automatic'}
                    onClick={() => void pickScale()}
                  >
                    Interface size
                  </List.Item>
                  <List.Item
                    description="The typeface used everywhere in the app. Fonts come from your device, so they may look slightly different on other phones."
                    extra={FONT_CHOICES.find(c => c.value === font)?.label ?? 'System default'}
                    onClick={() => setFontOpen(true)}
                  >
                    Font
                  </List.Item>
                </>
              )}
            </List>
          </Collapse.Panel>
        ))}
      </Collapse>
      <List header="About" mode="card">
        <List.Item description="Everything stays on this device. No accounts, no servers, no network permission.">
          Sitness 1.0
        </List.Item>
      </List>

      <Popup visible={fontOpen} onMaskClick={() => setFontOpen(false)} bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <div className="font-sheet">
          <div className="font-sheet-title">Font</div>
          <CheckList value={[font]} onChange={v => { if (v[0] != null) chooseFont(String(v[0])) }}>
            {FONT_CHOICES.map(c => (
              <CheckList.Item
                key={c.value} value={c.value}
                description={c.varies ? 'May look different on other phones' : undefined}
              >
                <span style={{ fontFamily: c.stack }}>{c.label}</span>
              </CheckList.Item>
            ))}
          </CheckList>
        </div>
      </Popup>

      {timeEdit && (
        <TimeWheelPopup
          title={timeEdit.title}
          minutes={timeEdit.value}
          onCancel={() => setTimeEdit(null)}
          onConfirm={v => { save(timeEdit.key, v); setTimeEdit(null) }}
        />
      )}
    </div>
  )
}
