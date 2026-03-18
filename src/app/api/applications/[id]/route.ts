import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { targetCompany, targetRole, jdText, status, notes } = body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(targetCompany && { targetCompany }),
        ...(targetRole && { targetRole }),
        ...(jdText !== undefined && { jdText }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("编辑投递失败:", error);
    return NextResponse.json(
      { error: "编辑投递失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除投递失败:", error);
    return NextResponse.json(
      { error: "删除投递失败" },
      { status: 500 }
    );
  }
}
