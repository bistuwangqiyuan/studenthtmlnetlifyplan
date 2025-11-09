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

function parseId(event) {
  const id = event.pathParameters?.id;
  if (!id) return null;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return numeric;
}

async function getCourse(id) {
  const result = await query(
    `
    SELECT id, name, code, credit, teacher, created_at, updated_at
    FROM courses
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
      const course = await getCourse(id);
      if (!course) {
        return http.notFound("课程信息不存在");
      }
      return http.success({ item: course });
    } catch (error) {
      console.error("查询课程失败", error);
      return http.serverError(error);
    }
  }

  if (event.httpMethod === "PUT") {
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
        UPDATE courses
        SET name = $1,
            code = $2,
            credit = $3,
            teacher = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, code, credit, teacher, created_at, updated_at
        `,
        [data.name, data.code, data.credit, data.teacher, id]
      );

      if (result.rowCount === 0) {
        return http.notFound("课程信息不存在");
      }

      return http.success({ item: result.rows[0] });
    } catch (error) {
      if (error.code === "23505") {
        return http.badRequest("课程编号已存在，请更换后重试");
      }
      console.error("更新课程失败", error);
      return http.serverError(error);
    }
  }

  if (event.httpMethod === "DELETE") {
    try {
      const result = await query("DELETE FROM courses WHERE id = $1", [id]);
      if (result.rowCount === 0) {
        return http.notFound("课程信息不存在");
      }
      return http.noContent();
    } catch (error) {
      console.error("删除课程失败", error);
      return http.serverError(error);
    }
  }

  return http.methodNotAllowed(["GET", "PUT", "DELETE"]);
});

