/**
 * 快速验证脚本 - 检查数据库中的数据
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 正在验证数据库初始化...\n");

  try {
    // 获取职位总数
    const totalJobs = await prisma.crawledJob.count();
    console.log(`📊 职位总数: ${totalJobs} 条`);

    // 获取活跃职位数
    const activeJobs = await prisma.crawledJob.count({
      where: { isActive: true },
    });
    console.log(`✅ 活跃职位: ${activeJobs} 条`);

    // 获取面经总数
    const totalInterviews = await prisma.crawledInterview.count();
    console.log(`💬 面经数据: ${totalInterviews} 条`);

    // 获取公司列表
    const companies = await prisma.crawledJob.groupBy({
      by: ["company"],
      _count: true,
      where: { isActive: true },
      orderBy: { _count: { company: "desc" } },
      take: 10,
    });

    console.log("\n📍 Top 10 招聘公司:");
    for (const company of companies) {
      console.log(`  • ${company.company}: ${company._count} 个职位`);
    }

    // 获取职位来源分布
    const sources = await prisma.crawledJob.groupBy({
      by: ["source"],
      _count: true,
      where: { isActive: true },
    });

    console.log("\n🔗 职位来源分布:");
    for (const source of sources) {
      console.log(`  • ${source.source}: ${source._count} 条`);
    }

    // 获取最新添加的职位
    const newestJobs = await prisma.crawledJob.findMany({
      where: { isActive: true },
      orderBy: { crawledAt: "desc" },
      take: 5,
      select: {
        id: true,
        company: true,
        position: true,
        salary: true,
        location: true,
        crawledAt: true,
      },
    });

    console.log("\n🆕 最新添加的职位:");
    for (const job of newestJobs) {
      console.log(`  • ${job.company} - ${job.position} (${job.salary}) @ ${job.location}`);
    }

    // 获取最新的面经
    const newestInterviews = await prisma.crawledInterview.findMany({
      orderBy: { crawledAt: "desc" },
      take: 5,
      select: {
        company: true,
        position: true,
        question: true,
        difficulty: true,
      },
    });

    console.log("\n💡 最新的面经问题:");
    for (const interview of newestInterviews) {
      console.log(`  • [${interview.difficulty.toUpperCase()}] ${interview.company} - ${interview.position}`);
      console.log(`    问: ${interview.question}\n`);
    }

    console.log("\n✨ 数据库验证完成！数据初始化成功。\n");
  } catch (error) {
    console.error("❌ 验证失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
