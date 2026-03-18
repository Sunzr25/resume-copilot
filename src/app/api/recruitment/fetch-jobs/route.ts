import { NextRequest, NextResponse } from "next/server";

interface JobPosting {
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  description: string;
  source: "boss" | "lagou" | "manual";
  link?: string;
  postedDate: string;
}

// OpenClaw API 配置
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || "";
const OPENCLAW_API_URL = "https://api.openclaw.com/v1";

/**
 * 通过OpenClaw爬取BOSS直聘职位
 */
async function fetchFromBOSS(
  position: string,
  city: string = "北京"
): Promise<JobPosting[]> {
  try {
    // 构建BOSS直聘搜索URL
    const bossUrl = `https://www.zhipin.com/c/${encodeURIComponent(
      city
    )}/t${encodeURIComponent(position)}/`;

    const response = await fetch(`${OPENCLAW_API_URL}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_API_KEY}`,
      },
      body: JSON.stringify({
        url: bossUrl,
        wait_for: ".job-list-item",
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.error("OpenClaw BOSS爬取失败:", response.statusText);
      return [];
    }

    const data = await response.json();
    const html = data.content;

    // 解析职位列表
    const jobs = parseJobsFromHTML(html, "boss");
    return jobs;
  } catch (error) {
    console.error("爬取BOSS直聘失败:", error);
    return [];
  }
}

/**
 * 通过OpenClaw爬取拉勾网职位
 */
async function fetchFromLagou(
  position: string,
  city: string = "北京"
): Promise<JobPosting[]> {
  try {
    const lagouUrl = `https://www.lagou.com/jobs/list_${encodeURIComponent(
      position
    )}`;

    const response = await fetch(`${OPENCLAW_API_URL}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_API_KEY}`,
      },
      body: JSON.stringify({
        url: lagouUrl,
        wait_for: ".job-item",
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.error("OpenClaw拉勾爬取失败:", response.statusText);
      return [];
    }

    const data = await response.json();
    const html = data.content;

    const jobs = parseJobsFromHTML(html, "lagou");
    return jobs;
  } catch (error) {
    console.error("爬取拉勾网失败:", error);
    return [];
  }
}

/**
 * 从HTML中解析职位信息
 */
function parseJobsFromHTML(html: string, source: "boss" | "lagou"): JobPosting[] {
  const jobs: JobPosting[] = [];

  // 简单的HTML解析 - 实际使用应该用 cheerio 或 jsdom
  if (source === "boss") {
    // 解析BOSS直聘结构
    const jobRegex =
      /<div class="job-list-item".*?data-positionid="(\d+)".*?>([\s\S]*?)<\/div>/g;
    let match;

    while ((match = jobRegex.exec(html)) !== null) {
      const jobHtml = match[2];

      // 提取公司名
      const companyMatch = jobHtml.match(
        /<div class="company-info">([\s\S]*?)<\/div>/
      );
      const company = companyMatch
        ? companyMatch[1].replace(/<[^>]*>/g, "").trim()
        : "未知公司";

      // 提取职位名
      const positionMatch = jobHtml.match(
        /<div class="job-name">([\s\S]*?)<\/div>/
      );
      const position = positionMatch
        ? positionMatch[1].replace(/<[^>]*>/g, "").trim()
        : "未知职位";

      // 提取薪资
      const salaryMatch = jobHtml.match(
        /<div class="salary">([\s\S]*?)<\/div>/
      );
      const salary = salaryMatch
        ? salaryMatch[1].replace(/<[^>]*>/g, "").trim()
        : "面议";

      // 提取地点
      const locationMatch = jobHtml.match(
        /<div class="location">([\s\S]*?)<\/div>/
      );
      const location = locationMatch
        ? locationMatch[1].replace(/<[^>]*>/g, "").trim()
        : "未知";

      // 提取链接
      const linkMatch = jobHtml.match(/href="([^"]*positionid=\d+[^"]*)"/);
      const link = linkMatch ? linkMatch[1] : undefined;

      if (company && position) {
        jobs.push({
          id: `boss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          company,
          position,
          location,
          salary,
          description: "从BOSS直聘爬取，请点击查看完整描述",
          source: "boss",
          link,
          postedDate: new Date().toLocaleDateString("zh-CN"),
        });
      }
    }
  } else if (source === "lagou") {
    // 解析拉勾网结构
    const jobRegex =
      /<div class="job-item".*?>([\s\S]*?)<\/div>/g;
    let match;

    while ((match = jobRegex.exec(html)) !== null) {
      const jobHtml = match[1];

      // 提取职位名
      const positionMatch = jobHtml.match(
        /<a class="job-link"[^>]*>([^<]*)<\/a>/
      );
      const position = positionMatch ? positionMatch[1].trim() : "未知职位";

      // 提取公司名
      const companyMatch = jobHtml.match(
        /<a class="company"[^>]*>([^<]*)<\/a>/
      );
      const company = companyMatch ? companyMatch[1].trim() : "未知公司";

      // 提取薪资
      const salaryMatch = jobHtml.match(
        /<span class="salary">([^<]*)<\/span>/
      );
      const salary = salaryMatch ? salaryMatch[1].trim() : "面议";

      // 提取城市
      const cityMatch = jobHtml.match(
        /<span class="city">([^<]*)<\/span>/
      );
      const location = cityMatch ? cityMatch[1].trim() : "未知";

      // 提取链接
      const linkMatch = jobHtml.match(/href="([^"]*positionId=\d+[^"]*)"/);
      const link = linkMatch ? `https://www.lagou.com${linkMatch[1]}` : undefined;

      if (company && position) {
        jobs.push({
          id: `lagou-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          company,
          position,
          location,
          salary,
          description: "从拉勾网爬取，请点击查看完整描述",
          source: "lagou",
          link,
          postedDate: new Date().toLocaleDateString("zh-CN"),
        });
      }
    }
  }

  return jobs;
}

/**
 * 主API端点：获取职位信息
 * POST /api/recruitment/fetch-jobs
 * 请求体: { position: string, cities?: string[], sources?: ("boss" | "lagou")[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { position, cities = ["北京"], sources = ["boss", "lagou"] } = body;

    if (!position) {
      return NextResponse.json(
        { error: "职位名称必填" },
        { status: 400 }
      );
    }

    if (!OPENCLAW_API_KEY) {
      return NextResponse.json(
        { 
          error: "OpenClaw API密钥未配置",
          hint: "请在.env.local中配置OPENCLAW_API_KEY"
        },
        { status: 500 }
      );
    }

    const allJobs: JobPosting[] = [];

    // 并发爬取多个来源和城市
    const promises: Promise<JobPosting[]>[] = [];

    for (const source of sources) {
      for (const city of cities) {
        if (source === "boss") {
          promises.push(fetchFromBOSS(position, city));
        } else if (source === "lagou") {
          promises.push(fetchFromLagou(position, city));
        }
      }
    }

    const results = await Promise.all(promises);
    results.forEach((jobs) => allJobs.push(...jobs));

    // 去重和排序
    const uniqueJobs = Array.from(
      new Map(allJobs.map((job) => [job.link || job.id, job])).values()
    );

    return NextResponse.json({
      success: true,
      total: uniqueJobs.length,
      jobs: uniqueJobs.slice(0, 50), // 限制返回数量
      source: "openclaw",
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取职位失败:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "未知错误",
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET 端点：查询可用来源和城市
 */
export async function GET() {
  return NextResponse.json({
    sources: [
      {
        name: "boss",
        label: "BOSS直聘",
        url: "https://www.zhipin.com",
      },
      {
        name: "lagou",
        label: "拉勾网",
        url: "https://www.lagou.com",
      },
    ],
    cities: [
      "北京",
      "上海",
      "深圳",
      "杭州",
      "南京",
      "武汉",
      "成都",
      "广州",
      "西安",
      "苏州",
    ],
    note: "使用OpenClaw爬虫服务，需要配置OPENCLAW_API_KEY",
  });
}
