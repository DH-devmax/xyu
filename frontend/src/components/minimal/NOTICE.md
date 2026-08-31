# Minimal Vite TS 7.7.0 复用记录

本目录复用用户提供的 `minimal-vite-ts-main.zip`（Minimal Vite TS 7.7.0）中的
`layouts/auth-centered`、`auth/components/form-head` 和 `layouts/core/main-section`
结构，并按 DH 闲不下来现有会话、路由和 API 边界做了适配。

- 归档 SHA-256：`b058dbc7fa8d231d06663e46d3e1d8fbfd8d38e7bd22db8abe12afa6ab498dde`
- 复用资源：`public/assets/background/background-3-blur.webp`
- 适配入口：`AuthCenteredLayout.tsx`、`FormHead.tsx`、`MainSection.tsx`
- 保留边界：认证请求仍由 `SessionProvider` 和特性 API adapter 管理，模板代码不引入演示账号、演示路由或第二套认证 Provider。

上游公开仓库的免费版本页面标注 MIT；随附归档本身未包含独立 LICENSE 文件。发布打包前以归档随附条款和仓库当前许可清单为准，并保留本记录以便追踪来源。
