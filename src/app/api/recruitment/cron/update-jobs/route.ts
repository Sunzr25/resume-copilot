import { NextRequest, NextResponse } from "next/server";
import {
  generateDynamicJobs,
  refreshJobsInDatabase,
  fetchAndSaveJobsFromKimi,
  cleanupExpiredJobs,
  getJobsDatabaseStats,
} from "@/lib/db-init";

/**
 * 定期更新职位数据的 API 路由
 * 可以被外部 cron 服务（如 EasyCron、Vercel Cron 等）调用
 * 
 * 调用方式：
 * - GET /api/recruitment/cron/update-jobs
 * 
 * 返回统计信息和更新结果
 */
export async function GET(request: NextRequest) {
  try {
    // 可选：验证 cron token（增加安全性）
    const cronToken = request.headers.get("x-cron-token");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && cronToken !== expectedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔄 开始定期更新职位数据...");

    // Step 1: 获取更新前的统计
    const statsBefore = await getJobsDatabaseStats();
    console.log(
      `📊 更新前数据库状态: 总计 ${statsBefore?.totalJobs} 条，活跃 ${statsBefore?.activeJobs} 条`
    );

    // Step 2: 尝试从 Kimi API 获取真实数据（如果配置了 API Key）
    const kimiKey = process.env.KIMI_API_KEY;
    let kimiJobsCount = 0;

    if (kimiKey) {
      console.log("🤖 从 Kimi API 获取真实职位数据...");
      const kimiJobs = await fetchAndSaveJobsFromKimi({
        skills: ["JavaScript", "React", "Node.js"],
        targetRole: "前端工程师",
        location: "北京",
      });

      if (kimiJobs) {
        kimiJobsCount = kimiJobs.length;
      }
    } else {
      console.log("ℹ️  未配置 KIMI_API_KEY，使用本地模板数据");
    }

    // Step 3: 生成动态职位数据（基于本地模板）
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
        company: "阿里巴巴",
        position: "Java 开发工程师",
        salary: "28-48k",
        location: "杭州",
        description: "淘宝、支付宝 Java 后端开发。需要掌握分布式架构。",
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
        company: "美团",
        position: "产品经理",
        salary: "20-36k",
        location: "北京",
        description: "外卖、到店服务产品。需要理解 O2O 业务。",
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
        company: "滴滴",
        position: "产品经理",
        salary: "25-40k",
        location: "北京",
        description: "滴滴出行或滴滴青桔产品。需要懂出行业务。",
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
        company: "京东",
        position: "Java 工程师",
        salary: "26-42k",
        location: "北京",
        description: "京东商城后端开发。需要掌握 Java，有大流量场景经验。",
        source: "boss" as const,
      },
    ];

    const dynamicJobs = generateDynamicJobs(baseJobTemplates);
    console.log(
      `📝 生成了 ${dynamicJobs.length} 个动态职位数据变体`
    );

    // Step 4: 刷新数据库
    const refreshResult = await refreshJobsInDatabase(dynamicJobs);
    console.log(`✅ 数据库刷新完成:`, refreshResult);

    // Step 5: 清理过期数据
    const cleanedCount = await cleanupExpiredJobs();
    console.log(`🗑️  清理了 ${cleanedCount} 条过期数据`);

    // Step 6: 获取更新后的统计
    const statsAfter = await getJobsDatabaseStats();
    console.log(
      `📊 更新后数据库状态: 总计 ${statsAfter?.totalJobs} 条，活跃 ${statsAfter?.activeJobs} 条`
    );

    return NextResponse.json({
      success: true,
      message: "职位数据更新成功",
      timestamp: new Date().toISOString(),
      updateSummary: {
        kimiApiUsed: !!kimiKey,
        kimiJobsAdded: kimiJobsCount,
        dynamicJobsProcessed: dynamicJobs.length,
        jobsAdded: refreshResult.addedCount,
        jobsDeleted: refreshResult.deletedCount,
        jobsCleanedUp: cleanedCount,
      },
      statistics: {
        before: statsBefore,
        after: statsAfter,
      },
    });
  } catch (error) {
    console.error("❌ 定期更新失败:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * 手动触发更新（POST 请求，用于管理界面）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const authToken = request.headers.get("authorization");
    const expectedToken = `Bearer ${process.env.CRON_SECRET_TOKEN}`;

    // 简单的认证检查
    if (
      process.env.CRON_SECRET_TOKEN &&
      authToken !== expectedToken
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 调用 GET 逻辑
    const response = await GET(request);
    return response;
  } catch (error) {
    console.error("❌ 手动更新失败:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
