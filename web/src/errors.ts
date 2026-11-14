/**
 * What to tell the user when a call to the app fails. The raw error (a bridge message, a stack
 * fragment) is for the developer, so it goes to the console and the user gets a plain sentence.
 *
 * `what` completes "Couldn't …", for example `friendlyError(e, 'save that setting')`.
 */
export function friendlyError(e: unknown, what: string): string {
  console.warn(`[sitness] couldn't ${what}:`, e)
  const raw = e instanceof Error ? e.message : String(e)
  if (/permission|denied|not allowed/i.test(raw)) {
    return `Couldn't ${what}: the app needs a permission. You can allow it in the phone's settings.`
  }
  return `Couldn't ${what}. Please try again.`
}
