const { query } = require("../db");
const http = require("../_shared/http");
const { withAuth } = require("../_shared/auth");
const { validateStudent } = require("../_shared/validators");

function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return null;
  }
}

async function listStudents(event) {
  const q = event.queryStringParameters?.q?.trim();
  const params = [];
  let sql = `
    SELECT id, name, gender, age, class_name, created_at, updated_at
    FROM students
  `;

  if (q) {
    params.push(`%${q}%`);
    sql += `
      WHERE name ILIKE $1
        OR class_name ILIKE $1
    `;
  }

  sql += " ORDER BY id DESC";

  const result = await query(sql, params);
  return http.success({ items: result.rows });
}

async function createStudent(event) {
  const payload = parseBody(event);
  if (!payload) {
    return http.badRequest("请求体不是合法的 JSON");
  }

  const { data, errors } = validateStudent(payload);
  if (errors.length > 0) {
    return http.badRequest("输入校验未通过", errors);
  }

  const result = await query(
    `
    INSERT INTO students (name, gender, age, class_name)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, gender, age, class_name, created_at, updated_at
    `,
    [data.name, data.gender, data.age, data.class_name]
  );

  return http.created({ item: result.rows[0] });
}

exports.handler = withAuth(async (event) => {
  try {
    if (event.httpMethod === "GET") {
      return await listStudents(event);
    }
    if (event.httpMethod === "POST") {
      return await createStudent(event);
    }
    return http.methodNotAllowed(["GET", "POST"]);
  } catch (error) {
    console.error("学生信息接口错误", error);
    return http.serverError(error);
  }
});

