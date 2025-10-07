import { Hono } from 'hono'
import { app as api } from './api'

const app = new Hono()

app.get('/', (c) => c.text('Its alive!'))
app.route('/api/v1', api)

export default app