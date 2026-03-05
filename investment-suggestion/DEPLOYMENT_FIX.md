# Cloudflare Pages 部署修复指南

## 错误分析

从错误日志来看，这是使用 `wrangler deploy` 命令时的错误：

```
17:05:54.392 
   main = "src/index.ts" 
17:05:54.392 
   
17:05:54.392 
   ``` 
17:05:54.393 
   
17:05:54.393 
   
17:05:54.393 
   If are uploading a directory of assets, you can either:
17:05:54.393 
   - Specify the path to the directory of assets via the command line: (ex: `npx wrangler deploy --assets=./dist`)
17:05:54.393 
   - Or add the following to your "wrangler.toml" file:
17:05:54.393 
   
17:05:54.393 
   ``` 
17:05:54.393 
   [assets] 
17:05:54.393 
   directory = "./dist" 
17:05:54.393 
   
17:05:54.393 
   ``` 
```

**问题原因**：
- 错误使用了 `wrangler deploy` 命令（这是部署 Workers 的命令）
- 没有正确配置静态资产目录

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
   - 点击 "Encrypt" 确保密钥加密存储

5. **部署项目**
   - 点击 **Save and Deploy**
   - 等待部署完成

### 方法 2：通过命令行部署

使用正确的 `wrangler pages deploy` 命令：

```bash
# 构建项目
pnpm run build

# 部署到 Pages
npx wrangler pages deploy out --project-name=investment-suggestion
```

## 配置文件修复

### 1. 修复 wrangler.toml

```toml
name = "investment-suggestion"
compatibility_date = "2024-12-02"
compatibility_flags = ["nodejs_compat"]

# Pages 构建配置
[build]
command = "pnpm run build"
directory = "out"

[vars]
ENVIRONMENT = "production"

# 环境变量（在 Cloudflare Dashboard 中配置）
# - SILICONFLOW_API_KEY
# - SILICONFLOW_MODEL
```

### 2. 确保 next.config.ts 配置正确

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

## 常见问题

### Q: 没有找到 "build output directory" 配置选项
A: 在 Cloudflare Pages Dashboard 中，这个选项在 "Build settings" 部分，名称可能是 "Build output directory" 或 "Output directory"

### Q: 部署失败，提示 "pnpm: command not found"
A: Cloudflare Pages 默认使用 npm，需要在构建命令中指定使用 pnpm：
   - Build command: `npx pnpm run build`

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

如果遇到问题，请查看 Cloudflare Pages 的部署日志或联系我协助解决！