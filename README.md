# 学生信息管理系统（Netlify + Neon）

本项目是一个基于 **纯静态前端（HTML/CSS/JS）** 与 **Netlify Functions** 的学生信息管理系统，实现管理员登录、学生/课程/教师信息的增删改查，并使用 **Neon PostgreSQL** 作为数据库。

## 功能概览

- 管理员注册、登录（密码使用 `bcrypt` 加密存储，登录颁发 JWT）
- 学生信息管理：新增、编辑、删除、查询
- 课程信息管理：新增、编辑、删除、查询
- 教师信息管理：新增、编辑、删除、查询
- UI 采用移动优先设计，支持中文输入与展示

## 目录结构

```
index.html           # 单页应用入口
styles.css           # 全局样式
app.js               # 前端交互逻辑
netlify/functions/   # Netlify Functions 源码
  |_ db.js
  |_ init-db.js
  |_ auth-login.js
  |_ auth-register.js
  |_ students/
  |_ courses/
  |_ teachers/
package.json          # 函数端依赖
netlify.toml          # Netlify 配置
```

## 环境变量

请在 Netlify 项目中配置以下环境变量（Dashboard → Site configuration → Environment variables）：

| 变量名 | 说明 |
| --- | --- |
| `NETLIFY_DATABASE_URL` | Neon 提供的 **池化** 连接字符串 |
| `NETLIFY_DATABASE_URL_UNPOOLED` | Neon 提供的 **非池化** 连接字符串（与上相同亦可） |
| `JWT_SECRET` | 用于签发管理员登录令牌的随机字符串（例如使用 `openssl rand -hex 32` 生成） |
| `JWT_EXPIRES_IN` *(可选)* | JWT 有效期，默认 `12h` |

## 初始化数据库

1. 部署完成后，执行一次初始化函数（POST 请求）：

   ```bash
   curl -X POST https://<your-site>.netlify.app/.netlify/functions/init-db
   ```

2. 如果执行成功，会返回：

   ```json
   {
     "message": "数据库初始化完成",
     "defaultAdmin": {
       "username": "admin",
       "password": "admin"
     }
   }
   ```

3. 登录系统后可自行修改或新增管理员。

## 本地开发

1. 安装依赖：

   ```bash
   npm install
   ```

2. 创建 `.env`（供 `netlify dev` 使用），写入上述环境变量值。

3. 启动本地开发服务器：

   ```bash
   npx netlify dev
   ```

   访问 `http://localhost:8888` 预览前端；函数端走本地代理，可直接调用。

## 发布到 Netlify

1. 将仓库连接到 Netlify，或使用 Netlify CLI 部署：

   ```bash
   netlify deploy --prod
   ```

2. 确保 Dashboard 中填入环境变量，并在 **Deploys → Trigger deploy → Clear cache and deploy site** 重新部署。

3. 部署完成后调用一次 `/.netlify/functions/init-db` 初始化数据库。

## 自测建议

- [ ] 调用 `init-db` 后确认默认管理员可登录
- [ ] 注册新管理员并再次登录确认成功
- [ ] 分别对学生、课程、教师执行 **新增 → 查询 → 编辑 → 删除** 流程
- [ ] 输入中文信息验证无乱码问题
- [ ] 使用浏览器开发者工具检查所有 API 请求状态码均为 2xx

## 常见问题

- **登录报错“缺少 JWT_SECRET”**：请确认部署环境已配置该变量。
- **数据库连接失败**：检查 Neon 连接字符串是否启用 SSL；Netlify 若在免费套餐建议开启 Prisma 的池化服务或使用 Neon 的连接池。
- **CORS 问题**：函数默认开放 `Access-Control-Allow-Origin: *`，如需限制可在 `netlify/functions/_shared/http.js` 中调整。

