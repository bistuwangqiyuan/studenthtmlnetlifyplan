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

function parseId(event) {
  const id = event.pathParameters?.id;
  if (!id) return null;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) return null;
  return numeric;
}

async function getStudent(id) {
  const result = await query(
    `
    SELECT id, name, gender, age, class_name, created_at, updated_at
    FROM students
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
      const student = await getStudent(id);
      if (!student) {
        return http.notFound("学生信息不存在");
      }
      return http.success({ item: student });
    } catch (error) {
      console.error("查询学生失败", error);
      return http.serverError(error);
    }
  }

  if (event.httpMethod === "PUT") {
    const payload = parseBody(event);
    if (!payload) {
      return http.badRequest("请求体不是合法的 JSON");
    }
    const { data, errors } = validateStudent(payload);
    if (errors.length > 0) {
      return http.badRequest("输入校验未通过", errors);
    }
    try {
      const result = await query(
        `
        UPDATE students
        SET name = $1,
            gender = $2,
            age = $3,
            class_name = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, gender, age, class_name, created_at, updated_at
        `,
        [data.name, data.gender, data.age, data.class_name, id]
      );

      if (result.rowCount === 0) {
        return http.notFound("学生信息不存在");
      }

      return http.success({ item: result.rows[0] });
    } catch (error) {
      console.error("更新学生失败", error);
      return http.serverError(error);
    }
  }

  if (event.httpMethod === "DELETE") {
    try {
      const result = await query("DELETE FROM students WHERE id = $1", [id]);
      if (result.rowCount === 0) {
        return http.notFound("学生信息不存在");
      }
      return http.noContent();
    } catch (error) {
      console.error("删除学生失败", error);
      return http.serverError(error);
    }
  }

  return http.methodNotAllowed(["GET", "PUT", "DELETE"]);
});

