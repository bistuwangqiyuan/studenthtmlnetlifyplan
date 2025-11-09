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

function parseId(event) {
  const id = event.pathParameters?.id;
  if (!id) return null;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return numeric;
}

async function getTeacher(id) {
  const result = await query(
    `
    SELECT id, name, title, phone, email, created_at, updated_at
    FROM teachers
    WHERE id = $1
    `,
    [id]
  );
  return result.rows[0] ?? null;
}

exports.handler = withAuth(async (event) => {
  const id = parseId(event);
  if (!id) {
    return http.badRequest("ID 参数不合法");
  }

  if (event.httpMethod === "GET") {
    try {
      const teacher = await getTeacher(id);
      if (!teacher) {
        return http.notFound("教师信息不存在");
      }
      return http.success({ item: teacher });
    } catch (error) {
      console.error("查询教师失败", error);
      return http.serverError(error);
    }
  }

  if (event.httpMethod === "PUT") {
    const payload = parseBody(event);
    if (!payload) {
      return http.badRequest("请求体不是合法的 JSON");
    }
    const { data, errors } = validateTeacher(payload);
    if (errors.length > 0) {
      return http.badRequest("输入校验未通过", errors);
    }
    try {
      const result = await query(
        `
        UPDATE teachers
        SET name = $1,
            title = $2,
            phone = $3,
            email = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, title, phone, email, created_at, updated_at
        `,
        [data.name, data.title, data.phone, data.email, id]
      );

      if (result.rowCount === 0) {
        return http.notFound("教师信息不存在");
      }

      return http.success({ item: result.rows[0] });
    } catch (error) {
      console.error("更新教师失败", error);
      return http.serverError(error);
    }
  }

  if (event.httpMethod === "DELETE") {
    try {
      const result = await query("DELETE FROM teachers WHERE id = $1", [id]);
      if (result.rowCount === 0) {
        return http.notFound("教师信息不存在");
      }
      return http.noContent();
    } catch (error) {
      console.error("删除教师失败", error);
      return http.serverError(error);
    }
  }

  return http.methodNotAllowed(["GET", "PUT", "DELETE"]);
});

