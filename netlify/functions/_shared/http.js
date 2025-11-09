const defaultHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function mergeHeaders(extra) {
  return { ...defaultHeaders, ...(extra || {}) };
}

function json(statusCode, data, headers) {
  return {
    statusCode,
    headers: mergeHeaders(headers),
    body: JSON.stringify(data),
  };
}

function success(data, headers) {
  return json(200, data, headers);
}

function created(data, headers) {
  return json(201, data, headers);
}

function noContent(headers) {
  return {
    statusCode: 204,
    headers: mergeHeaders(headers),
    body: "",
  };
}

function badRequest(message, details, headers) {
  return json(400, { error: message, details }, headers);
}

function unauthorized(message = "未登录或令牌失效", headers) {
  return json(401, { error: message }, headers);
}

function forbidden(message = "没有权限执行该操作", headers) {
  return json(403, { error: message }, headers);
}

function notFound(message = "资源不存在", headers) {
  return json(404, { error: message }, headers);
}

function serverError(error, headers) {
  return json(500, { error: error?.message || "服务器内部错误" }, headers);
}

function methodNotAllowed(methods = ["GET"]) {
  return {
    statusCode: 405,
    headers: mergeHeaders({ Allow: methods.join(",") }),
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
}

function options() {
  return {
    statusCode: 204,
    headers: mergeHeaders(),
    body: "",
  };
}

module.exports = {
  json,
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  methodNotAllowed,
  options,
};

