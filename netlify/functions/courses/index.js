const { query } = require("../db");
const http = require("../_shared/http");
const { withAuth } = require("../_shared/auth");
const { validateCourse } = require("../_shared/validators");

function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return null;
  }
}

async function listCourses(event) {
  const q = event.queryStringParameters?.q?.trim();
  const params = [];
  let sql = `
    SELECT id, name, code, credit, teacher, created_at, updated_at
    FROM courses
  `;

  if (q) {
    params.push(`%${q}%`);
    sql += `
      WHERE name ILIKE $1
         OR code ILIKE $1
         OR teacher ILIKE $1
    `;
  }

  sql += " ORDER BY id DESC";

  const result = await query(sql, params);
  return http.success({ items: result.rows });
}

async function createCourse(event) {
  const payload = parseBody(event);
  if (!payload) {
    return http.badRequest("请求体不是合法的 JSON");
  }

  const { data, errors } = validateCourse(payload);
  if (errors.length > 0) {
    return http.badRequest("输入校验未通过", errors);
  }

  try {
    const result = await query(
      `
      INSERT INTO courses (name, code, credit, teacher)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, code, credit, teacher, created_at, updated_at
      `,
      [data.name, data.code, data.credit, data.teacher]
    );

    return http.created({ item: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return http.badRequest("课程编号已存在，请更换后重试");
    }
    throw error;
  }
}

exports.handler = withAuth(async (event) => {
  try {
    if (event.httpMethod === "GET") {
      return await listCourses(event);
    }
    if (event.httpMethod === "POST") {
      return await createCourse(event);
    }
    return http.methodNotAllowed(["GET", "POST"]);
  } catch (error) {
    console.error("课程信息接口错误", error);
    return http.serverError(error);
  }
});

