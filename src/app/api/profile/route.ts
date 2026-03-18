import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 获取或创建主 profile
    let profile = await prisma.masterProfile.findFirst();
    
    if (!profile) {
      profile = await prisma.masterProfile.create({
        data: {},
      });
    }

    // 返回时解析 JSON 字段
    return NextResponse.json({
      ...profile,
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      education: profile.education ? JSON.parse(profile.education) : [],
      workExp: profile.workExp ? JSON.parse(profile.workExp) : [],
      projects: profile.projects ? JSON.parse(profile.projects) : [],
    });
  } catch (error) {
    console.error("获取 Profile 失败:", error);
    return NextResponse.json(
      { error: "获取 Profile 失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      location,
      summary,
      skills,
      education,
      workExp,
      projects,
    } = body;

    // 获取或创建主 profile
    let profile = await prisma.masterProfile.findFirst();

    if (!profile) {
      profile = await prisma.masterProfile.create({
        data: {
          name: name || "",
          email: email || "",
          phone: phone || "",
          location: location || "",
          summary: summary || "",
          skills: JSON.stringify(skills || []),
          education: JSON.stringify(education || []),
          workExp: JSON.stringify(workExp || []),
          projects: JSON.stringify(projects || []),
        },
      });
    } else {
      profile = await prisma.masterProfile.update({
        where: { id: profile.id },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
          ...(location !== undefined && { location }),
          ...(summary !== undefined && { summary }),
          ...(skills !== undefined && { skills: JSON.stringify(skills) }),
          ...(education !== undefined && { education: JSON.stringify(education) }),
          ...(workExp !== undefined && { workExp: JSON.stringify(workExp) }),
          ...(projects !== undefined && { projects: JSON.stringify(projects) }),
        },
      });
    }

    // 返回时解析 JSON 字段
    return NextResponse.json({
      ...profile,
      skills: JSON.parse(profile.skills),
      education: JSON.parse(profile.education),
      workExp: JSON.parse(profile.workExp),
      projects: JSON.parse(profile.projects),
    });
  } catch (error) {
    console.error("保存 Profile 失败:", error);
    return NextResponse.json(
      { error: "保存 Profile 失败" },
      { status: 500 }
    );
  }
}
