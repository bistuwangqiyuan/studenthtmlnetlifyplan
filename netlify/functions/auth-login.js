const { query } = require("./db");
const http = require("./_shared/http");
const { comparePassword, signToken } = require("./_shared/auth");

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
  if (!username || !password) {
    return http.badRequest("请填写用户名和密码");
  }

  try {
    const result = await query(
      `
      SELECT id, username, password_hash, created_at
      FROM admins
      WHERE username = $1
      `,
      [username.trim()]
    );

    if (result.rowCount === 0) {
      return http.unauthorized("用户名或密码错误");
    }

    const admin = result.rows[0];
    const matched = await comparePassword(password, admin.password_hash);

    if (!matched) {
      return http.unauthorized("用户名或密码错误");
    }

    const token = signToken({ sub: admin.id, username: admin.username });
    return http.success({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error("管理员登录失败", error);
    return http.serverError(error);
  }
};

