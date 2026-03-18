import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/profile/skill-history
 * 获取用户历史填写的所有技能
 */
export async function GET(request: NextRequest) {
  try {
    const skills = await prisma.skillHistory.findMany({
      orderBy: { lastUsed: "desc" },
    });

    return NextResponse.json({
      success: true,
      skills: skills.map((s) => ({
        skill: s.skill,
        usedCount: s.usedCount,
        lastUsed: s.lastUsed,
      })),
      total: skills.length,
    });
  } catch (error) {
    console.error("获取技能历史失败:", error);
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
 * POST /api/profile/skill-history
 * 添加/更新用户技能到历史记录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skill } = body;

    if (!skill || typeof skill !== "string") {
      return NextResponse.json(
        { success: false, error: "技能名称必填" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await prisma.skillHistory.findUnique({
      where: { skill },
    });

    if (existing) {
      // 增加使用次数并更新最后使用时间
      const updated = await prisma.skillHistory.update({
        where: { skill },
        data: {
          usedCount: existing.usedCount + 1,
          lastUsed: new Date(),
        },
      });
      return NextResponse.json({ success: true, skillHistory: updated });
    }

    // 创建新技能记录
    const newSkill = await prisma.skillHistory.create({
      data: {
        skill,
        usedCount: 1,
        lastUsed: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, skillHistory: newSkill },
      { status: 201 }
    );
  } catch (error) {
    console.error("保存技能失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "保存失败",
      },
      { status: 500 }
    );
  }
}
