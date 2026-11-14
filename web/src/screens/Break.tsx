import { useEffect, useRef } from 'react'
import { Button, Dialog, Swiper, Toast } from 'antd-mobile'
import type { SwiperRef } from 'antd-mobile'
import { api } from '../bridge'
import { CloseIcon, PauseIcon, PlayIcon } from '../components/Icons'
import { Vessel } from '../components/Vessel'
import { clock } from '../format'
import { usePoll } from '../hooks'

/** Asks to skip. Exposed so the Back button can use the same confirmation. */
export function confirmSkip(done: () => void) {
  Dialog.confirm({
    title: 'Skip this break?',
    content: 'It counts as skipped and resets your combo.',
    confirmText: 'Skip',
    cancelText: 'Keep going',
    onConfirm: () => {
      try { api.skipBreak() } catch (e) { Toast.show({ content: (e as Error).message }) }
      done()
    },
  })
}

export function Break({ refresh }: { refresh: () => void }) {
  const [info, pull] = usePoll(api.getBreak, 250)
  const swiper = useRef<SwiperRef>(null)
  const handedOff = useRef(false)

  const finish = () => {
    if (handedOff.current) return
    handedOff.current = true
    try { api.finishBreak() } catch (e) { Toast.show({ content: (e as Error).message }); handedOff.current = false }
    refresh()
  }

  // The timer is a native clock; when it runs out the page just moves on.
  useEffect(() => {
    if (info && info.stage === 'break' && info.elapsedMs >= info.totalMs) finish()
  })

  if (!info || info.stage !== 'break') return <div className="page" />

  const exerciseIndex = Math.max(0, info.exercises.findIndex(e => e.id === info.exerciseId))

  return (
    <div className="page break">
      <header className="break-head">
        <button className="icon-tile" aria-label={info.running ? 'Pause the timer' : 'Resume the timer'}
          onClick={() => { try { api.togglePause() } catch { /* ignore */ } pull() }}>
          {info.running ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="phase">{info.running ? `Move for ${Math.round(info.totalMs / 60000)} min` : 'Paused'}</div>
        <button className="icon-tile" aria-label="Skip this break" onClick={() => confirmSkip(refresh)}>
          <CloseIcon />
        </button>
      </header>

      <section className="vessel-area">
        <div className="vessel-box">
          <Vessel progress={info.elapsedMs / info.totalMs} />
          <div className="vessel-time">{clock(info.totalMs - info.elapsedMs)}</div>
        </div>
      </section>

      <section className="carousel">
        <Swiper
          ref={swiper}
          defaultIndex={exerciseIndex}
          indicator={() => null}
          slideSize={84}
          trackOffset={8}
          stuckAtBoundary={false}
          onIndexChange={i => { try { api.setExercise(info.exercises[i].id) } catch { /* ignore */ } }}
        >
          {info.exercises.map(ex => (
            <Swiper.Item key={ex.id}>
              <article className="card exercise">
                <div className="row">
                  <span className="category">{ex.category.toUpperCase()}</span>
                  <span className="dim small">
                    {ex.manualOnly ? 'swipe only'
                      : ex.today > 0 ? `${ex.today} today · ${ex.total} all time` : `${ex.total} all time`}
                  </span>
                </div>
                <div className="ex-name">{ex.name}</div>
                <div className="dim ex-text">{ex.instruction}</div>
                {!ex.inPool && <div className="dim small">not in your rotation</div>}
              </article>
            </Swiper.Item>
          ))}
        </Swiper>
        <div className="dots">
          {info.exercises.map((ex, i) => (
            <span key={ex.id} className={'dot' + (i === exerciseIndex ? ' on' : '')} />
          ))}
        </div>
        <div className="dim small center">swipe to choose a different one</div>
      </section>

      <footer className="actions single">
        <Button color="primary" size="large" block onClick={finish}>Done</Button>
      </footer>
    </div>
  )
}
