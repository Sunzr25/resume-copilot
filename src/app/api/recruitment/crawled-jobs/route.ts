import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/recruitment/crawled-jobs
 * 获取爬虫职位列表（可分页、筛选）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "";
    const position = searchParams.get("position") || "";
    const source = searchParams.get("source") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 构建查询条件
    const where: any = { isActive: true };
    if (city) where.location = { contains: city };
    if (position) where.position = { contains: position };
    if (source) where.source = source;

    // 分页查询
    const [jobs, total] = await Promise.all([
      prisma.crawledJob.findMany({
        where,
        include: {
          interviews: true,
          userLikes: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { crawledAt: "desc" },
      }),
      prisma.crawledJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs: jobs.map((job) => ({
        ...job,
        isLiked: job.userLikes.length > 0,
        interviewCount: job.interviews.length,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
      lastUpdated: jobs.length > 0 ? jobs[0].crawledAt : null,
    });
  } catch (error) {
    console.error("获取爬虫职位失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取失败",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recruitment/crawled-jobs
 * 由 OpenClaw Webhook 调用，存储爬虫数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company,
      position,
      location,
      salary,
      description,
      source,
      sourceUrl,
      rawData,
    } = body;

    // 检查是否已存在（基于URL）
    const existing = await prisma.crawledJob.findUnique({
      where: { "source_sourceUrl": { source: source || "boss", sourceUrl: sourceUrl || "" } },
    });

    if (existing) {
      // 更新现有记录
      const updated = await prisma.crawledJob.update({
        where: { id: existing.id },
        data: {
          description,
          rawData: JSON.stringify(rawData),
          updatedAt: new Date(),
        },
        include: { interviews: true },
      });
      return NextResponse.json({ success: true, job: updated });
    }

    // 创建新记录
    const job = await prisma.crawledJob.create({
      data: {
        company,
        position,
        location,
        salary,
        description,
        source: source || "boss",
        sourceUrl: sourceUrl || "",
        rawData: JSON.stringify(rawData || {}),
      },
      include: { interviews: true },
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("存储职位数据失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "存储失败",
      },
      { status: 500 }
    );
  }
}
