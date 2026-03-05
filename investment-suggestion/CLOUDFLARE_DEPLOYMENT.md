# Cloudflare Pages 部署指南

本文档说明如何将 AI 投资分析应用部署到 Cloudflare Pages。

## 前置要求

1. **GitHub 账号** - 用于托管代码仓库
2. **Cloudflare 账号** - 用于部署和托管
3. **硅基流动 API 密钥** - 用于 LLM 分析功能

---

## 第一步：获取硅基流动 API 密钥

1. 访问 [硅基流动官网](https://cloud.siliconflow.cn)
2. 注册/登录账号
3. 进入控制台，创建 API Key
4. 记录生成的 **API Key**

支持的模型：
- `deepseek-ai/DeepSeek-V3.2`（默认，推荐）
- `deepseek-ai/DeepSeek-V3`
- `Qwen/Qwen2.5-72B-Instruct`
- `THUDM/glm-4-9b-chat`

---

## 第二步：上传代码到 GitHub

### 2.1 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 `+` → `New repository`
3. 填写信息：
   - Repository name: `ai-stock-analyzer`
   - 选择 **Public** 或 **Private**
4. 点击 `Create repository`

### 2.2 推送代码到 GitHub

```bash
# 在项目根目录执行

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: AI Investment Analyzer ready for Cloudflare deployment"

# 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/YOUR_USERNAME/ai-stock-analyzer.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 第三步：在 Cloudflare 创建 Pages 项目

### 通过 Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Pages** 标签
5. 点击 **Connect to Git**
6. 授权 GitHub 并选择你的仓库 `ai-stock-analyzer`
7. 配置构建设置：
   
   | 设置项 | 值 |
   |--------|-----|
   | Framework preset | Next.js |
   | Build command | `pnpm run pages:build` |
   | Build output directory | `.vercel/output/static` |
   
8. 点击 **Save and Deploy**

---

## 第四步：配置环境变量

### 在 Cloudflare Dashboard 配置

1. 进入你的 Pages 项目
2. 点击 **Settings** → **Environment variables**
3. 添加以下变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SILICONFLOW_API_KEY` | 硅基流动 API 密钥 | `sk-xxxxxxxxxxxx` |
| `SILICONFLOW_MODEL` | 模型名称（可选） | `deepseek-ai/DeepSeek-V3.2` |

**重要**：
- 环境变量要同时配置 **Production** 和 **Preview** 环境
- 点击 "Encrypt" 确保密钥加密存储
- 配置后需要**重新部署**才能生效

### 重新部署

配置环境变量后：
1. 回到项目页面
2. 点击 **Deployments**
3. 点击最新部署右侧的 **Retry deployment**

---

## 第五步：验证部署

部署完成后，你会获得一个 `*.pages.dev` 域名，例如：
- `https://ai-stock-analyzer.pages.dev`

### 测试 API

```bash
# 测试股票数据接口（无需 API Key）
curl -X POST https://ai-stock-analyzer.pages.dev/api/stock/data \
  -H "Content-Type: application/json" \
  -d '{"symbol":"600519"}'

# 测试 AI 分析接口（需要配置 API Key）
curl -X POST https://ai-stock-analyzer.pages.dev/api/stock/analyze \
  -H "Content-Type: application/json" \
  -d '{"stockData":{"code":"600519","name":"贵州茅台","price":1400,"change":5,"changePercent":0.36}}'
```

---

## 绑定自定义域名（可选）

1. 在 Pages 项目设置中
2. 点击 **Custom domains** → **Set up a custom domain**
3. 输入你的域名（如 `stock.yourdomain.com`）
4. 按提示添加 DNS 记录
5. 等待 SSL 证书自动配置

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 创建本地环境变量文件
cp .env.example .env.local

# 编辑 .env.local 填入实际的 API 密钥
# SILICONFLOW_API_KEY=your_api_key_here

# 启动开发服务器
pnpm dev
```

---

## 常见问题

### Q: 部署失败，提示 "pnpm: command not found"

Cloudflare 默认使用 npm，需要修改构建命令或添加配置。

### Q: API 返回 "请配置 SILICONFLOW_API_KEY 环境变量"

检查环境变量是否正确配置：
1. 变量名是否正确（注意大小写）
2. 是否同时配置了 Production 和 Preview 环境
3. 配置后是否重新部署了项目

### Q: 股票数据无法获取

腾讯财经 API 在 Cloudflare 网络中应该可以正常访问。如果遇到问题：
1. 检查网络连接
2. 查看 Cloudflare 日志排查问题

### Q: AI 分析响应很慢

DeepSeek-V3.2 模型分析较复杂的数据可能需要 5-10 秒，这是正常现象。

---

## 更新部署

当你修改代码后：

```bash
# 提交并推送到 GitHub
git add .
git commit -m "update: xxx"
git push

# Cloudflare 会自动触发重新部署
```

或者手动部署：

```bash
pnpm run pages:deploy
```

---

## 项目结构

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── stock/
│   │   │       ├── data/route.ts      # 股票数据 API
│   │   │       └── analyze/route.ts   # AI 分析 API
│   │   └── page.tsx                   # 前端页面
│   └── lib/
│       └── llm-client.ts              # 硅基流动 LLM 客户端
├── wrangler.toml                      # Cloudflare 配置
├── .env.example                       # 环境变量模板
└── package.json                       # 项目依赖
```

---

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS
- **UI 组件**: shadcn/ui
- **数据源**: 腾讯财经 API
- **LLM**: 硅基流动 (DeepSeek-V3.2)
- **部署**: Cloudflare Pages
