# SaaS智能比价平台 (React-CP)

## 📋 项目简介

本项目是一套面向IVD行业集团型医疗企业与大中型供应链组织的SaaS智能比价平台前端应用。系统融合产品目录管理、价格比对、选品推荐、智能报价、分析决策等能力，支持平台端与多租户集团/组织端多层次业务需求。

## 🚀 主要功能模块

### 📊 数据管理
- **数据集管理** - 统一管理各类业务数据源
- **数据模型管理** - 构建灵活的数据模型架构
- **指标管理** - 定义和维护业务指标体系
- **维度管理** - 管理多维度分析维度

### 💰 比价核心
- **比价模型管理** - 创建和配置比价分析模型
- **比价模型2管理** - 优化版比价模型，支持可视化公式编辑
- **比价方案管理** - 制定具体的比价执行方案
- **比价方案2管理** - 新版比价方案，支持动态指标配置
- **比价规则管理** - 设置智能比价规则和策略

### 📈 分析决策
- **工作台** - 统一的业务操作中心
- **分析主题** - 多维度业务分析主题
- **报表中心** - 集中的报表查看和管理
- **报表管理** - 报表模板的创建和维护
- **价格因子管理** - 影响价格的关键因素管理

## 🛠️ 技术栈

### 前端框架
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的前端构建工具

### UI组件库
- **Ant Design 5** - 企业级UI设计语言和组件库
- **Tailwind CSS** - 实用优先的CSS框架
- **Lucide React** - 现代化图标库
- **Framer Motion** - 流畅的动画库

### 数据可视化
- **AntV G2** - 数据驱动的可视化图形语法
- **AntV S2** - 多维交叉分析表格
- **Recharts** - 基于React的图表库

### 状态管理与数据处理
- **React Query** - 强大的数据同步库
- **React Hook Form** - 高性能表单库
- **React Router DOM** - 声明式路由
- **Axios** - HTTP客户端
- **Zod** - TypeScript优先的模式验证

### 开发工具
- **ESLint** - 代码质量检查
- **PostCSS** - CSS后处理器
- **Less** - CSS预处理器

## 📦 安装与启动

### 环境要求
- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器

### 快速开始

#### 1. 克隆项目
```bash
git clone https://github.com/baowwa/react-cp.git
cd react-cp
```

#### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

#### 3. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

#### 4. 构建生产版本
```bash
npm run build
# 或
yarn build
```

#### 5. 预览生产构建
```bash
npm run preview
# 或
yarn preview
```

### 使用NVM管理Node版本（推荐）

#### 安装NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

#### 安装并使用Node.js 16
```bash
nvm install 16
nvm use 16
```

## 📁 项目结构

```
src/
├── components/          # 公共组件
├── pages/              # 页面组件
│   ├── Dashboard.tsx           # 工作台
│   ├── DataModelManagement.tsx # 数据模型管理
│   ├── DatasetManagement.tsx   # 数据集管理
│   ├── MetricManagement.tsx    # 指标管理
│   ├── PriceModel2Management.tsx # 比价模型2管理
│   ├── PriceScheme2Management.tsx # 比价方案2管理
│   └── ...                     # 其他页面
├── lib/                # 工具库
├── App.tsx            # 应用入口
└── main.tsx           # 主入口文件
```

## 📖 文档

项目文档位于 `doc/` 目录下：
- `原型设计/` - 各模块的原型设计文档
- `需求文档/` - 项目需求和架构文档
- `报表样式/` - 报表样式参考

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进项目。

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

---

**开发团队** | 智能比价平台前端团队
