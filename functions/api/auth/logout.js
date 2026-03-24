export async function onRequestPost({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  
  if (match) {
    const token = match[1];
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }

  const headers = new Headers();
  headers.set('Set-Cookie', 'session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify({ success: true }), { headers });
}
