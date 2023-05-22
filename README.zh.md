[English](README.md) [中文](README.zh.md) 

# ContextChat

ContextChat 是一个交互式应用程序，利用AI模型为用户生成相关且连贯的回应。该应用程序使用JavaScript和Electron构建，并使用OpenAI的模型进行聊天界面交互。

## 功能

- 交互式聊天界面，提供各种命令。
- 根据用户需求自定义命令。
- 调整模型参数以获得更精确的回应。
- 一键复制结果到剪贴板。
- 在本地存储中持久保存API密钥和设置。

## 安装

先决条件：您需要在计算机上安装 Node.js 和 npm/yarn。

1. 克隆存储库。
```bash
git clone https://github.com/temberature/contextChat
```
2. 导航到项目目录并安装依赖项。
```bash
cd context-chat
npm install
# 或者
yarn install
```

3. 启动应用程序。
```bash
npm start
# 或者
yarn start
```

## 使用

- 运行应用程序。
- 如果你是第一次运行应用程序，会提示你输入你的OpenAI API密钥。输入密钥后，应用程序会重新加载。
- 根据需要自定义提示和模型参数。
- 使用聊天区域与AI模型进行交互。
- 按`ctrl`+`[数字]`快速执行命令。
- AI的结果将在结果区域显示。
- 点击“复制结果”按钮将结果复制到剪贴板。

## 贡献

欢迎提交拉取请求。对于重大变更，请先开启一个问题讨论您想要改变的内容。

## 许可证

请在项目中检查许可证文件以获取详情。

## 致谢

本项目利用 [OpenAI API](https://openai.com/) 生成AI回应。