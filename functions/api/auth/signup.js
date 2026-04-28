import { hashPassword } from './auth_utils';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = username?.trim();

    if (!normalizedUsername || !/^[a-zA-Z0-9_.-]{4,32}$/.test(normalizedUsername)) {
      return new Response(JSON.stringify({ error: 'Username must be 4-32 letters, numbers, dots, dashes, or underscores' }), { status: 400 });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();

    await env.DB.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)')
      .bind(userId, normalizedUsername, hashedPassword)
      .run();

    return new Response(JSON.stringify({ success: true, message: 'User created successfully' }), { status: 201 });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
