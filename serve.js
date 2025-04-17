const server = Bun.serve({
  port: 3200,
  async fetch(req) {
    const url = new URL(req.url);
    const path = `./public${url.pathname === '/' ? '/index.html' : url.pathname}`;
    try {
      return new Response(Bun.file(path));
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
});

console.log(`Serving at http://localhost:${server.port}`);
