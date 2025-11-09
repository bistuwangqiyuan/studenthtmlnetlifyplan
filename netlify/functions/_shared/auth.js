const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("./http");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

if (!JWT_SECRET) {
  throw new Error("缺少 JWT_SECRET 环境变量，用于签发管理员登录令牌。");
}

function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, ...options });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function withAuth(handler) {
  return async (event, context) => {
    if (event.httpMethod === "OPTIONS") {
      return http.options();
    }

    const rawAuth =
      event.headers.authorization ||
      event.headers.Authorization ||
      event.multiValueHeaders?.authorization?.[0];

    if (!rawAuth || !rawAuth.startsWith("Bearer ")) {
      return http.unauthorized();
    }

    const token = rawAuth.replace(/^Bearer\s+/i, "");
    try {
      const claims = verifyToken(token);
      context.user = {
        id: claims.sub,
        username: claims.username,
      };
      return handler(event, context);
    } catch (error) {
      console.error("JWT 验证失败", error);
      return http.unauthorized();
    }
  };
}

module.exports = {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  withAuth,
};

