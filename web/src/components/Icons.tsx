import type { ReactNode, SVGProps } from 'react'

function Svg({ children, size = 20, ...rest }: { children: ReactNode; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={`${size / 16}rem`} height={`${size / 16}rem`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

type P = { size?: number }

export const PauseIcon = (p: P) => <Svg {...p}><path d="M8 5v14M16 5v14" /></Svg>
export const PlayIcon = (p: P) => <Svg {...p}><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></Svg>
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const MinusIcon = (p: P) => <Svg {...p}><path d="M5 12h14" /></Svg>
export const CheckCircleIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-6.5" /></Svg>
)
export const CupIcon = (p: P) => (
  <Svg {...p}><path d="M5 4h14l-1.6 15a2 2 0 0 1-2 1.8H8.6a2 2 0 0 1-2-1.8L5 4z" /><path d="M5.7 10h12.6" /></Svg>
)
export const ClockIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
)
export const DropIcon = (p: P) => (
  <Svg {...p}><path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3z" /></Svg>
)
