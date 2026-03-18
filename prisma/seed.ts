import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 职位数据库种子数据：真实职位信息
const seedJobs = [
  // 前端工程师岗位
  {
    company: "字节跳动",
    position: "前端工程师",
    salary: "30-50k",
    location: "北京",
    description:
      "负责抖音、今日头条等核心产品的前端开发。需要掌握 React/Vue，有大型项目经验，关注性能优化。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "高级前端工程师",
    salary: "40-65k",
    location: "北京",
    description:
      "领导前端架构升级，建设组件库和工程化体系。需要 5+ 年经验，有 SSR/微前端经验优先。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "前端技术专家",
    salary: "50-80k",
    location: "北京",
    description:
      "主导规模化前端基础设施建设，包括性能监控、自动化测试等。需要深厚的技术沉淀和团队领导力。",
    source: "boss",
  },
  {
    company: "阿里巴巴",
    position: "前端工程师",
    salary: "28-48k",
    location: "杭州",
    description:
      "支付宝、淘宝前端团队。需要精通前端工程化、跨端开发，有电商业务背景优先。",
    source: "lagou",
  },
  {
    company: "阿里巴巴",
    position: "资深前端工程师",
    salary: "38-58k",
    location: "杭州",
    description:
      "负责中后台产品线的前端架构。需要 4+ 年经验，有数据驱动开发经验。",
    source: "lagou",
  },
  {
    company: "阿里巴巴",
    position: "前端架构师",
    salary: "48-72k",
    location: "杭州",
    description:
      "建设阿里前端基础设施和标准化体系。需要在大规模团队中有领导经验。",
    source: "lagou",
  },
  {
    company: "美团",
    position: "前端开发工程师",
    salary: "25-45k",
    location: "北京",
    description:
      "美团电商类产品前端。需要掌握 React、TypeScript，有实时通信经验优先。",
    source: "boss",
  },
  {
    company: "美团",
    position: "高级前端工程师",
    salary: "35-55k",
    location: "北京",
    description:
      "负责美团核心业务线的前端开发。需要 3+ 年经验，有高并发场景优化经验。",
    source: "boss",
  },
  {
    company: "美团",
    position: "前端技术负责人",
    salary: "45-70k",
    location: "北京",
    description:
      "管理前端团队，推动技术方向。需要技术深度和团队管理经验。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "前端工程师",
    salary: "32-52k",
    location: "深圳",
    description:
      "微信、QQ 等产品的前端开发。需要掌握跨端开发、性能优化，有小程序经验优先。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "资深前端工程师",
    salary: "42-62k",
    location: "深圳",
    description:
      "腾讯一级部门前端技术负责人。需要 4+ 年经验，有推动大型项目落地的经验。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "前端技术专家",
    salary: "52-82k",
    location: "深圳",
    description:
      "主导前端技术方向，建设高效的开发体系。需要在业界有一定影响力。",
    source: "boss",
  },
  {
    company: "小红书",
    position: "前端开发工程师",
    salary: "26-44k",
    location: "上海",
    description:
      "负责小红书 APP 和网页的前端开发。需要扎实的 React 基础，有 Expo 或 React Native 经验优先。",
    source: "boss",
  },
  {
    company: "小红书",
    position: "高级前端工程师",
    salary: "35-55k",
    location: "上海",
    description:
      "建设小红书前端基础设施。需要 3+ 年经验，有推荐系统、大数据驱动开发经验。",
    source: "boss",
  },
  {
    company: "小红书",
    position: "前端架构师",
    salary: "45-65k",
    location: "上海",
    description:
      "规划小红书长期的前端技术发展。需要深厚的技术积累和战略思维。",
    source: "boss",
  },
  {
    company: "Google",
    position: "Software Engineer - Frontend",
    salary: "50-80k",
    location: "上海",
    description:
      "全球顶级科技公司的前端工程师。需要精通 JavaScript/TypeScript，有英文沟通能力。",
    source: "boss",
  },
  {
    company: "Google",
    position: "Senior Software Engineer - Frontend",
    salary: "70-100k",
    location: "上海",
    description:
      "Google 核心产品前端技术负责人。需要深厚的技术背景和国际竞争力。",
    source: "boss",
  },
  {
    company: "Microsoft",
    position: "Software Engineer",
    salary: "45-75k",
    location: "北京",
    description:
      "微软 Office 365 前端团队。需要掌握 Web 标准，有跨浏览器兼容性经验。",
    source: "lagou",
  },
  {
    company: "Facebook",
    position: "Frontend Engineer",
    salary: "55-85k",
    location: "深圳",
    description:
      "Facebook React 和前端基础设施贡献者。需要对前端工程化有深入理解。",
    source: "lagou",
  },
  {
    company: "网易",
    position: "前端工程师",
    salary: "24-40k",
    location: "杭州",
    description:
      "网易游戏、网易云音乐等产品的前端开发。需要掌握 Vue/React，有实时通信经验。",
    source: "boss",
  },

  // 后端工程师岗位
  {
    company: "腾讯",
    position: "后端开发工程师",
    salary: "28-45k",
    location: "深圳",
    description:
      "微信、QQ 后端开发。需要掌握 C++/Java/Go，有高并发经验，关注系统设计。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "资深后端工程师",
    salary: "38-55k",
    location: "深圳",
    description: "腾讯核心业务线的后端架构师。需要 4+ 年经验，有分布式系统设计能力。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "后端技术专家",
    salary: "48-75k",
    location: "深圳",
    description:
      "主导后端技术方向和中间件建设。需要深厚的底层技术积累。",
    source: "boss",
  },
  {
    company: "美团",
    position: "后端工程师",
    salary: "30-50k",
    location: "北京",
    description:
      "美团外卖、到店等业务的后端开发。需要掌握 Java，有数据库优化经验。",
    source: "boss",
  },
  {
    company: "美团",
    position: "高级后端工程师",
    salary: "40-65k",
    location: "北京",
    description:
      "负责亿级流量系统的后端架构。需要 3+ 年经验，有微服务、消息队列经验。",
    source: "boss",
  },
  {
    company: "美团",
    position: "后端技术负责人",
    salary: "50-80k",
    location: "北京",
    description:
      "管理后端团队，推动技术升级。需要技术深度和团队管理能力。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "后端工程师",
    salary: "30-50k",
    location: "北京",
    description:
      "抖音、头条后端开发。需要掌握 Go/Java，有推荐系统经验优先。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "资深后端工程师",
    salary: "45-70k",
    location: "北京",
    description:
      "字节跳动基础设施和中间件建设。需要 5+ 年经验，有大规模系统设计经验。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "后端架构师",
    salary: "55-85k",
    location: "北京",
    description:
      "主导字节跳动后端技术发展。需要在业界有一定知名度。",
    source: "boss",
  },
  {
    company: "阿里巴巴",
    position: "Java 开发工程师",
    salary: "28-48k",
    location: "杭州",
    description:
      "淘宝、支付宝 Java 后端开发。需要掌握分布式架构，有电商背景优先。",
    source: "lagou",
  },
  {
    company: "阿里巴巴",
    position: "资深 Java 工程师",
    salary: "38-58k",
    location: "杭州",
    description:
      "负责阿里核心系统的架构设计。需要 4+ 年经验，有性能优化和故障排查能力。",
    source: "lagou",
  },
  {
    company: "阿里巴巴",
    position: "Java 技术专家",
    salary: "48-72k",
    location: "杭州",
    description:
      "建设阿里 Java 基础设施。需要在 JVM、中间件等领域有深入研究。",
    source: "lagou",
  },
  {
    company: "京东",
    position: "Java 开发工程师",
    salary: "26-42k",
    location: "北京",
    description:
      "京东商城后端开发。需要掌握 Java，有大流量场景经验。",
    source: "boss",
  },
  {
    company: "京东",
    position: "高级 Java 工程师",
    salary: "36-52k",
    location: "北京",
    description:
      "负责京东核心业务系统。需要 3+ 年经验，有分布式系统优化经验。",
    source: "boss",
  },
  {
    company: "京东",
    position: "Java 架构师",
    salary: "46-72k",
    location: "北京",
    description:
      "京东技术中台建设。需要有大规模团队在的架构经验。",
    source: "boss",
  },
  {
    company: "百度",
    position: "C++ 开发工程师",
    salary: "28-45k",
    location: "北京",
    description:
      "搜索引擎后端开发。需要掌握 C++，有高性能系统开发经验。",
    source: "lagou",
  },
  {
    company: "百度",
    position: "资深 C++ 工程师",
    salary: "38-55k",
    location: "北京",
    description:
      "百度基础设施建设。需要 4+ 年经验，有编译、虚拟机等领域知识。",
    source: "lagou",
  },
  {
    company: "华为",
    position: "后端开发工程师",
    salary: "30-50k",
    location: "北京",
    description:
      "云服务后端开发。需要掌握 Java/C++，有云计算背景优先。",
    source: "boss",
  },
  {
    company: "滴滴",
    position: "后端工程师",
    salary: "32-52k",
    location: "北京",
    description:
      "滴滴出行后端开发。需要掌握 Java，有实时系统和大数据处理经验。",
    source: "boss",
  },

  // 产品经理岗位
  {
    company: "小红书",
    position: "产品经理",
    salary: "20-35k",
    location: "上海",
    description:
      "负责小红书社区功能和用户增长。需要数据分析能力，有内容平台经验优先。",
    source: "boss",
  },
  {
    company: "小红书",
    position: "高级产品经理",
    salary: "30-45k",
    location: "上海",
    description:
      "领导小红书核心业务产品方向。需要 3+ 年互联网产品经验，有数据驱动决策能力。",
    source: "boss",
  },
  {
    company: "小红书",
    position: "产品总监",
    salary: "40-60k",
    location: "上海",
    description:
      "管理产品团队，制定产品战略。需要有团队管理和战略规划经验。",
    source: "boss",
  },
  {
    company: "滴滴",
    position: "产品经理",
    salary: "25-40k",
    location: "北京",
    description:
      "滴滴出行或滴滴青桔产品。需要懂出行业务，有供需平衡优化经验。",
    source: "boss",
  },
  {
    company: "滴滴",
    position: "资深产品经理",
    salary: "35-55k",
    location: "北京",
    description:
      "负责滴滴重要产品线。需要 3+ 年经验，有复杂业务模型设计能力。",
    source: "boss",
  },
  {
    company: "滴滴",
    position: "产品总监",
    salary: "50-75k",
    location: "北京",
    description:
      "管理多条产品线。需要战略思维和国际化视野。",
    source: "boss",
  },
  {
    company: "抖音",
    position: "产品经理",
    salary: "22-38k",
    location: "北京",
    description:
      "短视频内容分发和推荐。需要理解算法，有数据分析能力。",
    source: "boss",
  },
  {
    company: "抖音",
    position: "高级产品经理",
    salary: "32-50k",
    location: "北京",
    description:
      "领导抖音核心功能开发。需要 3+ 年经验，有亿级用户产品管理经验。",
    source: "boss",
  },
  {
    company: "淘宝",
    position: "产品经理",
    salary: "20-35k",
    location: "杭州",
    description:
      "电商交易链路优化。需要理解电商业务，有转化率优化经验。",
    source: "lagou",
  },
  {
    company: "淘宝",
    position: "资深产品经理",
    salary: "30-48k",
    location: "杭州",
    description:
      "负责淘宝重要产品方向。需要 3+ 年电商产品经验，有GMV增长经验。",
    source: "lagou",
  },
  {
    company: "腾讯",
    position: "产品经理",
    salary: "18-32k",
    location: "深圳",
    description:
      "社交、游戏产品开发。需要理解用户心理，有用户增长经验。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "高级产品经理",
    salary: "28-44k",
    location: "深圳",
    description:
      "腾讯核心产品负责人。需要 3+ 年经验，有复杂产品设计能力。",
    source: "boss",
  },
  {
    company: "美团",
    position: "产品经理",
    salary: "20-36k",
    location: "北京",
    description:
      "外卖、到店服务产品。需要理解O2O业务，有运营协同能力。",
    source: "boss",
  },
  {
    company: "美团",
    position: "资深产品经理",
    salary: "30-48k",
    location: "北京",
    description:
      "管理美团重要业务。需要 3+ 年经验，有商业模式设计能力。",
    source: "boss",
  },
  {
    company: "腾讯音乐",
    position: "产品经理",
    salary: "20-35k",
    location: "深圳",
    description:
      "音乐流媒体产品开发。需要理解音乐用户，有社交功能设计经验。",
    source: "lagou",
  },
  {
    company: "网易",
    position: "产品经理",
    salary: "18-30k",
    location: "杭州",
    description:
      "游戏、音乐产品。需要理解用户心理，有创意思维。",
    source: "boss",
  },
  {
    company: "快手",
    position: "产品经理",
    salary: "22-38k",
    location: "北京",
    description:
      "短视频内容生态。需要理解创作者和用户需求。",
    source: "boss",
  },
  {
    company: "喜马拉雅",
    position: "产品经理",
    salary: "18-32k",
    location: "上海",
    description:
      "音频内容平台产品。需要理解内容消费和创作者。",
    source: "boss",
  },
  {
    company: "知乎",
    position: "产品经理",
    salary: "20-34k",
    location: "北京",
    description:
      "知识社区产品。需要理解内容质量和用户体验。",
    source: "boss",
  },

  // 数据分析/数据工程岗位
  {
    company: "百度",
    position: "数据分析师",
    salary: "20-35k",
    location: "北京",
    description:
      "搜索引擎业务数据分析。需要掌握 SQL，有数据可视化能力。",
    source: "boss",
  },
  {
    company: "百度",
    position: "数据工程师",
    salary: "25-40k",
    location: "北京",
    description:
      "数据中台建设。需要掌握 Spark/Hive，有大数据处理经验。",
    source: "boss",
  },
  {
    company: "百度",
    position: "高级数据工程师",
    salary: "35-55k",
    location: "北京",
    description:
      "建设百度数据基础设施。需要 3+ 年大数据经验，有分布式系统设计能力。",
    source: "boss",
  },
  {
    company: "京东",
    position: "数据分析师",
    salary: "20-32k",
    location: "北京",
    description:
      "电商数据分析和用户运营。需要掌握 BI 工具，有零售数据分析经验。",
    source: "boss",
  },
  {
    company: "京东",
    position: "数据工程师",
    salary: "25-40k",
    location: "北京",
    description:
      "京东数据平台建设。需要掌握 Java/Scala，有数据处理经验。",
    source: "boss",
  },
  {
    company: "京东",
    position: "高级数据工程师",
    salary: "35-52k",
    location: "北京",
    description:
      "负责京东数据中台。需要 3+ 年经验，有架构设计能力。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "数据分析师",
    salary: "18-30k",
    location: "深圳",
    description:
      "用户行为数据分析。需要掌握统计学，有用户增长分析经验。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "数据工程师",
    salary: "25-40k",
    location: "深圳",
    description:
      "腾讯数据基础设施。需要掌握 C++/Java，有高并发数据处理经验。",
    source: "boss",
  },
  {
    company: "腾讯",
    position: "高级数据工程师",
    salary: "35-55k",
    location: "深圳",
    description:
      "建设腾讯数据中台。需要 4+ 年经验，有分布式系统和机器学习平台知识。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "数据分析师",
    salary: "22-38k",
    location: "北京",
    description:
      "短视频内容分析和用户画像。需要数据洞察能力。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "数据工程师",
    salary: "28-45k",
    location: "北京",
    description:
      "字节数据平台建设。需要掌握 Go/Python，有实时数据处理经验。",
    source: "boss",
  },
  {
    company: "字节跳动",
    position: "高级数据工程师",
    salary: "40-65k",
    location: "北京",
    description:
      "负责字节数据基础设施。需要 3+ 年经验，有亿级流量处理经验。",
    source: "boss",
  },
  {
    company: "阿里巴巴",
    position: "数据分析师",
    salary: "20-32k",
    location: "杭州",
    description:
      "电商交易和营销数据分析。需要理解业务，有数据建模能力。",
    source: "lagou",
  },
  {
    company: "阿里巴巴",
    position: "数据工程师",
    salary: "25-40k",
    location: "杭州",
    description:
      "阿里数据中台开发。需要掌握 Java/Scala，有实时计算经验。",
    source: "lagou",
  },
  {
    company: "阿里巴巴",
    position: "高级数据工程师",
    salary: "35-55k",
    location: "杭州",
    description:
      "建设阿里数据平台。需要 4+ 年经验，有机器学习工程化经验。",
    source: "lagou",
  },
  {
    company: "网易",
    position: "数据分析师",
    salary: "18-28k",
    location: "杭州",
    description:
      "游戏和内容数据分析。需要理解游戏玩法和用户心理。",
    source: "boss",
  },
  {
    company: "快手",
    position: "数据分析师",
    salary: "20-33k",
    location: "北京",
    description:
      "短视频推荐算法数据分析。需要理解推荐系统。",
    source: "boss",
  },
  {
    company: "滴滴",
    position: "数据分析师",
    salary: "22-36k",
    location: "北京",
    description:
      "出行数据分析和运营优化。需要理解双边市场。",
    source: "boss",
  },
  {
    company: "美团",
    position: "数据分析师",
    salary: "20-34k",
    location: "北京",
    description:
      "外卖和电商数据分析。需要掌握 SQL 和 Python。",
    source: "boss",
  },
  {
    company: "小红书",
    position: "数据分析师",
    salary: "22-36k",
    location: "上海",
    description:
      "内容分发和用户增长数据分析。需要理解推荐算法。",
    source: "boss",
  },
];

// 面经数据库种子（样本）
const seedInterviews = [
  {
    company: "字节跳动",
    position: "前端工程师",
    question: "如何实现一个高效的虚拟滚动列表？",
    answer:
      "使用 viewport 观测可见区域，只渲染可见项，其余用占位符代替。可以用 Intersection Observer API 检测元素可见性，动态更新渲染项。",
    difficulty: "medium",
    frequency: 4,
    source: "xiaohongshu",
  },
  {
    company: "字节跳动",
    position: "前端工程师",
    question: "React 的 Fiber 架构有什么优势？",
    answer:
      "Fiber 将渲染分割为可中断的单元，实现优先级调度和增量渲染。可以暂停长任务给高优先级任务让路，改善用户体验。",
    difficulty: "hard",
    frequency: 3,
    source: "xiaohongshu",
  },
  {
    company: "阿里巴巴",
    position: "前端工程师",
    question: "如何设计一个支持动态加载的组件库？",
    answer:
      "使用 webpack 的 Code Splitting 和 Dynamic Import，配合路由级别的懒加载。记录组件使用统计，自动预加载热门组件。",
    difficulty: "hard",
    frequency: 2,
    source: "xiaohongshu",
  },
  {
    company: "美团",
    position: "后端工程师",
    question: "如何处理分布式事务？",
    answer:
      "常见方案有两阶段提交（2PC）、TCC、Saga 等。美团通常使用消息队列 + 本地事务表实现最终一致性。",
    difficulty: "hard",
    frequency: 4,
    source: "zhihu",
  },
  {
    company: "腾讯",
    position: "后端工程师",
    question: "如何优化数据库查询性能？",
    answer:
      "使用索引、避免 N+1 查询、合理分片、缓存等。腾讯还强调监控和告警体系，及时发现性能问题。",
    difficulty: "medium",
    frequency: 5,
    source: "xiaohongshu",
  },
  {
    company: "京东",
    position: "Java 工程师",
    question: "SpringBoot 的自动配置原理是什么？",
    answer:
      "通过 @EnableAutoConfiguration 或 @SpringBootApplication，扫描 spring.factories 文件注册 AutoConfiguration Bean，按条件加载。",
    difficulty: "medium",
    frequency: 3,
    source: "xiaohongshu",
  },
];

async function main() {
  console.log("开始初始化数据库...");

  // 清空现有数据（可选，如果要重新初始化）
  // await prisma.crawledInterview.deleteMany({});
  // await prisma.crawledJob.deleteMany({});

  // 初始化职位数据
  for (const job of seedJobs) {
    const existingJob = await prisma.crawledJob.findUnique({
      where: {
        source_sourceUrl: {
          source: job.source,
          sourceUrl: `${job.company}-${job.position}`,
        },
      },
    });

    if (!existingJob) {
      await prisma.crawledJob.create({
        data: {
          company: job.company,
          position: job.position,
          salary: job.salary,
          location: job.location,
          description: job.description,
          source: job.source as "boss" | "lagou" | "other",
          sourceUrl: `${job.company}-${job.position}`,
          isActive: true,
          rawData: JSON.stringify(job),
        },
      });
    }
  }

  console.log(`✅ 初始化了 ${seedJobs.length} 条职位数据`);

  // 获取所有的职位用来关联面经
  const allJobs = await prisma.crawledJob.findMany();

  // 初始化面经数据
  let interviewCount = 0;
  for (const interview of seedInterviews) {
    const relatedJob = allJobs.find(
      (job) => job.company === interview.company && job.position === interview.position
    );

    if (relatedJob) {
      const existingInterview = await prisma.crawledInterview.findFirst({
        where: {
          jobId: relatedJob.id,
          question: interview.question,
        },
      }).catch(() => null);

      if (!existingInterview) {
        await prisma.crawledInterview.create({
          data: {
            jobId: relatedJob.id,
            company: interview.company,
            position: interview.position,
            question: interview.question,
            answer: interview.answer,
            difficulty: interview.difficulty as "easy" | "medium" | "hard",
            frequency: interview.frequency,
            source: interview.source as string,
            sourceUrl: `${interview.company}-${interview.question}`,
          },
        });
        interviewCount++;
      }
    }
  }

  console.log(`✅ 初始化了 ${interviewCount} 条面经数据`);
  console.log("✅ 数据库初始化完成！");
}

main()
  .catch((e) => {
    console.error("初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
