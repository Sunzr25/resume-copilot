import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 预设的常见公司面经题库（热门企业）
const PRESET_INTERVIEWS: Record<string, Array<{
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  frequency: number;
}>> = {
  "字节跳动": [
    {
      question: "介绍一下React的生命周期和Hooks的优势",
      answer: "React 16.8之前使用类组件的生命周期（挂载、更新、卸载）。Hooks提供了函数式编程方式，useState、useEffect等简化了状态管理和副作用处理，提高了代码复用率。",
      difficulty: "medium",
      frequency: 5
    },
    {
      question: "Promise.all和Promise.race的区别？",
      answer: "Promise.all等待所有Promise完成或任一失败，Promise.race返回首个完成或失败的结果。all用于并行执行等待все完成，race用于超时控制。",
      difficulty: "medium",
      frequency: 4
    },
    {
      question: "TypeScript中的泛型如何使用？",
      answer: "泛型是类型的占位符，使用<T>表示。可用于函数、类、接口，提高代码复用性并保持类型安全性。",
      difficulty: "easy",
      frequency: 4
    },
    {
      question: "如何优化大列表的渲染性能？",
      answer: "使用虚拟滚动、React.memo、useMemo、分页加载等技术。字节系产品广泛使用虚拟列表方案处理数百万数据。",
      difficulty: "hard",
      frequency: 5
    }
  ],
  "阿里巴巴": [
    {
      question: "讲一下Redux的工作原理和中间件机制",
      answer: "Redux通过单一统一的Store管理应用状态。action→reducer→state的单向数据流。中间件可在action dispatch和reducer处理间截获，如redux-thunk。",
      difficulty: "medium",
      frequency: 5
    },
    {
      question: "浏览器缓存策略有哪些？",
      answer: "强制缓存（Expires、Cache-Control）和协商缓存（ETag、Last-Modified）。CDN配合浏览器缓存可显著提升传输性能。",
      difficulty: "medium",
      frequency: 4
    },
    {
      question: "如何设计一个高并发秒杀系统？",
      answer: "前端限流、库存预热、消息队列削峰、数据库加锁、Cache预热等多层防护。",
      difficulty: "hard",
      frequency: 5
    }
  ],
  "腾讯": [
    {
      question: "WebSocket和HTTP轮询的区别？",
      answer: "WebSocket是双向全双工通信协议，适合实时应用。HTTP轮询是单向的反复请求。WebSocket性能更优，延迟更低。",
      difficulty: "medium",
      frequency: 4
    },
    {
      question: "讲讲Vue3的响应式原理",
      answer: "Vue3使用Proxy进行深层响应式追踪，相比Vue2的Object.defineProperty性能更优，支持对象新增属性监听。",
      difficulty: "hard",
      frequency: 4
    }
  ],
  "美团": [
    {
      question: "讲讲MVC、MVP和MVVM的区别",
      answer: "MVC：Model-View-Controller直接关联。MVP：Presenter负责逻辑，View和Model完全分离。MVVM：ViewModel自动绑定，减少业务代码。",
      difficulty: "medium",
      frequency: 3
    }
  ],
  "滴滴": [
    {
      question: "如何设计地理位置查询和实时定位系统？",
      answer: "GIS库（LOD四叉树）、Redis GEO、Kafka流处理。定期同步位置、GEO Hash索引范围查询、WebSocket推送更新。",
      difficulty: "hard",
      frequency: 4
    }
  ]
};

/**
 * GET /api/recruitment/jobs/{jobId}/interviews?company=公司名
 * 获取某个职位的所有面经
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const { searchParams } = new URL(request.url);
    const companyParam = searchParams.get("company");

    // 先查询数据库中的真实面经
    let interviews = await prisma.crawledInterview.findMany({
      where: { jobId },
      orderBy: {
        frequency: "desc"  // 按热度排序
      }
    });

    // 如果数据库无数据，尝试从查询参数或jobId中解析公司名并返回预设数据
    if (interviews.length === 0) {
      // 优先使用查询参数中的公司名
      let companyName = companyParam;
      
      if (!companyName) {
        // 如果没有查询参数，尝试从jobId中提取
        companyName = extractCompanyName(jobId);
      }
      
      if (companyName && PRESET_INTERVIEWS[companyName]) {
        // 返回预设面经
        const presetData = PRESET_INTERVIEWS[companyName];
        return NextResponse.json({
          success: true,
          interviews: presetData.map((item, idx) => ({
            id: `${jobId}-preset-${idx}`,
            jobId,
            question: item.question,
            answer: item.answer,
            difficulty: item.difficulty,
            frequency: item.frequency,
            createdAt: new Date()
          })),
          total: presetData.length,
          isPreset: true,
        });
      }

      return NextResponse.json({
        success: true,
        interviews: [],
        message: "该职位暂无面经数据",
      });
    }

    return NextResponse.json({
      success: true,
      interviews,
      total: interviews.length,
    });
  } catch (error) {
    console.error("获取面经失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取失败",
      },
      { status: 500 }
    );
  }
}

// 从jobId中提取公司名（简单启发式）
function extractCompanyName(jobId: string): string | null {
  // jobId 格式可能是 "job-xxxx-1" 或其他
  // 这里尝试多种方式识别公司名
  const keywords = Object.keys(PRESET_INTERVIEWS);
  
  for (const keyword of keywords) {
    if (jobId.includes(keyword) || jobId.includes(keyword.substring(0, 2))) {
      return keyword;
    }
  }
  
  return null;
}

/**
 * POST /api/recruitment/jobs/{jobId}/interviews
 * 由 OpenClaw Webhook 调用，添加面经
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body = await request.json();
    const {
      company,
      position,
      question,
      answer,
      difficulty,
      frequency,
      source,
      sourceUrl,
    } = body;

    // 验证职位是否存在
    const job = await prisma.crawledJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "职位不存在" },
        { status: 404 }
      );
    }

    const interview = await prisma.crawledInterview.create({
      data: {
        jobId,
        company: company || job.company,
        position: position || job.position,
        question,
        answer: answer || "",
        difficulty: difficulty || "medium",
        frequency: frequency || 1,
        source: source || "unknown",
        sourceUrl: sourceUrl || "",
      },
    });

    return NextResponse.json(
      { success: true, interview },
      { status: 201 }
    );
  } catch (error) {
    console.error("添加面经失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "添加失败",
      },
      { status: 500 }
    );
  }
}
