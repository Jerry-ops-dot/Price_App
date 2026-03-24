import { hashPassword, generateToken } from './auth_utils';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const hashedPassword = await hashPassword(password);

    const user = await env.DB.prepare('SELECT id, password_hash FROM users WHERE username = ?')
      .bind(username)
      .first();

    if (!user || user.password_hash !== hashedPassword) {
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401 });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(token, user.id, expiresAt)
      .run();

    const headers = new Headers();
    headers.set('Set-Cookie', `session_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`);
    headers.set('Content-Type', 'application/json');

    return new Response(JSON.stringify({ success: true, user: { id: user.id, username } }), { 
      status: 200, 
      headers 
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
