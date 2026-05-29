# Deno KV 短链接服务

一个轻量级、零外部依赖的短链接服务，基于 **Deno** + **Deno KV** + **Hono** 构建。提供公共创建页、REST API 和 Web 管理后台，支持中英双语、深色/浅色主题、链接过期、点击统计、QR 码等功能。

## 功能特性

### 链接管理

- **公共创建页** — 无需登录即可创建短链接，有效期可选 1 天 / 7 天 / 14 天 / 1 个月
- **管理员面板** — 登录后管理所有链接，支持创建永久短链接、搜索、批量删除
- **自定义短码** — 管理员可自定义短码（3-32 位），公共用户自动生成 6 位 Base62 随机码
- **链接编辑** — 管理员可随时修改目标 URL 和过期时间
- **链接过期** — 灵活的 TTL 设置，支持 `30m` `24h` `7d` `4w` `never` 等格式
- **来源标签** — 链接区分"admin"和"公共"来源，方便管理

### 数据统计

- **点击统计** — 原子性地记录每个短链接的点击次数
- **每日趋势** — 按日聚合的点击时间序列数据，支持查看最近 90 天
- **全局趋势** — 管理面板展示全站 30 天访问量折线图
- **热门链接** — Top N 点击量排行

### 安全与防护

- **IP 限流** — 公共创建接口每 IP 每小时最多 20 次，防止滥用
- **多方式认证** — 支持 Bearer Token、Query Key、Cookie 三种认证方式
- **Bot 过滤** — 识别搜索引擎和爬虫的 User-Agent，避免虚假点击计入统计
- **保留短码** — 自动保护 `api`、`dashboard`、`login` 等系统路径

### 用户体验

- **QR 码生成** — 每个短链接自动生成 SVG 二维码，无需第三方库
- **双语支持** — 中文（默认）/ 英文，一键切换，偏好持久化
- **深色模式** — 自动跟随系统偏好，也可手动切换
- **响应式设计** — 桌面端表格布局，移动端卡片布局
- **健康检查** — `/health` 端点，用于监控和负载均衡探活

## 技术栈

| 层级     | 技术                                                    | 说明                                |
| -------- | ------------------------------------------------------- | ----------------------------------- |
| 运行时   | [Deno](https://deno.land/)                              | 安全、现代的 TypeScript 运行时      |
| Web 框架 | [Hono](https://hono.dev/) v4                            | 超轻量、高性能的 Web 框架           |
| 数据库   | [Deno KV](https://deno.land/api?s=Deno.Kv)              | 内置 Key-Value 存储，零配置         |
| 认证     | Cookie + Bearer Token                                   | 管理面板使用 HttpOnly Cookie        |
| QR 码    | 自研 SVG 生成器（Version 1-5, EC Level M）              | 纯 TypeScript，零依赖               |
| 国际化   | 自研 i18n 模块                                          | 中/英双语，Cookie 持久化            |
| UI       | 服务端渲染 HTML + CSS                                   | 无前端框架依赖，首屏秒开            |
| CI/CD    | [GitHub Actions](https://github.com/features/actions)   | 自动 Lint + Test                    |

### 项目结构

```
├── main.ts         # 入口文件，路由定义，服务启动
├── db.ts           # Deno KV 数据访问层（CRUD、批量删除、限流、统计）
├── auth.ts         # 认证中间件（API Key + Cookie）
├── utils.ts        # 工具函数（短码生成、校验、TTL 解析、IP 提取、Bot 识别）
├── i18n.ts         # 国际化（中文 / 英文）
├── qrcode.ts       # QR 码 SVG 生成器（零依赖）
├── templates.ts    # 服务端 HTML 模板（公共页 + 管理面板 + 详情页）
└── deno.json       # Deno 配置与任务定义
```

## 快速开始

### 前置条件

安装 [Deno](https://deno.land/#installation)（v1.40+）。

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/<your-username>/short-link.git
cd short-link

# 设置 API Key（必填）
export API_KEY="your-secret-key"

# 启动开发服务
deno task dev
```

服务默认监听 `http://localhost:3000`。

### 环境变量

| 变量      | 必填 | 默认值 | 说明                     |
| --------- | ---- | ------ | ------------------------ |
| `API_KEY` | 是   | —      | API 和管理后台的认证密钥 |
| `PORT`    | 否   | `3000` | 服务监听端口             |

## 部署

### 方式一：Deno Deploy（推荐）

[Deno Deploy](https://deno.com/deploy) 原生支持 Deno KV，零配置数据库，全球边缘部署：

1. 将代码推送到 GitHub 仓库
2. 在 Deno Deploy 控制台导入项目
3. 设置环境变量 `API_KEY`
4. 绑定 KV 数据库：进入项目 **Settings → KV Database**，点击 **Create a new database** 或选择已有数据库，将其绑定到 `KV_DATABASE` 变量
5. 部署完成，获得 `*.deno.dev` 域名

> **注意：** Deno Deploy 的 KV 是持久化的全球分布式数据库，数据不会因重新部署而丢失。

### 方式二：Docker

```dockerfile
FROM denoland/deno:latest
WORKDIR /app
COPY . .
RUN deno cache main.ts
EXPOSE 3000
CMD ["deno", "task", "start"]
```

```bash
docker build -t short-link .
docker run -d -p 3000:3000 -e API_KEY=your-secret-key short-link
```

### 方式三：自建服务器

任何支持 Deno 的 Linux / macOS / Windows 服务器：

```bash
export API_KEY="your-secret-key"
deno task start
```

可配合 systemd 或 PM2 管理进程：

```ini
# /etc/systemd/system/short-link.service
[Unit]
Description=Short Link Service
After=network.target

[Service]
ExecStart=/usr/local/bin/deno task start
Environment=API_KEY=your-secret-key
Environment=PORT=3000
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now short-link
```


## API 文档

### 公共接口（无需认证）

**创建短链接**

```bash
curl -X POST http://localhost:3000/api/public/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "ttl": "7d"}'
```

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

### 管理员接口（需要认证）

所有管理员 API 请求需要认证，支持两种方式：

```
Authorization: Bearer <API_KEY>
# 或
?key=<API_KEY>
```

**创建短链接**

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

**查询列表**

```bash
curl "http://localhost:3000/api/links?page=1&limit=20&search=example" \
  -H "Authorization: Bearer your-secret-key"
```

**获取详情**

```bash
curl http://localhost:3000/api/links/my-link \
  -H "Authorization: Bearer your-secret-key"
```

**获取点击统计**

```bash
curl "http://localhost:3000/api/links/my-link/stats?days=7" \
  -H "Authorization: Bearer your-secret-key"
```

**响应：**

```json
{
  "code": "my-link",
  "total": 1234,
  "days": 7,
  "timeSeries": [
    { "date": "2024-05-23", "count": 150 },
    { "date": "2024-05-24", "count": 200 }
  ]
}
```

**获取热门链接**

```bash
curl "http://localhost:3000/api/links/top?n=10" \
  -H "Authorization: Bearer your-secret-key"
```

**更新短链接**

```bash
curl -X PUT http://localhost:3000/api/links/my-link \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://new-url.com"}'
```

**删除短链接**

```bash
curl -X DELETE http://localhost:3000/api/links/my-link \
  -H "Authorization: Bearer your-secret-key"
```

**批量删除**

```bash
curl -X DELETE http://localhost:3000/api/links \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"codes": ["link1", "link2", "link3"]}'
```

**访问短链接**

```
GET http://localhost:3000/my-link  →  302 重定向到目标 URL
```

无需认证，公开访问。每次真人访问会原子性地递增点击计数（Bot 访问不计入）。

## 短码规则

- **长度：** 3 - 32 个字符
- **允许字符：** 字母（`a-z` `A-Z`）、数字（`0-9`）、连字符（`-`）、下划线（`_`）
- **自动生成：** 6 位 Base62 随机码
- **保留短码：** `api`、`admin`、`static`、`health`、`dashboard`、`login`、`favicon.ico`、`robots.txt`

## License

MIT
