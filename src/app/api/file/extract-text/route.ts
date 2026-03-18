/**
 * 文件文本提取 API 端点
 * POST /api/file/extract-text
 * 接受上传的文件并提取文本内容
 * 支持格式：PDF, TXT, MD, DOC 等
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// 缓存 PDFParse 类
let cachedPDFParse: any = null;
let workerConfigured = false;

function getPDFParse() {
  if (cachedPDFParse) {
    return cachedPDFParse;
  }

  try {
    console.log("🔍 尝试通过 require 导入 pdf-parse...");
    // 使用 require 而不是动态 import
    const pdfModule = require("pdf-parse");
    console.log("✅ pdf-parse 模块导入成功");
    console.log("📦 导入对象 keys:", Object.keys(pdfModule).slice(0, 5));

    // 获取 PDFParse 类
    const PDFParse = pdfModule.PDFParse;
    console.log("📦 PDFParse 类型:", typeof PDFParse);

    if (!PDFParse) {
      console.error("❌ PDFParse 类未找到");
      return null;
    }

    // 配置 worker
    if (PDFParse.setWorker && !workerConfigured) {
      try {
        console.log("⚙️ 配置 Worker...");
        const nodeModulesPath = path.resolve(__dirname, "../../../../../../node_modules");
        const workerPath = path.join(nodeModulesPath, "pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs");

        console.log(`📍 Worker 路径: ${workerPath}`);

        if (fs.existsSync(workerPath)) {
          console.log("✅ Worker 文件找到，正在设置...");
          PDFParse.setWorker(workerPath);
          console.log("✅ Worker 已设置");
          workerConfigured = true;
        } else {
          console.warn(`⚠️ Worker 文件未找到: ${workerPath}`);
        }
      } catch (e) {
        console.warn("⚠️ Worker 配置出错:", e instanceof Error ? e.message : e);
      }
    }

    cachedPDFParse = PDFParse;
    console.log("✅ PDFParse 缓存已设置");
    return PDFParse;
  } catch (e) {
    console.error("❌ require pdf-parse 失败:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * 从 PDF 缓冲区中提取文本
 */
async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  try {
    const PDFParse = getPDFParse();

    if (!PDFParse) {
      throw new Error("PDF 解析库加载失败，请检查依赖是否正确安装");
    }

    console.log("📖 开始解析 PDF...");

    // 创建 PDFParse 实例并传入 buffer
    const parser = new PDFParse({ data: buffer });
    console.log("✅ PDFParse 实例创建成功");

    // 调用 getText() 方法获取文本
    const result = await parser.getText();
    console.log(`📊 PDF 页数: ${result.pages?.length || '未知'}`);

    let fullText = result.text || result.version || "";

    // 如果没有文本，尝试从页面数据获取
    if (!fullText || fullText.trim().length === 0) {
      console.warn("⚠️ result.text 为空，尝试从页面数组提取...");

      if (result.pages && Array.isArray(result.pages)) {
        console.log(`📄 尝试从 ${result.pages.length} 页数据提取文本...`);
        fullText = result.pages
          .map((page: any) => {
            if (typeof page === "string") return page;
            if (page.text) return page.text;
            if (page.content) return page.content;
            return "";
          })
          .join("\n");
      }
    }

    // 最后的诊断信息
    console.log(`✅ PDF 解析完成: 提取 ${fullText?.length || 0} 个字符`);

    if (!fullText || fullText.trim().length === 0) {
      console.warn("⚠️ ️无法从 PDF 提取文本");
      throw new Error(
        "PDF 可能是扫描件或加密文件。请尝试：\n1. 用其他 PDF 阅读器验证文件是否正常\n2. 尝试 export 为新 PDF\n3. 手动复制文本内容"
      );
    }

    await parser.destroy();
    return fullText.trim();
  } catch (error) {
    console.error("❌ PDF 解析失败:", error);

    const errorMsg = error instanceof Error ? error.message : "未知错误";

    // 提供针对性的错误消息
    if (errorMsg.includes("password")) {
      throw new Error("PDF 受密码保护，请先移除密码");
    }
    if (errorMsg.includes("Invalid") || errorMsg.includes("Corrupt")) {
      throw new Error("PDF 文件可能已损坏，请检查文件完整性");
    }

    // 通用错误
    throw new Error(`PDF 解析错误: ${errorMsg}`);
  }
}

/**
 * 从纯文本缓冲区中提取文本
 */
function extractTextFromTextBuffer(buffer: Buffer): string {
  // 尝试不同的编码方式
  const encodings = ["utf8", "latin1", "gbk"] as BufferEncoding[];

  for (const encoding of encodings) {
    try {
      const text = buffer.toString(encoding);
      // 检查是否包含有效的字符
      if (text.length > 0 && text.match(/[\u4e00-\u9fff\w]/)) {
        return text;
      }
    } catch (e) {
      // 继续尝试下一个编码
    }
  }

  // 默认 UTF-8
  return buffer.toString("utf8");
}

/**
 * 处理文件上传请求
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "未找到文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileName = file.name.toLowerCase();
    const fileMime = file.type;
    const isPDF = fileName.endsWith(".pdf") || fileMime === "application/pdf";
    const isText =
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileMime.startsWith("text/");

    if (!isPDF && !isText) {
      return NextResponse.json(
        {
          error: `仅支持 PDF、TXT、MD 格式，不支持 ${
            file.name.split(".").pop() || "该格式"
          }`,
        },
        { status: 400 }
      );
    }

    // 检查文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件过大，请上传小于 10MB 的文件" },
        { status: 400 }
      );
    }

    // 转换文件为 Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = "";

    if (isPDF) {
      console.log(`📄 正在识别 PDF 文件: ${file.name}`);
      extractedText = await extractTextFromPDFBuffer(buffer);
    } else {
      console.log(`📄 正在读取文本文件: ${file.name}`);
      extractedText = extractTextFromTextBuffer(buffer);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.warn("⚠️ 无法从文件提取到文本");
      
      // 返回更详细的错误信息帮助用户诊断
      const isPDF = file.name.toLowerCase().endsWith(".pdf");
      const errorMsg = isPDF 
        ? "该 PDF 可能是扫描件、已加密或文件格式不标准。\n\n尝试解决方案:\n1. 用 Adobe Reader 打开确认\n2. Export 重新生成 PDF\n3. 手动复制文本内容"
        : "文件可能为空或格式不兼容";
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    // 清理提取的文本
    const cleanedText = extractedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    return NextResponse.json(
      {
        success: true,
        text: cleanedText,
        fileName: file.name,
        fileSize: file.size,
        extractedChars: cleanedText.length,
        message: `✅ 成功识别 ${file.name}，提取 ${cleanedText.length} 个字符`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("文件处理错误:", error);

    let errorMsg = error instanceof Error ? error.message : "未知错误";
    let details = "请检查文件是否完整";

    // 针对不同错误提供具体信息
    if (errorMsg.includes("Invalid") || errorMsg.includes("invalid")) {
      errorMsg = "PDF 文件格式无效或已损坏";
      details = "请尝试用 Adobe Reader 打开验证";
    } else if (errorMsg.includes("Corrupt") || errorMsg.includes("corrupt")) {
      errorMsg = "PDF 文件可能已损坏";
      details = "请检查文件是否完整，或重新导出 PDF";
    } else if (errorMsg.includes("password")) {
      errorMsg = "PDF 受密码保护";
      details = "请先用 Adobe Reader 移除密码";
    } else if (errorMsg.includes("扫描件") || errorMsg.includes("OCR")) {
      errorMsg = "PDF 为扫描件或加密格式";
      details = "目前不支持扫描件自动识别，请手动复制文本或等待 OCR 功能";
    }

    return NextResponse.json(
      {
        error: errorMsg,
        details: details,
      },
      { status: 500 }
    );
  }
}
