import { NextRequest, NextResponse } from "next/server";

// 推荐职位模拟数据生成
const generateRecommendedJobs = async (
  userProfile?: {
    skills?: string[];
    targetRole?: string;
    location?: string;
    jdText?: string;
    resumeText?: string;
    selectedSkills?: string[];
  }
) => {
  const kimiApiKey = process.env.KIMI_API_KEY;

  if (!kimiApiKey) {
    // 如果没有 API 密钥，返回虚拟职位
    return generateMockJobs(userProfile);
  }

  try {
    const prompt = buildPrompt(userProfile);

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("Kimi API error:", response.statusText);
      return generateMockJobs(userProfile);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return parseJobsFromKimi(content, userProfile);
  } catch (error) {
    console.error("Error calling Kimi API:", error);
    return generateMockJobs(userProfile);
  }
};

const buildPrompt = (
  userProfile?: {
    skills?: string[];
    targetRole?: string;
    location?: string;
    jdText?: string;
    resumeText?: string;
    selectedSkills?: string[];
  }
) => {
  const skills = userProfile?.skills?.join("、") || "前端、React、JavaScript";
  const selectedSkills = userProfile?.selectedSkills?.join("、") || "";
  const targetRole = userProfile?.targetRole || "前端工程师";
  const location = userProfile?.location || "北京";
  const jdText = userProfile?.jdText || "";
  const resumeText = userProfile?.resumeText || "";

  return `
你是一位资深 HR，根据候选人的背景，生成 5 个真实、具有竞争力的职位推荐。

候选人信息：
- 技能: ${skills}
- 关键词技能: ${selectedSkills || "无"}
- 目标职位: ${targetRole}
- 偏好城市: ${location}
- JD 要求摘要: ${jdText ? jdText.slice(0, 200) : "无"}
- 简历摘要: ${resumeText ? resumeText.slice(0, 200) : "无"}

请生成 20 个职位推荐，格式为 JSON 数组，每个职位包含：
{
  "company": "公司名称",
  "position": "职位名称",
  "salary": "薪资范围，如 30-50k",
  "location": "城市",
  "description": "职位描述（2-3 句话）",
  "source": "boss" | "lagou" | "manual"
}

请直接返回 JSON 数组，不要其他文字。
`;
};

const parseJobsFromKimi = (
  content: string,
  userProfile?: {
    skills?: string[];
    targetRole?: string;
    location?: string;
    jdText?: string;
    resumeText?: string;
    selectedSkills?: string[];
  }
) => {
  try {
    // 尝试从响应中提取 JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generateMockJobs(userProfile);
    }

    const jobs = JSON.parse(jsonMatch[0]);
    return jobs.map((job: any) => ({
      id: `${job.company}-${Date.now()}`,
      company: job.company || "Unknown",
      position: job.position || "职位",
      salary: job.salary || "面议",
      location: job.location || "北京",
      description: job.description || "",
      source: job.source || "lagou",
      postedDate: new Date().toLocaleDateString("zh-CN"),
      link: `https://example.com/${job.company}`,
    }));
  } catch (error) {
    console.error("Error parsing Kimi response:", error);
    return generateMockJobs(userProfile);
  }
};

const generateMockJobs = (
  userProfile?: {
    skills?: string[];
    targetRole?: string;
    location?: string;
    jdText?: string;
    resumeText?: string;
    selectedSkills?: string[];
  }
) => {
  const cities = [userProfile?.location || "北京", "上海", "深圳"];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const roleHint = `${userProfile?.targetRole || ""} ${userProfile?.jdText || ""}`.toLowerCase();

  const presetByRole = getPresetJobsByRole(roleHint, city, userProfile?.targetRole);
  if (presetByRole.length > 0) {
    return presetByRole;
  }

  const mockJobs = [
    {
      id: `job-${Date.now()}-1`,
      company: "字节跳动",
      position: userProfile?.targetRole || "前端工程师",
      salary: "30-50k",
      location: city,
      description:
        "负责字节系产品的前端开发，使用 React、TypeScript 等现代技术栈。我们期待有扎实的基础和热情的你加入。",
      source: "boss" as const,
      postedDate: new Date().toLocaleDateString("zh-CN"),
      link: "https://www.zhipin.com/job_detail/...",
    },
    {
      id: `job-${Date.now()}-2`,
      company: "阿里巴巴",
      position: userProfile?.targetRole || "前端工程师",
      salary: "28-48k",
      location: city,
      description:
        "支付宝前端团队招聘高级前端工程师。需要 3+ 年大型项目经验，掌握性能优化、跨端开发等技能。",
      source: "lagou" as const,
      postedDate: new Date().toLocaleDateString("zh-CN"),
      link: "https://www.lagou.com/jobs/...",
    },
    {
      id: `job-${Date.now()}-3`,
      company: "腾讯",
      position: userProfile?.targetRole || "全栈工程师",
      salary: "32-52k",
      location: city,
      description:
        "微信团队全栈岗位，要求掌握 Node.js、React 等技术，有小程序开发经验优先。",
      source: "boss" as const,
      postedDate: new Date().toLocaleDateString("zh-CN"),
      link: "https://www.zhipin.com/job_detail/...",
    },
    {
      id: `job-${Date.now()}-4`,
      company: "快手",
      position: userProfile?.targetRole || "前端工程师",
      salary: "25-45k",
      location: city,
      description:
        "负责快手客户端及网页的前端开发，使用 Vue 3、TypeScript 等技术栈。",
      source: "lagou" as const,
      postedDate: new Date().toLocaleDateString("zh-CN"),
      link: "https://www.lagou.com/jobs/...",
    },
    {
      id: `job-${Date.now()}-5`,
      company: "小红书",
      position: userProfile?.targetRole || "前端开发工程师",
      salary: "26-44k",
      location: city,
      description:
        "负责小红书 APP 和网页的前端开发。需要扎实的 React 基础，有 Expo 或 Electron 经验优先。",
      source: "boss" as const,
      postedDate: new Date().toLocaleDateString("zh-CN"),
      link: "https://www.zhipin.com/job_detail/...",
    },
  ];

  return mockJobs;
};

const getPresetJobsByRole = (
  roleHint: string,
  city: string,
  targetRole?: string
) => {
  const role = targetRole || "工程师";

  const presets: Record<string, Array<{ company: string; position: string; salary: string; description: string; source: "boss" | "lagou" | "manual"; link?: string }>> = {
    frontend: [
      {
        company: "字节跳动",
        position: `${role || "前端工程师"}`,
        salary: "30-50k",
        description: "负责中大型前端项目，强调性能优化与工程化。",
        source: "boss",
      },
      {
        company: "阿里巴巴",
        position: "高级前端工程师",
        salary: "28-48k",
        description: "前端架构与组件库建设，跨端与性能优化经验优先。",
        source: "lagou",
      },
    ],
    backend: [
      {
        company: "腾讯",
        position: "后端开发工程师",
        salary: "28-45k",
        description: "高并发服务开发，熟悉分布式与数据库优化。",
        source: "boss",
      },
      {
        company: "美团",
        position: "资深后端工程师",
        salary: "30-50k",
        description: "支付与订单链路建设，熟悉微服务与中间件。",
        source: "lagou",
      },
    ],
    product: [
      {
        company: "小红书",
        position: "产品经理",
        salary: "20-35k",
        description: "用户增长与体验优化，数据分析与A/B测试能力。",
        source: "boss",
      },
      {
        company: "滴滴",
        position: "高级产品经理",
        salary: "25-40k",
        description: "复杂业务流程设计，跨团队协作推进。",
        source: "lagou",
      },
    ],
    data: [
      {
        company: "百度",
        position: "数据分析师",
        salary: "20-35k",
        description: "业务指标体系与分析建模，SQL与可视化能力。",
        source: "boss",
      },
      {
        company: "京东",
        position: "数据工程师",
        salary: "25-40k",
        description: "数据仓库建设与ETL优化，熟悉Spark/Hive。",
        source: "lagou",
      },
    ],
    design: [
      {
        company: "网易",
        position: "UI/UX设计师",
        salary: "18-30k",
        description: "产品体验设计与用户研究，能独立输出高保真方案。",
        source: "boss",
      },
      {
        company: "快手",
        position: "资深交互设计师",
        salary: "20-35k",
        description: "多端交互设计与体验优化，推动设计落地。",
        source: "lagou",
      },
    ],
    chef: [
      {
        company: "连锁餐饮集团",
        position: "厨师",
        salary: "8-15k",
        description: "负责热菜出品与菜单执行，熟悉厨房流程与食品安全。",
        source: "boss",
      },
      {
        company: "高端酒店",
        position: "西餐厨师",
        salary: "10-18k",
        description: "负责西餐出品与摆盘，注重品质与出餐效率。",
        source: "lagou",
      },
    ],
    doctor: [
      {
        company: "三甲医院",
        position: "内科医生",
        salary: "15-30k",
        description: "负责门诊与病房诊疗，参与病例讨论与治疗方案制定。",
        source: "boss",
      },
      {
        company: "综合医院",
        position: "外科医生",
        salary: "18-35k",
        description: "参与手术与术后管理，重视规范化诊疗流程。",
        source: "lagou",
      },
      {
        company: "专科医院",
        position: "口腔医生",
        salary: "12-28k",
        description: "提供口腔诊疗服务，注重患者沟通与服务体验。",
        source: "boss",
      },
    ],
    nurse: [
      {
        company: "三甲医院",
        position: "护士",
        salary: "8-15k",
        description: "负责病区护理与医嘱执行，协助医生进行诊疗。",
        source: "boss",
      },
      {
        company: "社区医院",
        position: "护理人员",
        salary: "6-12k",
        description: "提供基础护理与健康宣教，注重服务与规范操作。",
        source: "lagou",
      },
      {
        company: "康复医院",
        position: "康复护士",
        salary: "7-13k",
        description: "负责康复护理与康复训练协助，关注患者恢复。",
        source: "boss",
      },
    ],
  };

  const matchKey =
    roleHint.includes("前端") || roleHint.includes("frontend") || roleHint.includes("react") || roleHint.includes("vue")
      ? "frontend"
      : roleHint.includes("后端") || roleHint.includes("后段") || roleHint.includes("backend") || roleHint.includes("java") || roleHint.includes("go")
      ? "backend"
      : roleHint.includes("产品") || roleHint.includes("product")
      ? "product"
      : roleHint.includes("数据") || roleHint.includes("data") || roleHint.includes("sql")
      ? "data"
      : roleHint.includes("设计") || roleHint.includes("ux") || roleHint.includes("ui")
      ? "design"
      : roleHint.includes("厨师") || roleHint.includes("餐饮") || roleHint.includes("厨房")
      ? "chef"
      : roleHint.includes("医生") || roleHint.includes("医师") || roleHint.includes("医疗") || roleHint.includes("临床")
      ? "doctor"
      : roleHint.includes("护士") || roleHint.includes("护理")
      ? "nurse"
      : "";

  if (!matchKey || !presets[matchKey]) {
    return [];
  }

  return buildPresetJobs(matchKey, presets[matchKey], 20, city);
};

const buildPresetJobs = (
  matchKey: string,
  baseJobs: Array<{
    company: string;
    position: string;
    salary: string;
    description: string;
    source: "boss" | "lagou" | "manual";
    link?: string;
  }>,
  count: number,
  city: string
) => {
  const results = [] as Array<{
    id: string;
    company: string;
    position: string;
    salary: string;
    location: string;
    description: string;
    source: "boss" | "lagou" | "manual";
    postedDate: string;
    link: string;
  }>;

  for (let i = 0; i < count; i += 1) {
    const base = baseJobs[i % baseJobs.length];
    results.push({
      id: `preset-${matchKey}-${Date.now()}-${i + 1}`,
      company: base.company,
      position: base.position,
      salary: base.salary,
      location: city,
      description: base.description,
      source: base.source,
      postedDate: new Date().toLocaleDateString("zh-CN"),
      link: base.link || "https://www.zhipin.com/",
    });
  }

  return results;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skillsParam = searchParams.get("skills");
  const targetRole = searchParams.get("targetRole");
  const location = searchParams.get("location");

  const userProfile = {
    skills: skillsParam ? skillsParam.split(",") : undefined,
    targetRole: targetRole || undefined,
    location: location || undefined,
  };

  const jobs = await generateRecommendedJobs(userProfile);

  return NextResponse.json({
    success: true,
    jobs,
    count: jobs.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobs = await generateRecommendedJobs(body);

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error("Error in recommended-jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate recommended jobs" },
      { status: 500 }
    );
  }
}
