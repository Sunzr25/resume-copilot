import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/recruitment/jobs/{jobId}/like
 * Like 一个职位，并同时返回相关面经
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // 检查职位是否存在
    const job = await prisma.crawledJob.findUnique({
      where: { id: jobId },
      include: { interviews: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "职位不存在" },
        { status: 404 }
      );
    }

    // 检查是否已 like
    const existing = await prisma.userLike.findUnique({
      where: { jobId },
    });

    if (existing) {
      // 取消 like
      await prisma.userLike.delete({ where: { id: existing.id } });
      return NextResponse.json({
        success: true,
        liked: false,
        job: {
          ...job,
          isLiked: false,
        },
      });
    }

    // 创建 like 记录
    const like = await prisma.userLike.create({
      data: { jobId },
    });

    return NextResponse.json({
      success: true,
      liked: true,
      likedAt: like.likedAt,
      job: {
        ...job,
        isLiked: true,
      },
      // 返回该职位的所有面经
      interviews: job.interviews,
    });
  } catch (error) {
    console.error("Like职位失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "操作失败",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recruitment/jobs/{jobId}/like
 * 取消 like
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    await prisma.userLike.delete({
      where: { jobId },
    });

    return NextResponse.json({
      success: true,
      message: "已取消收藏",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "取消失败",
      },
      { status: 500 }
    );
  }
}
