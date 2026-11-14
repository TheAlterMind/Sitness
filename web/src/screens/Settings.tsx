import { Fragment, useState } from 'react'
import { CheckList, Collapse, Dialog, List, Picker, Popup, Selector, Slider, Switch, Toast } from 'antd-mobile'
import { api } from '../bridge'
import { PageTitle } from '../components/PageTitle'
import { TimeWheelPopup } from '../components/TimeWheel'
import { daySlots, minuteOfDay } from '../format'
import { FONT_CHOICES, getUserFont, setUserFont } from '../fonts'
import { SCALE_CHOICES, getUserScale, setUserScale } from '../scale'
import { GROUPS, labelFor } from '../settingsSchema'
import type { ActionId, Item } from '../settingsSchema'
import type { SettingKey, Settings } from '../types'

/** A slider that follows the finger locally and only tells the app when it is released. */
function SliderRow({ item, value, onCommit }: {
  item: Extract<Item, { kind: 'slider' }>
  value: number
  onCommit: (v: number) => void
}) {
  const [drag, setDrag] = useState<number | null>(null)
  const shown = drag ?? value
  const one = (v: number | [number, number]) => (Array.isArray(v) ? v[0] : v)
  return (
    <div className="slider-row">
      <div className="slider-value">{shown}{item.unit ? ` ${item.unit}` : ''}</div>
      <Slider
        min={item.min} max={item.max} step={item.step ?? 1} value={shown}
        onChange={v => setDrag(one(v))}
        onAfterChange={v => { setDrag(null); onCommit(one(v)) }}
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
  if (!s) return <div className="page" />

  const use24h = s.time_format === '24'

  // Show the fixed break times these settings produce, so what will happen is never a surprise.
  const slots = daySlots(s.day_start, s.day_end, s.interval_minutes)
  const shown = slots.slice(0, 10).map(m => minuteOfDay(m, use24h))
  const schedule = shown.join(' · ') + (slots.length > shown.length ? ` · … (${slots.length} a day)` : '')

  // The one-line summary pinned under the title, so the effect of the interval and the day's start and end stays in view.
  const summary = `${slots.length} ${slots.length === 1 ? 'Break' : 'Breaks'} a day · Every ${s.interval_minutes} min · ${minuteOfDay(s.day_start, use24h)}–${minuteOfDay(s.day_end, use24h)}`

  const save = (key: SettingKey, value: unknown) => {
    try {
      setS(api.setSetting(key, value))
      onChanged()
    } catch (e) {
      Toast.show({ icon: 'fail', content: (e as Error).message })
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
        case 'reset_stats':
          void confirmThen('Reset all statistics?', 'XP, levels, streaks and badges are erased. Settings are kept.', 'Erase',
            () => { api.resetStats(); Toast.show({ icon: 'success', content: 'Statistics erased' }) })
          break
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
      Toast.show({ icon: 'fail', content: (e as Error).message })
    }
  }

  // A greyed-out row says what to turn on, instead of just looking broken.
  const parentTitle = (key: SettingKey) => GROUPS.flatMap(g => g.items).find(i => 'key' in i && i.key === key)?.title

  const row = (item: Item) => {
    const disabled = !!item.dependsOn && !s[item.dependsOn]
    const common = { className: disabled ? 'disabled' : '', disabled }
    const note = disabled && item.dependsOn ? `Turn on "${parentTitle(item.dependsOn) ?? 'the setting above'}" to change this` : item.desc
    switch (item.kind) {
      case 'switch':
        return (
          <List.Item {...common} description={note}
            extra={<Switch checked={s[item.key] as boolean} onChange={v => save(item.key, v)} />}>
            {item.title}
          </List.Item>
        )
      case 'slider':
        return (
          <List.Item {...common} description={<>{note && <div>{note}</div>}
            <SliderRow item={item} value={s[item.key] as number} onCommit={v => save(item.key, v)} /></>}>
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
              multiple showCheckMark={false} columns={item.columns ?? 2} options={item.options} value={s[item.key] as string[]}
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
    <div className="page scrolling">
      <PageTitle onBack={onBack}>Settings</PageTitle>
      <div className="schedule-bar" aria-label="Current schedule">{summary}</div>
      <section className="card schedule">
        <div className="caption">YOUR BREAK TIMES</div>
        <div className="schedule-times">{schedule}</div>
        <div className="dim small">Fixed times, the same every day. Pausing or snoozing never moves them.</div>
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
