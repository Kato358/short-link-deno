# Deno KV 短链接服务

一个轻量级、零外部依赖的短链接服务，基于 **Deno** + **Deno KV** +
[Hono](https://hono.dev/) 构建。提供公共创建页、REST API 和 Web
管理后台，支持中英双语、深色/浅色主题、链接过期、点击统计等功能。

## 功能特性

- **公共创建页** — 无需登录即可创建短链接，有效期可选 1 天 / 7 天 / 14 天 / 1
  个月
- **管理员面板** — 登录后管理所有链接，支持创建永久短链接、搜索、批量删除
- **IP 限流** — 公共创建接口每 IP 每小时最多 20 次，防止滥用
- **来源标签** — 链接区分"admin"和"公共"来源，方便管理
- **零依赖数据库** — 使用 Deno 内置 KV 存储，无需安装 MySQL / Redis / PostgreSQL
- **REST API** — 完整的 CRUD 接口，支持 Bearer Token 和 Query Key 认证
- **自定义短码** — 管理员支持自定义短码，公共用户自动生成 6 位 Base62 随机码
- **链接过期** — 灵活的 TTL 设置，管理员可创建永不过期链接
- **点击统计** — 原子性地记录每个短链接的点击次数
- **双语支持** — 中文（默认）/ 英文，一键切换
- **深色模式** — 自动跟随系统偏好，也可手动切换，持久化到 localStorage
- **响应式设计** — 桌面端表格布局，移动端卡片布局

## 快速开始

### 前置条件

安装 [Deno](https://deno.land/#installation)（v1.40+）。

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/<your-username>/short-link.git
cd short-link

# 设置 API Key（必填）
export API_KEY="your-secret-key"

# 启动服务
deno task dev
```

服务默认监听 `http://localhost:3000`。

### 环境变量

| 变量      | 必填 | 默认值 | 说明                     |
| --------- | ---- | ------ | ------------------------ |
| `API_KEY` | 是   | —      | API 和管理后台的认证密钥 |
| `PORT`    | 否   | `3000` | 服务监听端口             |

### 自定义端口

```bash
PORT=8080 deno task start
```

## 页面结构

### 公共首页 `/`

无需登录，任何人可直接创建短链接：

- 输入目标 URL + 选择有效期（1 天 / 7 天 / 14 天 / 1 个月）
- 仅支持随机短码，不支持自定义码
- 创建后原地显示短链接 + 一键复制
- 右上角"管理入口"链接进入管理面板

### 管理面板 `/dashboard`

使用 `API_KEY` 登录后进入：

- **统计摘要** — 总链接数、活跃链接数、已过期链接数
- **链接管理** — 查看列表、搜索、来源标签（admin / 公共）、分页
- **批量删除** — 勾选多个链接一键删除
- **链接详情** — 点击进入详情页，查看完整信息、复制短链接、删除

## API 文档

### 公共创建（无需认证）

```bash
curl -X POST http://localhost:3000/api/public/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "ttl": "7d"}'
```

**请求体：**

| 字段  | 类型   | 必填 | 说明                                                   |
| ----- | ------ | ---- | ------------------------------------------------------ |
| `url` | string | 是   | 目标 URL（必须以 `http://` 或 `https://` 开头）        |
| `ttl` | string | 否   | 过期时间：`1d` `7d` `14d` `30d`，默认 `7d`，最大 30 天 |

**响应 (201)：**

```json
{
  "code": "AbC123",
  "url": "https://example.com",
  "shortUrl": "http://localhost:3000/AbC123",
  "expiresAt": 1717200000000
}
```

**限流：** 每 IP 每小时最多 20 次。超限返回 `429 Too Many Requests`。

### 管理员 API（需要认证）

所有管理员 API 请求需要认证，支持两种方式：

```
Authorization: Bearer <API_KEY>
# 或
?key=<API_KEY>
```

#### 创建短链接（管理员）

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "code": "my-link", "ttl": "never"}'
```

| 字段   | 类型   | 必填 | 说明                                                    |
| ------ | ------ | ---- | ------------------------------------------------------- |
| `url`  | string | 是   | 目标 URL                                                |
| `code` | string | 否   | 自定义短码（3-32 位），不填则自动生成                   |
| `ttl`  | string | 否   | 过期时间，支持 `30m` `24h` `7d` `4w` `never`，默认 `7d` |

#### 查询短链接列表

```bash
curl "http://localhost:3000/api/links?page=1&limit=20&search=example" \
  -H "Authorization: Bearer your-secret-key"
```

#### 获取单个短链接

```bash
curl http://localhost:3000/api/links/my-link \
  -H "Authorization: Bearer your-secret-key"
```

#### 更新短链接

```bash
curl -X PUT http://localhost:3000/api/links/my-link \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://new-url.com"}'
```

#### 删除短链接

```bash
curl -X DELETE http://localhost:3000/api/links/my-link \
  -H "Authorization: Bearer your-secret-key"
```

#### 批量删除短链接

```bash
curl -X DELETE http://localhost:3000/api/links \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"codes": ["link1", "link2", "link3"]}'
```

**响应：** `{"deleted": 3}`

### 访问短链接

```
GET http://localhost:3000/my-link  →  302 重定向到目标 URL
```

无需认证，公开访问。每次访问会原子性地递增点击计数。

## 项目结构

```
├── main.ts         # 入口文件，路由定义，服务启动
├── db.ts           # Deno KV 数据访问层（CRUD、批量删除、限流）
├── auth.ts         # 认证中间件（API Key + Cookie）
├── utils.ts        # 工具函数（短码生成、校验、TTL 解析、IP 提取）
├── i18n.ts         # 国际化（中文 / 英文）
├── templates.ts    # 服务端 HTML 模板（公共页 + 管理面板）
└── deno.json       # Deno 配置与任务定义
```

## 技术栈

- **运行时：** [Deno](https://deno.land/)
- **Web 框架：** [Hono](https://hono.dev/) v4
- **数据库：** [Deno KV](https://deno.land/api?s=Deno.Kv)（内置 Key-Value 存储）
- **UI：** 纯服务端渲染 HTML + CSS，无前端框架依赖

## 部署

### Deno Deploy

推荐部署到 [Deno Deploy](https://deno.com/deploy)，原生支持 Deno KV：

1. 将代码推送到 GitHub 仓库
2. 在 Deno Deploy 中导入项目
3. 设置环境变量 `API_KEY`
4. 部署完成

### 任何支持 Deno 的服务器

```bash
export API_KEY="your-secret-key"
deno task start
```

## 短码规则

- 长度：3 - 32 个字符
- 允许字符：字母（`a-z` `A-Z`）、数字（`0-9`）、连字符（`-`）、下划线（`_`）
- 自动生成：6 位 Base62 随机码
- 保留短码：`api`、`admin`、`static`、`health`、`dashboard`、`login`、`favicon.ico`、`robots.txt`

## License

MIT
