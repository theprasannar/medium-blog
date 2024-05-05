import { createBlogInput, updateBlogInput } from "@prasannardesai/medium-common";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

const blogRouter = new Hono<{ Bindings: { DATABASE_URL: string, JWT_SECRET: string }, Variables: { userId: string } }>(); PrismaClient;

blogRouter.use("/*", async (ctx, next) => {
  try {
    const authHeader = ctx.req.header("authorization") || '';
    if (!authHeader) {
      ctx.status(401);
      return ctx.json({ error: "Please login" });
    }
    const user = await verify(authHeader, ctx.env.JWT_SECRET);
    if (user) {
      ctx.set("userId", user.id);
      await next();
    } else {
      ctx.status(403);
      return ctx.json({ error: "You are not allowed to access this page" });
    }
  } catch (error) {
    console.error('Error:', error);
    ctx.status(500);
    return ctx.json({ error: "Internal Server Error" });
  }
});

blogRouter.get("/:id", async (ctx) => {
  const id = ctx.req.param("id");
  const prisma = new PrismaClient({ datasourceUrl: ctx.env.DATABASE_URL }).$extends(withAccelerate());
  try {
    const blog = await prisma.blog.findFirst({
      where: { id: Number(id) }
    });
    if (blog) {
      ctx.status(200);
      return ctx.json({ data: blog });
    } else {
      ctx.status(404);
      return ctx.json({ error: "Blog not found" });
    }
  } catch (error) {
    console.error('Error:', error);
    ctx.status(500);
    return ctx.json({ error: "Internal Server Error" });
  }
});

blogRouter.get("/", async (ctx) => {
  const prisma = new PrismaClient({ datasourceUrl: ctx.env.DATABASE_URL }).$extends(withAccelerate());
  try {
    const blogs = await prisma.blog.findMany();
    ctx.status(200);
    return ctx.json({ data: blogs });
  } catch (error) {
    console.error('Error:', error);
    ctx.status(500);
    return ctx.json({ error: "Internal Server Error" });
  }
});

blogRouter.post("/", async (ctx) => {
  const body = await ctx.req.json();
  const { success } = createBlogInput.safeParse(body);
  if (!success) {
    ctx.status(400);
    return ctx.json({ error: 'Invalid inputs' });
  }
  const authorId = ctx.get("userId");
  const prisma = new PrismaClient({ datasourceUrl: ctx.env.DATABASE_URL }).$extends(withAccelerate());
  try {
    const blog = await prisma.blog.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: Number(authorId),
        thumbnail: "test"
      }
    });
    ctx.status(201);
    return ctx.json({ id: blog.id });
  } catch (error) {
    console.error('Error:', error);
    ctx.status(500);
    return ctx.json({ error: "Internal Server Error" });
  }
});

blogRouter.put("/:id", async (ctx) => {
  const id = ctx.req.param("id");
  const body = await ctx.req.json();
  const { success } = updateBlogInput.safeParse(body);
  if (!success) {
    ctx.status(400);
    return ctx.json({ error: 'Invalid inputs' });
  }
  const prisma = new PrismaClient({ datasourceUrl: ctx.env.DATABASE_URL }).$extends(withAccelerate());
  try {
    const blog = await prisma.blog.update({
      where: {
        id: Number(id)
      },
      data: {
        title: body.title,
        content: body.content,
      }
    });
    ctx.status(200);
    return ctx.json({ id: blog.id });
  } catch (error) {
    console.error('Error:', error);
    ctx.status(500);
    return ctx.json({ error: "Internal Server Error" });
  }
});

blogRouter.delete("/", (ctx) => {
  ctx.status(405);
  return ctx.json({ error: "Method Not Allowed" });
});

export default blogRouter;
