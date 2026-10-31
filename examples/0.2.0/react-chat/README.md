# React 聊天

覆盖基础面板、自定义 `useChat` 布局、业务卡片 `equipment.status`、通用组件注册，以及一次 `QUEUE` 跟进提交。`dashboard.tsx` 使用同名的大屏组件，不和基础样式叠在同一个面板上。

依赖 `@sparktide/frontend-sdk@0.2.0`、`@sparktide/ui-basic@0.2.0`、`@sparktide/ui-dashboard@0.2.0`、`@sparktide/ai-components@0.2.0`，外加 React `19.1.0`。四个启澜包都是 `private`，尚未发布到 npm registry。使用维护者提供的同版本 tarball 安装后再执行 `npm run check`。本目录不把公网 `npm install` 写成已验证。
