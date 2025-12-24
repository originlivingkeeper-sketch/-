
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { 
  UserCircle, Loader2, Sparkles, Briefcase, BarChart3, Plus, Minus,
  Download, User, Clock, PieChart as PieIcon, Send, Copy, Database,
  Zap, ChevronUp, ChevronDown, Check, Info, ListOrdered, Heart,
  FileText, MessageSquare
} from 'lucide-react';
import { AssessmentData, AnalysisResult, NotionConfig, TaskEntry } from './types';
import { SKILL_OPTIONS, INTEREST_OPTIONS, RADAR_CATEGORIES } from './constants';
import { getSuitabilityAnalysis } from './geminiService';

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#78716c', '#a8a29e', '#57534e'];

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [showWebhookHelp, setShowWebhookHelp] = useState(false);
  const [notionCopied, setNotionCopied] = useState(false);
  const [notionSaving, setNotionSaving] = useState(false);
  const [notionSuccess, setNotionSuccess] = useState(false);
  
  const [notionConfig, setNotionConfig] = useState<NotionConfig>(() => {
    const saved = localStorage.getItem('notion_config');
    return saved ? JSON.parse(saved) : { apiKey: '', databaseId: '', webhookUrl: '', mode: 'webhook' };
  });

  const [formData, setFormData] = useState<AssessmentData>({
    userName: '',
    totalWeeklyHours: 40,
    tasks: [],
    otherTasks: '',
    interests: [],
    otherInterests: ''
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Regex 提取時數邏輯
  const extractedOtherTaskHours = useMemo(() => {
    if (!formData.otherTasks) return 0;
    const regex = /(\d+(\.\d+)?)\s*(小時|h|H|hr|HR)/g;
    let match;
    let total = 0;
    while ((match = regex.exec(formData.otherTasks)) !== null) {
      total += parseFloat(match[1]);
    }
    return total;
  }, [formData.otherTasks]);

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

  const handleInterestToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id) 
        ? prev.interests.filter(i => i !== id) 
        : [...prev.interests, id]
    }));
  };

  const runAnalysis = async () => {
    if (!formData.userName.trim()) { alert("請輸入姓名"); return; }
    setLoading(true);
    setShowResult(true);
    try {
      const apiResult = await getSuitabilityAnalysis(formData);
      const radarData = RADAR_CATEGORIES.map(cat => ({ 
        subject: cat.label, 
        A: apiResult.scores[cat.key], 
        fullMark: 100 
      }));

      const trackedHours = formData.tasks.reduce((sum, t) => sum + t.hours, 0) + extractedOtherTaskHours;
      const miscHours = Math.max(0, formData.totalWeeklyHours - trackedHours);

      // 準備圓餅圖數據
      const pieData: any[] = formData.tasks.map((t, idx) => ({ 
        name: t.name, 
        value: t.hours, 
        color: COLORS[idx % (COLORS.length - 2)] 
      }));
      
      if (extractedOtherTaskHours > 0) {
        pieData.push({ name: '其他補充任務', value: extractedOtherTaskHours, color: '#a8a29e' });
      }
      
      if (miscHours > 0) {
        pieData.push({ name: '雜項', value: miscHours, color: '#e5e7eb' });
      }

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
          otherTaskHours: extractedOtherTaskHours,
          miscHours
        }
      });

      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (e) {
      alert("分析失敗，請檢查網路連線與 API Key 設定。");
    } finally {
      setLoading(false);
    }
  };

  const copyToNotion = () => {
    if (!result) return;
    const md = `# 照顧管家職能報告：${result.summary.userName}\n\n${result.tags.map(t => `\#${t}`).join(' ')}\n\n${result.suitabilityAdvice}`;
    navigator.clipboard.writeText(md);
    setNotionCopied(true);
    setTimeout(() => setNotionCopied(false), 2000);
  };

  const handleSaveToNotion = async () => {
    if (!notionConfig.webhookUrl) { alert("請填入 Webhook URL"); return; }
    setNotionSaving(true);
    try {
      await fetch(notionConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result, timestamp: new Date().toISOString() })
      });
      setNotionSuccess(true);
      setTimeout(() => { setNotionSuccess(false); setShowNotionModal(false); }, 2000);
    } catch (e) {
      alert("傳送失敗");
    } finally {
      setNotionSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 text-stone-800">
      <header className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 flex items-center justify-center gap-3">
          <Briefcase className="text-amber-600 w-10 h-10 md:w-12 md:h-12" />
          照顧管家適性判斷系統
        </h1>
        <p className="text-stone-500 mt-2 font-medium tracking-wide">資深人才數據分析與 HR 評核</p>
      </header>

      {!showResult || loading ? (
        <div className="space-y-10 animate-in fade-in">
          {/* 1. 基本資料 */}
          <section className="bg-white rounded-3xl shadow-sm p-8 border border-stone-100">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><User className="text-amber-600" /> 1. 基本資料收集</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase mb-2">姓名</label>
                  <input type="text" className="w-full p-4 rounded-xl border-2 border-stone-100 focus:border-amber-500 outline-none" placeholder="管家姓名" value={formData.userName} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase mb-2">每周總工時</label>
                  <input type="number" className="w-full p-4 rounded-xl border-2 border-stone-100 focus:border-amber-500 outline-none" value={formData.totalWeeklyHours} onChange={(e) => setFormData({...formData, totalWeeklyHours: Number(e.target.value)})} />
                </div>
             </div>
          </section>

          {/* 2. 周任務分布 */}
          <section className="bg-white rounded-3xl shadow-sm p-8 border border-stone-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Clock className="text-amber-600" /> 2. 周任務分布</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
               {SKILL_OPTIONS.map(opt => {
                 const task = formData.tasks.find(t => t.name === opt.label);
                 return (
                   <div key={opt.id} className={`p-4 rounded-2xl border-2 transition-all ${task ? 'border-amber-500 bg-amber-50' : 'border-stone-100 hover:border-stone-200'}`}>
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
            <div>
              <label className="block text-xs font-black text-stone-400 uppercase mb-2">其他任務補充 (系統會自動偵測時數，如：陪伴，1.5小時)</label>
              <textarea 
                className="w-full p-4 rounded-xl border-2 border-stone-100 focus:border-amber-500 outline-none h-24" 
                placeholder="請輸入其他任務與時數..." 
                value={formData.otherTasks} 
                onChange={(e) => setFormData({...formData, otherTasks: e.target.value})}
              ></textarea>
              {extractedOtherTaskHours > 0 && (
                <div className="mt-2 text-xs font-bold text-amber-600 flex items-center gap-1">
                  <Check size={14} /> 已偵測到補充時數：{extractedOtherTaskHours} 小時
                </div>
              )}
            </div>
          </section>

          {/* 3. 喜歡執行的項目 */}
          <section className="bg-white rounded-3xl shadow-sm p-8 border border-stone-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Heart className="text-amber-600" /> 3. 興趣與偏好</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
               {INTEREST_OPTIONS.map(opt => (
                 <button 
                  key={opt.id} 
                  onClick={() => handleInterestToggle(opt.label)}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${formData.interests.includes(opt.label) ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'bg-white border-stone-100 text-stone-500 hover:border-amber-200'}`}
                 >
                   {opt.label}
                 </button>
               ))}
            </div>
            <div>
              <label className="block text-xs font-black text-stone-400 uppercase mb-2">說明自己喜歡卻不在題目中的內容</label>
              <textarea 
                className="w-full p-4 rounded-xl border-2 border-stone-100 focus:border-amber-500 outline-none h-24" 
                placeholder="還有什麼特別喜歡做的事嗎？" 
                value={formData.otherInterests} 
                onChange={(e) => setFormData({...formData, otherInterests: e.target.value})}
              ></textarea>
            </div>
          </section>

          <div className="flex justify-center pt-6">
            <button onClick={runAnalysis} disabled={loading} className="px-20 py-6 bg-stone-900 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4">
               {loading ? <Loader2 className="animate-spin" /> : <Sparkles/>} 開始深度適性分析
            </button>
          </div>
        </div>
      ) : result && (
        <div id="analysis-result" className="animate-in fade-in space-y-12">
           {/* 報告頭部 */}
           <div className="bg-white rounded-3xl p-10 border-l-[16px] border-amber-600 shadow-sm">
              <span className="text-amber-600 font-black text-xs uppercase tracking-[0.2em] mb-2 block">Official Assessment Report</span>
              <h2 className="text-4xl font-black text-stone-900">{result.summary.userName} 的人才鑑定報告</h2>
              <div className="flex flex-wrap gap-2 mt-6">
                {result.tags.map((tag, i) => <span key={i} className="px-5 py-2 bg-amber-600 text-white rounded-full text-xs font-black shadow-sm">#{tag}</span>)}
              </div>
           </div>

           {/* 任務明細表格 (新增) */}
           <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><ListOrdered className="text-amber-600"/> 任務時數分配明細表</h3>
              <div className="overflow-hidden rounded-2xl border border-stone-100">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase">任務項目</th>
                      <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase text-right">執行時數</th>
                      <th className="px-6 py-4 text-xs font-black text-stone-400 uppercase text-right">佔比 (對總工時)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {formData.tasks.map((t, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-bold text-stone-700">{t.name}</td>
                        <td className="px-6 py-4 text-right font-mono text-amber-700">{t.hours} h</td>
                        <td className="px-6 py-4 text-right font-mono text-stone-400">{((t.hours / formData.totalWeeklyHours) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                    {result.summary.otherTaskHours > 0 && (
                      <tr>
                        <td className="px-6 py-4 font-bold text-stone-700">其他補充任務 (Regex 提取)</td>
                        <td className="px-6 py-4 text-right font-mono text-amber-700">{result.summary.otherTaskHours} h</td>
                        <td className="px-6 py-4 text-right font-mono text-stone-400">{((result.summary.otherTaskHours / formData.totalWeeklyHours) * 100).toFixed(1)}%</td>
                      </tr>
                    )}
                    <tr className="bg-stone-50/50">
                      <td className="px-6 py-4 font-bold text-stone-500 italic">雜項 (差值)</td>
                      <td className="px-6 py-4 text-right font-mono text-stone-400">{result.summary.miscHours} h</td>
                      <td className="px-6 py-4 text-right font-mono text-stone-400">{((result.summary.miscHours / formData.totalWeeklyHours) * 100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
           </div>

           {/* 數據圖表 */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm flex flex-col items-center">
                <h3 className="text-xl font-bold mb-8 w-full">五維職能分析圖</h3>
                <div className="w-full h-[350px]">
                  <ResponsiveContainer>
                    <RadarChart data={result.radarData}>
                      <PolarGrid stroke="#f1f1f0" />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize: 11, fontWeight: 'bold'}} />
                      <Radar dataKey="A" stroke="#d97706" fill="#d97706" fillOpacity={0.4} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm flex flex-col items-center">
                <h3 className="text-xl font-bold mb-8 w-full">工時分配圓餅圖 (總量 100%)</h3>
                <div className="w-full h-[350px]">
                   <ResponsiveContainer>
                      <PieChart>
                         <Pie data={result.pieData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={5}>
                            {result.pieData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                         </Pie>
                         <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
           </div>

           {/* 深度剖析 */}
           <div className="grid grid-cols-1 gap-8">
              <div className="bg-white rounded-3xl p-10 md:p-14 border border-stone-100 shadow-sm">
                <h3 className="text-2xl font-black mb-8 border-b pb-6 flex items-center gap-3"><FileText className="text-amber-600"/> 個人興趣與適才剖析</h3>
                <div className="text-stone-700 leading-relaxed space-y-6 text-lg whitespace-pre-wrap font-medium">
                  {result.suitabilityAdvice}
                </div>
              </div>

              <div className="bg-stone-900 rounded-3xl p-10 md:p-14 text-white shadow-2xl">
                <h3 className="text-2xl font-black mb-8 border-b border-stone-800 pb-6 flex items-center gap-3"><MessageSquare className="text-amber-600"/> 生成式 AI 與工具協助建議</h3>
                <div className="text-stone-300 leading-relaxed text-lg whitespace-pre-wrap font-medium opacity-90">
                  {result.aiAssistance}
                </div>
              </div>
           </div>

           {/* 操作按鈕 */}
           <div className="flex flex-col sm:flex-row justify-center gap-6 pb-20 print:hidden">
              <button onClick={() => window.print()} className="px-12 py-5 bg-amber-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl"><Download size={22}/> 下載 PDF 報告</button>
              <button onClick={() => setShowNotionModal(true)} className="px-12 py-5 bg-stone-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl"><Database size={22}/> 同步至資料庫</button>
           </div>
        </div>
      )}

      {/* Notion 設定彈窗 (保持之前版本) */}
      {showNotionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">Notion 自動化同步</h3>
              <button onClick={() => setShowNotionModal(false)} className="text-stone-300 hover:text-stone-600 p-2"><Plus className="rotate-45" size={32}/></button>
            </div>
            <div className="space-y-6">
              <div className="bg-amber-50 rounded-2xl p-6">
                <label className="block text-xs font-black text-stone-400 uppercase mb-2">Make.com Webhook URL</label>
                <input type="text" className="w-full p-4 rounded-xl border-2 border-stone-100 outline-none" placeholder="貼上 Webhook 網址" value={notionConfig.webhookUrl} onChange={(e) => setNotionConfig({...notionConfig, webhookUrl: e.target.value})} />
              </div>
              <button onClick={handleSaveToNotion} disabled={notionSaving} className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black flex items-center justify-center gap-3">
                {notionSaving ? <Loader2 className="animate-spin" /> : notionSuccess ? <Check /> : <Send />} 確認發送
              </button>
              <button onClick={copyToNotion} className="w-full py-4 border-2 border-stone-100 rounded-2xl font-black text-stone-500">
                {notionCopied ? "已複製 Markdown" : "複製報告 Markdown"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
