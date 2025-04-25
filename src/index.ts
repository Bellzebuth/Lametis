import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import sqlite3 from 'sqlite3'

sqlite3.verbose()

/**
 * @see https://github.com/TryGhost/node-sqlite3/wiki/API
 */
const db = new sqlite3.Database('db.sqlite3', (error) => {
  if (error === null) {
    return
  }
  console.error(error)
})

/**
 * @see https://hono.dev/
 */
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/projects', (c) => {
  return c.json([])
})

app.get('/projects/:projectId', (c) => {
  const {projectId} = c.req.param()

  return c.json({
    projectId
  })
})


app.post('/projects/', async (c) => {
  const body = await c.req.json()

  console.log(body)

  return c.json({
    success: true
  })
})

//

app.get('/projects/:projectId/analyses', (c) => {
  const {projectId} = c.req.param()

  return c.json([])
})

app.get('/projects/:projectId/analyses/:analysisId', (c) => {
  const {analysisId} = c.req.param()

  return c.json({
    analysisId
  })
})

app.post('/projects/:projectId/analyses', async (c) => {
  const {projectId} = c.req.param()
  const body = await c.req.json()

  console.log(body)

  return c.json({
    success: true
  })
})


const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
