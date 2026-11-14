import { LeftOutline } from 'antd-mobile-icons'

/** The title bar of a sub-screen. The whole bar is one button that returns to Home. */
export function PageTitle({ children, onBack }: { children: string; onBack: () => void }) {
  return (
    <button className="page-head" aria-label={`Back from ${children}`} onClick={onBack}>
      <LeftOutline className="back" />
      <span className="page-title">{children}</span>
    </button>
  )
}
