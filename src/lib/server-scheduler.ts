/**
 * 服务器端定时任务调度器初始化
 * 在应用启动时自动启动后台定时任务
 * 只在服务器端运行（Next.js 服务器组件）
 */

import {
  generateDynamicJobs,
  refreshJobsInDatabase,
  fetchAndSaveJobsFromKimi,
  cleanupExpiredJobs,
  getJobsDatabaseStats,
} from "./db-init";

// 定时任务状态（使用全局变量），确保只启动一次
let schedulerStarted = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * 执行一次数据库更新任务
 */
async function performDatabaseUpdate() {
  try {
    const timestamp = new Date().toLocaleString("zh-CN");
    console.log(`\n⏰ [${timestamp}] 执行定期职位数据更新...`);

    const baseJobTemplates = [
      {
        company: "字节跳动",
        position: "前端工程师",
        salary: "30-50k",
        location: "北京",
        description: "负责抖音、头条等核心产品的前端开发。",
        source: "boss" as const,
      },
      {
        company: "阿里巴巴",
        position: "Java 开发工程师",
        salary: "28-48k",
        location: "杭州",
        description: "淘宝、支付宝 Java 后端开发。",
        source: "lagou" as const,
      },
      {
        company: "腾讯",
        position: "后端开发工程师",
        salary: "28-45k",
        location: "深圳",
        description: "微信、QQ 后端开发。",
        source: "boss" as const,
      },
      {
        company: "美团",
        position: "产品经理",
        salary: "20-36k",
        location: "北京",
        description: "外卖、到店服务产品。",
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
    ];

    // 获取更新前的统计
    const statsBefore = await getJobsDatabaseStats();
    console.log(
      `  📊 更新前: ${statsBefore?.totalJobs} 条职位`
    );

    // 尝试从 Kimi API 获取数据（如果配置）
    if (process.env.KIMI_API_KEY) {
      console.log("  🤖 尝试从 Kimi API 获取数据...");
      await fetchAndSaveJobsFromKimi({
        skills: ["JavaScript", "React", "Node.js"],
        targetRole: "前端工程师",
        location: "北京",
      });
    }

    // 生成动态职位数据
    const dynamicJobs = generateDynamicJobs(baseJobTemplates);

    // 刷新数据库
    const refreshResult = await refreshJobsInDatabase(dynamicJobs);
    console.log(
      `  ✅ 更新完成: +${refreshResult.addedCount} 条新职位, -${refreshResult.deletedCount} 条过期职位`
    );

    // 清理过期数据
    const cleanedCount = await cleanupExpiredJobs();
    if (cleanedCount > 0) {
      console.log(`  🗑️  清理了 ${cleanedCount} 条 30 天未更新的数据`);
    }

    // 获取更新后的统计
    const statsAfter = await getJobsDatabaseStats();
    console.log(
      `  📊 更新后: ${statsAfter?.totalJobs} 条职位\n`
    );
  } catch (error) {
    console.error("❌ 定期更新失败:", error);
  }
}

/**
 * 初始化定时任务调度器
 * 在应用启动时调用，启动后台定时任务
 */
export async function initializeScheduler() {
  // 防止在服务器端多次初始化
  if (schedulerStarted) {
    return;
  }

  // 使用原子操作标记为已启动
  schedulerStarted = true;

  try {
    console.log("\n🔄 [应用启动] 初始化职位数据定时更新任务...");

    // 首次启动立即执行一次更新
    console.log("📥 首次启动执行数据更新...");
    try {
      await performDatabaseUpdate();
    } catch (error) {
      console.error("首次更新失败:", error);
    }

    // 获取更新间隔（默认 8 小时）
    const UPDATE_INTERVAL_HOURS =
      parseInt(process.env.UPDATE_INTERVAL_HOURS || "8", 10);
    const UPDATE_INTERVAL_MS = UPDATE_INTERVAL_HOURS * 60 * 60 * 1000;

    // 设置定时任务
    if (typeof global !== "undefined" && typeof setInterval !== "undefined") {
      schedulerInterval = setInterval(
        performDatabaseUpdate,
        UPDATE_INTERVAL_MS
      );

      console.log(
        `⏱️  定时更新已启动，将每 ${UPDATE_INTERVAL_HOURS} 小时自动更新一次职位数据\n`
      );
    }
  } catch (error) {
    console.error("❌ 初始化调度器失败:", error);
    schedulerStarted = false; // 失败时重置标记
  }
}

/**
 * 停止定时任务调度器
 * 应用关闭时调用
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    schedulerStarted = false;
    console.log("🛑 定时更新任务已停止");
  }
}

/**
 * 手动执行一次更新（供外部调用）
 */
export async function triggerManualUpdate() {
  console.log("👤 用户手动触发职位数据更新");
  await performDatabaseUpdate();
}
