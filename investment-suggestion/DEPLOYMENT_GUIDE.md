# Cloudflare Workers 部署指南

本指南将帮助你将智能投资分析应用部署到 Cloudflare。

## ⚠️ 重要说明

当前项目使用了 `coze-coding-dev-sdk`（沙箱环境特有的 SDK），部署到 Cloudflare 需要将 LLM 调用替换为直接 API 调用。

## 部署方案选择

### 方案一：Cloudflare Pages（推荐）
- ✅ 免费额度充足
- ✅ 自动部署，连接 GitHub
- ✅ 支持 Next.js 静态导出 + Edge Functions

### 方案二：Cloudflare Workers
- ✅ 更灵活的后端控制
- ✅ 支持 D1 数据库、KV 存储
- ⚠️ 需要更多配置

---

## 第一步：准备 GitHub 仓库

### 1. 初始化 Git 仓库

```bash
# 在项目根目录执行
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: AI Investment Analysis App"

# 在 GitHub 创建新仓库后，添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/ai-stock-analyzer.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 2. 创建 .gitignore（确保敏感信息不上传）

项目已有 .gitignore，确保包含：
```
node_modules/
.env
.env.local
.env.*.local
.next/
dist/
*.log
.DS_Store
```

---

## 第二步：修改代码适配 Cloudflare

### 1. 安装 Cloudflare 适配器

```bash
pnpm add -D @cloudflare/next-on-pages
```

### 2. 创建 wrangler.toml 配置文件

```toml
name = "ai-stock-analyzer"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[vars]
ENVIRONMENT = "production"

# 如果需要 D1 数据库
# [[d1_databases]]
# binding = "DB"
# database_name = "stock_analyzer"
# database_id = "your-database-id"
```

### 3. 修改 next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export', // 静态导出（如果只需要静态页面）
  // 或者使用 edge runtime
  experimental: {
    runtime: 'edge',
  },
}

export default nextConfig
```

### 4. 替换 coze-coding-dev-sdk 为直接 API 调用

创建 `src/lib/ai-client.ts`：

```typescript
// 使用豆包 API（或其他 LLM API）
export async function callLLM(prompt: string, content: string): Promise<string> {
  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.DOUBAO_MODEL_ID, // 如: ep-xxxx-xxxx
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: content },
      ],
      stream: false,
    }),
  })

  const data = await response.json()
  return data.choices[0].message.content
}
```

然后修改 `src/app/api/stock/analyze/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const { stockData } = await request.json();

    if (!stockData) {
      return NextResponse.json({ error: '股票数据不能为空' }, { status: 400 });
    }

    const systemPrompt = `你是一位华尔街资深股票交易员...`;
    
    const result = await callLLM(systemPrompt, JSON.stringify(stockData));
    
    return NextResponse.json({ analysis: JSON.parse(result) });
  } catch (error) {
    console.error('AI分析错误:', error);
    return NextResponse.json({ error: '分析失败' }, { status: 500 });
  }
}
```

---

## 第三步：Cloudflare Pages 部署

### 方式 A：通过 Cloudflare Dashboard（推荐新手）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧 **Workers & Pages** → **Create application**
3. 选择 **Pages** → **Connect to Git**
4. 授权 GitHub，选择你的仓库
5. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `pnpm run build`
   - **Build output directory**: `.next` 或 `out`
6. 添加环境变量：
   - `DOUBAO_API_KEY` - 豆包 API 密钥
   - `DOUBAO_MODEL_ID` - 豆包模型 ID
7. 点击 **Save and Deploy**

### 方式 B：通过命令行部署

```bash
# 安装 Wrangler CLI
pnpm add -g wrangler

# 登录 Cloudflare
wrangler login

# 构建
pnpm run build

# 部署到 Pages
wrangler pages deploy .vercel/output/static --project-name=ai-stock-analyzer
```

---

## 第四步：配置环境变量

### 在 Cloudflare Dashboard 配置

1. 进入你的 Pages 项目
2. 点击 **Settings** → **Environment variables**
3. 添加以下变量：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DOUBAO_API_KEY` | 豆包 API 密钥 | [火山引擎控制台](https://console.volcengine.com/ark) |
| `DOUBAO_MODEL_ID` | 豆包模型 ID | 创建推理接入点后获取 |

### 本地开发环境变量

创建 `.env.local` 文件：
```
DOUBAO_API_KEY=your_api_key_here
DOUBAO_MODEL_ID=ep-xxxx-xxxx
```

---

## 第五步：验证部署

部署完成后，你会获得一个 `*.pages.dev` 域名，例如：
- `https://ai-stock-analyzer.pages.dev`

测试 API：
```bash
curl -X POST https://ai-stock-analyzer.pages.dev/api/stock/data \
  -H "Content-Type: application/json" \
  -d '{"symbol":"600519"}'
```

---

## 可选：绑定自定义域名

1. 在 Cloudflare Pages 项目设置中
2. 点击 **Custom domains** → **Set up a custom domain**
3. 输入你的域名（需要已在 Cloudflare 托管）
4. 等待 DNS 生效

---

## 常见问题

### Q: 部署后 API 返回 500 错误
A: 检查环境变量是否正确配置，特别是 API 密钥

### Q: 股票数据获取失败
A: 腾讯财经 API 在 Cloudflare 网络中应该可以正常访问，检查网络连接

### Q: Next.js 16 兼容性问题
A: Cloudflare Pages 目前对 Next.js 最新版本支持有限，可能需要：
- 使用 `output: 'export'` 静态导出
- 或者降级到 Next.js 14

---

## 替代方案：Vercel 部署

如果 Cloudflare 遇到兼容性问题，推荐使用 Vercel（Next.js 原生支持）：

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 一键部署

Vercel 对 Next.js 支持更完善，无需修改代码。

---

## 需要我帮你执行的操作

1. **创建 GitHub 仓库配置文件**（wrangler.toml、修改后的 API 代码）
2. **准备 .env.local 模板**
3. **调整代码以适配 Cloudflare 环境**

请告诉我你想：
- A) 继续使用 Cloudflare（我帮你修改代码）
- B) 改用 Vercel 部署（更简单，无需改代码）
