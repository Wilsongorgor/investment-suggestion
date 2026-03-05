# Cloudflare Pages 部署配置指南

## 正确的构建和部署配置

| 设置项 | 值 | 说明 |
|--------|-----|------|
| 构建命令 | `pnpm run build` | 构建 Next.js 项目 |
| 部署命令 | `npx wrangler pages deploy out --project-name=investment-suggestion` | 部署到 Cloudflare Pages |
| 版本命令 | `echo "Deployment complete"` | 版本命令（占位符） |

## 环境变量配置

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SILICONFLOW_API_KEY` | 你的 API 密钥 | 硅基流动 API 密钥 |
| `SILICONFLOW_MODEL` | `deepseek-ai/DeepSeek-V3.2` | 模型名称 |

## 分支控制

| 设置项 | 值 | 说明 |
|--------|-----|------|
| 生产分支 | `main` | 触发生产部署的分支 |
| 预览分支 | 留空 | 触发预览部署的分支（可选） |

## 部署流程

1. **保存配置**：按照上述配置填写所有字段
2. **触发构建**：提交代码到 main 分支或手动触发构建
3. **等待部署**：构建和部署过程大约需要 2-5 分钟
4. **验证部署**：访问生成的 `*.pages.dev` 域名

## 常见问题解决

### Q: 版本命令不能留空
A: 使用 `echo "Deployment complete"` 作为占位符命令

### Q: 部署失败，提示 "pnpm: command not found"
A: 将构建命令改为 `npx pnpm run build`

### Q: 部署后只显示 Hello World
A: 确保构建命令正确执行，并且生成了 `out` 目录

### Q: API 返回 500 错误
A: 检查 `SILICONFLOW_API_KEY` 是否正确配置

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

如果遇到问题，请查看部署日志或联系我协助解决！