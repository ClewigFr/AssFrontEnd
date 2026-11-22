import express from 'express'
import serveStatic from 'serve-static'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const app = express()
app.use(serveStatic(dist))
const port = process.env.PORT || 5000

app.listen(port)
console.log('server started on port ' + port)
