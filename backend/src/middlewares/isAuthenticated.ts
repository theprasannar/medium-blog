import { Hono } from "hono";
import { verify } from "hono/jwt";

// Define isAuthenticated middleware
const isAuthenticated = async (ctx, next) => {
  const header = ctx.req.header("authorization")
  const token = header.split(" ")[1];
  const response = await verify(token, ctx.env.JWT_SECRET)
  if (response.id) {
    await next()
  } else {
    ctx.status(403);
    ctx.json({ error: 'unauthorized' })
  }
};

export { isAuthenticated };
