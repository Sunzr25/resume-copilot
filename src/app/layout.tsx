import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { initializeScheduler } from "@/lib/server-scheduler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resume Copilot - AI 智能简历定制助手",
  description:
    "基于大模型的个人职业生涯管理与智能投递助理。本地存储，隐私优先。",
};

// 在应用启动时初始化定时任务调度器
if (typeof global !== "undefined") {
  // 防止在开发模式下多次初始化
  if (!(global as any).__schedulerInitialized) {
    (global as any).__schedulerInitialized = true;
    initializeScheduler().catch((error) => {
      console.error("Failed to initialize scheduler:", error);
    });
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
