export async function onRequestPost({ request, env }) {
  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const token = match[1];
    const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP').bind(token).first();
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { query, thumbnail } = await request.json();
    if (!query) return new Response(JSON.stringify({ error: 'Query required' }), { status: 400 });

    await env.DB.prepare('INSERT INTO search_history (user_id, search_query, thumbnail) VALUES (?, ?, ?)')
      .bind(session.user_id, query, thumbnail || null)
      .run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const token = match[1];
    const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP').bind(token).first();
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { results } = await env.DB.prepare('SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
      .bind(session.user_id)
      .all();

    return new Response(JSON.stringify({ history: results }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const token = match[1];
    const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP').bind(token).first();
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    await env.DB.prepare('DELETE FROM search_history WHERE user_id = ?').bind(session.user_id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
