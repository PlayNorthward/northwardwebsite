export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      let email;
      const contentType = request.headers.get('content-type') || '';

      try {
        if (contentType.includes('application/json')) {
          const body = await request.json();
          email = body.email;
        } else {
          const formData = await request.formData();
          email = formData.get('email');
        }
      } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
      }

      if (!email || typeof email !== 'string') {
        return Response.json({ error: 'Email is required' }, { status: 400 });
      }

      const trimmed = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return Response.json({ error: 'Invalid email address' }, { status: 400 });
      }

      try {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO emails (email, submitted_at) VALUES (?, ?)'
        )
          .bind(trimmed, new Date().toISOString())
          .run();
      } catch {
        return Response.json({ error: 'Database error' }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    return env.ASSETS.fetch(request);
  },
};
