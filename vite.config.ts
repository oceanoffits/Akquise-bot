import { timingSafeEqual } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function passwordProtect(): Plugin {
  return {
    name: 'password-protect',
    configurePreviewServer(server) {
      const password = process.env.APP_PASSWORT
      if (!password) return

      server.middlewares.use((req, res, next) => {
        const header = req.headers.authorization
        const provided = header?.startsWith('Basic ')
          ? Buffer.from(header.slice(6), 'base64').toString('utf-8').split(':')[1]
          : undefined

        const a = Buffer.from(provided ?? '')
        const b = Buffer.from(password)
        const match = a.length === b.length && timingSafeEqual(a, b)

        if (match) return next()

        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="Akquise-Bot"')
        res.end('Authentifizierung erforderlich')
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), passwordProtect()],
  preview: {
    allowedHosts: ['bot.oceanoffits.de'],
  },
})
