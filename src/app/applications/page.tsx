"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  Building2,
  Trash2,
  Edit2,
  X,
} from "lucide-react";

interface ApplicationCard {
  id: string;
  targetCompany: string;
  targetRole: string;
  status: string;
  jdText?: string;
  createdAt: string;
}

interface FormData {
  targetCompany: string;
  targetRole: string;
  jdText: string;
}

const STATUS_COLUMNS = [
  {
    key: "PREPARING",
    label: "准备中",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-400",
  },
  {
    key: "APPLIED",
    label: "已投递",
    icon: Send,
    gradient: "from-blue-500 to-cyan-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-400",
  },
  {
    key: "INTERVIEWING",
    label: "面试中",
    icon: MessageSquare,
    gradient: "from-violet-500 to-purple-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    dotColor: "bg-violet-400",
  },
  {
    key: "CLOSED",
    label: "已结束",
    icon: CheckCircle2,
    gradient: "from-slate-400 to-slate-500",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dotColor: "bg-slate-400",
  },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    targetCompany: "",
    targetRole: "",
    jdText: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // 加载投递列表
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
      } else {
        setApplications([]);
        console.error("API返回错误:", res.status);
      }
    } catch (error) {
      console.error("加载投递列表失败:", error);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (app?: ApplicationCard) => {
    if (app) {
      setEditingId(app.id);
      setFormData({
        targetCompany: app.targetCompany,
        targetRole: app.targetRole,
        jdText: app.jdText || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        targetCompany: "",
        targetRole: "",
        jdText: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      targetCompany: "",
      targetRole: "",
      jdText: "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.targetCompany || !formData.targetRole) {
      alert("请输入公司名称和岗位名称");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/applications/${editingId}`
        : "/api/applications";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(editingId ? "编辑成功" : "新增成功");
        handleCloseModal();
        loadApplications();
      } else {
        alert("操作失败，请重试");
      }
    } catch (error) {
      console.error("提交失败:", error);
      alert("提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/applications/${deleteConfirmId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        setDeleteConfirmId(null);
        loadApplications();
      } else {
        alert("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    } finally {
      setSubmitting(false);
    }
  };

  const getCardsByStatus = (status: string) =>
    applications.filter((app) => app.status === status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <div className="space-y-8">
      {/* Modal: 新增/编辑投递 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingId ? "编辑投递" : "新增投递"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">公司名称</label>
                <Input
                  name="targetCompany"
                  value={formData.targetCompany}
                  onChange={handleInputChange}
                  placeholder="例如：ByteDance"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">岗位名称</label>
                <Input
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleInputChange}
                  placeholder="例如：高级前端工程师"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">职位描述（可选）</label>
                <Textarea
                  name="jdText"
                  value={formData.jdText}
                  onChange={handleInputChange}
                  placeholder="粘贴 JD 内容..."
                  className="mt-1 h-24 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={submitting}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "提交中..." : "提交"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: 删除确认 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold">确认删除？</h2>
            <p className="mt-2 text-sm text-gray-600">
              删除后无法恢复，请谨慎操作。
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={submitting}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "删除中..." : "确认删除"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">投递看板</h1>
          <p className="text-sm text-muted-foreground">
            追踪你的每一次投递，直观掌握求职全流程
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="shadow-sm shadow-indigo-500/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增投递
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      )}

      {/* Stats Bar */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STATUS_COLUMNS.map((col) => {
              const count = getCardsByStatus(col.key).length;
              return (
                <div
                  key={col.key}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${col.gradient} text-white shadow-sm`}
                  >
                    <col.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{col.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {STATUS_COLUMNS.map((column) => {
              const cards = getCardsByStatus(column.key);
              return (
                <div key={column.key} className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center gap-2.5 px-1">
                    <div className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                    <h2 className="text-sm font-semibold">{column.label}</h2>
                    <Badge
                      variant="secondary"
                      className="ml-auto h-5 rounded-md px-1.5 text-[10px] font-bold"
                    >
                      {cards.length}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5">
                    {cards.map((app) => (
                      <Card
                        key={app.id}
                        className="border-transparent bg-card shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground flex-shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="truncate text-sm font-semibold">
                                {app.targetCompany}
                              </CardTitle>
                              <CardDescription className="truncate text-xs">
                                {app.targetRole}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="px-4 pb-3 pt-1">
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(app.createdAt)}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOpenModal(app)}
                                className="p-1 text-muted-foreground hover:text-amber-600 transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(app.id)}
                                className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}

                    {cards.length === 0 && (
                      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed bg-muted/20">
                        <p className="text-xs text-muted-foreground">暂无记录</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
