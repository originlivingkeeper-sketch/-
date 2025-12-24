
import React, { useState, useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { 
  UserCircle, Loader2, Sparkles, Briefcase, Plus, Minus,
  Download, User, Clock, Database, Check, ListOrdered, Heart,
  FileText, MessageSquare, Send, Copy
} from 'lucide-react';
import { AssessmentData, AnalysisResult, NotionConfig } from './types';
import { SKILL_OPTIONS, INTEREST_OPTIONS, RADAR_CATEGORIES } from './constants';
import { getSuitabilityAnalysis } from './geminiService';

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#78716c', '#a8a29e', '#57534e'];

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showNotionModal, setShowNotionModal] = useState(false);
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

  // Regex 提取時數
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

  const handleInterestToggle = (label: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(label) 
        ? prev.interests.filter(i => i !== label) 
        : [...prev.interests, label]
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
        A: apiResult.scores[cat.key] || 0, 
        fullMark: 100 
      }));

      const trackedHours = formData.tasks.reduce((sum, t) => sum + t.hours, 0) + extractedOtherTaskHours;
      const miscHours = Math.max(0, formData.totalWeeklyHours - trackedHours);

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
      alert("分析發生錯誤，請檢查 API Key 或網路連線。");
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 flex items-center justify-center gap-3 tracking-tight">
          <Briefcase className="text-amber-600 w-10 h-10 md:w-12 md:h-12" />
          照顧管家適性判斷系統
        </h1>
        <p className="text-stone-500 mt-3 font-medium tracking-widest uppercase text-sm">Senior Talent Assessment System</p>
      </header>

      {!showResult || loading ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* 1. 基本資料收集 */}
          <section className="bg-white rounded-[2rem] shadow-sm p-8 md:p-10 border border-stone-100">
             <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><User className="text-amber-600" /> 1. 基本資料收集</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase mb-3 tracking-widest">姓名</label>
                  <input type="text" className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-amber-500 outline-none transition-all font-bold text-lg" placeholder="輸入管家姓名" value={formData.userName} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase mb-3 tracking-widest">每周總工時 (H)</label>
                  <input type="number" className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-amber-500 outline-none transition-all font-bold text-lg" value={formData.totalWeeklyHours} onChange={(e) => setFormData({...formData, totalWeeklyHours: Number(e.target.value)})} />
                </div>
             </div>
          </section>

          {/* 2. 周任務分布 */}
          <section className="bg-white rounded-[2rem] shadow-sm p-8 md:p-10 border border-stone-100">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><Clock className="text-amber-600" /> 2. 周任務分布</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
               {SKILL_OPTIONS.map(opt => {
                 const task = formData.tasks.find(t => t.name === opt.label);
                 return (
                   <div key={opt.id} className={`p-4 rounded-2xl border-2 transition-all duration-300 ${task ? 'border-amber-500 bg-amber-50/50' : 'border-stone-100 hover:border-stone-200'}`}>
                     <label className="flex items-center gap-3 cursor-pointer mb-3">
                       <input type="checkbox" checked={!!task} onChange={() => handleTaskToggle(opt.label)} className="w-5 h-5 rounded-lg text-amber-600 focus:ring-amber-500 border-stone-300" />
                       <span className="text-sm font-black text-stone-700">{opt.label}</span>
                     </label>
                     {task && (
                       <div className="flex items-center justify-between bg-white rounded-xl p-1.5 border border-amber-200 shadow-sm">
                         <button onClick={() => updateHours(opt.label, -0.5)} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-amber-600"><Minus size={16}/></button>
                         <span className="text-sm font-black text-amber-700">{task.hours} 小時</span>
                         <button onClick={() => updateHours(opt.label, 0.5)} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-amber-600"><Plus size={16}/></button>
                       </div>
                     )}
                   </div>
                 )
               })}
            </div>
            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
              <label className="block text-xs font-black text-stone-500 uppercase mb-3 tracking-widest">其他任務補充 (時數將由系統自動提取)</label>
              <textarea 
                className="w-full p-5 rounded-2xl border-2 border-white focus:border-amber-500 outline-none h-32 text-stone-700 font-medium shadow-inner" 
                placeholder="例如：陪伴聊天，1.5小時；協助購物 2h" 
                value={formData.otherTasks} 
                onChange={(e) => setFormData({...formData, otherTasks: e.target.value})}
              ></textarea>
              {extractedOtherTaskHours > 0 && (
                <div className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-2 w-fit animate-pulse">
                  <Check size={14} /> 偵測到補充工時：{extractedOtherTaskHours} H
                </div>
              )}
            </div>
          </section>

          {/* 3. 喜歡執行的項目 */}
          <section className="bg-white rounded-[2rem] shadow-sm p-8 md:p-10 border border-stone-100">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><Heart className="text-amber-600" /> 3. 興趣與適性項目</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
               {INTEREST_OPTIONS.map(opt => (
                 <button 
                  key={opt.id} 
                  onClick={() => handleInterestToggle(opt.label)}
                  className={`p-5 rounded-2xl border-2 font-black text-sm transition-all duration-300 ${formData.interests.includes(opt.label) ? 'bg-amber-600 border-amber-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-stone-100 text-stone-500 hover:border-amber-200'}`}
                 >
                   {opt.label}
                 </button>
               ))}
            </div>
            <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
              <label className="block text-xs font-black text-stone-500 uppercase mb-3 tracking-widest">補充說明：喜歡卻不在題目中的內容</label>
              <textarea 
                className="w-full p-5 rounded-2xl border-2 border-white focus:border-amber-500 outline-none h-32 text-stone-700 font-medium shadow-inner" 
                placeholder="還有什麼特別感興趣的工作嗎？" 
                value={formData.otherInterests} 
                onChange={(e) => setFormData({...formData, otherInterests: e.target.value})}
              ></textarea>
            </div>
          </section>

          <div className="flex justify-center pt-6">
            <button onClick={runAnalysis} disabled={loading} className="px-24 py-7 bg-stone-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-5">
               {loading ? <Loader2 className="animate-spin" size={28} /> : <Sparkles size={28} />} 執行適性深度鑑定
            </button>
          </div>
        </div>
      ) : result && (
        <div id="analysis-result" className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-12">
           {/* 報告頭部 */}
           <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border-l-[20px] border-amber-600 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
              <span className="text-amber-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">Official Competency Report</span>
              <h2 className="text-5xl font-black text-stone-900 leading-tight">{result.summary.userName} 的人才鑑定報告</h2>
              <div className="flex flex-wrap gap-3 mt-8">
                {result.tags.map((tag, i) => <span key={i} className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-xs font-black shadow-lg">#{tag}</span>)}
              </div>
           </div>

           {/* 任務明細表格 (新增) */}
           <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-sm">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-4"><ListOrdered className="text-amber-600" size={32}/> 任務時數分配明細表</h3>
              <div className="overflow-hidden rounded-3xl border border-stone-100 bg-stone-50/30">
                <table className="w-full text-left">
                  <thead className="bg-stone-100/50 border-b border-stone-100">
                    <tr>
                      <th className="px-8 py-6 text-xs font-black text-stone-400 uppercase tracking-widest">任務項目</th>
                      <th className="px-8 py-6 text-xs font-black text-stone-400 uppercase tracking-widest text-right">執行時數</th>
                      <th className="px-8 py-6 text-xs font-black text-stone-400 uppercase tracking-widest text-right">佔比 (100% 總量)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {formData.tasks.map((t, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="px-8 py-5 font-black text-stone-700">{t.name}</td>
                        <td className="px-8 py-5 text-right font-mono font-black text-amber-600 text-lg">{t.hours} H</td>
                        <td className="px-8 py-5 text-right font-mono text-stone-400 font-bold">{((t.hours / formData.totalWeeklyHours) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                    {result.summary.otherTaskHours > 0 && (
                      <tr className="hover:bg-white transition-colors">
                        <td className="px-8 py-5 font-black text-stone-700">其他補充任務 (Regex)</td>
                        <td className="px-8 py-5 text-right font-mono font-black text-amber-600 text-lg">{result.summary.otherTaskHours} H</td>
                        <td className="px-8 py-5 text-right font-mono text-stone-400 font-bold">{((result.summary.otherTaskHours / formData.totalWeeklyHours) * 100).toFixed(1)}%</td>
                      </tr>
                    )}
                    <tr className="bg-stone-100/20">
                      <td className="px-8 py-6 font-black text-stone-400 italic">雜項 (未分配工時)</td>
                      <td className="px-8 py-6 text-right font-mono font-black text-stone-300 text-lg">{result.summary.miscHours} H</td>
                      <td className="px-8 py-6 text-right font-mono text-stone-300 font-bold">{((result.summary.miscHours / formData.totalWeeklyHours) * 100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
           </div>

           {/* 數據圖表 */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-sm flex flex-col items-center">
                <h3 className="text-xl font-black mb-10 w-full text-stone-400 uppercase tracking-widest">五維職能分析</h3>
                <div className="w-full h-[400px]">
                  <ResponsiveContainer>
                    <RadarChart data={result.radarData}>
                      <PolarGrid stroke="#f1f1f0" />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize: 12, fontWeight: '900', fill: '#78716c'}} />
                      <Radar dataKey="A" stroke="#d97706" fill="#d97706" fillOpacity={0.4} strokeWidth={3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-sm flex flex-col items-center">
                <h3 className="text-xl font-black mb-10 w-full text-stone-400 uppercase tracking-widest">工時分配比例 (100%)</h3>
                <div className="w-full h-[400px]">
                   <ResponsiveContainer>
                      <PieChart>
                         <Pie data={result.pieData} dataKey="value" innerRadius={80} outerRadius={120} paddingAngle={8} animationBegin={200} animationDuration={1000}>
                            {result.pieData.map((e: any, i: number) => <Cell key={i} fill={e.color} stroke="none" />)}
                         </Pie>
                         <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px'}} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
              </div>
           </div>

           {/* 深度剖析 */}
           <div className="space-y-10">
              <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-stone-100 shadow-sm">
                <h3 className="text-3xl font-black mb-10 border-b pb-8 flex items-center gap-4 text-stone-900"><FileText className="text-amber-600" size={36}/> 工作效率與適性剖析</h3>
                <div className="text-stone-700 leading-[2.2] space-y-8 text-xl whitespace-pre-wrap font-medium">
                  {result.suitabilityAdvice}
                </div>
              </div>

              <div className="bg-stone-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600 rounded-full -mb-48 -mr-48 opacity-10"></div>
                <h3 className="text-3xl font-black mb-10 border-b border-stone-800 pb-8 flex items-center gap-4"><MessageSquare className="text-amber-600" size={36}/> AI 賦能與工具協助方案</h3>
                <div className="text-stone-300 leading-[2.2] text-xl whitespace-pre-wrap font-medium opacity-90">
                  {result.aiAssistance}
                </div>
              </div>
           </div>

           {/* 操作按鈕 */}
           <div className="flex flex-col sm:flex-row justify-center gap-8 pb-20 print:hidden">
              <button onClick={() => window.print()} className="px-14 py-6 bg-amber-600 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-4 shadow-xl hover:bg-amber-700 transition-all"><Download size={26}/> 匯出評核報告</button>
              <button onClick={() => setShowNotionModal(true)} className="px-14 py-6 bg-stone-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-4 shadow-xl hover:bg-black transition-all"><Database size={26}/> 同步 Notion</button>
           </div>
        </div>
      )}

      {/* Notion 設定彈窗 */}
      {showNotionModal && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-stone-900">Notion 同步設定</h3>
              <button onClick={() => setShowNotionModal(false)} className="text-stone-300 hover:text-stone-600 transition-colors p-2"><Plus className="rotate-45" size={40}/></button>
            </div>
            <div className="space-y-8">
              <div className="bg-stone-50 rounded-[2rem] p-8 border border-stone-100 shadow-inner">
                <label className="block text-xs font-black text-stone-400 uppercase mb-4 tracking-widest">Make.com Webhook URL</label>
                <input type="text" className="w-full p-5 rounded-2xl border-2 border-white focus:border-amber-500 outline-none font-mono text-sm shadow-sm" placeholder="https://hook.make.com/..." value={notionConfig.webhookUrl} onChange={(e) => setNotionConfig({...notionConfig, webhookUrl: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleSaveToNotion} disabled={notionSaving} className={`w-full py-6 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${notionSuccess ? 'bg-green-600' : 'bg-stone-900 hover:bg-black text-white'}`}>
                  {notionSaving ? <Loader2 className="animate-spin" /> : notionSuccess ? <Check /> : <Send />} 確認發送
                </button>
                <button onClick={() => {
                  if (!result) return;
                  const md = `# ${result.summary.userName} 的人才報告\n\n${result.tags.map(t => `#${t}`).join(' ')}\n\n${result.suitabilityAdvice}`;
                  navigator.clipboard.writeText(md);
                  alert("Markdown 已複製");
                }} className="w-full py-6 bg-white border-2 border-stone-100 rounded-3xl font-black text-stone-500 hover:border-amber-500 hover:text-amber-600 transition-all">
                  複製 Markdown 備案
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
