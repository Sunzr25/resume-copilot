import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 职位数据生成的基础信息
 */
interface JobTemplate {
  company: string;
  position: string;
  salary: string;
  location: string;
  description: string;
  source: "boss" | "lagou" | "other";
}

/**
 * 生成动态的职位数据（用于定期更新）
 * 基于现有的模板，生成变化的数据以模拟真实更新
 */
export function generateDynamicJobs(baseJobs: JobTemplate[]): JobTemplate[] {
  const randomJobs: JobTemplate[] = [];

  // 为每个基础职位生成变化版本（模拟不同的发布时间和需求变化）
  for (const job of baseJobs) {
    const variations = [
      {
        ...job,
        salary:
          increaseSalary(job.salary, Math.random() * 0.1) || job.salary,
        description: `${job.description}（更新于 ${new Date().toLocaleDateString(
          "zh-CN"
        )}）`,
      },
      {
        ...job,
        position: `${job.position}（高级）`,
        salary: increaseSalary(job.salary, 0.2) || job.salary,
        description:
          job.description.replace("需要", "需要有 3+ 年经验，") +
          "，急招。",
      },
      {
        ...job,
        location: getRandomLocation(),
        description: `${job.description} 欢迎投递。`,
      },
    ];

    // 随机选择一个变化版本
    const selectedVariation =
      variations[Math.floor(Math.random() * variations.length)];
    randomJobs.push(selectedVariation);
  }

  return randomJobs;
}

/**
 * 增加薪资范围
 */
function increaseSalary(
  salaryRange: string,
  percentage: number
): string | null {
  const match = salaryRange.match(/(\d+)-(\d+)k/);
  if (!match) return null;

  const min = parseInt(match[1]);
  const max = parseInt(match[2]);

  const newMin = Math.ceil(min * (1 + percentage));
  const newMax = Math.ceil(max * (1 + percentage));

  return `${newMin}-${newMax}k`;
}

/**
 * 随机选择一个城市
 */
function getRandomLocation(): string {
  const locations = [
    "北京",
    "上海",
    "深圳",
    "杭州",
    "南京",
    "成都",
    "武汉",
    "西安",
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

/**
 * 刷新数据库中的职位数据
 * 删除一部分旧数据，添加新的更新数据
 */
export async function refreshJobsInDatabase(
  newJobsData: JobTemplate[]
) {
  try {
    // 获取所有现有职位（按更新时间）
    const existingJobs = await prisma.crawledJob.findMany({
      orderBy: { updatedAt: "asc" },
    });

    // 删除最旧的 30% 职位（保留最新的）
    const deleteCount = Math.ceil(existingJobs.length * 0.3);
    if (deleteCount > 0) {
      const jobsToDelete = existingJobs.slice(0, deleteCount);
      for (const job of jobsToDelete) {
        await prisma.crawledJob.delete({
          where: { id: job.id },
        });
      }
      console.log(`✅ 删除了 ${deleteCount} 条已过期的职位`);
    }

    // 添加新的职位数据
    let addedCount = 0;
    for (const job of newJobsData) {
      const jobKey = `${job.company}-${job.position}-${new Date().getTime()}`;
      const existingJob = await prisma.crawledJob.findUnique({
        where: {
          source_sourceUrl: {
            source: job.source,
            sourceUrl: jobKey,
          },
        },
      }).catch(() => null);

      if (!existingJob) {
        await prisma.crawledJob.create({
          data: {
            company: job.company,
            position: job.position,
            salary: job.salary,
            location: job.location,
            description: job.description,
            source: job.source,
            sourceUrl: jobKey,
            isActive: true,
            rawData: JSON.stringify(job),
          },
        });
        addedCount++;
      }
    }

    console.log(`✅ 新增了 ${addedCount} 条职位数据`);

    // 统计当前数据库中的职位数
    const totalJobs = await prisma.crawledJob.count();
    console.log(`📊 数据库当前包含 ${totalJobs} 条职位`);

    return {
      success: true,
      addedCount,
      deletedCount: deleteCount,
      totalCount: totalJobs,
    };
  } catch (error) {
    console.error("❌ 刷新职位数据失败:", error);
    throw error;
  }
}

/**
 * 从 Kimi API 获取真实职位推荐并保存到数据库
 * （需要配置 KIMI_API_KEY 环境变量）
 */
export async function fetchAndSaveJobsFromKimi(
  userProfile?: {
    skills?: string[];
    targetRole?: string;
    location?: string;
  }
) {
  const kimiApiKey = process.env.KIMI_API_KEY;

  if (!kimiApiKey) {
    console.warn(
      "⚠️  未配置 KIMI_API_KEY，跳过从 Kimi API 获取数据"
    );
    return null;
  }

  try {
    const prompt = `
你是一个专业的职位推荐系统，根据以下候选人信息，列出 20 个现实真实存在的热门职位。

候选人信息：
- 技能: ${userProfile?.skills?.join("、") || "Java, 分布式系统"}
- 目标职位: ${userProfile?.targetRole || "后端工程师"}
- 偏好城市: ${userProfile?.location || "北京"}

请生成 20 个真实、具体的职位推荐，返回 JSON 数组，格式如下：
[
  {
    "company": "真实公司名称",
    "position": "职位名称",
    "salary": "薪资范围(例: 30-50k)",
    "location": "城市名",
    "description": "职位描述(2-3句话)",
    "source": "boss"
  }
]

只返回 JSON 数组，不要其他内容。
    `;

    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${kimiApiKey}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 提取 JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Kimi response");
    }

    const jobs = JSON.parse(jsonMatch[0]) as JobTemplate[];

    // 保存到数据库
    let savedCount = 0;
    for (const job of jobs) {
      const jobKey = `${job.company}-${job.position}`;
      const existingJob = await prisma.crawledJob.findUnique({
        where: {
          source_sourceUrl: {
            source: job.source,
            sourceUrl: jobKey,
          },
        },
      }).catch(() => null);

      if (!existingJob) {
        await prisma.crawledJob.create({
          data: {
            company: job.company,
            position: job.position,
            salary: job.salary,
            location: job.location,
            description: job.description,
            source: job.source as "boss" | "lagou" | "other",
            sourceUrl: jobKey,
            isActive: true,
            rawData: JSON.stringify(job),
          },
        });
        savedCount++;
      }
    }

    console.log(`✅ 从 Kimi API 获取并保存了 ${savedCount} 条职位`);
    return jobs;
  } catch (error) {
    console.error("❌ 从 Kimi API 获取职位失败:", error);
    return null;
  }
}

/**
 * 清理过期数据（超过 30 天未更新）
 */
export async function cleanupExpiredJobs() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.crawledJob.deleteMany({
      where: {
        updatedAt: {
          lt: thirtyDaysAgo,
        },
        isActive: false,
      },
    });

    console.log(`✅ 清理了 ${deleted.count} 条过期职位数据`);
    return deleted.count;
  } catch (error) {
    console.error("❌ 清理过期数据失败:", error);
    return 0;
  }
}

/**
 * 获取数据库统计信息
 */
export async function getJobsDatabaseStats() {
  try {
    const totalJobs = await prisma.crawledJob.count();
    const activeJobs = await prisma.crawledJob.count({
      where: { isActive: true },
    });
    const totalInterviews = await prisma.crawledInterview.count();

    const latestUpdate = await prisma.crawledJob.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    return {
      totalJobs,
      activeJobs,
      inactiveJobs: totalJobs - activeJobs,
      totalInterviews,
      lastUpdated: latestUpdate?.updatedAt,
    };
  } catch (error) {
    console.error("❌ 获取统计信息失败:", error);
    return null;
  }
}
