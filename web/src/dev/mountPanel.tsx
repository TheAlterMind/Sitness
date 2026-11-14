// Dev only: mounts the tweak panel beside the app, in its own React root.
import ReactDOM from 'react-dom/client'
import { TweakPanel } from './TweakPanel'

const host = document.createElement('div')
document.body.appendChild(host)
ReactDOM.createRoot(host).render(<TweakPanel />)
