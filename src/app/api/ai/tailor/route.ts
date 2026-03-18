import { NextRequest, NextResponse } from "next/server";
import {
  tailorResultSchema,
  tailorRequestSchema,
  type TailorResult,
} from "@/lib/schemas/tailor";

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const TAILOR_SYSTEM_PROMPT = `你是一个资深的招聘顾问和求职导师。根据用户的履历和目标职位 JD，生成定制化的简历结构和面试题目。

重要规则：
1. 不捏造用户没有的经历和技能
2. 使用 STAR 法则重新组织经历描述
3. 最多选 3 个最匹配的项目
4. 生成 3 个高频面试题和 2 个可能的压力测试题
5. 提供 1 句面试策略建议
6. 全部用中文，技术词汇用英文

请返回一个 JSON 对象，格式如下：
{
  "tailoredSummary": "100字左右的优势总结",
  "matchedSkills": ["技能1", "技能2"],
  "selectedProjects": [
    {
      "projectName": "项目名称",
      "role": "你的角色",
      "tailoredBullets": ["描述1", "描述2"]
    }
  ],
  "interviewPreparation": {
    "highFrequencyQuestions": ["问题1", "问题2", "问题3"],
    "weaknessQuestions": ["问题1", "问题2"],
    "tips": "面试建议建议"
  }
}`;

// ---------------------------------------------------------------------------
// 调用 Kimi API 的函数
// ---------------------------------------------------------------------------

async function callKimiAPI(prompt: string, system: string, signal?: AbortSignal) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.moonshot.cn/v1";
  const model = process.env.OPENAI_MODEL || "moonshot-v1-8k";

  console.log(`[tailor] 调用 Kimi API: ${baseUrl}/chat/completions`);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      top_p: 0.8,
      max_tokens: 4000,
    }),
    signal,
  });

  if (!response.ok) {
    const data = await response.json();
    console.error("[tailor] Kimi API 错误:", data);
    throw new Error(data.error?.message || `API 错误: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";
  console.log("[tailor] 收到 AI 响应");
  return content;
}

// ---------------------------------------------------------------------------
// 将 MasterProfile 组装为 user prompt
// ---------------------------------------------------------------------------

function buildUserPrompt(masterProfile: string, targetJd: string): string {
  return `## 📋 我的全量履历库和技能

${masterProfile}

---

## 🎯 目标岗位 JD

${targetJd}

---

## 📝 任务

请根据以上信息，为我生成一份**高度匹配目标岗位**的定制化简历结构和面试预测。

**关键要求：**
1. 严格基于我的履历库中的实际经历和技能，不能捏造或过度夸大
2. 优先选择与目标 JD 最相关的技能和项目
3. 重点突出那些能直接满足 JD 需求的实际案例
4. 如果我的履历库中缺少某些 JD 要求的技能，请在建议中提到

请返回前述 JSON 格式的定制化简历结构。`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[tailor] 收到请求");

    const parsed = tailorRequestSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[tailor] 参数校验失败:", parsed.error);
      return NextResponse.json(
        {
          error: "参数校验失败",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { masterProfile, targetJd } = parsed.data;
    console.log("[tailor] 开始调用 AI 模型...");

    // 确保 AbortController 支持
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120 * 1000); // 120 秒超时

    try {
      const userPrompt = buildUserPrompt(masterProfile, targetJd);
      const aiResponse = await callKimiAPI(
        userPrompt,
        TAILOR_SYSTEM_PROMPT,
        controller.signal
      );

      clearTimeout(timeoutId);

      // 解析 JSON 响应
      let result: TailorResult;
      try {
        // 尝试直接解析
        result = JSON.parse(aiResponse);
      } catch {
        // 如果 JSON 在 markdown 代码块中，尝试提取
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("无法解析 AI 响应为 JSON");
        }
      }

      // 验证响应格式
      const validated = tailorResultSchema.safeParse(result);
      if (!validated.success) {
        console.error("[tailor] 响应验证失败:", validated.error);
        throw new Error("AI 生成的数据格式不符合要求");
      }

      console.log("[tailor] AI 生成成功");
      return NextResponse.json(validated.data);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (err) {
    console.error("[tailor] AI generation failed:", err);

    let errorMessage = "AI 生成失败，请稍后重试";
    let statusCode = 500;

    if (err instanceof Error) {
      errorMessage = err.message;

      if (err.name === "AbortError" || err.message.includes("abort")) {
        errorMessage = "生成耗时过长（超过 120 秒），请稍后重试";
        statusCode = 504;
      } else if (err.message.includes("quota") || err.message.includes("额度")) {
        errorMessage = "API 额度已用尽，请检查账户";
        statusCode = 429;
      } else if (err.message.includes("无法解析") || err.message.includes("格式")) {
        errorMessage = "AI 返回格式异常，请重试";
        statusCode = 502;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
