# Cloudflare Pages 部署步骤

## 前置要求

1. **Node.js 环境** - 版本 18+，用于构建项目
2. **pnpm** - 包管理器，版本 9+（项目要求使用 pnpm）
3. **GitHub 账号** - 用于托管代码仓库
4. **Cloudflare 账号** - 用于部署和托管
5. **硅基流动 API 密钥** - 用于 LLM 分析功能

## 部署步骤

### 步骤 1：准备本地环境

1. **安装 Node.js**
   - 从 [Node.js 官网](https://nodejs.org) 下载并安装 Node.js 18+ 版本
   - 验证安装：`node -v`

2. **安装 pnpm**
   ```bash
   npm install -g pnpm
   ```
   - 验证安装：`pnpm -v`

### 步骤 2：构建项目

1. **安装项目依赖**
   ```bash
   cd investment-suggestion
   pnpm install
   ```

2. **构建项目**
   ```bash
   pnpm run build
   ```
   - 构建完成后，会在 `out` 目录生成静态文件

### 步骤 3：Cloudflare Pages 部署

#### 方式 A：通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. **创建 Pages 项目**
   - 点击左侧 **Workers & Pages** → **Create application**
   - 选择 **Pages** → **Connect to Git**
   - 授权 GitHub，选择你的仓库 `investment-suggestion`

3. **配置构建设置**
   - **Framework preset**: Next.js
   - **Build command**: `pnpm run build`
   - **Build output directory**: `out`

4. **配置环境变量**
   - 点击 **Settings** → **Environment variables**
   - 添加以下变量：
     | 变量名 | 值 |
     |--------|-----|
     | `SILICONFLOW_API_KEY` | 你的硅基流动 API 密钥 |
     | `SILICONFLOW_MODEL` | `deepseek-ai/DeepSeek-V3.2` |
   - 确保同时配置 **Production** 和 **Preview** 环境
   - 点击 "Encrypt" 确保密钥加密存储

5. **部署项目**
   - 点击 **Save and Deploy**
   - 等待部署完成

#### 方式 B：通过命令行部署

1. **安装 Wrangler CLI**
   ```bash
   pnpm add -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **部署到 Pages**
   ```bash
   wrangler pages deploy out --project-name=investment-suggestion
   ```

### 步骤 4：验证部署

部署完成后，你会获得一个 `*.pages.dev` 域名，例如：
- `https://investment-suggestion.pages.dev`

#### 测试 API

```bash
# 测试股票数据接口（无需 API Key）
curl -X POST https://investment-suggestion.pages.dev/api/stock/data \
  -H "Content-Type: application/json" \
  -d '{"symbol":"600519"}'

# 测试 AI 分析接口（需要配置 API Key）
curl -X POST https://investment-suggestion.pages.dev/api/stock/analyze \
  -H "Content-Type: application/json" \
  -d '{"stockData":{"code":"600519","name":"贵州茅台","price":1400,"change":5,"changePercent":0.36}}'
```

## 常见问题

### Q: 部署后只显示 Hello World
A: 这通常是因为构建配置不正确。确保：
1. `next.config.ts` 中设置了 `output: 'export'`
2. 构建命令使用 `pnpm run build`
3. 构建输出目录设置为 `out`
4. 项目已经成功构建，生成了 `out` 目录

### Q: API 返回 500 错误
A: 检查环境变量是否正确配置，特别是 `SILICONFLOW_API_KEY`

### Q: 股票数据无法获取
A: 腾讯财经 API 在 Cloudflare 网络中应该可以正常访问。如果遇到问题，检查网络连接。

### Q: AI 分析响应很慢
A: DeepSeek-V3.2 模型分析较复杂的数据可能需要 5-10 秒，这是正常现象。

## 技术支持

如果遇到问题，可以参考以下资源：
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js 静态导出文档](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [硅基流动 API 文档](https://docs.siliconflow.cn/)