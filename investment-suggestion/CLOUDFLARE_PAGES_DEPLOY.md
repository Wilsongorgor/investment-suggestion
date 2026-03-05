# Cloudflare Pages 部署详细指南

## 错误分析

从错误日志来看：

```
17:28:44.939	📎 It looks like you are authenticating Wrangler via a custom API token set in an environment variable.
17:28:44.939	Please ensure it has the correct permissions for this operation.
17:28:44.939	
17:28:44.940	Getting User settings...
17:28:45.537	👋 You are logged in with an User API Token, associated with the email 35465189@qq.com.
17:28:45.538	ℹ️  The API Token is read from the CLOUDFLARE_API_TOKEN environment variable.
17:28:45.542	┌───────────────────────────┬──────────────────────────────────┐
17:28:45.542	│ Account Name              │ Account ID                       │
17:28:45.542	├───────────────────────────┼──────────────────────────────────┤
17:28:45.542	│ 35465189@qq.com's Account │ 014af57348671519d100c558d2c12e1e │
17:28:45.542	└───────────────────────────┴──────────────────────────────────┘
17:28:45.542	🔓 To see token permissions visit `https://dash.cloudflare.com/profile/api-tokens.`
17:28:45.705	🎢 Membership roles in "35465189@qq.com's Account": Contact account super admin to change your permissions.
17:28:45.705	- Super Administrator - All Privileges
17:28:45.707	🪵  Logs were written to "/opt/buildhome/.config/.wrangler/logs/wrangler-2026-03-05_09-28-40_464.log"
17:28:45.751	Failed: error occurred while running deploy command
```

**问题分析**：
- 已成功登录 Cloudflare 账户（35465189@qq.com）
- 拥有超级管理员权限
- 但部署命令仍然失败

## 正确的部署方法

### 方法 1：通过 Cloudflare Pages Dashboard 部署（推荐）

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

5. **部署项目**
   - 点击 **Save and Deploy**
   - 等待部署完成

### 方法 2：修复命令行部署

如果坚持使用命令行部署，需要确保：

1. **正确的部署命令**
   ```bash
   # 构建项目
   pnpm run build
   
   # 部署到 Pages（使用正确的账户 ID）
   npx wrangler pages deploy out --project-name=investment-suggestion --account-id=014af57348671519d100c558d2c12e1e
   ```

2. **确保 API 令牌权限**
   - 登录 Cloudflare Dashboard
   - 访问 **Profile** → **API Tokens**
   - 确保你的 API 令牌具有 `Account > Cloudflare Pages > Edit` 权限

3. **检查 wrangler 配置**
   确保 `wrangler.toml` 文件配置正确：
   ```toml
   name = "investment-suggestion"
   account_id = "014af57348671519d100c558d2c12e1e"
   compatibility_date = "2024-12-02"
   compatibility_flags = ["nodejs_compat"]
   
   [build]
   command = "pnpm run build"
   directory = "out"
   ```

## 项目配置检查

### 1. 检查 package.json

```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 2. 检查 next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // 静态导出
  
  // 允许的开发源
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 图片配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

### 3. 检查 API 路由

确保 `src/app/api/stock/data/route.ts` 和 `src/app/api/stock/analyze/route.ts` 存在且配置正确。

## 常见问题解决

### Q: 部署失败，提示 "error occurred while running deploy command"
A: 尝试以下解决方案：
1. 使用 Cloudflare Pages Dashboard 部署（推荐）
2. 确保 API 令牌具有正确的权限
3. 在部署命令中指定账户 ID
4. 检查项目构建是否成功生成了 `out` 目录

### Q: 构建失败，提示 "pnpm: command not found"
A: 将构建命令改为 `npx pnpm run build`

### Q: 部署后只显示 Hello World
A: 确保构建命令正确执行，并且生成了 `out` 目录

## 验证部署

部署完成后，访问生成的 `*.pages.dev` 域名，例如：
- `https://investment-suggestion.pages.dev`

测试 API 接口：
```bash
# 测试股票数据接口
curl -X POST https://investment-suggestion.pages.dev/api/stock/data \
  -H "Content-Type: application/json" \
  -d '{"symbol":"600519"}'
```

## 紧急解决方案

如果以上方法都失败，尝试：

1. **使用 Vercel 部署**（作为备用方案）
   - 访问 [Vercel](https://vercel.com/)
   - 连接 GitHub 仓库 `investment-suggestion`
   - 按照默认配置部署

2. **检查 Cloudflare 状态**
   - 访问 [Cloudflare Status](https://www.cloudflarestatus.com/)
   - 确认 Cloudflare Pages 服务是否正常

如果遇到问题，请联系我协助解决！