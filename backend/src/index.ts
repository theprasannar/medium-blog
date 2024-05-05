import { Hono } from 'hono'
import authRoutes from './routes/authRoutes'
import blogRoutes from './routes/blogRoutes'
const app = new Hono<{ Bindings: { DATABASE_URL: string, JWT_SECRET: string } }>();

app.get('/', (c) => {
  return c.text('Hello Hono!')
})


app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/blog', blogRoutes)

export default app
