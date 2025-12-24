
import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { 
  UserCircle, 
  Loader2, 
  Sparkles, 
  Briefcase, 
  BarChart3,
  Cpu,
  Plus,
  Minus,
  Heart,
  Download,
  ArrowRight,
  AlertTriangle,
  User,
  Clock,
  PieChart as PieIcon,
  ListChecks,
  Tag,
  Share2,
  Settings2,
  Check,
  Copy,
  Database,
  ShieldCheck,
  Send,
  HelpCircle,
  ExternalLink as ExternalIcon,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Info
} from 'lucide-react';
import { AssessmentData, AnalysisResult, NotionConfig } from './types';
import { SKILL_OPTIONS, INTEREST_OPTIONS, RADAR_CATEGORIES } from './constants';
import { getSuitabilityAnalysis } from './geminiService';

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#78716c', '#a8a29e', '#57534e'];

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [showWebhookHelp, setShowWebhookHelp] = useState(true); // 預設開啟教學
  const [notionCopied, setNotionCopied] = useState(false);
  const [notionSaving, setNotionSaving] = useState(false);
  const [notionSuccess, setNotionSuccess] = useState(false);
  
  const [notionConfig, setNotionConfig] = useState<NotionConfig>(() => {
    const saved = localStorage.getItem('notion_config');
    return saved ? JSON.parse(saved) : { apiKey: '', databaseId: '', webhookUrl: '', mode: 'webhook' };
  });

  useEffect(() => {
    localStorage.setItem('notion_config', JSON.stringify(notionConfig));
  }, [notionConfig]);

  const [formData, setFormData] = useState<AssessmentData>({
    userName: '',
    totalWeeklyHours: 40,
    tasks: [],
    otherTasks: '',
    interests: [],
    otherInterests: ''
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleTaskToggle = (label: string) => {
    const exists = formData.tasks.find(t => t.name === label);
    if (exists) {
      setFormData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.name !== label) }));
    } else {
      setFormData(prev => ({ ...prev, tasks: [...prev.tasks, { name: label, hours: 1 }] }));
    }
  };

  const updateHours = (label: string, delta: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.name === label ? { ...t, hours: Math.max(0.5, t.hours + delta) } : t)
    }));
  };

  const generateNotionMarkdown = () => {
    if (!result) return "";
    return `# 照顧管家職能鑑定：${result.summary.userName}\n> 生成日期：${new Date().toLocaleDateString()}\n\n${result.tags.map(t => `\`#${t}\``).join(' ')}\n\n## 📊 核心職能評分\n${result.radarData.map(d => `- **${d.subject}**: ${d.A}/100`).join('\n')}\n\n## 📝 主管深度評語\n${result.suitabilityAdvice}\n\n--- \n*由照顧管家系統產出*`;
  };

  const copyToNotion = () => {
    navigator.clipboard.writeText(generateNotionMarkdown());
    setNotionCopied(true);
    setTimeout(() => setNotionCopied(false), 2000);
  };

  const handleSaveToNotion = async () => {
    if (notionConfig.mode === 'api') {
      alert("由於 Notion CORS 限制，前端無法直連 API。請改用『穩定模式』。");
      return;
    }

    if (!notionConfig.webhookUrl) {
      alert("請先填入 Make.com 提供的 Webhook URL。");
      return;
    }

    setNotionSaving(true);
    try {
      const payload = {
        userName: result?.summary.userName || "測試人員",
        tags: result?.tags || ["測試標籤"],
        scores: result?.radarData.map(d => ({ [d.subject]: d.A })),
        advice: result?.suitabilityAdvice || "這是一份測試資料",
        timestamp: new Date().toLocaleString('zh-TW')
      };

      const response = await fetch(notionConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("傳輸失敗");
      
      setNotionSuccess(true);
      setTimeout(() => {
        setNotionSuccess(false);
        if (result) setShowNotionModal(false);
      }, 2500);
    } catch (err) {
      alert("傳送失敗！請確保 Make.com 的 Webhook 處於『Waiting for data』狀態。");
    } finally {
      setNotionSaving(false);
    }
  };

  const runAnalysis = async () => {
    if (!formData.userName.trim()) { alert("請輸入姓名"); return; }
    setLoading(true);
    setShowResult(true);
    try {
      const apiResult = await getSuitabilityAnalysis(formData);
      const radarData = RADAR_CATEGORIES.map(cat => ({ subject: cat.label, A: apiResult.scores[cat.key], fullMark: 100 }));
      const trackedHours = formData.tasks.reduce((sum, t) => sum + t.hours, 0);
      const pieData = formData.tasks.map((t, idx) => ({ name: t.name, value: t.hours, color: COLORS[idx % (COLORS.length - 2)] }));
      
      setResult({
        radarData,
        pieData: pieData.filter(d => d.value > 0),
        suitabilityAdvice: apiResult.suitabilityAdvice,
        aiAssistance: apiResult.aiAssistance,
        tags: apiResult.tags || [],
        summary: {
          userName: formData.userName,
          totalWeeklyHours: formData.totalWeeklyHours,
          trackedHours,
          otherTaskHours: 0,
          miscHours: Math.max(0, formData.totalWeeklyHours - trackedHours)
        }
      });
      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (e) {
      setErrorStatus("分析失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 text-stone-800">
      <header className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 flex items-center justify-center gap-3">
          <Briefcase className="text-amber-600 w-10 h-10 md:w-12 md:h-12" />
          照顧管家適性判斷
        </h1>
        <p className="text-stone-500 mt-2 font-medium tracking-wide">資深人才評核系統</p>
      </header>

      {!showResult || loading ? (
        <div className="space-y-8">
           <section className="bg-white rounded-3xl shadow-sm p-6 md:p-10 border border-stone-100">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><User className="text-amber-600" /> 1. 基本資訊</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" className="p-4 rounded-xl border-2 border-stone-100 outline-none focus:border-amber-500 transition-all" placeholder="管家姓名" value={formData.userName} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                <input type="number" className="p-4 rounded-xl border-2 border-stone-100 outline-none focus:border-amber-500 transition-all" placeholder="周工時" value={formData.totalWeeklyHours} onChange={(e) => setFormData({...formData, totalWeeklyHours: Number(e.target.value)})} />
             </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm p-6 md:p-10 border border-stone-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Clock className="text-amber-600" /> 2. 任務分佈</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {SKILL_OPTIONS.map(opt => {
                 const task = formData.tasks.find(t => t.name === opt.label);
                 return (
                   <div key={opt.id} className={`p-4 rounded-2xl border-2 transition-all ${task ? 'border-amber-500 bg-amber-50' : 'border-stone-100'}`}>
                     <label className="flex items-center gap-2 cursor-pointer mb-2">
                       <input type="checkbox" checked={!!task} onChange={() => handleTaskToggle(opt.label)} className="w-4 h-4 text-amber-600" />
                       <span className="text-sm font-bold">{opt.label}</span>
                     </label>
                     {task && (
                       <div className="flex items-center justify-between bg-white rounded-lg p-1 border border-amber-200">
                         <button onClick={() => updateHours(opt.label, -0.5)} className="p-1 hover:text-amber-600"><Minus size={14}/></button>
                         <span className="text-xs font-black">{task.hours}h</span>
                         <button onClick={() => updateHours(opt.label, 0.5)} className="p-1 hover:text-amber-600"><Plus size={14}/></button>
                       </div>
                     )}
                   </div>
                 )
               })}
            </div>
          </section>

          <div className="flex justify-center mt-12">
            <button onClick={runAnalysis} disabled={loading} className="px-16 py-5 bg-stone-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-black transition-all flex items-center gap-3">
               {loading ? <Loader2 className="animate-spin" /> : <Sparkles/>} 開始職能鑑定
            </button>
          </div>
        </div>
      ) : result && (
        <div id="analysis-result" className="animate-in fade-in space-y-8">
           <div className="bg-white rounded-3xl p-8 border-l-[12px] border-amber-600 shadow-sm">
              <h2 className="text-4xl font-black text-stone-900">{result.summary.userName} 的評分報告</h2>
              <div className="flex flex-wrap gap-2 mt-4">
                {result.tags.map((tag, i) => <span key={i} className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-black border border-amber-100">#{tag}</span>)}
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm h-[400px]">
                <h3 className="text-xl font-bold mb-4">五維職能分析</h3>
                <ResponsiveContainer width="100%" height="90%">
                   <RadarChart data={result.radarData}>
                      <PolarGrid stroke="#e7e5e4" />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Radar dataKey="A" stroke="#d97706" fill="#d97706" fillOpacity={0.4} strokeWidth={2} />
                   </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
                <h3 className="text-xl font-bold mb-4">任務時數分配</h3>
                <div className="h-[280px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={result.pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={5}>
                            {result.pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-3xl p-8 md:p-14 border border-stone-100 shadow-sm text-lg leading-relaxed whitespace-pre-wrap">
              <h3 className="text-2xl font-black mb-8 border-b pb-4 flex items-center gap-3"><UserCircle className="text-amber-600" /> 主管評語</h3>
              {result.suitabilityAdvice}
           </div>

           <div className="flex flex-col sm:flex-row justify-center gap-6 pb-20 print:hidden">
              <button onClick={() => window.print()} className="px-10 py-5 bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl"><Download size={22}/> 匯出 PDF</button>
              <button onClick={() => setShowNotionModal(true)} className="px-10 py-5 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl"><Share2 size={22}/> 存入 Notion</button>
           </div>
        </div>
      )}

      {/* Notion 設定彈窗 - 強化 Make.com 教學版 */}
      {showNotionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Database className="text-stone-900" size={32} />
                <h3 className="text-2xl font-black">Notion 自動化同步</h3>
              </div>
              <button onClick={() => setShowNotionModal(false)} className="text-stone-300 hover:text-stone-600 p-2"><Plus className="rotate-45" size={32}/></button>
            </div>

            <div className="space-y-6">
              {/* Webhook 連線教學區塊 */}
              <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-6 shadow-sm">
                <button 
                  onClick={() => setShowWebhookHelp(!showWebhookHelp)}
                  className="flex items-center justify-between w-full text-amber-900 font-black text-lg mb-2"
                >
                  <span className="flex items-center gap-2"><Zap size={20} className="text-amber-600"/> 連線步驟指南</span>
                  {showWebhookHelp ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                </button>
                
                {showWebhookHelp && (
                  <div className="mt-4 space-y-6 text-sm text-stone-700 leading-relaxed border-t border-amber-200 pt-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-black">1</div>
                      <div className="space-y-1">
                        <p className="font-black text-amber-900">複製 Make.com 網址</p>
                        <p className="text-xs">在 Make.com 新增 Custom Webhook 後，點擊 <strong>"Copy address"</strong>。</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-black">2</div>
                      <div className="space-y-1 flex-1">
                        <p className="font-black text-amber-900">貼入下方欄位並發送</p>
                        <p className="text-xs mb-3">貼上後，點擊最下方的 <strong>『確認並發送資料』</strong>。</p>
                        <div className="bg-white p-3 rounded-2xl border border-amber-200">
                          <label className="block text-[10px] font-black text-stone-400 uppercase mb-2">Webhook URL</label>
                          <input type="text" className="w-full p-3 rounded-xl border-2 border-stone-100 bg-stone-50 outline-none focus:border-amber-500 font-mono text-[10px]" placeholder="https://hook.make.com/..." value={notionConfig.webhookUrl} onChange={(e) => setNotionConfig({...notionConfig, webhookUrl: e.target.value, mode: 'webhook'})} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center font-black">3</div>
                      <div className="space-y-2">
                        <p className="font-black text-stone-900">回到 Make.com 觀察視窗</p>
                        <p className="text-xs">當發送完成後，請立即切換回 Make.com 網頁，原本旋轉的等待圖示會變成下圖：</p>
                        <div className="bg-green-100 text-green-800 p-3 rounded-xl flex items-center gap-2 font-black text-xs border border-green-200 animate-pulse">
                          <Check size={16}/> Successfully determined
                        </div>
                        <p className="text-[10px] text-stone-400 italic font-medium">※ 這代表 Make.com 已經抓到資料結構，您現在可以點擊 OK 並連結 Notion 模組了！</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSaveToNotion}
                  disabled={notionSaving}
                  className={`w-full py-5 rounded-3xl font-black text-white flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${notionSuccess ? 'bg-green-600' : 'bg-stone-900 hover:bg-black'}`}
                >
                  {notionSaving ? <Loader2 className="animate-spin" size={24}/> : notionSuccess ? <><Check size={24}/> 測試資料已成功送出</> : <><Send size={24}/> 確認並發送資料</>}
                </button>
              </div>

              <div className="pt-6 border-t border-stone-100">
                <button onClick={copyToNotion} className={`w-full py-4 rounded-2xl font-black border-2 transition-all flex items-center justify-center gap-3 ${notionCopied ? 'border-green-600 text-green-600 bg-green-50' : 'border-stone-100 text-stone-400 hover:text-amber-600'}`}>
                  <Copy size={20}/> {notionCopied ? '已複製 Markdown 格式' : '複製 Markdown (手動貼上備案)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
