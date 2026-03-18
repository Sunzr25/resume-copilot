import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(applications);
  } catch (error) {
    console.error("获取投递列表失败:", error);
    return NextResponse.json(
      { error: "获取投递列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetCompany, targetRole, jdText, status = "PREPARING" } = body;

    if (!targetCompany || !targetRole) {
      return NextResponse.json(
        { error: "公司名称和岗位名称不能为空" },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        targetCompany,
        targetRole,
        jdText: jdText || "",
        status,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("新增投递失败:", error);
    return NextResponse.json(
      { error: "新增投递失败" },
      { status: 500 }
    );
  }
}
