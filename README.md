# Campus Wall · 校园墙

一个面向校园的多人在线画板与聊天应用。

[前端仓库](https://github.com/qingning7/campus-wall-frontend) · [后端仓库](https://github.com/qingning7/campus-wall-backend)

## 功能介绍

- **账号与学校**：邮箱验证码注册、登录、绑定学校及进入学校房间。
- **私密房间**：创建房间、通过房间码加入、房间密码、退出房间及房主删除房间。
- **多人画板**：自由绘制、调整笔刷颜色与粗细、实时同步和加载历史笔触。
- **房间聊天**：发送消息、接收实时消息、加载聊天记录。

## 技术栈

### 前端

| 功能 | 技术栈 |
| --- | --- |
| 页面框架 | React 19、TypeScript |
| 构建工具 | Vite 8 |
| 路由 | React Router 8 |
| 样式 | Tailwind CSS 4 |
| UI | shadcn/ui、Base UI |
| 画板 | Canvas 2D、perfect-freehand |
| 实时通信 | Socket.IO Client |

### 后端

| 功能 | 技术栈 |
| --- | --- |
| 运行环境与语言 | Node.js、TypeScript、tsx |
| Web 框架 | Express 5 |
| 数据库 | PostgreSQL、Prisma 7 |
| 身份认证 | JSON Web Token、bcryptjs |
| 实时通信 | Socket.IO |
| 邮件发送 | Nodemailer、SMTP |

## 本地运行

### 1. 准备环境

- Git、Node.js 和 npm。可使用 Node.js 22.12 或更高版本；当前 Vite 的 Node.js 要求为 `^20.19.0 || >=22.12.0`。
- 准备 PostgreSQL 数据库（本地或托管服务），以及已开启 SMTP 服务的发件邮箱。
- 前端默认连接 `http://localhost:3001`。仅启动前端无法完成登录和房间同步。

### 2. 配置并启动后端

在终端中获取后端仓库并安装依赖：

```bash
git clone https://github.com/qingning7/campus-wall-backend.git
cd campus-wall-backend
npm ci
```

在后端仓库根目录新建 `.env`，并替换为自己的配置：

```dotenv
// 均为示例值
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/campus_wall"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=3001

SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your-email@163.com
SMTP_PASS=your-mail-authorization-code
```

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | 已创建的 PostgreSQL 数据库连接地址 |
| `JWT_SECRET` | 用于签发和验证登录令牌的随机长密钥 |
| `PORT` | 后端监听端口，默认 `3001` |
| `SMTP_HOST` | 邮件服务器地址 |
| `SMTP_PORT` | SMTP 端口 |
| `SMTP_USER` | 发件邮箱，同时用于 SMTP 身份验证 |
| `SMTP_PASS` | 邮箱客户端授权码 |

在后端仓库执行已有迁移并生成 Prisma 客户端：

```bash
npx prisma migrate deploy
npx prisma generate
```

准备学校数据：创建一个 UTF-8 文本文件 `schools.txt`，每行一个学校名称，再执行脚本

```bash
npm run import:schools -- ./schools.txt
npm run create:school-rooms
```

已有学校数据和学校房间时，可以跳过这一步。

启动后端

```bash
npm run dev
```

默认后端地址为 `http://localhost:3001`。

### 3. 配置并启动前端

```bash
git clone https://github.com/qingning7/campus-wall-frontend.git
cd campus-wall-frontend
npm ci
```

在前端仓库根目录新建 `.env.local`：

```dotenv
// 默认值
VITE_API_BASE_URL=http://localhost:3001
```
启动前端

```bash
npm run dev
```

打开终端输出的 Local 地址，通常是 `http://localhost:5173`。

后端 HTTP 和 Socket.IO 的跨域配置需要允许前端实际使用的来源地址。

## 项目结构

```text
src/
├── api/          # 账号、学校、房间 API 调用
├── canvas/       # Canvas 渲染、笔触绘制与颜色映射
├── components/   # 业务组件与 UI 基础组件
├── contexts/     # 登录状态、主题、画板工具状态
├── hooks/        # 自定义 React Hooks
├── lib/          # HTTP、登录令牌与 Socket.IO 封装
├── pages/        # 登录、学校、设置和房间页面
├── routes/       # 路由守卫与工作区布局
├── utils/        # 笔触合并、删除和画笔配置
├── index.css     # 全局样式及日间、夜间主题变量
├── main.tsx      # 应用入口
└── router.tsx    # 路由定义
```

## 常见问题

**收不到邮箱验证码？**

邮件由后端发送。检查后端 SMTP 配置、邮箱授权码、发送日志和收件箱的垃圾邮件目录。
