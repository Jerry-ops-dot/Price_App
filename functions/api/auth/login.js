import { generateToken, sessionCookie, verifyPassword } from './auth_utils';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = username?.trim();
    if (!normalizedUsername || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), { status: 400 });
    }

    const user = await env.DB.prepare('SELECT id, password_hash FROM users WHERE username = ?')
      .bind(normalizedUsername)
      .first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401 });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? OR expires_at <= CURRENT_TIMESTAMP')
      .bind(user.id)
      .run();

    await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(token, user.id, expiresAt)
      .run();

    const headers = new Headers();
    headers.set('Set-Cookie', sessionCookie(token, 7 * 24 * 60 * 60, request.url));
    headers.set('Content-Type', 'application/json');

    return new Response(JSON.stringify({ success: true, user: { id: user.id, username: normalizedUsername } }), { 
      status: 200, 
      headers 
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
