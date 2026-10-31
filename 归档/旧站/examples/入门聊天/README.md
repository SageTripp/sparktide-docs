# 入门聊天示例

按文档站“快速上手”依次准备制品、启动平台、初始化应用、接入后台和前端。

后台为 Java 17 / Spring Boot 4.0.8，消费公开 Maven 仓库中的 SDK 0.1.0。frontend-react 与 frontend-vue 二选一，将 GitHub Release 的 SDK tgz 下载到 vendor 后安装。

模型需要自行提供兼容 Chat Completions 的完整地址、实际模型 ID 和密钥。示例 ZIP 不包含模型替身、厂商凭据或 SDK 安装包，第 1 步提供固定下载地址。local 身份只适用于本机学习，正式项目替换为原业务认证产生的 Principal。

凭据保存在 .local，不提交到版本管理，也不输出到构建日志。初始化仅运行一次；过期后在独立管理员终端执行 backend 的 credentials 任务，再重新加载 business.env 并重启后台。

目录中的 .local 和运行数据仅属于本地教程。使用已有平台必须先让平台运维配置 tutorial 应用范围的模型和回调密钥授权，不要用教程配置覆盖已有部署环境。

固定制品获取地址及启动顺序见 https://sagetripp.github.io/sparktide-docs/教程/准备环境.html；SDK、底座 Jar 与镜像可公开下载，三个源码仓库保持私有。
