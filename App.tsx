
import React, { useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
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
  AlertTriangle
} from 'lucide-react';
import { AssessmentData, AnalysisResult } from './types';
import { SKILL_OPTIONS, INTEREST_OPTIONS, RADAR_CATEGORIES } from './constants';
import { getSuitabilityAnalysis } from './geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AssessmentData>({
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
        tasks: [...prev.tasks, { name: label, hours: 0.5 }]
      }));
    }
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

  const handleInterestToggle = (label: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(label)
        ? prev.interests.filter(i => i !== label)
        : [...prev.interests, label]
    }));
  };

  const runAnalysis = async () => {
    if (formData.tasks.length === 0) {
      alert("請至少選擇一個任務項目。");
      return;
    }
    setLoading(true);
    setShowResult(true);
    setErrorStatus(null);
    setRawError(null);
    try {
      const apiResult = await getSuitabilityAnalysis(formData);
      const radarData = RADAR_CATEGORIES.map(cat => ({
        subject: cat.label,
        A: apiResult.scores[cat.key],
        fullMark: 100
      }));
      setResult({
        radarData,
        suitabilityAdvice: apiResult.suitabilityAdvice,
        aiAssistance: apiResult.aiAssistance
      });
      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Analysis failed', error);
      const msg = error.message || String(error);
      if (msg === "額度已用完") {
        setErrorStatus("額度已用完");
      } else {
        setErrorStatus("分析過程中發生錯誤");
        setRawError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => window.print();

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 text-stone-800">
      <header className="mb-12 text-center print:block">
        <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 flex items-center justify-center gap-3">
          <Briefcase className="text-amber-600 w-10 h-10 md:w-12 md:h-12" />
          照顧管家適性判斷
        </h1>
        <p className="text-stone-500 mt-4 text-lg print:hidden">專業職能評估與 AI 協作轉型建議</p>
      </header>

      <div className={`space-y-8 ${showResult ? 'hidden md:block print:hidden' : ''}`}>
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-amber-600" />
            1. 任務執行與時數統計
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
                      <button onClick={() => updateHours(option.label, -0.5)} className="p-1 text-stone-500"><Minus size={16} /></button>
                      <span className="text-sm font-black text-amber-700">{task.hours} 小時</span>
                      <button onClick={() => updateHours(option.label, 0.5)} className="p-1 text-stone-500"><Plus size={16} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <textarea className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50 h-28 outline-none focus:border-amber-500" placeholder="其他任務補充..." value={formData.otherTasks} onChange={(e) => setFormData(prev => ({ ...prev, otherTasks: e.target.value }))} />
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <Heart className="text-rose-500" />
            2. 特別感興趣的項目
          </h2>
          <div className="flex flex-wrap gap-3 mb-10">
            {INTEREST_OPTIONS.map((option) => (
              <button key={option.id} onClick={() => handleInterestToggle(option.label)} className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all ${formData.interests.includes(option.label) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-stone-100 text-stone-600'}`}>{option.label}</button>
            ))}
          </div>
          <textarea className="w-full p-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50 h-28 outline-none focus:border-rose-500" placeholder="其他興趣補充..." value={formData.otherInterests} onChange={(e) => setFormData(prev => ({ ...prev, otherInterests: e.target.value }))} />
        </section>

        <div className="flex justify-center pt-8 print:hidden">
          <button onClick={runAnalysis} disabled={loading} className="px-10 py-5 font-bold text-white bg-amber-600 rounded-2xl shadow-xl hover:bg-amber-700 disabled:opacity-50">
            {loading ? <><Loader2 className="animate-spin mr-2" /> 分析中...</> : <><Sparkles className="mr-2" /> 生成適性分析報告</>}
          </button>
        </div>
      </div>

      {showResult && (
        <div id="analysis-result" className="mt-16 md:mt-24 print:mt-0">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="animate-spin mb-4 text-amber-600" size={48} />
              <p className="text-xl animate-pulse">正在深度分析中...</p>
            </div>
          ) : errorStatus ? (
            <div className="bg-white border-2 border-rose-100 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-xl">
              <AlertTriangle className="mx-auto text-rose-500 mb-6" size={48} />
              <h3 className="text-2xl font-bold text-stone-800 mb-2">{errorStatus}</h3>
              {rawError && <p className="text-xs text-stone-400 mb-6 font-mono bg-stone-50 p-2 rounded">錯誤代碼: {rawError}</p>}
              <p className="text-stone-500 mb-8">{errorStatus === "額度已用完" ? "配額已達上限，請稍後再試。" : "請檢查網路或 API 金鑰設定後重試。"}</p>
              <button onClick={() => { setShowResult(false); setErrorStatus(null); }} className="bg-stone-800 text-white px-8 py-3 rounded-xl font-bold">回上一頁</button>
            </div>
          ) : result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 print:space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
                <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2"><BarChart3 className="text-amber-600" />適性雷達分析</h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.radarData}>
                        <PolarGrid stroke="#e7e5e4" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 11, fontWeight: 'bold' }} />
                        <Radar name="Score" dataKey="A" stroke="#d97706" strokeWidth={3} fill="#d97706" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><UserCircle className="text-amber-600" />個人適性建議</h3>
                  <div className="text-stone-600 leading-relaxed space-y-4 text-lg">
                    {result.suitabilityAdvice.split('\n').map((para, i) => para.trim() && <p key={i}>{para}</p>)}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-900 via-orange-950 to-stone-950 rounded-3xl shadow-2xl p-8 md:p-12 text-white relative print:bg-white print:text-stone-800 print:border">
                <h3 className="text-3xl font-bold mb-8 flex items-center gap-3"><Cpu className="text-amber-300" /> AI 協作轉型建議</h3>
                <div className="space-y-4">
                  {result.aiAssistance.split('\n').map((line, i) => line.trim() && (
                    <div key={i} className="flex gap-3"><ArrowRight className="shrink-0 text-orange-400 mt-1.5" size={16} /><span>{line.replace(/^[-*]\s*/, '').replace(/^\d\.\s*/, '')}</span></div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-6 mt-12 pb-12 print:hidden">
                <button onClick={handleExportPDF} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl"><Download size={20} /> 匯出報告 (PDF)</button>
                <button onClick={() => { setShowResult(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-stone-500 font-bold px-6 py-2">重新調整</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
