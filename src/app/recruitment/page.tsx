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
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  MapPin,
  Zap,
  Users,
  MessageCircle,
  Plus,
  X,
  Copy,
  Check,
  Star,
  Link2,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  Loader2,
} from "lucide-react";

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

interface InterviewQuestion {
  id: string;
  company: string;
  position: string;
  question: string;
  answer?: string;
  difficulty: "easy" | "medium" | "hard";
  frequency: number;
  tips?: string;
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [interviews, setInterviews] = useState<InterviewQuestion[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedInterview, setSelectedInterview] =
    useState<InterviewQuestion | null>(null);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [editingInterview, setEditingInterview] =
    useState<InterviewQuestion | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"jobs" | "interviews">("jobs");
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedJobs = localStorage.getItem("recruitment_jobs");
    const savedInterviews = localStorage.getItem("recruitment_interviews");

    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    } else {
      // 如果没有保存的职位，添加示例数据
      const sampleJobs: JobPosting[] = [
        {
          id: "1",
          company: "字节跳动",
          position: "前端开发工程师",
          location: "北京",
          salary: "30k-45k",
          description: "负责字节跳动旗下产品的前端开发工作，包括但不限于：\n- React/Vue技术栈应用\n- 性能优化和用户体验提升\n- 跨浏览器兼容性处理\n- 前后端协作和接口联调",
          source: "boss",
          link: "https://www.boss.com",
          postedDate: new Date().toLocaleDateString("zh-CN"),
        },
        {
          id: "2",
          company: "阿里巴巴",
          position: "资深前端工程师",
          location: "杭州",
          salary: "35k-50k",
          description: "参与高并发场景下的前端架构设计，主要职责：\n- 搭建可维护的前端工程体系\n- 优化页面加载速度和运行性能\n- 团队技术建设和代码审查\n- 参与技术分享和文档撰写",
          source: "lagou",
          link: "https://www.lagou.com",
          postedDate: new Date().toLocaleDateString("zh-CN"),
        },
        {
          id: "3",
          company: "腾讯",
          position: "Web前端开发",
          location: "深圳",
          salary: "25k-40k",
          description: "参与腾讯WebOS平台的前端开发工作：\n- 组件库整体构建和维护\n- 跨端适配和响应式设计\n- 移动端Web优化\n- 与设计师和产品团队紧密协作",
          source: "manual",
          postedDate: new Date().toLocaleDateString("zh-CN"),
        },
      ];
      setJobs(sampleJobs);
    }
    
    if (savedInterviews) setInterviews(JSON.parse(savedInterviews));
  }, []);

  // 保存 jobs 到 localStorage
  useEffect(() => {
    localStorage.setItem("recruitment_jobs", JSON.stringify(jobs));
  }, [jobs]);

  // 保存 interviews 到 localStorage
  useEffect(() => {
    localStorage.setItem("recruitment_interviews", JSON.stringify(interviews));
  }, [interviews]);

  const addJob = (job: Omit<JobPosting, "id" | "postedDate">) => {
    const newJob: JobPosting = {
      ...job,
      id: Date.now().toString(),
      postedDate: new Date().toLocaleDateString("zh-CN"),
    };
    setJobs([newJob, ...jobs]);
    setEditingJob(null);
  };

  const updateJob = (job: JobPosting) => {
    setJobs(jobs.map((j) => (j.id === job.id ? job : j)));
    setEditingJob(null);
    setSelectedJob(job);
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter((j) => j.id !== id));
    if (selectedJob?.id === id) setSelectedJob(null);
  };

  const addInterview = (
    interview: Omit<InterviewQuestion, "id">
  ) => {
    const newInterview: InterviewQuestion = {
      ...interview,
      id: Date.now().toString(),
    };
    setInterviews([newInterview, ...interviews]);
    setEditingInterview(null);
  };

  const updateInterview = (interview: InterviewQuestion) => {
    setInterviews(
      interviews.map((i) => (i.id === interview.id ? interview : i))
    );
    setEditingInterview(null);
    setSelectedInterview(interview);
  };

  const deleteInterview = (id: string) => {
    setInterviews(interviews.filter((i) => i.id !== id));
    if (selectedInterview?.id === id) setSelectedInterview(null);
  };

  const handleCopyJob = async (job: JobPosting) => {
    const text = `
${job.company} - ${job.position}
位置: ${job.location}
薪资: ${job.salary}
来源: ${job.source === "boss" ? "BOSS直聘" : job.source === "lagou" ? "拉勾网" : "手动添加"}
链接: ${job.link || "无"}

${job.description}
    `.trim();

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 确认职位选择并加载相关面经
  const confirmSelectJob = async (job: JobPosting) => {
    setSelectedJob(job);
    setIsLoadingInterviews(true);
    
    try {
      // 从API获取该职位相关的面经
      if (job.id) {
        const res = await fetch(
          `/api/recruitment/jobs/${job.id}/interviews?company=${encodeURIComponent(job.company)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.interviews && data.interviews.length > 0) {
            // 添加新面经到列表
            const newInterviews = data.interviews.map(
              (q: any, idx: number) => ({
                id: `${job.id}-q-${idx}`,
                company: job.company,
                position: job.position,
                question: q.question,
                answer: q.answer,
                difficulty: q.difficulty || "medium",
                frequency: q.frequency || 1,
              })
            );
            
            // 合并并去重
            const existingIds = new Set(interviews.map((q) => q.id));
            const uniqueNew = newInterviews.filter(
              (q: any) => !existingIds.has(q.id)
            );
            
            if (uniqueNew.length > 0) {
              setInterviews([...uniqueNew, ...interviews]);
              // 自动切换到面经标签页
              setTab("interviews");
            }
          }
        }
      }
    } catch (error) {
      console.error("加载职位面经失败:", error);
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  // 自动加载推荐职位
  useEffect(() => {
    const loadRecommendedJobs = async () => {
      try {
        // 获取用户 Profile 信息
        const profileRes = await fetch("/api/profile");
        let userProfile = {};
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          userProfile = {
            skills: profileData.skills || [],
            location: profileData.location || "北京",
            targetRole: profileData.targetRole || "工程师",
          };
        }

        // 读取 tailor 页面输入，辅助推荐职位
        let tailorJd = "";
        let tailorResume = "";
        let tailorSkills: string[] = [];
        try {
          tailorJd = localStorage.getItem("tailor_jd") || "";
          tailorResume = localStorage.getItem("tailor_custom_resume") || "";
          const savedSkills = localStorage.getItem("tailor_selected_skills");
          if (savedSkills) {
            const parsed = JSON.parse(savedSkills);
            tailorSkills = Array.isArray(parsed) ? parsed : [];
          }
        } catch (error) {
          console.error("读取tailor输入失败:", error);
        }

        userProfile = {
          ...userProfile,
          jdText: tailorJd,
          resumeText: tailorResume,
          selectedSkills: tailorSkills,
        };

        // 获取推荐职位
        const res = await fetch("/api/recruitment/recommended-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userProfile),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.jobs && data.jobs.length > 0) {
            setJobs(data.jobs);
          }
        }
      } catch (error) {
        console.error("加载推荐职位失败:", error);
      }
    };

    // 页面加载时加载推荐职位
    loadRecommendedJobs();
    
    // 监听来自 tailor 页面的数据更新事件
    const handleTailorUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(`检测到tailor页面更新: ${customEvent.detail?.key}, 重新加载推荐职位...`);
      loadRecommendedJobs();
    };
    
    // 监听 profile 更新事件
    const handleProfileUpdate = (event: Event) => {
      console.log("检测到profile更新，重新加载推荐职位...");
      loadRecommendedJobs();
    };
    
    // 监听 storage 变化（来自其他标签页的更新）
    const handleStorageChange = (event: StorageEvent) => {
      // 当tailor相关的数据更新时，重新加载推荐职位
      const relevantKeys = ["tailor_jd", "tailor_custom_resume", "tailor_selected_skills"];
      if (event.key && relevantKeys.includes(event.key)) {
        console.log(`检测到 ${event.key} 变化，重新加载推荐职位...`);
        loadRecommendedJobs();
      }
    };

    window.addEventListener("tailorDataUpdated", handleTailorUpdate);
    window.addEventListener("profileUpdated", handleProfileUpdate);
    window.addEventListener("storage", handleStorageChange);
    
    // 5 分钟后重新加载一次
    const interval = setInterval(loadRecommendedJobs, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener("tailorDataUpdated", handleTailorUpdate);
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);


  // 统计数据
  const hardInterviews = interviews.filter(i => i.difficulty === "hard").length;
  const mediumInterviews = interviews.filter(i => i.difficulty === "medium").length;
  const easyInterviews = interviews.filter(i => i.difficulty === "easy").length;
  const highFrequencyInterviews = interviews.filter(i => i.frequency >= 4).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">招聘信息库</h1>
          <p className="text-sm text-muted-foreground">
            收集目标职位、管理面试题库，做好求职准备
          </p>
        </div>
        <Badge variant="outline" className="text-xs py-1">
          {jobs.length + interviews.length} 条记录
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">职位数</p>
              <p className="text-2xl font-bold text-blue-600">{jobs.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总题数</p>
              <p className="text-2xl font-bold text-violet-600">
                {interviews.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">高难度</p>
              <p className="text-2xl font-bold text-red-600">{hardInterviews}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">高频题</p>
              <p className="text-2xl font-bold text-amber-600">
                {highFrequencyInterviews}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with better styling */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("jobs")}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
            tab === "jobs"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          职位信息
          <Badge variant={tab === "jobs" ? "default" : "secondary"} className="ml-2">
            {jobs.length}
          </Badge>
        </button>
        <button
          onClick={() => setTab("interviews")}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
            tab === "interviews"
              ? "border-violet-500 text-violet-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          面经题库
          <Badge variant={tab === "interviews" ? "default" : "secondary"} className="ml-2">
            {interviews.length}
          </Badge>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左栏：列表 */}
        <div className="space-y-3 lg:col-span-1">
          {tab === "jobs" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                {jobs.length === 0 ? (
                  <Card className="shadow-sm">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">
                        还没有添加职位，开始添加吧
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      style={{
                        border: selectedJob?.id === job.id ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                        backgroundColor: selectedJob?.id === job.id ? "#eff6ff" : "#ffffff",
                        boxShadow: selectedJob?.id === job.id ? "0 10px 15px -3px rgba(0,0,0,0.1)" : "0 1px 2px 0px rgba(0,0,0,0.05)",
                      }}
                      className="cursor-pointer transition p-4 rounded-lg hover:border-blue-300 hover:bg-blue-50"
                    >
                      <p className="font-semibold text-base text-foreground truncate">
                        {job.company}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {job.position}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <Badge variant="outline" className="text-xs">
                          {job.source === "boss"
                            ? "BOSS直聘"
                            : job.source === "lagou"
                            ? "拉勾网"
                            : "手动"}
                        </Badge>
                        <span className="text-sm font-semibold text-amber-600">
                          {job.salary}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() =>
                  setEditingInterview({
                    id: "",
                    company: "",
                    position: "",
                    question: "",
                    difficulty: "medium",
                    frequency: 1,
                  })
                }
                className="w-full shadow-sm shadow-violet-500/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                添加面试题
              </Button>

              <div className="space-y-2">
                {interviews.length === 0 ? (
                  <Card className="shadow-sm">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">
                        还没有添加面试题，开始添加吧
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  interviews.map((interview) => {
                    const diffBg = {
                      easy: "bg-green-50 border-green-200 hover:border-green-300",
                      medium: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
                      hard: "bg-red-50 border-red-200 hover:border-red-300",
                    };

                    return (
                      <div
                        key={interview.id}
                        onClick={() => setSelectedInterview(interview)}
                        className={`rounded-lg border-2 p-4 cursor-pointer transition ${
                          selectedInterview?.id === interview.id
                            ? `${diffBg[interview.difficulty]} shadow-md`
                            : `${diffBg[interview.difficulty]}`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm line-clamp-2 flex-1">
                            {interview.question}
                          </p>
                          {interview.frequency >= 4 && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {interview.company} - {interview.position}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右栏：编辑面板或详情 */}
        <div className="lg:col-span-2">
          {tab === "jobs" ? (
            // 职位编辑面板
            editingJob ? (
              <JobEditPanel
                job={editingJob}
                onSave={(job) => {
                  if (editingJob.id) {
                    updateJob(job as JobPosting);
                  } else {
                    addJob(job as Omit<JobPosting, "id" | "postedDate">);
                  }
                }}
                onCancel={() => setEditingJob(null)}
              />
            ) : selectedJob ? (
              <JobDetailPanel
                job={selectedJob}
                isLoading={isLoadingInterviews}
                onConfirm={() => confirmSelectJob(selectedJob)}
                onEdit={() => setEditingJob(selectedJob)}
                onDelete={() => deleteJob(selectedJob.id)}
                onCopy={() => handleCopyJob(selectedJob)}
                copied={copied}
              />
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">
                    选择一个职位查看详情
                  </p>
                </CardContent>
              </Card>
            )
          ) : // 面经编辑面板
          editingInterview ? (
            <InterviewEditPanel
              interview={editingInterview}
              onSave={(interview) => {
                if (editingInterview.id) {
                  updateInterview(interview as InterviewQuestion);
                } else {
                  addInterview(interview as Omit<InterviewQuestion, "id">);
                }
              }}
              onCancel={() => setEditingInterview(null)}
            />
          ) : selectedInterview ? (
            <InterviewDetailPanel
              interview={selectedInterview}
              onEdit={() => setEditingInterview(selectedInterview)}
              onDelete={() => deleteInterview(selectedInterview.id)}
            />
          ) : (
            <Card className="shadow-sm">
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  选择一个面试题查看详情
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// 职位详情面板
function JobDetailPanel({
  job,
  isLoading,
  onConfirm,
  onEdit,
  onDelete,
  onCopy,
  copied,
}: {
  job: JobPosting;
  isLoading: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <Card className="shadow-md border-blue-100/50">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{job.company}</CardTitle>
            <CardDescription className="text-base font-medium text-foreground/80 mt-1">
              {job.position}
            </CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-700">
            {job.source === "boss"
              ? "BOSS直聘"
              : job.source === "lagou"
              ? "拉勾网"
              : "手动"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-600">
              {job.salary}
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-3">职位描述</h3>
          <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {job.description}
            </p>
          </div>
        </div>

        {job.link && (
          <div className="border-t pt-4">
            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              <Link2 className="h-4 w-4" />
              打开原始链接
            </a>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
          <span>添加于 {job.postedDate}</span>
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                确认加载面经
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                复制信息
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            编辑
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 职位编辑面板
function JobEditPanel({
  job,
  onSave,
  onCancel,
}: {
  job: JobPosting;
  onSave: (job: JobPosting | Omit<JobPosting, "id" | "postedDate">) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(job);

  return (
    <Card className="shadow-md border-blue-100/50">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          {job.id ? "编辑职位" : "添加新职位"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div>
          <label className="block text-sm font-medium mb-2">公司名称</label>
          <Input
            placeholder="例如：字节跳动、Google、阿里巴巴"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            className="border-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">职位名称</label>
          <Input
            placeholder="例如：高级前端工程师"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            className="border-slate-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">工作地点</label>
            <Input
              placeholder="北京、杭州、上海"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">薪资范围</label>
            <Input
              placeholder="30-40k"
              value={formData.salary}
              onChange={(e) =>
                setFormData({ ...formData, salary: e.target.value })
              }
              className="border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">职位描述</label>
          <Textarea
            placeholder="粘贴完整的职位描述和要求..."
            rows={6}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="border-slate-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            原始链接（可选）
          </label>
          <Input
            placeholder="https://..."
            value={formData.link || ""}
            onChange={(e) =>
              setFormData({ ...formData, link: e.target.value })
            }
            className="border-slate-200"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onSave(formData)}
            disabled={!formData.company || !formData.position}
            className="flex-1 shadow-sm shadow-blue-500/20"
          >
            保存职位
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 面经详情面板
function InterviewDetailPanel({
  interview,
  onEdit,
  onDelete,
}: {
  interview: InterviewQuestion;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const difficultyConfig = {
    easy: { colorClass: "green", label: "简单", bgGradient: "from-green-50/50", borderColor: "border-green-100" },
    medium: { colorClass: "yellow", label: "中等", bgGradient: "from-yellow-50/50", borderColor: "border-yellow-100" },
    hard: { colorClass: "red", label: "困难", bgGradient: "from-red-50/50", borderColor: "border-red-100" },
  };

  const config = difficultyConfig[interview.difficulty];

  return (
    <Card className={`shadow-md ${config.borderColor} border`}>
      <CardHeader className={`pb-4 bg-gradient-to-r ${config.bgGradient} to-transparent`}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{interview.company}</CardTitle>
            <CardDescription className="text-base font-medium text-foreground/80 mt-1">
              {interview.position}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {interview.frequency >= 4 && (
              <Badge className="bg-amber-100 text-amber-700">
                <Star className="h-3 w-3 mr-1 fill-current" />
                高频题
              </Badge>
            )}
            <Badge
              className={
                interview.difficulty === "easy"
                  ? "bg-green-100 text-green-700"
                  : interview.difficulty === "medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }
            >
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            问题
          </h3>
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
            <p className="text-sm leading-relaxed text-foreground/90">
              {interview.question}
            </p>
          </div>
        </div>

        {interview.answer && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              参考答案
            </h3>
            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {interview.answer}
              </p>
            </div>
          </div>
        )}

        {interview.tips && (
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              面试建议
            </h3>
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {interview.tips}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm border-t pt-4">
          <span className="text-muted-foreground">时间频率：</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= interview.frequency
                    ? "fill-amber-500 text-amber-500"
                    : "text-slate-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            编辑
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 面经编辑面板
function InterviewEditPanel({
  interview,
  onSave,
  onCancel,
}: {
  interview: InterviewQuestion;
  onSave: (interview: InterviewQuestion) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(interview);

  return (
    <Card className="shadow-md border-violet-100/50">
      <CardHeader className="bg-gradient-to-r from-violet-50/50 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-violet-600" />
          {interview.id ? "编辑面试题" : "添加新的面试题"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">所属公司</label>
            <Input
              placeholder="例如：字节跳动、Google"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              className="border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">目标职位</label>
            <Input
              placeholder="例如：高级前端工程师"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              className="border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">面试问题</label>
          <Textarea
            placeholder="记录面试官问的问题，或从其他地方收集的常见问题..."
            rows={3}
            value={formData.question}
            onChange={(e) =>
              setFormData({ ...formData, question: e.target.value })
            }
            className="border-slate-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">参考答案（可选）</label>
          <Textarea
            placeholder="记录你对这个问题的理解和可能的回答思路..."
            rows={3}
            value={formData.answer || ""}
            onChange={(e) =>
              setFormData({ ...formData, answer: e.target.value })
            }
            className="border-slate-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">面试建议（可选）</label>
          <Textarea
            placeholder="记录面试的关键点、注意事项或进阶思路..."
            rows={2}
            value={formData.tips || ""}
            onChange={(e) =>
              setFormData({ ...formData, tips: e.target.value })
            }
            className="border-slate-200 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">难度等级</label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty: e.target.value as "easy" | "medium" | "hard",
                })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="easy">🟢 简单</option>
              <option value="medium">🟡 中等</option>
              <option value="hard">🔴 困难</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">出现高频度</label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() =>
                    setFormData({ ...formData, frequency: star })
                  }
                  className="transition"
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= formData.frequency
                        ? "fill-amber-500 text-amber-500"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => onSave(formData)}
            disabled={!formData.company || !formData.question}
            className="flex-1 shadow-sm shadow-violet-500/20"
          >
            保存题目
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
