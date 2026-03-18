/**
 * 手动触发职位数据更新的 API 端点
 * GET /api/recruitment/cron/trigger-update
 * 用于测试定时任务是否正常工作
 */

import { NextRequest, NextResponse } from "next/server";
import { triggerManualUpdate } from "@/lib/server-scheduler";

export async function GET(request: NextRequest) {
  try {
    // 验证请求来源（可选，用于安全性）
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN || "test-token";

    // 如果设置了 CRON_SECRET_TOKEN，则需要验证
    if (
      process.env.CRON_SECRET_TOKEN &&
      authHeader !== `Bearer ${expectedToken}`
    ) {
      return NextResponse.json(
        { error: "未授权的请求" },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    console.log("🔔 API 触发职位数据手动更新...");

    // 执行数据更新
    await triggerManualUpdate();

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: "职位数据更新已触发",
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 手动更新失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
