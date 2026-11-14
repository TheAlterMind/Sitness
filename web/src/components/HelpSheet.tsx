import { Popup } from 'antd-mobile'

const ITEMS: { term: string; text: string }[] = [
  { term: 'The big ring', text: 'Fills as your next break gets closer. When it is full, it is time to move.' },
  { term: 'The two small counters', text: 'Breaks and glasses of water so far today. They fill towards your daily goals.' },
  { term: 'XP and levels', text: 'Every finished break earns XP. Levels get further apart as you go, and each has a title.' },
  { term: 'Combo', text: 'Breaks in a row. Each one adds 10% more XP, up to double. Skipping or ignoring a break resets it; snoozing does not.' },
  { term: 'Streak', text: 'Days in a row you reach your daily goal. Grace days mean one bad day does not wipe it, and days your schedule is off cannot break it.' },
]

/** A short explanation of the game terms, for someone who has just installed the app. */
export function HelpSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Popup visible={visible} onMaskClick={onClose} bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
      <div className="help-sheet" role="dialog" aria-label="How it works">
        <div className="help-title">How it works</div>
        {ITEMS.map(i => (
          <div className="help-item" key={i.term}>
            <div className="help-term">{i.term}</div>
            <div className="help-text">{i.text}</div>
          </div>
        ))}
        <button className="help-close" onClick={onClose}>Got it</button>
      </div>
    </Popup>
  )
}
