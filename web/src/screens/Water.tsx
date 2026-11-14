import { useRef, useState } from 'react'
import { Button, Toast } from 'antd-mobile'
import { api } from '../bridge'
import { DropIcon, MinusIcon, PlusIcon } from '../components/Icons'
import { usePoll } from '../hooks'

export function Water({ refresh }: { refresh: () => void }) {
  const [info] = usePoll(api.getBreak, null)
  const [glasses, setGlasses] = useState<number | null>(null)
  const busy = useRef(false)

  if (!info || info.stage !== 'water') return <div className="page" />

  const count = glasses ?? info.defaultGlasses

  const commit = () => {
    if (busy.current) return          // a double tap must not score the break twice
    busy.current = true
    try { api.commitBreak(count) } catch (e) {
      Toast.show({ content: (e as Error).message })
      busy.current = false
    }
    refresh()
  }

  return (
    <div className="page water">
      <section className="water-block">
        <div className="water-icon"><DropIcon size={52} /></div>
        <h1>Did you drink?</h1>
        <p className="dim center">Every glass is worth experience.<br />Leave it at zero if you didn't.</p>

        <div className="stepper">
          <button className="round" aria-label="One less" onClick={() => setGlasses(Math.max(0, count - 1))}><MinusIcon size={22} /></button>
          <div className="count">
            <div className="num">{count}</div>
            <div className="dim small">{count === 1 ? 'glass' : 'glasses'}</div>
          </div>
          <button className="round" aria-label="One more" onClick={() => setGlasses(Math.min(6, count + 1))}><PlusIcon size={22} /></button>
        </div>

        <div className="dim small">{info.waterToday} of {info.waterGoal} today</div>
      </section>

      <footer className="actions single">
        <Button color="primary" size="large" block onClick={commit}>Done</Button>
      </footer>
    </div>
  )
}
