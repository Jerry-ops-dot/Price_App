import { hashPassword } from './auth_utils';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password || password.length < 4) {
      return new Response(JSON.stringify({ error: 'Valid username and password (min 4 chars) required' }), { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();

    await env.DB.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)')
      .bind(userId, username, hashedPassword)
      .run();

    return new Response(JSON.stringify({ success: true, message: 'User created successfully' }), { status: 201 });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
