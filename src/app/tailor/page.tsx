"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  FileText,
  HelpCircle,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Target,
  Shield,
  Code2,
  Download,
  Copy,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import type { TailorResult } from "@/lib/schemas/tailor";
import { generateTailoredResumeLatex } from "@/lib/latex";

const JD_PLACEHOLDER = `我要找：前端工程师

期望的公司：科技公司 / 互联网公司

岗位要求：
• 3-5 年前端开发经验
• 精通 React/Vue/Angular 等现代框架
• 深入理解 JavaScript 和 TypeScript
• 有 Web 性能优化经验
• 了解模块化和组件化开发

我能提供的：
• 5 年 React 全栈开发经验
• TypeScript 和现代前端工具链
• 性能优化和 SEO 经验
• 组件库和设计系统经验`;

export default function TailorPage() {
  const [jdText, setJdText] = useState("");
  const [customResume, setCustomResume] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [selectedSkillsForJD, setSelectedSkillsForJD] = useState<Set<string>>(
    new Set()
  );
  const [skillHistory, setSkillHistory] = useState<
    Array<{ skill: string; usedCount: number; lastUsed: string }>
  >([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // 从 localStorage 恢复数据
  useEffect(() => {
    const savedJd = localStorage.getItem("tailor_jd");
    const savedResume = localStorage.getItem("tailor_custom_resume");
    const savedResult = localStorage.getItem("tailor_result");
    const savedSelectedSkills = localStorage.getItem(
      "tailor_selected_skills"
    );

    if (savedJd) setJdText(savedJd);
    if (savedResume) setCustomResume(savedResume);
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (e) {
        console.error("Failed to restore result:", e);
      }
    }
    if (savedSelectedSkills) {
      try {
        setSelectedSkillsForJD(new Set(JSON.parse(savedSelectedSkills)));
      } catch (e) {
        console.error("Failed to restore selected skills:", e);
      }
    }

    // 加载履历库中的技能
    loadProfileSkills();
  }, []);

  // 加载履历库的技能
  const loadProfileSkills = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.skills)) {
          setAvailableSkills(data.skills);
        }
      }
    } catch (error) {
      console.error("加载履历库技能失败:", error);
    }
  };

  // 加载技能历史
  useEffect(() => {
    loadSkillHistory();
  }, []);

  const loadSkillHistory = async () => {
    try {
      const res = await fetch("/api/profile/skill-history");
      if (res.ok) {
        const data = await res.json();
        if (data.skills) {
          setSkillHistory(data.skills);
        }
      }
    } catch (error) {
      console.error("加载技能历史失败:", error);
    }
  };

  // 自动保存 JD 到 localStorage
  useEffect(() => {
    localStorage.setItem("tailor_jd", jdText);
    // 派发自定义事件通知其他页面
    window.dispatchEvent(new CustomEvent("tailorDataUpdated", { detail: { key: "tailor_jd" } }));
  }, [jdText]);

  // 自动保存自定义简历到 localStorage
  useEffect(() => {
    localStorage.setItem("tailor_custom_resume", customResume);
    // 派发自定义事件通知其他页面
    window.dispatchEvent(new CustomEvent("tailorDataUpdated", { detail: { key: "tailor_custom_resume" } }));
  }, [customResume]);

  // 自动保存选中的技能到 localStorage
  useEffect(() => {
    localStorage.setItem(
      "tailor_selected_skills",
      JSON.stringify(Array.from(selectedSkillsForJD))
    );
    // 派发自定义事件通知其他页面
    window.dispatchEvent(new CustomEvent("tailorDataUpdated", { detail: { key: "tailor_selected_skills" } }));
  }, [selectedSkillsForJD]);

  // 自动保存结果到 localStorage
  useEffect(() => {
    if (result) {
      localStorage.setItem("tailor_result", JSON.stringify(result));
    }
  }, [result]);

  const latexCode = result ? generateTailoredResumeLatex(result, jdText) : "";

  // 获取用户 Profile 数据或使用自定义简历
  const getProfileData = async () => {
    // 如果用户上传了自定义简历，优先使用
    if (customResume.trim()) {
      return {
        name: "用户简历",
        email: "",
        phone: "",
        skills: [],
        projects: [],
        summary: customResume,
      };
    }

    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.error("获取 Profile 失败:", e);
    }
    return null;
  };

  const handleGenerate = async () => {
    if (!jdText.trim()) {
      setError("请输入职位要求信息");
      return;
    }

    setIsGenerating(true);
    setError("");
    setStatusMessage("正在加载个人信息...");

    try {
      // 获取用户 Profile 或自定义简历
      const profileData = await getProfileData();
      const masterProfile = profileData
        ? JSON.stringify(profileData, null, 2)
        : "未填写个人信息";

      setStatusMessage("正在分析 JD 和匹配技能...");

      // 调用 AI API（增加 5 分钟超时）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetJd: jdText,
          masterProfile: masterProfile,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 504) {
          throw new Error(
            "生成耗时较长（AI 正在深度分析），请稍后重试或尝试更简短的信息"
          );
        } else if (res.status === 429) {
          throw new Error(
            "API 额度已用尽，请检查 Kimi 账户余额或等待额度恢复"
          );
        }
        throw new Error(data.error || "生成失败");
      }

      setStatusMessage("正在生成简历...");
      const data: TailorResult = await res.json();
      setResult(data);
      setStatusMessage("生成完成！");
      // 派发事件通知recruitment页面更新推荐职位
      window.dispatchEvent(new CustomEvent("tailorDataUpdated", { detail: { key: "tailor_result" } }));
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("请求超时，AI 生成耗时过长，请稍后重试");
      } else {
        setError(e instanceof Error ? e.message : "请求失败，请重试");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadLatex = () => {
    if (!latexCode) return;

    const blob = new Blob([latexCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-copilot-tailored-resume.tex";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopyLatex = async () => {
    if (!latexCode) return;

    await navigator.clipboard.writeText(latexCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 显示加载状态
    const originalValue = customResume;
    setCustomResume("⏳ 正在识别文件内容...");

    try {
      // 使用后端 API 解析文件
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/file/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "文件解析失败";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setCustomResume(data.text || "");
      setShowResumeUpload(false);

      // 显示成功提示
      console.log(`✅ 成功识别 ${file.name}`);
    } catch (error) {
      console.error("文件解析错误:", error);
      setCustomResume(originalValue);
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      
      // 根据错误类型提供不同的建议
      let suggestion = "请尝试:\n1. 确保是有效的 PDF/TXT/MD 文件\n2. 手动复制文本内容到框中\n3. 用 Adobe Reader 打开验证文件是否正常";
      
      if (errorMsg.includes("密码")) {
        suggestion = "该 PDF 受密码保护\n\n请尝试:\n1. 用 Adobe Reader 打开\n2. 移除密码\n3. 重新上传";
      } else if (errorMsg.includes("扫描件") || errorMsg.includes("加密")) {
        suggestion = "该文件可能是扫描件或加密\n\n请尝试:\n1. 确认文件是否为纯文本 PDF\n2. 或手动复制文本内容\n3. OCR 功能计划中";
      } else if (errorMsg.includes("损坏")) {
        suggestion = "文件可能已损坏\n\n请尝试:\n1. 检查文件完整性\n2. 用其他应用打开验证\n3. 重新导出 PDF";
      } else if (errorMsg.includes("编码") || errorMsg.includes("乱码")) {
        suggestion = "文件编码不兼容\n\n请尝试:\n1. 用记事本打开\n2. 另存为 UTF-8 编码\n3. 重新上传";
      }
      
      alert(
        `❌ 无法解析该文件\n\n错误: ${errorMsg}\n\n${suggestion}`
      );
    }
  };

  const handleResetResume = () => {
    setCustomResume("");
    localStorage.removeItem("tailor_custom_resume");
  };

  const handleClearAll = () => {
    if (confirm("确定要清空所有数据（JD、简历和生成结果）吗？")) {
      setJdText("");
      setCustomResume("");
      setResult(null);
      setSelectedSkillsForJD(new Set());
      localStorage.removeItem("tailor_jd");
      localStorage.removeItem("tailor_custom_resume");
      localStorage.removeItem("tailor_result");
      localStorage.removeItem("tailor_selected_skills");
    }
  };

  const toggleSkillForJD = (skill: string) => {
    setSelectedSkillsForJD((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) {
        next.delete(skill);
      } else {
        next.add(skill);
        // 保存到技能历史
        saveSkillToHistory(skill);
      }
      return next;
    });
  };

  // 保存技能到历史
  const saveSkillToHistory = async (skill: string) => {
    try {
      await fetch("/api/profile/skill-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill }),
      });
      // 重新加载历史
      loadSkillHistory();
    } catch (error) {
      console.error("保存技能失败:", error);
    }
  };

  // 添加新技能
  const addNewSkill = async () => {
    const skillToAdd = newSkillInput.trim();
    if (!skillToAdd) return;

    await saveSkillToHistory(skillToAdd);
    setNewSkillInput("");
  };

  const addSelectedSkillsToJD = () => {
    if (selectedSkillsForJD.size === 0) {
      setStatusMessage("请先选择技能");
      setTimeout(() => setStatusMessage(""), 2000);
      return;
    }

    const skillsText = Array.from(selectedSkillsForJD).join("、");
    const addition = `✅ 我已具备的技能：${skillsText}`;

    const newJD = jdText.trim()
      ? `${jdText}\n\n## 我已具备的技能\n${skillsText}`
      : addition;

    setJdText(newJD);
    setSelectedSkillsForJD(new Set());
    setStatusMessage("技能已添加到职位要求");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">AI 定制工作台</h1>
        <p className="text-sm text-muted-foreground">
          粘贴职位要求和简历内容，AI 智能匹配并生成定制简历和面试预测
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 左栏：JD 输入和简历上传（占 2 列） */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Target className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base">职位要求</CardTitle>
                  <CardDescription>
                    描述目标职位和期望
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={JD_PLACEHOLDER}
                rows={16}
                className="resize-none text-[13px]"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
              {statusMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {statusMessage}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button
                className={`w-full shadow-sm shadow-indigo-500/20 ${
                  !jdText.trim() || isGenerating
                    ? "bg-slate-200 text-slate-500 hover:bg-slate-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                size="lg"
                onClick={handleGenerate}
                disabled={!jdText.trim() || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isGenerating && statusMessage
                  ? statusMessage
                  : !isGenerating && result
                  ? "已生成，刷新可重新生成"
                  : "生成定制简历"}
              </Button>
            </CardContent>
          </Card>

          {/* 简历输入卡片 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base">个人简历</CardTitle>
                  <CardDescription>
                    粘贴你的简历内容
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="在这里粘贴你的简历内容（支持文本格式）..."
                rows={12}
                className="resize-none text-[12px]"
                value={customResume}
                onChange={(e) => setCustomResume(e.target.value)}
              />
              {customResume && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <Check className="h-4 w-4" />
                  已加载 {customResume.length} 字符的简历
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetResume}
                disabled={!customResume}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                清空简历，使用履历库
              </Button>
              <p className="text-xs text-muted-foreground">
                💡 如果不粘贴简历，将使用配置的个人信息进行匹配
              </p>
            </CardContent>
          </Card>

          {/* 技能库卡片 */}
          {availableSkills.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Code2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">我的技能库</CardTitle>
                    <CardDescription>
                      从履历库中已有的 {availableSkills.length} 项技能
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant={
                        selectedSkillsForJD.has(skill) ? "default" : "outline"
                      }
                      className={`cursor-pointer transition ${
                        selectedSkillsForJD.has(skill)
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "hover:border-purple-400"
                      }`}
                      onClick={() => toggleSkillForJD(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>

                {selectedSkillsForJD.size > 0 && (
                  <div className="space-y-2 rounded-lg bg-purple-50 p-3">
                    <p className="text-xs font-medium text-purple-900">
                      已选择 {selectedSkillsForJD.size} 项技能
                    </p>
                    <Button
                      size="sm"
                      onClick={addSelectedSkillsToJD}
                      className="w-full shadow-sm shadow-purple-500/20"
                    >
                      添加到职位要求
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  💡 点击技能标签选择，然后一键添加到职位要求中，让 AI
                  更清楚理解你已具备的条件
                </p>
              </CardContent>
            </Card>
          )}

          {/* 控制按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              清空所有
            </Button>
          </div>

          {/* 技能历史卡片 */}
          <Card className="shadow-sm border-blue-100/50">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Code2 className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">技能历史</CardTitle>
                  <CardDescription>
                    你填写过的技能记录，共 {skillHistory.length} 项
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 添加新技能 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="输入新技能..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewSkill()}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
                <Button
                  size="sm"
                  onClick={addNewSkill}
                  className="shadow-sm shadow-blue-500/20"
                >
                  添加
                </Button>
              </div>

              {/* 技能卡片列表 */}
              {skillHistory.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {skillHistory.map((item) => (
                    <div
                      key={item.skill}
                      onClick={() => {
                        setSelectedSkillsForJD((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.skill)) {
                            next.delete(item.skill);
                          } else {
                            next.add(item.skill);
                          }
                          return next;
                        });
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                        selectedSkillsForJD.has(item.skill)
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="text-sm font-medium">{item.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        用过 {item.usedCount} 次
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  还没有技能记录，添加一项新技能或从上面的技能库中选择
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右栏：结果预览（占 3 列） */}
        <div className="space-y-4 lg:col-span-3">
          {/* 定制简历预览 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base">定制简历预览</CardTitle>
                  <CardDescription>
                    AI 为你量身裁剪的简历结构
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Wand2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      等待生成
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      在左侧输入 JD 后点击生成按钮
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 定制摘要 */}
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-1 w-1 rounded-full bg-indigo-500" />
                      定制自我介绍
                    </h3>
                    <div className="rounded-lg bg-indigo-50/50 p-4">
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {result.tailoredSummary}
                      </p>
                    </div>
                  </div>

                  {/* 匹配技能 */}
                  <div className="space-y-2.5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Code2 className="h-3.5 w-3.5 text-emerald-600" />
                      匹配技能
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 精选项目 */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-1 w-1 rounded-full bg-amber-500" />
                      精选项目经历
                    </h3>
                    {result.selectedProjects.map((proj, pi) => (
                      <div
                        key={proj.projectName}
                        className="rounded-xl border bg-card p-4 shadow-sm"
                      >
                        <div className="mb-3 flex items-center gap-2.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-600">
                            {pi + 1}
                          </div>
                          <span className="text-sm font-semibold">
                            {proj.projectName}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px]"
                          >
                            {proj.role}
                          </Badge>
                        </div>
                        <ul className="space-y-1.5 pl-1">
                          {proj.tailoredBullets.map((bullet, bi) => (
                            <li
                              key={bi}
                              className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-sm font-semibold">导出选项</p>
                        <p className="text-xs text-muted-foreground">
                          选择导出格式继续排版或应用
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyLatex}
                          className="flex-1"
                        >
                          {copied ? (
                            <Check className="mr-1.5 h-4 w-4" />
                          ) : (
                            <Copy className="mr-1.5 h-4 w-4" />
                          )}
                          {copied ? "已复制代码" : "复制 LaTeX"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleDownloadLatex}
                          className="flex-1"
                        >
                          <Download className="mr-1.5 h-4 w-4" />
                          下载 .tex
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        💡 使用 Overleaf 或 XeLaTeX 编译成 PDF
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 面试预测 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base">面试预测</CardTitle>
                  <CardDescription>
                    基于简历与 JD 的匹配分析
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!result?.interviewPreparation ? (
                <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    生成简历后自动预测面试问题
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* 高频题 */}
                  <div className="space-y-2.5">
                    <h4 className="flex items-center gap-2 text-xs font-semibold">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-700">
                        高频面试题 — 你的强项
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {result.interviewPreparation.highFrequencyQuestions.map(
                        (q, i) => (
                          <div
                            key={i}
                            className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                              {i + 1}
                            </span>
                            <span className="text-sm text-emerald-900">
                              {q}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* 压力测试题 */}
                  <div className="space-y-2.5">
                    <h4 className="flex items-center gap-2 text-xs font-semibold">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-amber-700">
                        压力测试题 — 需要准备
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {result.interviewPreparation.weaknessQuestions.map(
                        (q, i) => (
                          <div
                            key={i}
                            className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                              {i + 1}
                            </span>
                            <span className="text-sm text-amber-900">{q}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* 面试策略 */}
                  <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-700">
                        面试策略建议
                      </p>
                      <p className="mt-1 text-sm text-indigo-900/70">
                        {result.interviewPreparation.tips}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
