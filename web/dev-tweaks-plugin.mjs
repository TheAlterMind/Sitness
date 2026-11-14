// Dev server only: the in-app tweak panel POSTs its settings to /__tweaks.json and they are saved to
// web/__tweaks.json, the same file the /iterate bar writes and src/dev/apply.js reads. Never part of a build.
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export const tweaks = {
  name: 'sitness-tweaks',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__tweaks.json', (req, res, next) => {
      if (req.method !== 'POST') return next()
      let body = ''
      req.on('data', c => { body += c; if (body.length > 200000) req.destroy() })
      req.on('end', () => {
        try { JSON.parse(body) } catch { res.statusCode = 400; res.end('bad json'); return }
        writeFileSync(resolve(here, '__tweaks.json'), body)
        res.end('ok')
      })
    })
  },
}
