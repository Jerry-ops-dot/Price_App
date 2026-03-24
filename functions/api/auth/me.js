export async function onRequestGet({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  
  if (!match) {
    return new Response(JSON.stringify({ user: null }), { status: 200 });
  }

  const token = match[1];
  try {
    const session = await env.DB.prepare(`
      SELECT users.id, users.username, sessions.expires_at 
      FROM sessions 
      JOIN users ON sessions.user_id = users.id 
      WHERE sessions.token = ?
    `).bind(token).first();

    if (!session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ user: null }), { status: 200 });
    }

    return new Response(JSON.stringify({ user: { id: session.id, username: session.username } }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ user: null, error: e.message }), { status: 200 });
  }
}
