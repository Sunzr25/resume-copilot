import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/recruitment/webhook/openclaw
 * 接收 OpenClaw 推送的数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证 Webhook 签名（可选，根据 OpenClaw 配置）
    const secret = process.env.OPENCLAW_WEBHOOK_SECRET;
    if (secret) {
      const signature = request.headers.get("x-openclaw-signature");
      if (!signature || !verifySignature(body, signature, secret)) {
        return NextResponse.json(
          { success: false, error: "Webhook签名验证失败" },
          { status: 401 }
        );
      }
    }

    const { type, data } = body;

    if (type === "job") {
      // 处理职位数据
      return await handleJobData(data);
    } else if (type === "interview") {
      // 处理面经数据
      return await handleInterviewData(data);
    } else {
      return NextResponse.json(
        { success: false, error: "未知的数据类型" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Webhook 处理失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "处理失败",
      },
      { status: 500 }
    );
  }
}

/**
 * 处理职位数据
 */
async function handleJobData(data: any) {
  try {
    const {
      company,
      position,
      location,
      salary,
      description,
      source,
      sourceUrl,
    } = data;

    if (!company || !position || !sourceUrl) {
      return NextResponse.json(
        { success: false, error: "缺少必要字段" },
        { status: 400 }
      );
    }

    // 检查职位是否已存在
    const existing = await prisma.crawledJob.findUnique({
      where: {
        "source_sourceUrl": {
          source: source || "boss",
          sourceUrl,
        },
      },
    });

    let job;
    if (existing) {
      // 更新现有职位
      job = await prisma.crawledJob.update({
        where: { id: existing.id },
        data: {
          description,
          salary,
          isActive: true,
          updatedAt: new Date(),
          rawData: JSON.stringify(data),
        },
        include: { interviews: true },
      });
    } else {
      // 创建新职位
      job = await prisma.crawledJob.create({
        data: {
          company,
          position,
          location,
          salary,
          description,
          source: source || "boss",
          sourceUrl,
          rawData: JSON.stringify(data),
        },
        include: { interviews: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: existing ? "职位已更新" : "职位已创建",
      job,
    });
  } catch (error) {
    console.error("处理职位数据失败:", error);
    return NextResponse.json(
      { success: false, error: "处理职位数据失败" },
      { status: 500 }
    );
  }
}

/**
 * 处理面经数据
 */
async function handleInterviewData(data: any) {
  try {
    const {
      jobId,
      company,
      position,
      question,
      answer,
      difficulty,
      frequency,
      source,
      sourceUrl,
    } = data;

    if (!jobId || !question) {
      return NextResponse.json(
        { success: false, error: "缺少必要字段" },
        { status: 400 }
      );
    }

    // 验证职位是否存在
    const job = await prisma.crawledJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "职位不存在" },
        { status: 404 }
      );
    }

    // 创建或更新面经
    const interview = await prisma.crawledInterview.create({
      data: {
        jobId,
        company: company || job.company,
        position: position || job.position,
        question,
        answer: answer || "",
        difficulty: difficulty || "medium",
        frequency: frequency || 1,
        source: source || "unknown",
        sourceUrl: sourceUrl || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "面经已保存",
      interview,
    });
  } catch (error) {
    console.error("处理面经数据失败:", error);
    return NextResponse.json(
      { success: false, error: "处理面经数据失败" },
      { status: 500 }
    );
  }
}

/**
 * 验证 Webhook 签名（需要根据 OpenClaw 的实现调整）
 */
function verifySignature(data: any, signature: string, secret: string): boolean {
  // 这是伪代码，实际实现取决于 OpenClaw 的签名算法
  // 通常是 HMAC-SHA256(JSON body, secret)
  return true; // TODO: 实现实际的签名验证
}

/**
 * GET /api/recruitment/webhook/openclaw
 * 健康检查
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
