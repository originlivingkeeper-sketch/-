
import React, { useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend
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
  CheckCircle2,
  Heart,
  Download,
  ArrowRight,
  AlertTriangle,
  User,
  Clock,
  PieChart as PieIcon,
  ListChecks
} from 'lucide-react';
import { AssessmentData, AnalysisResult } from './types';
import { SKILL_OPTIONS, INTEREST_OPTIONS, RADAR_CATEGORIES } from './constants';
import { getSuitabilityAnalysis } from './geminiService';

const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#78716c', '#a8a29e'];

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
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
      setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.name !== label)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, { name: label, hours: 1 }]
      }));
    }
  };

  const handleInterestToggle = (label: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(label)
        ? prev.interests.filter(i => i !== label)
        : [...prev.interests, label]
    }));
  };

  const updateHours = (label: string, delta: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.name === label 
          ? { ...t, hours: Math.max(0.5, t.hours + delta) } 
          : t
      )
    }));
  };

  const runAnalysis = async () => {
    if (!formData.userName.trim()) {
      alert("請輸入姓名。");
      return;
    }
    if (formData.tasks.length === 0) {
      alert("請至少選擇一個任務項目。");
      return;
    }
    
    setLoading(true);
    setShowResult(true);
    setErrorStatus(null);
    
    try {
      const apiResult = await getSuitabilityAnalysis(formData);
      
      const radarData = RADAR_CATEGORIES.map(cat => ({
        subject: cat.label,
        A: apiResult.scores[cat.key],
        fullMark: 100
      }));

      const trackedHours = formData.tasks.reduce((sum, t) => sum + t.hours, 0);
      const miscHours = Math.max(0, formData.totalWeeklyHours - trackedHours);

      // 圓餅圖數據：包含所有已選任務 + 差額（移動或雜務）
      const pieData = [
        ...formData.tasks.map((t, idx) => ({
          name: t.name,
          value: t.hours,
          color: COLORS[idx % (COLORS.length - 1)]
        })),
        { name: '移動或雜務時數', value: miscHours, color: '#e7e5e4' }
      ].filter(d => d.value > 0);

      setResult({
        radarData,
        pieData,
        suitabilityAdvice: apiResult.suitabilityAdvice,
        aiAssistance: apiResult.aiAssistance,
        summary: {
          userName: formData.userName,
          totalWeeklyHours: formData.totalWeeklyHours,
          trackedHours,
          miscHours
        }
      });

      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error(error);
      setErrorStatus("分析過程中發生錯誤，請確認網路連線與 API Key。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 text-stone-800">
      <header className="mb-12 text-center print:block">
        <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 flex items-center justify-center gap-3">
          <Briefcase className="text-amber-600 w-10 h-10 md:w-12 md:h-12" />
          照顧管家適性判斷
        </h1>
        <p className="text-stone-500 mt-4 text-lg print:hidden">資深人力主管專業職能評估系統</p>
      </header>

      <div className={`space-y-8 ${showResult && !loading ? 'hidden md:block print:hidden' : ''}`}>
        {/* 1. 基本資訊 */}
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white text-sm">1</span>
            基本資訊收集
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-500 mb-2">姓名</label>
              <input 
                type="text" 
                className="w-full p-4 rounded-xl border-2 border-stone-100 outline-none focus:border-amber-500"
                placeholder="輸入照顧管家姓名"
                value={formData.userName}
                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-500 mb-2">前周上班總時數 (小時)</label>
              <input 
                type="number" 
                className="w-full p-4 rounded-xl border-2 border-stone-100 outline-none focus:border-amber-500"
                value={formData.totalWeeklyHours}
                onChange={(e) => setFormData(prev => ({ ...prev, totalWeeklyHours: Number(e.target.value) }))}
              />
            </div>
          </div>
        </section>

        {/* 2. 任務統計 */}
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white text-sm">2</span>
            任務執行與時數統計
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {SKILL_OPTIONS.map((option) => {
              const task = formData.tasks.find(t => t.name === option.label);
              return (
                <div key={option.id} className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${task ? 'border-amber-500 bg-amber-50' : 'border-stone-100 bg-white'}`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input type="checkbox" className="w-5 h-5 rounded text-amber-600" checked={!!task} onChange={() => handleTaskToggle(option.label)} />
                    <span className="text-sm font-bold text-stone-700">{option.label}</span>
                  </label>
                  {task && (
                    <div className="flex items-center justify-between bg-white rounded-xl p-2 mt-auto border border-amber-200">
                      <button onClick={() => updateHours(option.label, -0.5)} className="p-1 text-stone-500 hover:text-amber-600"><Minus size={16} /></button>
                      <span className="text-sm font-black text-amber-700">{task.hours} 小時</span>
                      <button onClick={() => updateHours(option.label, 0.5)} className="p-1 text-stone-500 hover:text-amber-600"><Plus size={16} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <label className="block text-sm font-bold text-stone-500 mb-2">其他任務補充</label>
          <textarea 
            className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50 h-28 outline-none focus:border-amber-500" 
            placeholder="其他任務補充，請以半小時為單位寫入，例如『陪伴長輩談心，1.5小時』" 
            value={formData.otherTasks} 
            onChange={(e) => setFormData(prev => ({ ...prev, otherTasks: e.target.value }))} 
          />
        </section>

        {/* 3. 感興趣項目 */}
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white text-sm">3</span>
            特別感興趣的項目
          </h2>
          <div className="flex flex-wrap gap-3 mb-10">
            {INTEREST_OPTIONS.map((option) => (
              <button 
                key={option.id} 
                onClick={() => handleInterestToggle(option.label)} 
                className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all ${formData.interests.includes(option.label) ? 'bg-amber-600 border-amber-600 text-white shadow-md' : 'bg-white border-stone-100 text-stone-600 hover:border-amber-300'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="block text-sm font-bold text-stone-500 mb-2">其他興趣補充</label>
          <textarea 
            className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50 h-28 outline-none focus:border-amber-500" 
            placeholder="還有什麼特別想發展的方向嗎？" 
            value={formData.otherInterests} 
            onChange={(e) => setFormData(prev => ({ ...prev, otherInterests: e.target.value }))} 
          />
        </section>

        <div className="flex justify-center pt-8 print:hidden">
          <button onClick={runAnalysis} disabled={loading} className="px-10 py-5 font-bold text-white bg-amber-600 rounded-2xl shadow-xl hover:bg-amber-700 disabled:opacity-50 flex items-center gap-3 transition-all transform hover:scale-105">
            {loading ? <><Loader2 className="animate-spin" /> 分析報表生成中...</> : <><Sparkles /> 產出深度職能報告</>}
          </button>
        </div>
      </div>

      {showResult && (
        <div id="analysis-result" className="mt-16 md:mt-24 print:mt-0">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="animate-spin mb-4 text-amber-600" size={48} />
              <p className="text-xl animate-pulse">正在調用資深管理主管 AI 進行深度剖析...</p>
            </div>
          ) : errorStatus ? (
            <div className="bg-white border-2 border-rose-100 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-xl">
              <AlertTriangle className="mx-auto text-rose-500 mb-6" size={48} />
              <h3 className="text-2xl font-bold text-stone-800 mb-2">{errorStatus}</h3>
              <button onClick={() => { setShowResult(false); setErrorStatus(null); }} className="bg-stone-800 text-white px-8 py-3 rounded-xl font-bold mt-4">重新填寫</button>
            </div>
          ) : result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 print:space-y-4">
              
              {/* 人才摘要區 */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-l-8 border-l-amber-600">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900">{result.summary.userName}</h2>
                    <p className="text-stone-500 font-medium">照顧管家 職能適性報告書</p>
                  </div>
                </div>
                <div className="flex gap-8 text-center bg-stone-50 p-6 rounded-2xl border border-stone-100">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">上周總工時</p>
                    <p className="text-2xl font-black text-amber-600">{result.summary.totalWeeklyHours}h</p>
                  </div>
                  <div className="w-px h-10 bg-stone-200 self-center"></div>
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">有效紀錄工時</p>
                    <p className="text-2xl font-black text-stone-800">{result.summary.trackedHours}h</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 適性分析雷達圖 */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-stone-800">
                    <BarChart3 className="text-amber-600" />適性維度分析
                  </h3>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.radarData}>
                        <PolarGrid stroke="#e7e5e4" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 11, fontWeight: 'bold' }} />
                        <Radar name="適性分" dataKey="A" stroke="#d97706" strokeWidth={3} fill="#d97706" fillOpacity={0.4} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 時數分配圓餅圖 */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-800">
                    <PieIcon className="text-amber-600" />時數分配比例
                  </h3>
                  <div className="h-[250px] w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={result.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {result.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} 小時`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {result.pieData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-2 bg-stone-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-stone-600 font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-stone-800">{item.value}h ({Math.round((item.value/formData.totalWeeklyHours)*100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 任務明細列表 */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-800">
                  <ListChecks className="text-amber-600" />具體任務時數清單
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.tasks.map((task, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl flex justify-between items-center border border-stone-100 shadow-sm hover:border-amber-200 transition-colors">
                      <span className="font-bold text-stone-700">{task.name}</span>
                      <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-xs font-black">{task.hours}h</span>
                    </div>
                  ))}
                  {result.summary.miscHours > 0 && (
                    <div className="bg-stone-50 p-4 rounded-xl flex justify-between items-center border border-dashed border-stone-300">
                      <span className="font-bold text-stone-500 italic">移動或雜務時數</span>
                      <span className="bg-stone-200 text-stone-600 px-4 py-1 rounded-full text-xs font-black">{result.summary.miscHours}h</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 個人適性深度建議：移除大首字樣式 */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 lg:p-12">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-stone-800">
                  <UserCircle className="text-amber-600" /> HR 主管適性深度評語
                </h3>
                <div className="text-stone-700 leading-relaxed space-y-6 text-lg whitespace-pre-wrap">
                  {result.suitabilityAdvice.split('\n').map((para, i) => para.trim() && (
                    <p key={i}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* AI 賦能建議 */}
              <div className="bg-stone-900 rounded-3xl shadow-2xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Cpu size={140} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Cpu className="text-amber-400" /> AI 協作轉型建議方案
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.aiAssistance.split('\n').filter(l => l.trim()).map((line, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group">
                        <div className="flex gap-4">
                          <div className="bg-amber-500/20 p-2 rounded-lg group-hover:bg-amber-500/40 transition-colors">
                            <ArrowRight className="text-amber-400" size={18} />
                          </div>
                          <span className="text-stone-200 text-lg">{line.replace(/^[-*]\s*/, '').replace(/^\d\.\s*/, '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12 pb-12 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="bg-amber-600 text-white px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-amber-700 transition-all transform hover:-translate-y-1"
                >
                  <Download size={20} /> 匯出完整報告書 (PDF)
                </button>
                <button 
                  onClick={() => { setShowResult(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  className="text-stone-400 font-bold px-8 py-5 hover:text-stone-600 hover:bg-stone-100 rounded-2xl transition-colors"
                >
                  返回重新評估
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f5f5f4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a29e; }
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .shadow-sm, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
          .rounded-3xl { border-radius: 1rem !important; }
          .bg-stone-900 { background: #1c1917 !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-stone-50 { background: #f5f5f4 !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
