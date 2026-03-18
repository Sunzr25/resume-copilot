import { NextRequest, NextResponse } from "next/server";
import { getJobsDatabaseStats } from "@/lib/db-init";

/**
 * 数据库状态查询 API
 * 返回数据库中职位、面经等数据的统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getJobsDatabaseStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: {
        totalJobs: stats?.totalJobs || 0,
        activeJobs: stats?.activeJobs || 0,
        inactiveJobs: (stats?.inactiveJobs || 0),
        totalInterviews: stats?.totalInterviews || 0,
        lastUpdated: stats?.lastUpdated?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("获取数据库统计失败:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get database statistics",
      },
      { status: 500 }
    );
  }
}
