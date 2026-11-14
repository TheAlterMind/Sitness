import { Dialog, Toast } from 'antd-mobile'
import { api } from './bridge'
import { friendlyError } from './errors'

/** The one "reset statistics" flow, used by Stats and Settings so both say the same thing. */
export async function confirmResetStats(onDone?: () => void): Promise<void> {
  const ok = await Dialog.confirm({
    title: 'Reset all statistics?',
    content: 'XP, levels, streaks, badges and history are erased. Settings are kept. This cannot be undone.',
    confirmText: 'Erase everything',
    cancelText: 'Cancel',
  })
  if (!ok) return
  try { api.resetStats(); Toast.show({ icon: 'success', content: 'Statistics erased' }) }
  catch (e) { Toast.show({ content: friendlyError(e, 'erase your statistics') }) }
  onDone?.()
}
