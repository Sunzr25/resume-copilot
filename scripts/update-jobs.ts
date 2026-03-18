/**
 * 定期任务调度器
 * 在应用启动时可以运行此脚本，持续定期更新职位数据
 * 
 * 使用方式：
 * node --require ts-node/register scripts/update-jobs.ts
 */

import {
  generateDynamicJobs,
  refreshJobsInDatabase,
  fetchAndSaveJobsFromKimi,
  cleanupExpiredJobs,
  getJobsDatabaseStats,
} from "../src/lib/db-init";

// 定义基础职位模板
const baseJobTemplates = [
  {
    company: "字节跳动",
    position: "前端工程师",
    salary: "30-50k",
    location: "北京",
    description: "负责抖音、头条等核心产品的前端开发。需要掌握 React/Vue。",
    source: "boss" as const,
  },
  {
    company: "字节跳动",
    position: "后端工程师",
    salary: "30-50k",
    location: "北京",
    description: "抖音、头条后端开发。需要掌握 Go/Java，有推荐系统经验优先。",
    source: "boss" as const,
  },
  {
    company: "阿里巴巴",
    position: "Java 开发工程师",
    salary: "28-48k",
    location: "杭州",
    description: "淘宝、支付宝 Java 后端开发。需要掌握分布式架构。",
    source: "lagou" as const,
  },
  {
    company: "阿里巴巴",
    position: "前端工程师",
    salary: "28-48k",
    location: "杭州",
    description: "支付宝前端团队。需要精通前端工程化、跨端开发。",
    source: "lagou" as const,
  },
  {
    company: "腾讯",
    position: "后端开发工程师",
    salary: "28-45k",
    location: "深圳",
    description:
      "微信、QQ 后端开发。需要掌握 C++/Java/Go，有高并发经验。",
    source: "boss" as const,
  },
  {
    company: "腾讯",
    position: "前端工程师",
    salary: "32-52k",
    location: "深圳",
    description: "微信前端开发。需要掌握跨端开发、性能优化。",
    source: "boss" as const,
  },
  {
    company: "美团",
    position: "产品经理",
    salary: "20-36k",
    location: "北京",
    description: "外卖、到店服务产品。需要理解 O2O 业务。",
    source: "boss" as const,
  },
  {
    company: "美团",
    position: "Java 工程师",
    salary: "30-50k",
    location: "北京",
    description: "美团电商类产品后端。需要掌握 Java，有数据库优化经验。",
    source: "boss" as const,
  },
  {
    company: "小红书",
    position: "数据分析师",
    salary: "22-36k",
    location: "上海",
    description: "内容分发和用户增长数据分析。",
    source: "boss" as const,
  },
  {
    company: "小红书",
    position: "前端开发工程师",
    salary: "26-44k",
    location: "上海",
    description: "负责小红书 APP 和网页的前端开发。",
    source: "boss" as const,
  },
  {
    company: "滴滴",
    position: "产品经理",
    salary: "25-40k",
    location: "北京",
    description: "滴滴出行或青桔产品。需要懂出行业务。",
    source: "boss" as const,
  },
  {
    company: "滴滴",
    position: "后端工程师",
    salary: "32-52k",
    location: "北京",
    description: "滴滴出行后端开发。需要掌握 Java，有实时系统经验。",
    source: "boss" as const,
  },
  {
    company: "百度",
    position: "数据工程师",
    salary: "25-40k",
    location: "北京",
    description: "数据中台建设。需要掌握 Spark/Hive。",
    source: "boss" as const,
  },
  {
    company: "百度",
    position: "C++ 开发工程师",
    salary: "28-45k",
    location: "北京",
    description: "搜索引擎后端开发。需要掌握 C++。",
    source: "lagou" as const,
  },
  {
    company: "京东",
    position: "Java 工程师",
    salary: "26-42k",
    location: "北京",
    description: "京东商城后端开发。需要掌握 Java。",
    source: "boss" as const,
  },
  {
    company: "京东",
    position: "产品经理",
    salary: "20-32k",
    location: "北京",
    description: "电商产品设计。需要理解电商业务。",
    source: "lagou" as const,
  },
  {
    company: "网易",
    position: "JavaScript 工程师",
    salary: "24-40k",
    location: "杭州",
    description: "网易云音乐、游戏产品。",
    source: "boss" as const,
  },
  {
    company: "快手",
    position: "产品经理",
    salary: "22-38k",
    location: "北京",
    description: "短视频内容生态。",
    source: "boss" as const,
  },
];

/**
 * 执行单次更新
 */
async function performUpdate() {
  console.log(
    `\n⏰ [${new Date().toLocaleString("zh-CN")}] 开始大定期更新...`
  );

  try {
    // 获取更新前统计
    const statsBefore = await getJobsDatabaseStats();
    console.log(
      `📊 更新前: 总计 ${statsBefore?.totalJobs} 条职位，活跃 ${statsBefore?.activeJobs} 条`
    );

    // 尝试从 Kimi API 获取（如果配置）
    if (process.env.KIMI_API_KEY) {
      console.log("🤖 尝试从 Kimi API 获取真实数据...");
      await fetchAndSaveJobsFromKimi({
        skills: ["JavaScript", "React", "Node.js", "Java", "Python"],
        targetRole: "工程师",
        location: "北京",
      });
    }

    // 生成动态职位
    console.log("📝 生成动态职位数据...");
    const dynamicJobs = generateDynamicJobs(baseJobTemplates);

    // 刷新数据库
    const refreshResult = await refreshJobsInDatabase(dynamicJobs);
    console.log(`✅ 刷新完成: 新增 ${refreshResult.addedCount} 条`);

    // 清理过期数据
    const cleanedCount = await cleanupExpiredJobs();
    console.log(`🗑️  清理过期数据: ${cleanedCount} 条`);

    // 获取更新后统计
    const statsAfter = await getJobsDatabaseStats();
    console.log(
      `📊 更新后: 总计 ${statsAfter?.totalJobs} 条职位，活跃 ${statsAfter?.activeJobs} 条`
    );

    console.log("✨ 定期更新完成！\n");
  } catch (error) {
    console.error("❌ 更新失败:", error);
  }
}

/**
 * 启动定时任务调度器
 * 首次启动时立即执行一次，然后每隔指定时间执行一次
 */
async function startScheduler() {
  // 首次运行
  await performUpdate();

  // 获取更新间隔（默认 8 小时）
  const UPDATE_INTERVAL_HOURS =
    parseInt(process.env.UPDATE_INTERVAL_HOURS || "8", 10);
  const UPDATE_INTERVAL_MS = UPDATE_INTERVAL_HOURS * 60 * 60 * 1000;

  console.log(
    `\n⏱️  定时任务已启动，每 ${UPDATE_INTERVAL_HOURS} 小时更新一次职位数据...`
  );
  console.log(
    "💡 按 Ctrl+C 停止定时任务\n"
  );

  // 设置定时任务
  setInterval(performUpdate, UPDATE_INTERVAL_MS);

  // 优雅关闭
  process.on("SIGINT", () => {
    console.log("\n🛑 正在关闭定时任务调度器...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 正在关闭定时任务调度器...");
    process.exit(0);
  });
}

// 启动调度器
startScheduler().catch((error) => {
  console.error("❌ 启动调度器失败:", error);
  process.exit(1);
});
