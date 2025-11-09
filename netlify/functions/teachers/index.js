const { query } = require("../db");
const http = require("../_shared/http");
const { withAuth } = require("../_shared/auth");
const { validateTeacher } = require("../_shared/validators");

function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return null;
  }
}

async function listTeachers(event) {
  const q = event.queryStringParameters?.q?.trim();
  const params = [];
  let sql = `
    SELECT id, name, title, phone, email, created_at, updated_at
    FROM teachers
  `;

  if (q) {
    params.push(`%${q}%`);
    sql += `
      WHERE name ILIKE $1
         OR title ILIKE $1
         OR phone ILIKE $1
         OR email ILIKE $1
    `;
  }

  sql += " ORDER BY id DESC";

  const result = await query(sql, params);
  return http.success({ items: result.rows });
}

async function createTeacher(event) {
  const payload = parseBody(event);
  if (!payload) {
    return http.badRequest("请求体不是合法的 JSON");
  }

  const { data, errors } = validateTeacher(payload);
  if (errors.length > 0) {
    return http.badRequest("输入校验未通过", errors);
  }

  const result = await query(
    `
    INSERT INTO teachers (name, title, phone, email)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, title, phone, email, created_at, updated_at
    `,
    [data.name, data.title, data.phone, data.email]
  );

  return http.created({ item: result.rows[0] });
}

exports.handler = withAuth(async (event) => {
  try {
    if (event.httpMethod === "GET") {
      return await listTeachers(event);
    }
    if (event.httpMethod === "POST") {
      return await createTeacher(event);
    }
    return http.methodNotAllowed(["GET", "POST"]);
  } catch (error) {
    console.error("教师信息接口错误", error);
    return http.serverError(error);
  }
});

