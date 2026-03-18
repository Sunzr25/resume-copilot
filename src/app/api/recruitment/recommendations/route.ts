import { NextRequest, NextResponse } from "next/server";

/**
 * 招聘职位推荐 API
 * 基于用户的职位要求和技能，推荐相关的职位
 * 
 * POST /api/recruitment/recommendations
 * Body: {
 *   targetJd: string,           // 用户的目标职位要求
 *   selectedSkills: string[],   // 用户选中的技能
 *   jobs: Array                 // 候选职位列表
 * }
 */

interface JobPosting {
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  description: string;
  source: "boss" | "lagou" | "manual";
  postedDate: string;
}

interface RecommendationRequest {
  targetJd: string;
  selectedSkills: string[];
  jobs: JobPosting[];
}

interface RecommendedJob extends JobPosting {
  matchScore: number; // 0-1
  matchReasons: string[];
}

// 简单的关键词匹配函数
function calculateMatchScore(
  job: JobPosting,
  targetJd: string,
  selectedSkills: string[]
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 提取目标职位关键词
  const jdMatches = targetJd.toLowerCase().match(/\b[\w]+\b/g);
  const jdKeywords: string[] = (jdMatches || []).slice(0, 20);

  // 提取工作描述关键词和文本
  const jobDescMatches = job.description.toLowerCase().match(/\b[\w]+\b/g);
  const jobKeywords: string[] = jobDescMatches || [];
  const jobText = `${job.company}${job.position}${job.location}${job.salary}${job.description}`.toLowerCase();

  // 1. 职位名称匹配
  const positionMatch = jdKeywords.some(
    (kw: string) =>
      kw.length > 2 && job.position.toLowerCase().includes(kw)
  );
  if (positionMatch) {
    score += 0.3;
    reasons.push("职位名称匹配");
  }

  // 2. 工作描述匹配
  const descriptionMatches = jdKeywords.filter(
    (kw: string) => kw.length > 2 && jobKeywords.includes(kw)
  ).length;
  const descriptionScore = Math.min(descriptionMatches / 10, 0.3);
  score += descriptionScore;
  if (descriptionScore > 0) {
    reasons.push(`描述匹配 ${Math.round(descriptionScore * 100)}%`);
  }

  // 3. 技能匹配
  const skillMatches = selectedSkills.filter(
    (skill: string) =>
      skill &&
      jobText.includes(skill.toLowerCase())
  ).length;
  const skillScore = Math.min(skillMatches / Math.max(selectedSkills.length, 1), 0.4);
  score += skillScore;
  if (skillScore > 0) {
    reasons.push(`${Math.round(skillScore * 100)}% 技能匹配`);
  }

  // 规范化分数到 0-1
  score = Math.min(score, 1);

  return { score, reasons };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecommendationRequest;
    const { targetJd, selectedSkills, jobs } = body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: "缺少职位列表" },
        { status: 400 }
      );
    }

    if (!targetJd && selectedSkills.length === 0) {
      return NextResponse.json(
        { error: "请提供职位要求或技能信息" },
        { status: 400 }
      );
    }

    // 计算每个职位的匹配度
    const recommendedJobs: RecommendedJob[] = jobs
      .map((job) => {
        const { score, reasons } = calculateMatchScore(
          job,
          targetJd,
          selectedSkills
        );
        return {
          ...job,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      // 按匹配度排序
      .sort((a, b) => b.matchScore - a.matchScore)
      // 只返回匹配度 > 0.2 的职位（过滤掉完全不匹配的）
      .filter((job) => job.matchScore > 0.2);

    // 如果完全没有匹配，返回最接近的几个
    if (recommendedJobs.length === 0) {
      return NextResponse.json({
        recommendations: jobs
          .map((job) => {
            const { score, reasons } = calculateMatchScore(
              job,
              targetJd,
              selectedSkills
            );
            return {
              ...job,
              matchScore: score,
              matchReasons: reasons,
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3),
        message: "未找到高度匹配的职位，显示最接近的职位",
      });
    }

    return NextResponse.json({
      recommendations: recommendedJobs,
      total: jobs.length,
      matched: recommendedJobs.length,
      message: `在 ${jobs.length} 个职位中找到 ${recommendedJobs.length} 个匹配的职位`,
    });
  } catch (error) {
    console.error("[recruitment/recommendations] 错误:", error);
    return NextResponse.json(
      { error: "推荐失败，请重试" },
      { status: 500 }
    );
  }
}
