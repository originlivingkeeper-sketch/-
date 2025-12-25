
import React, { useState, useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, ZAxis, ReferenceLine, Label
} from 'recharts';
import { 
  Loader2, Sparkles, Briefcase, Plus, Minus,
  Download, User, Clock, Database, Check, ListOrdered, Heart,
  FileText, MessageSquare, Send, LayoutGrid, Award, Target
} from 'lucide-react';
import { AssessmentData, AnalysisResult, NotionConfig, TaskEntry } from './types';
import { SKILL_OPTIONS, RADAR_CATEGORIES } from './constants';
import { getSuitabilityAnalysis } from './geminiService';

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#78716c', '#a8a29e', '#57534e'];

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionSaving, setNotionSaving] = useState(false);
  const [notionSuccess, setNotionSuccess] = useState(false);
  const [notionConfig, setNotionConfig] = useState<NotionConfig>(() => {
    const defaultWebhook = 'https://hook.us2.make.com/bawonsr23rnctboo6t6v5z85slwqoans';
    const saved = localStorage.getItem('notion_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.webhookUrl) parsed.webhookUrl = defaultWebhook;
      return parsed;
    }
    return { 
      apiKey: '', 
      databaseId: '', 
      webhookUrl: defaultWebhook, 
      mode: 'webhook' 
    };
  });

  const [formData, setFormData] = useState<AssessmentData>({
    userName: '',
    totalDailyHours: 8,
    tasks: [],
    otherTasks: ''
  });
  
  const [result, setResult] = useState<AnalysisResult | any>(null);

  const parsedOtherTasks = useMemo((): TaskEntry[] => {
    if (!formData.otherTasks) return [];
    const regex = /([^，,；;：:\n]+?)\s*[：:\s]*(\d+(\.\d+)?)\s*(小時|h|H|hr|HR|個小時)/g;
    const items: TaskEntry[] = [];
    let match;
    while ((match = regex.exec(formData.otherTasks)) !== null) {
      items.push({ name: match[1].trim(), hours: parseFloat(match[2]) });
    }
    return items;
  }, [formData.otherTasks]);

  const totalOtherHours = useMemo(() => 
    parsedOtherTasks.reduce((sum, t) => sum + t.hours, 0), 
  [parsedOtherTasks]);

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

      const trackedHours = formData.tasks.reduce((sum, t) => sum + t.hours, 0) + totalOtherHours;
      const miscHours = Math.max(0, formData.totalDailyHours - trackedHours);

      const q1Tasks = formData.tasks.filter(t => SKILL_OPTIONS.find(o => o.label === t.name)?.weight === 4);
      const q2Tasks = formData.tasks.filter(t => SKILL_OPTIONS.find(o => o.label === t.name)?.weight === 3);
      const q4Tasks = [
        ...formData.tasks.filter(t => SKILL_OPTIONS.find(o => o.label === t.name)?.weight === 2),
        ...parsedOtherTasks 
      ];
      const q3Tasks = formData.tasks.filter(t => SKILL_OPTIONS.find(o => o.label === t.name)?.weight === 1);

      const q1Hours = q1Tasks.reduce((s, t) => s + t.hours, 0);
      const q2Hours = q2Tasks.reduce((s, t) => s + t.hours, 0);
      const q4Hours = q4Tasks.reduce((s, t) => s + t.hours, 0);
      const q3Hours = q3Tasks.reduce((s, t) => s + t.hours, 0) + miscHours;

      const actualTotalHours = q1Hours + q2Hours + q4Hours + q3Hours;
      const personalScore = Math.round(
        (q1Hours * 2 * 4) + (q2Hours * 2 * 3) + (q4Hours * 2 * 2) + (q3Hours * 2 * 1)
      );

      const xRatio = actualTotalHours > 0 ? ((q1Hours + q4Hours) - (q2Hours + q3Hours)) / actualTotalHours : 0;
      const yRatio = actualTotalHours > 0 ? ((q1Hours + q2Hours) - (q3Hours + q4Hours)) / actualTotalHours : 0;
      
      const mapPos = { x: xRatio * 100, y: yRatio * 100 };

      const matrixData = {
        q1: { title: "第一象限", tasks: q1Tasks, hours: q1Hours },
        q2: { title: "第二象限", tasks: q2Tasks, hours: q2Hours },
        q4: { title: "第四象限", tasks: q4Tasks, hours: q4Hours },
        q3: { title: "第三象限", tasks: q3Tasks, hours: q3Hours, idleHours: miscHours }
      };

      const pieData: any[] = [
        ...formData.tasks.map((t, idx) => ({ name: t.name, value: t.hours, color: COLORS[idx % (COLORS.length - 2)] })),
        ...parsedOtherTasks.map((t, idx) => ({ name: t.name, value: t.hours, color: COLORS[(formData.tasks.length + idx) % (COLORS.length - 2)] }))
      ];
      if (miscHours > 0) pieData.push({ name: '未指定服務項目或雜務時間', value: miscHours, color: '#e5e7eb' });

      setResult({
        radarData,
        pieData: pieData.filter(d => d.value > 0),
        suitabilityAdvice: apiResult.suitabilityAdvice,
        aiAssistance: apiResult.aiAssistance,
        tags: apiResult.tags || [],
        matrixData,
        personalScore,
        mapPos,
        summary: {
          userName: formData.userName,
          totalDailyHours: formData.totalDailyHours,
          actualTotalHours,
          trackedHours,
          otherTaskHours: totalOtherHours,
          miscHours
        }
      });

      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (e) {
      alert("分析失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotion = async () => {
    if (!notionConfig.webhookUrl) { alert("請填入 Webhook URL"); return; }
    setNotionSaving(true);
    try {
      const payload = {
        userName: result?.summary.userName,
        tags: result?.tags,
        suitabilityAdvice: result?.suitabilityAdvice,
        aiAssistance: result?.aiAssistance,
        personalScore: result?.personalScore,
        totalHours: result?.summary.totalDailyHours,
        analysisDate: new Date().toLocaleDateString('zh-TW')
      };
      await fetch(notionConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNotionSuccess(true);
      localStorage.setItem('notion_config', JSON.stringify(notionConfig));
      setTimeout(() => { setNotionSuccess(false); setShowNotionModal(false); }, 2000);
    } catch (e) {
      alert("傳送失敗");
    } finally {
      setNotionSaving(false);
    }
  };

  const renderOuterLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.25; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <g>
        <text x={x} y={y} fill="#666" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
          {`${name} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-stone-50 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 text-stone-800">
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 flex items-center justify-center gap-3 tracking-tight">
            <Briefcase className="text-amber-600 w-10 h-10 md:w-12 md:h-12" />
            照顧管家適性判斷系統
          </h1>
          <p className="text-stone-500 mt-3 font-medium tracking-widest uppercase text-xs italic">Daily Strategic Assessment Portal</p>
        </header>

        {!showResult || loading ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="bg-white rounded-[2rem] shadow-sm p-8 md:p-10 border border-stone-100">
               <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><User className="text-amber-600" /> 1. 基本資料</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input type="text" className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-amber-500 outline-none font-bold text-lg" placeholder="管家姓名" value={formData.userName} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                  <div className="flex flex-col">
                    <span className="text-stone-400 font-bold text-xs uppercase mb-1">今日工時設定 (標竿 8H)</span>
                    <input type="number" className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-amber-500 outline-none font-bold text-lg" value={formData.totalDailyHours} onChange={(e) => setFormData({...formData, totalDailyHours: Number(e.target.value)})} />
                  </div>
               </div>
            </section>

            <section className="bg-white rounded-[2rem] shadow-sm p-8 md:p-10 border border-stone-100">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><Clock className="text-amber-600" /> 2. 每日服務勾選</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SKILL_OPTIONS.map(opt => {
                  const task = formData.tasks.find(t => t.name === opt.label);
                  return (
                    <div key={opt.id} className={`p-4 rounded-2xl border-2 transition-all ${task ? 'border-amber-600 bg-amber-50/50' : 'border-stone-100 hover:border-stone-200'}`}>
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input type="checkbox" checked={!!task} onChange={() => handleTaskToggle(opt.label)} className="w-7 h-7 rounded-lg text-amber-600" />
                        <span className="text-xl font-black text-stone-700 leading-snug">{opt.label}</span>
                      </label>
                      {task && (
                        <div className="flex items-center justify-between bg-white rounded-xl p-2 border border-amber-200">
                          <button onClick={() => updateHours(opt.label, -0.5)} className="p-1.5 text-stone-400 hover:text-amber-600 transition-colors"><Minus size={20}/></button>
                          <span className="text-lg font-black text-amber-700">{task.hours} H</span>
                          <button onClick={() => updateHours(opt.label, 0.5)} className="p-1.5 text-stone-400 hover:text-amber-600 transition-colors"><Plus size={20}/></button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 bg-stone-50 rounded-3xl p-6 border border-stone-100">
                <label className="block font-black text-stone-400 uppercase mb-3 tracking-widest italic text-xl">今日額外任務</label>
                <textarea 
                  className="w-full p-5 rounded-2xl border-2 border-white focus:border-amber-500 outline-none h-24 text-stone-700 font-medium shadow-inner text-lg" 
                  placeholder="例如：緊急採買 0.5h" 
                  value={formData.otherTasks} 
                  onChange={(e) => setFormData({...formData, otherTasks: e.target.value})}
                ></textarea>
              </div>
            </section>

            <div className="flex justify-center pt-6"><button onClick={runAnalysis} disabled={loading} className="px-24 py-7 bg-stone-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center gap-5">{loading ? <Loader2 className="animate-spin" /> : <Sparkles />} 啟動單日深度分析</button></div>
          </div>
        ) : result && (
          <div id="analysis-result" className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-12">
             <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-stone-100 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="z-10">
                   <span className="text-amber-600 font-black text-xs uppercase tracking-widest mb-4 block italic">Daily Assessment Report</span>
                   <h2 className="text-5xl font-black text-stone-900 tracking-tight">{result.summary.userName} <span className="text-2xl font-normal text-stone-400">今日評核</span></h2>
                   <div className="flex flex-wrap gap-2 mt-6">{result.tags.map((tag: string, i: number) => <span key={i} className="px-4 py-1.5 bg-stone-100 text-stone-600 rounded-full text-[10px] font-black uppercase">#{tag}</span>)}</div>
                </div>
                <div className="mt-8 md:mt-0 flex flex-col items-end bg-stone-50 p-6 rounded-[2rem] border border-stone-100 z-10 text-right">
                   <div className="flex items-center gap-2 mb-1 text-stone-400 font-black text-[10px] uppercase tracking-widest justify-end"><Award size={14}/> 綜合量能積分 (理論值 16-64)</div>
                   <div className="text-7xl font-black text-stone-900 leading-none">{result.personalScore}<span className="text-sm font-bold text-stone-400 ml-1 italic">pts</span></div>
                   <div className="mt-2 text-[10px] font-bold text-stone-400">依當日工時累加調整</div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-stone-100 shadow-sm">
                <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-stone-800 border-b border-stone-50 pb-6"><LayoutGrid className="text-amber-600" /> 適性職能矩陣 (配分統整)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 左上 Q2 */}
                  <div className="p-8 rounded-[2rem] border bg-blue-50/20 border-blue-100">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-black text-blue-600 uppercase tracking-widest">第二象限</h4>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black">Weight 3</span>
                    </div>
                    <div className="space-y-3 mb-6 min-h-[80px]">
                      {result.matrixData.q2.tasks.length > 0 ? result.matrixData.q2.tasks.map((t: any, i: number) => <div key={i} className="text-[15px] font-bold flex justify-between text-stone-600"><span>• {t.name}</span><span>{t.hours}H</span></div>) : <div className="text-[11px] text-stone-300 italic">無歸類任務</div>}
                    </div>
                    <div className="text-right border-t border-blue-50 pt-3 text-blue-700 font-black text-sm">小計: {result.matrixData.q2.hours * 2 * 3} pts</div>
                  </div>

                  {/* 右上 Q1 */}
                  <div className="p-8 rounded-[2rem] border bg-red-50/20 border-red-100">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-black text-red-600 uppercase tracking-widest">第一象限</h4>
                      <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black">Weight 4</span>
                    </div>
                    <div className="space-y-3 mb-6 min-h-[80px]">
                      {result.matrixData.q1.tasks.length > 0 ? result.matrixData.q1.tasks.map((t: any, i: number) => <div key={i} className="text-[15px] font-bold flex justify-between text-stone-600"><span>• {t.name}</span><span>{t.hours}H</span></div>) : <div className="text-[11px] text-stone-300 italic">無歸類任務</div>}
                    </div>
                    <div className="text-right border-t border-red-50 pt-3 text-red-700 font-black text-sm">小計: {result.matrixData.q1.hours * 2 * 4} pts</div>
                  </div>

                  {/* 左下 Q3 */}
                  <div className="p-8 rounded-[2rem] border bg-stone-100/50 border-stone-200">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-black text-stone-500 uppercase tracking-widest">第三象限</h4>
                      <span className="text-[10px] bg-stone-500 text-white px-2 py-0.5 rounded-full font-black">Weight 1</span>
                    </div>
                    <div className="space-y-3 mb-6 min-h-[80px]">
                      {result.matrixData.q3.tasks.map((t: any, i: number) => <div key={i} className="text-[15px] font-bold flex justify-between text-stone-500"><span>• {t.name}</span><span>{t.hours}H</span></div>)}
                      {result.matrixData.q3.idleHours > 0 && <div className="text-[15px] font-bold flex justify-between text-stone-400 italic"><span>• 未指定服務或雜務</span><span>{result.matrixData.q3.idleHours}H</span></div>}
                    </div>
                    <div className="text-right border-t border-stone-200 pt-3 text-stone-500 font-black text-sm">小計: {Math.round(result.matrixData.q3.hours * 2 * 1)} pts</div>
                  </div>

                  {/* 右下 Q4 */}
                  <div className="p-8 rounded-[2rem] border bg-amber-50/20 border-amber-100">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-black text-amber-600 uppercase tracking-widest">第四象限</h4>
                      <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-black">Weight 2</span>
                    </div>
                    <div className="space-y-3 mb-6 min-h-[80px]">
                      {result.matrixData.q4.tasks.length > 0 ? result.matrixData.q4.tasks.map((t: any, i: number) => <div key={i} className="text-[15px] font-bold flex justify-between text-stone-600"><span>• {t.name}</span><span>{t.hours}H</span></div>) : <div className="text-[11px] text-stone-300 italic">無歸類任務</div>}
                    </div>
                    <div className="text-right border-t border-amber-50 pt-3 text-amber-700 font-black text-sm">小計: {result.matrixData.q4.hours * 2 * 2} pts</div>
                  </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-stone-100 shadow-sm">
                <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-stone-800 border-b border-stone-50 pb-6"><Target className="text-amber-600" /> 單日職能分布地圖</h3>
                <div className="w-full h-[450px] bg-stone-100 rounded-[2.5rem] p-8 relative border border-stone-200/50 shadow-inner">
                  <div className="absolute top-8 right-8 text-[10px] font-black text-red-300 uppercase tracking-widest text-right">第一象限 (48-64 pts)</div>
                  <div className="absolute top-8 left-8 text-[10px] font-black text-blue-300 uppercase tracking-widest text-left">第二象限 (32-48 pts)</div>
                  <div className="absolute bottom-8 left-8 text-[10px] font-black text-stone-300 uppercase tracking-widest text-left">第三象限 (16-32 pts)</div>
                  <div className="absolute bottom-8 right-8 text-[10px] font-black text-amber-300 uppercase tracking-widest text-right">第四象限 (32-48 pts)</div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis type="number" dataKey="x" domain={[-100, 100]} hide />
                      <YAxis type="number" dataKey="y" domain={[-100, 100]} hide />
                      <ZAxis type="number" range={[600, 600]} />
                      <ReferenceLine x={0} stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" />
                      <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" />
                      <Scatter name="位置" data={[{ x: result.mapPos.x, y: result.mapPos.y }]} fill="#d97706" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  
                  <div 
                    className="absolute w-14 h-14 bg-amber-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-bounce transition-all duration-1000"
                    style={{
                      left: `calc(50% + ${result.mapPos.x / 2}%)`,
                      top: `calc(50% - ${result.mapPos.y / 2}%)`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <User size={24} className="text-white" />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-sm">
                  <h3 className="text-xs font-black mb-8 text-stone-400 uppercase tracking-widest text-center italic">五維職能分佈</h3>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer><RadarChart data={result.radarData}><PolarGrid stroke="#f1f1f0" /><PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: '700', fill: '#a8a29e'}} /><Radar dataKey="A" stroke="#d97706" fill="#d97706" fillOpacity={0.4} strokeWidth={2} /></RadarChart></ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-sm">
                  <h3 className="text-xs font-black mb-8 text-stone-400 uppercase tracking-widest text-center italic">工時佔比細節</h3>
                  <div className="w-full h-[300px]">
                     <ResponsiveContainer><PieChart><Pie data={result.pieData} dataKey="value" innerRadius={50} outerRadius={75} label={renderOuterLabel}>{result.pieData.map((e: any, i: number) => <Cell key={i} fill={e.color} stroke="none" />)}</Pie></PieChart></ResponsiveContainer>
                  </div>
                </div>
             </div>

             <div className="space-y-10">
                <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-stone-100 shadow-sm leading-[2.2] text-lg">
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-stone-900 border-b pb-6 italic"><FileText className="text-amber-600" /> 當日安排專家說評</h3>
                  <div className="whitespace-pre-wrap text-stone-700 font-medium">{result.suitabilityAdvice}</div>
                </div>
                <div className="bg-sky-50 rounded-[2.5rem] p-10 md:p-14 text-black shadow-lg border border-sky-100 leading-[2.2] text-lg">
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-4 border-b border-sky-200 pb-6 italic"><MessageSquare className="text-sky-600" /> AI 轉型工具與賦能方案</h3>
                  <div className="whitespace-pre-wrap font-medium">{result.aiAssistance}</div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row justify-center gap-6 pb-20 print:hidden">
                <button onClick={() => window.print()} className="px-10 py-5 bg-stone-200/50 text-stone-900 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-stone-200 transition-all border border-stone-200"><Download size={20}/> 輸出完整分析報告</button>
                <button onClick={() => setShowNotionModal(true)} className="px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl"><Database size={20}/> 同步至人才資料庫</button>
             </div>
          </div>
        )}

        {showNotionModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl border border-stone-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-stone-900">同步至雲端系統</h3>
                <button onClick={() => setShowNotionModal(false)} className="text-stone-300 hover:text-stone-600 transition-colors p-2"><Plus className="rotate-45" size={32}/></button>
              </div>
              <div className="space-y-6">
                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                  <label className="block text-[10px] font-black text-stone-400 uppercase mb-3 tracking-widest">Webhook Endpoint</label>
                  <input type="text" className="w-full p-4 rounded-xl border border-stone-200 focus:border-amber-500 outline-none font-mono text-[10px]" value={notionConfig.webhookUrl} onChange={(e) => setNotionConfig({...notionConfig, webhookUrl: e.target.value})} />
                </div>
                <button onClick={handleSaveToNotion} disabled={notionSaving} className={`w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${notionSuccess ? 'bg-green-600 text-white' : 'bg-stone-900 hover:bg-black text-white'}`}>
                  {notionSaving ? <Loader2 className="animate-spin" /> : notionSuccess ? <Check /> : <Send />} 啟動資料傳輸
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
