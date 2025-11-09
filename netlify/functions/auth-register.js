const { query } = require("./db");
const http = require("./_shared/http");
const { hashPassword, signToken } = require("./_shared/auth");

function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return http.options();
  }

  if (event.httpMethod !== "POST") {
    return http.methodNotAllowed(["POST"]);
  }

  const payload = parseBody(event);
  if (!payload) {
    return http.badRequest("请求体不是合法的 JSON");
  }

  const { username, password } = payload;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return http.badRequest("用户名至少需要 3 个字符");
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return http.badRequest("密码长度至少 6 位");
  }

  try {
    const existing = await query("SELECT id FROM admins WHERE username = $1", [username.trim()]);
    if (existing.rowCount > 0) {
      return http.badRequest("用户名已存在，请更换后重试");
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `
      INSERT INTO admins (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username, created_at
      `,
      [username.trim(), passwordHash]
    );

    const admin = result.rows[0];
    const token = signToken({ sub: admin.id, username: admin.username });

    return http.created({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error("注册管理员失败", error);
    return http.serverError(error);
  }
};

