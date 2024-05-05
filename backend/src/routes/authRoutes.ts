import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from 'hono/jwt'
import { signInInput, signUpInput } from '@prasannardesai/medium-common'

const auth = new Hono<{ Bindings: { DATABASE_URL: string, JWT_SECRET: string } }>(); PrismaClient;

auth.post('/signup', async (ctx) => {
  const prisma = new PrismaClient({ datasourceUrl: ctx.env.DATABASE_URL, }).$extends(withAccelerate());
  const body = await ctx.req.json()
  const { success } = signUpInput.safeParse(body)
  if (!success) {
    ctx.status(411);
    return ctx.json({ error: 'Invalid inputs' });
  }
  try {
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password
      }
    })
    const token = await sign({ id: user.id }, ctx.env.JWT_SECRET)
    return ctx.json({ token })
  } catch (error) {
    console.log('error:', error);
    ctx.status(411);
    return ctx.json({ error: 'Internal server error' });
  }
})

auth.post('/signin', async (ctx) => {
  const prisma = new PrismaClient({ datasourceUrl: ctx.env.DATABASE_URL, }).$extends(withAccelerate());
  const body = await ctx.req.json()
  const { success } = signInInput.safeParse(body)
  if (!success) {
    ctx.status(411);
    return ctx.json({ error: 'Invalid inputs' });
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
        password: body.password
      }
    })
    if (!user) {
      ctx.status(403);
      return ctx.json({
        error: 'Incorrect credentials'
      })
    }
    const token = await sign({ id: user.id }, ctx.env.JWT_SECRET)
    return ctx.json({ token })
  } catch (error) {
    ctx.status(511);
    return ctx.json({ error: 'Internal server error' });
  }
})

export default auth;



