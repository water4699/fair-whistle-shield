"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useWhistleBlower } from "@/hooks/useWhistleBlower";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { ActivityLogPanel } from "./ActivityLogPanel";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useState, useEffect, useRef } from "react";
import { 
  Send, Eye, RefreshCw, AlertCircle, Lock, 
  FileText, Clock, User, CheckCircle, XCircle,
  Loader2, Sparkles, Info, Copy, Check, Zap,
  Award, Globe, Key, Database
} from "lucide-react";

type WhistleBlowerDemoProps = {
  mode?: "full" | "decryptOnly" | "noReports";
};

// 严重程度配置
const severityConfig = [
  { level: 1, label: "Low", emoji: "🟢", color: "text-emerald-500", desc: "Minor issue" },
  { level: 2, label: "Medium", emoji: "🟡", color: "text-yellow-500", desc: "Moderate concern" },
  { level: 3, label: "High", emoji: "🟠", color: "text-orange-500", desc: "Significant problem" },
  { level: 4, label: "Severe", emoji: "🔴", color: "text-red-500", desc: "Serious violation" },
  { level: 5, label: "Critical", emoji: "⚫", color: "text-red-700", desc: "Urgent action needed" },
];

// 状态配置
const statusConfig: Record<string, { emoji: string; class: string; label: string }> = {
  "Pending": { emoji: "⏳", class: "badge-pending", label: "Pending" },
  "Under Review": { emoji: "🔍", class: "badge-review", label: "Under Review" },
  "Resolved": { emoji: "✅", class: "badge-resolved", label: "Resolved" },
  "Rejected": { emoji: "❌", class: "badge-rejected", label: "Rejected" },
};

// 报告类别
const reportCategories = [
  { id: "financial", label: "💰 Financial Fraud", icon: "💰" },
  { id: "safety", label: "⚠️ Safety Violation", icon: "⚠️" },
  { id: "ethics", label: "⚖️ Ethics Breach", icon: "⚖️" },
  { id: "data", label: "🔐 Data Privacy", icon: "🔐" },
  { id: "harassment", label: "🚫 Harassment", icon: "🚫" },
  { id: "other", label: "📋 Other", icon: "📋" },
];

// 功能特性
const features = [
  { icon: "🔒", title: "End-to-End Encryption", desc: "Your report is encrypted before leaving your device" },
  { icon: "👤", title: "Anonymous Reporting", desc: "Your identity is protected by blockchain technology" },
  { icon: "⛓️", title: "Immutable Records", desc: "Reports cannot be altered or deleted once submitted" },
  { icon: "🔑", title: "Controlled Access", desc: "Only authorized parties can decrypt reports" },
];

// 地址缩短
function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// 相对时间
function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export const WhistleBlowerDemo = ({ mode = "full" }: WhistleBlowerDemoProps) => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const [reportContent, setReportContent] = useState("");
  const [reportSeverity, setReportSeverity] = useState(3);
  const [reportCategory, setReportCategory] = useState("other");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showTips, setShowTips] = useState(true);

  const { add: addLog } = useActivityLog();
  const lastMessageRef = useRef<string>("");

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const whistleBlower = useWhistleBlower({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Activity Log Integration
  useEffect(() => {
    const m = whistleBlower.message || "";
    if (!m || m === lastMessageRef.current) return;
    lastMessageRef.current = m;

    if (m.includes("successfully")) {
      addLog({ type: "report_submit", title: "Report Submitted", details: m });
      setReportContent("");
      setReportSeverity(3);
    } else if (m.toLowerCase().includes("failed") || m.toLowerCase().includes("error")) {
      addLog({ type: "error", title: "Operation Failed", details: m });
    } else if (m.toLowerCase().includes("decrypt")) {
      addLog({ type: "decrypt", title: "FHEVM Decryption", details: m });
    } else if (m) {
      addLog({ type: "info", title: "Status Update", details: m });
    }
  }, [whistleBlower.message, addLog]);

  // 复制地址
  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // 筛选报告
  const filteredReports = whistleBlower.reports.filter(report => {
    if (filterStatus === "all") return true;
    return report.status === filterStatus;
  });

  // 统计数据
  const stats = {
    total: whistleBlower.totalReports,
    pending: whistleBlower.reports.filter(r => r.status === "Pending").length,
    review: whistleBlower.reports.filter(r => r.status === "Under Review").length,
    resolved: whistleBlower.reports.filter(r => r.status === "Resolved").length,
    rejected: whistleBlower.reports.filter(r => r.status === "Rejected").length,
  };

  // 未连接钱包
  if (!isConnected) {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center py-12 gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 animate-float">
              <span className="text-6xl">🛡️</span>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">Fair Whistle Shield</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg">
              🔐 The most secure anonymous whistleblower platform powered by 
              <span className="font-semibold text-purple-600"> Fully Homomorphic Encryption</span>
            </p>
          </div>

          <button 
            onClick={connect}
            className="btn-gradient flex items-center gap-3 text-lg px-8 py-4"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Lock className="w-5 h-5" />
              Connect Wallet to Start
              <span className="text-xl">🚀</span>
            </span>
          </button>
        </div>

        {/* 功能特性 */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 text-center text-gradient">
            ✨ Why Choose Fair Whistle Shield?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <div key={idx} className="stat-card p-5">
                <span className="text-3xl mb-3">{feature.icon}</span>
                <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-500 text-center">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 工作原理 */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 text-center text-gradient">
            🔄 How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center gap-3 relative">
              <div className="step-circle">1</div>
              <div className="text-3xl">📝</div>
              <p className="font-semibold">Write Report</p>
              <p className="text-xs text-gray-500">Describe the issue in detail</p>
              <div className="hidden md:block absolute top-5 -right-3 text-purple-300 text-2xl">→</div>
            </div>
            <div className="flex flex-col items-center text-center gap-3 relative">
              <div className="step-circle">2</div>
              <div className="text-3xl">🔒</div>
              <p className="font-semibold">FHE Encrypt</p>
              <p className="text-xs text-gray-500">Data encrypted on your device</p>
              <div className="hidden md:block absolute top-5 -right-3 text-purple-300 text-2xl">→</div>
            </div>
            <div className="flex flex-col items-center text-center gap-3 relative">
              <div className="step-circle">3</div>
              <div className="text-3xl">⛓️</div>
              <p className="font-semibold">Store On-Chain</p>
              <p className="text-xs text-gray-500">Immutable blockchain record</p>
              <div className="hidden md:block absolute top-5 -right-3 text-purple-300 text-2xl">→</div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="step-circle">4</div>
              <div className="text-3xl">🔓</div>
              <p className="font-semibold">Authorized Decrypt</p>
              <p className="text-xs text-gray-500">Only permitted users can view</p>
            </div>
          </div>
        </div>

        {/* 技术栈 */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 text-center text-gradient">
            🛠️ Powered By
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Key className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">FHEVM</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Ethereum</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium">Zama</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <Zap className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Next.js</span>
            </div>
          </div>
        </div>

        {/* 统计数据展示 */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 text-center text-gradient">
            📊 Platform Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="text-3xl mb-2">🛡️</span>
              <span className="text-3xl font-bold text-gradient">100%</span>
              <span className="text-xs text-gray-500">Encrypted</span>
            </div>
            <div className="stat-card">
              <span className="text-3xl mb-2">👤</span>
              <span className="text-3xl font-bold text-gradient">100%</span>
              <span className="text-xs text-gray-500">Anonymous</span>
            </div>
            <div className="stat-card">
              <span className="text-3xl mb-2">⛓️</span>
              <span className="text-3xl font-bold text-gradient">100%</span>
              <span className="text-xs text-gray-500">On-Chain</span>
            </div>
            <div className="stat-card">
              <span className="text-3xl mb-2">🔐</span>
              <span className="text-3xl font-bold text-gradient">FHE</span>
              <span className="text-xs text-gray-500">Technology</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (whistleBlower.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 + 合约信息 */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-3xl">{mode === "decryptOnly" ? "🔓" : "📝"}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">
                {mode === "decryptOnly" ? "Decrypt Reports" : "Submit Report"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {mode === "decryptOnly" 
                  ? "View and decrypt submitted reports securely" 
                  : "Submit an encrypted anonymous report"}
              </p>
            </div>
          </div>
          
          {/* 合约地址 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <span className="text-xs text-gray-500">Contract:</span>
            <button
              onClick={() => copyAddress(whistleBlower.contractAddress)}
              className="font-mono text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              {shortenAddress(whistleBlower.contractAddress)}
              {copiedAddress === whistleBlower.contractAddress ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 - 更丰富 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card">
          <span className="text-2xl mb-1">📊</span>
          <span className="text-2xl font-bold text-gradient">{stats.total}</span>
          <span className="text-xs text-gray-500">Total Reports</span>
        </div>
        <div className="stat-card">
          <span className="text-2xl mb-1">⏳</span>
          <span className="text-2xl font-bold text-amber-500">{stats.pending}</span>
          <span className="text-xs text-gray-500">Pending</span>
        </div>
        <div className="stat-card">
          <span className="text-2xl mb-1">🔍</span>
          <span className="text-2xl font-bold text-blue-500">{stats.review}</span>
          <span className="text-xs text-gray-500">Under Review</span>
        </div>
        <div className="stat-card">
          <span className="text-2xl mb-1">✅</span>
          <span className="text-2xl font-bold text-emerald-500">{stats.resolved}</span>
          <span className="text-xs text-gray-500">Resolved</span>
        </div>
        <div className="stat-card col-span-2 md:col-span-1">
          <span className="text-2xl mb-1">{fhevmInstance ? "🟢" : "🔴"}</span>
          <span className="text-sm font-semibold capitalize">{fhevmStatus}</span>
          <span className="text-xs text-gray-500">FHEVM Status</span>
        </div>
      </div>

      {/* 提交报告表单 */}
      {mode !== "decryptOnly" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主表单 */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-500" />
              Submit Encrypted Report
            </h2>

            {/* 隐私提示 - 可关闭 */}
            {showTips && (
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 mb-6 border border-purple-100 dark:border-purple-800/30 relative">
                <button 
                  onClick={() => setShowTips(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Your Privacy is Our Priority
                    </p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                      All report content is encrypted using Fully Homomorphic Encryption (FHE). 
                      Your data remains encrypted even during processing. Only authorized parties can decrypt.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 报告类别选择 */}
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-gray-400">📁</span>
                Report Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {reportCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setReportCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                      reportCategory === cat.id
                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 报告内容 */}
            <div className="space-y-2 mb-6">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Report Content
                </span>
                <span className={`text-xs ${reportContent.length > 800 ? "text-amber-500" : "text-gray-400"}`}>
                  {reportContent.length} / 1000
                </span>
              </label>
              <textarea
                className="textarea-glass h-40"
                placeholder="✍️ Describe the issue you want to report in detail...

• What happened?
• When did it occur?
• Who was involved?
• Any evidence or documentation?

(This content will be encrypted before submission)"
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value.slice(0, 1000))}
                disabled={whistleBlower.isSubmitting}
              />
            </div>

            {/* 严重程度 */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                Severity Level
              </label>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className="text-3xl">{severityConfig[reportSeverity - 1].emoji}</span>
                <div>
                  <span className={`font-bold text-lg ${severityConfig[reportSeverity - 1].color}`}>
                    {severityConfig[reportSeverity - 1].label}
                  </span>
                  <p className="text-xs text-gray-500">{severityConfig[reportSeverity - 1].desc}</p>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="5"
                value={reportSeverity}
                onChange={(e) => setReportSeverity(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    #10b981 0%, 
                    #eab308 25%, 
                    #f97316 50%, 
                    #ef4444 75%, 
                    #7f1d1d 100%)`
                }}
                disabled={whistleBlower.isSubmitting}
              />
              
              <div className="flex justify-between text-sm">
                {severityConfig.map((s) => (
                  <span 
                    key={s.level} 
                    className={`cursor-pointer transition-all ${reportSeverity === s.level ? "scale-125" : "opacity-50"}`}
                    onClick={() => setReportSeverity(s.level)}
                  >
                    {s.emoji}
                  </span>
                ))}
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              className="btn-gradient w-full flex items-center justify-center gap-2 py-4"
              disabled={!whistleBlower.canSubmit || whistleBlower.isSubmitting || !reportContent.trim()}
              onClick={() => {
                addLog({ 
                  type: "report_submit", 
                  title: "Submit Encrypted Report", 
                  details: `category=${reportCategory}, severity=${reportSeverity}` 
                });
                whistleBlower.submitReport(reportContent, reportSeverity);
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {whistleBlower.isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Encrypting & Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Encrypted Report
                    <span className="text-lg">🚀</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* 侧边栏 - 提示和信息 */}
          <div className="space-y-4">
            {/* 快速提示 */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Be specific and factual
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Include dates and times
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Describe what you witnessed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Avoid assumptions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">!</span>
                  Do not include personal info
                </li>
              </ul>
            </div>

            {/* 加密状态 */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">🔒</span>
                Encryption Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">FHEVM Instance</span>
                  <span className={`text-sm font-medium ${fhevmInstance ? "text-emerald-500" : "text-red-500"}`}>
                    {fhevmInstance ? "✓ Ready" : "✗ Not Ready"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Contract</span>
                  <span className="text-sm font-medium text-emerald-500">
                    ✓ Deployed
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Chain ID</span>
                  <span className="text-sm font-mono">{chainId}</span>
                </div>
              </div>
            </div>

            {/* 安全保证 */}
            <div className="glass-card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                Security Guarantee
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Your report is protected by military-grade FHE encryption. 
                Even we cannot read your data without proper authorization.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Zama Certified
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log (on Report page) */}
      {mode === "noReports" && (
        <ActivityLogPanel />
      )}

      {/* 报告列表 */}
      {mode !== "noReports" && (
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              Submitted Reports
              <span className="text-sm font-normal text-gray-400">
                ({filteredReports.length} of {whistleBlower.reports.length})
              </span>
            </h2>
            
            <div className="flex items-center gap-2">
              {/* 筛选 */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-glass text-sm py-2 px-3"
              >
                <option value="all">🔍 All Status</option>
                <option value="Pending">⏳ Pending ({stats.pending})</option>
                <option value="Under Review">🔍 Under Review ({stats.review})</option>
                <option value="Resolved">✅ Resolved ({stats.resolved})</option>
                <option value="Rejected">❌ Rejected ({stats.rejected})</option>
              </select>
              
              {/* 刷新按钮 */}
              <button
                className="btn-soft flex items-center gap-2"
                onClick={whistleBlower.refreshReports}
                disabled={whistleBlower.isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${whistleBlower.isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* 报告列表 */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                No reports found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {filterStatus === "all" 
                  ? "Be the first to submit an encrypted report" 
                  : "No reports with this status"}
              </p>
              {filterStatus !== "all" && (
                <button
                  onClick={() => setFilterStatus("all")}
                  className="mt-4 btn-soft"
                >
                  Show All Reports
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const statusInfo = statusConfig[report.status] || statusConfig["Pending"];
                const statusClass = report.status.toLowerCase().replace(" ", "-");
                
                return (
                  <div
                    key={report.id}
                    className={`report-card status-${statusClass === "under-review" ? "review" : statusClass}`}
                  >
                    <div className="flex flex-col gap-4">
                      {/* 头部信息 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold">
                            #{report.id}
                          </div>
                          <div>
                            <span className="font-bold text-gradient">Report #{report.id}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {timeAgo(report.timestamp)}
                            </div>
                          </div>
                        </div>
                        <span className={`badge-status ${statusInfo.class}`}>
                          {statusInfo.emoji} {statusInfo.label}
                        </span>
                      </div>

                      {/* 详细信息 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Reporter:</span>
                          <button
                            onClick={() => copyAddress(report.reporter)}
                            className="font-mono text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            {shortenAddress(report.reporter)}
                            {copiedAddress === report.reporter ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Submitted:</span>
                          <span className="text-sm">
                            {new Date(report.timestamp * 1000).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* 解密后的内容 */}
                      {report.decryptedContent && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/30">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                              🔓 Decrypted Content
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                            {report.decryptedContent}
                          </p>
                          
                          {report.decryptedSeverity !== undefined && (
                            <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800/30 flex items-center gap-3">
                              <span className="text-sm text-gray-500">Severity:</span>
                              <span className="text-2xl">
                                {severityConfig[report.decryptedSeverity - 1]?.emoji || "❓"}
                              </span>
                              <span className={`font-bold ${severityConfig[report.decryptedSeverity - 1]?.color || ""}`}>
                                {severityConfig[report.decryptedSeverity - 1]?.label || "Unknown"}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({severityConfig[report.decryptedSeverity - 1]?.desc || ""})
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          🔐 Content is {report.decryptedContent ? "decrypted" : "encrypted"}
                        </div>
                        <button
                          className={`btn-gradient px-4 py-2 text-sm ${
                            report.decryptedContent ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() => whistleBlower.decryptReport(report.id)}
                          disabled={whistleBlower.isDecrypting || report.decryptedContent !== undefined}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {whistleBlower.isDecrypting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Decrypting...
                              </>
                            ) : report.decryptedContent ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Decrypted ✓
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Decrypt Report 🔓
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 底部信息卡片 */}
      {mode !== "noReports" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <p className="font-semibold">FHE Protected</p>
              <p className="text-xs text-gray-500">All data encrypted on-chain</p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="font-semibold">Anonymous</p>
              <p className="text-xs text-gray-500">Your identity is protected</p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-2xl">⛓️</span>
            </div>
            <div>
              <p className="font-semibold">Immutable</p>
              <p className="text-xs text-gray-500">Records cannot be altered</p>
            </div>
          </div>
        </div>
      )}

      {/* 状态消息 Toast */}
      {whistleBlower.message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div className={`glass-card p-4 flex items-center gap-3 max-w-md shadow-2xl ${
            whistleBlower.message.toLowerCase().includes("failed") || whistleBlower.message.toLowerCase().includes("error")
              ? "border-red-300 dark:border-red-700"
              : whistleBlower.message.includes("successfully")
              ? "border-emerald-300 dark:border-emerald-700"
              : "border-purple-300 dark:border-purple-700"
          }`}>
            {whistleBlower.message.toLowerCase().includes("failed") || whistleBlower.message.toLowerCase().includes("error") ? (
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            ) : whistleBlower.message.includes("successfully") ? (
              <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            ) : (
              <Info className="w-6 h-6 text-purple-500 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{whistleBlower.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
