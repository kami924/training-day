# 训练日：免费演示方案

这套方案的目标不是正式上架，而是先把 `训练日` 变成一个可以分享的网页演示版本。

## 现在已经准备好的内容

- Web 导出脚本：`npm run export:web`
- Web 导出目录：`/Users/kami/projects/fitness-minimal/mobile/dist`
- Vercel 路由回退配置：`/Users/kami/projects/fitness-minimal/mobile/vercel.json`

## 本地预览

先导出网页版本：

```bash
cd /Users/kami/projects/fitness-minimal/mobile
npm run export:web
```

然后本地预览：

```bash
cd /Users/kami/projects/fitness-minimal/mobile
npm run preview:web
```

浏览器打开：

```text
终端里会显示本地预览地址
```

## 免费公开分享：Vercel

最省事的一条路：

1. 把 `/Users/kami/projects/fitness-minimal/mobile` 推到 GitHub
2. 在 Vercel 新建项目并选择这个仓库
3. 项目名建议填：`training-day`
4. 构建命令填：

```text
npm run export:web
```

5. 输出目录填：

```text
dist
```

6. 部署完成后，Vercel 会给你一个公开链接。若 `training-day` 这个免费子域名没有被占用，地址会类似：

```text
https://training-day.vercel.app
```

如果这个名字已经被别人占用，可以用 `training-day-app`、`trainingday` 或绑定自己的独立域名。

## 免费公开分享：GitHub Pages / Netlify

也可以用任何静态托管平台，只要满足两点：

- 构建命令：`npm run export:web`
- 发布目录：`dist`

## 适合现在的使用场景

这套 Web 演示版适合：

- 给朋友试用
- 给投资人或面试官看
- 先验证产品方向

它不适合代替 App Store 正式版本，但很适合当前阶段低成本传播。
