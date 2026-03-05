# GitHub Actions 自动部署到 Cloudflare Pages

由于当前环境无法直接安装 Node.js，我为您配置了 **GitHub Actions 自动部署**方案。这样您只需要在 GitHub 上配置好 Secrets，每次推送代码到 main 分支时，GitHub 会自动构建并部署到 Cloudflare Pages。

## 前置要求

1. **GitHub 账号** - 用于托管代码仓库
2. **Cloudflare 账号** - 用于部署和托管
3. **硅基流动 API 密钥** - 用于 LLM 分析功能

## 部署步骤

### 步骤 1：准备 GitHub 仓库

1. **确保代码已推送到 GitHub**
   ```bash
   git add .
   git commit -m "feat: 添加 GitHub Actions 自动部署配置"
   git push origin main
   ```

### 步骤 2：获取 Cloudflare API Token

1. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. **创建 API Token**
   - 点击右上角头像 → **My Profile**
   - 选择 **API Tokens** 标签
   - 点击 **Create Token**
   - 选择 **Custom token** 模板
   - 配置权限：
     - **Zone:Read** - 读取区域信息
     - **Page Rules:Edit** - 编辑页面规则
     - **Cloudflare Pages:Edit** - 编辑 Pages 项目
   - **Account Resources**: Include - 你的账户
   - **Zone Resources**: Include - All zones
   - 点击 **Continue to summary** → **Create Token**
   - **复制并保存 Token**（只显示一次）

3. **获取 Account ID**
   - 在 Cloudflare Dashboard 右侧边栏可以看到 **Account ID**
   - 复制这个 ID

### 步骤 3：配置 GitHub Secrets

1. **进入 GitHub 仓库设置**
   - 打开你的 GitHub 仓库
   - 点击 **Settings** → **Secrets and variables** → **Actions**

2. **添加 Secrets**
   点击 **New repository secret**，添加以下变量：

   | Secret 名称 | 值 | 说明 |
   |------------|-----|------|
   | `CLOUDFLARE_API_TOKEN` | 你的 Cloudflare API Token | 从步骤 2 获取 |
   | `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare Account ID | 从步骤 2 获取 |
   | `SILICONFLOW_API_KEY` | 你的硅基流动 API 密钥 | 从 [硅基流动](https://cloud.siliconflow.cn) 获取 |
   | `SILICONFLOW_MODEL` | `deepseek-ai/DeepSeek-V3.2` | 模型名称（可选） |

### 步骤 4：触发自动部署

1. **推送代码到 main 分支**
   ```bash
   git add .
   git commit -m "feat: 准备自动部署"
   git push origin main
   ```

2. **查看部署状态**
   - 在 GitHub 仓库页面，点击 **Actions** 标签
   - 可以看到正在运行的部署工作流
   - 点击工作流名称查看详细日志

3. **等待部署完成**
   - 构建过程大约需要 2-5 分钟
   - 成功后会显示绿色 ✓

### 步骤 5：验证部署

1. **查看 Cloudflare Pages 项目**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 点击 **Workers & Pages**
   - 应该能看到自动创建的 `investment-suggestion` 项目

2. **访问网站**
   - 部署完成后，会获得一个 `*.pages.dev` 域名
   - 例如：`https://investment-suggestion.pages.dev`

3. **测试 API**
   ```bash
   # 测试股票数据接口
   curl -X POST https://investment-suggestion.pages.dev/api/stock/data \
     -H "Content-Type: application/json" \
     -d '{"symbol":"600519"}'
   ```

## 配置说明

### GitHub Actions 工作流文件

工作流文件位于 `.github/workflows/deploy-cloudflare.yml`，包含以下步骤：

1. **检出代码** - 使用 `actions/checkout@v4`
2. **设置 Node.js** - 使用 Node.js 20
3. **设置 pnpm** - 使用 pnpm 9
4. **缓存依赖** - 加速后续构建
5. **安装依赖** - 运行 `pnpm install`
6. **构建项目** - 运行 `pnpm run build`
7. **部署到 Cloudflare Pages** - 使用 `cloudflare/pages-action@v1`

### 环境变量

构建时会自动注入以下环境变量：
- `SILICONFLOW_API_KEY` - 硅基流动 API 密钥
- `SILICONFLOW_MODEL` - 模型名称

## 常见问题

### Q: 部署失败，提示 "Failed to publish your Pages site"
A: 检查 GitHub Secrets 是否正确配置，特别是 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`

### Q: API 返回 500 错误
A: 检查 `SILICONFLOW_API_KEY` 是否正确配置

### Q: 如何重新部署？
A: 推送任意代码更改到 main 分支，GitHub Actions 会自动触发重新部署

### Q: 如何查看部署日志？
A: 在 GitHub 仓库页面，点击 **Actions** 标签，选择最新的工作流运行记录

## 优势

✅ **无需本地 Node.js 环境** - 所有构建在 GitHub 服务器上完成
✅ **自动部署** - 每次推送代码自动触发部署
✅ **版本控制** - 每次部署都有记录，方便回滚
✅ **免费** - GitHub Actions 和 Cloudflare Pages 都有免费额度

## 下一步

1. 确保所有 Secrets 已正确配置
2. 推送代码触发自动部署
3. 验证部署是否成功
4. 绑定自定义域名（可选）

如有问题，请查看 GitHub Actions 日志或联系我协助解决。