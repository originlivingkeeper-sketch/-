
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
  ArrowRight
} from 'lucide-react';
import { AssessmentData, AnalysisResult, TaskEntry } from './types';
import { SKILL_OPTIONS, INTEREST_OPTIONS, RADAR_CATEGORIES } from './constants';
import { getSuitabilityAnalysis } from './geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
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
      // Scroll to result
      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Analysis failed', error);
      alert('分析過程中發生錯誤，請稍後再試。');
      setShowResult(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 text-stone-800">
      {/* Header hidden on print */}
      <header className="mb-12 text-center print:block">
        <h1 className="text-3xl md:text-5xl font-extrabold text-stone-900 flex items-center justify-center gap-3">
          <Briefcase className="text-amber-600 w-10 h-10 md:w-12 md:h-12" />
          照顧管家適性判斷
        </h1>
        <p className="text-stone-500 mt-4 text-lg print:hidden">專業職能評估與 AI 協作轉型建議</p>
      </header>

      {/* Input Form Section - hidden on print if result is shown */}
      <div className={`space-y-8 ${showResult ? 'print:hidden' : ''}`}>
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-amber-600" />
            1. 任務執行與時數統計
          </h2>
          <p className="text-stone-500 mb-8">請勾選執行過的任務，並設定投入的平均時數（以 0.5 小時為單位）：</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {SKILL_OPTIONS.map((option) => {
              const task = formData.tasks.find(t => t.name === option.label);
              return (
                <div 
                  key={option.id}
                  className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-200 ${
                    task ? 'border-amber-500 bg-amber-50' : 'border-stone-100 hover:border-stone-200 bg-white'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                      checked={!!task}
                      onChange={() => handleTaskToggle(option.label)}
                    />
                    <div className="flex items-center gap-2">
                      <span className={task ? 'text-amber-600' : 'text-stone-400'}>{option.icon}</span>
                      <span className="text-sm font-bold text-stone-700">{option.label}</span>
                    </div>
                  </label>

                  {task && (
                    <div className="flex items-center justify-between bg-white rounded-xl p-2 mt-auto border border-amber-200">
                      <button 
                        onClick={() => updateHours(option.label, -0.5)}
                        className="p-1 hover:bg-stone-100 rounded-lg text-stone-500"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-black text-amber-700">{task.hours} <span className="font-normal text-xs">小時</span></span>
                      <button 
                        onClick={() => updateHours(option.label, 0.5)}
                        className="p-1 hover:bg-stone-100 rounded-lg text-stone-500"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <label className="block text-sm font-bold text-stone-700 mb-3">其他任務執行（不包含在以上）：</label>
            <textarea 
              className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-50 outline-none transition-all resize-none h-28 bg-stone-50/50"
              placeholder="例如：特殊輔具操作、多語系溝通..."
              value={formData.otherTasks}
              onChange={(e) => setFormData(prev => ({ ...prev, otherTasks: e.target.value }))}
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <Heart className="text-rose-500" />
            2. 特別感興趣的項目
          </h2>
          <p className="text-stone-500 mb-8">請選擇您最感興趣或想發展的領域：</p>
          
          <div className="flex flex-wrap gap-3 mb-10">
            {INTEREST_OPTIONS.map((option) => (
              <button 
                key={option.id}
                onClick={() => handleInterestToggle(option.label)}
                className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all ${
                  formData.interests.includes(option.label)
                    ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-100'
                    : 'bg-white border-stone-100 text-stone-600 hover:border-stone-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-3">其他感興趣的項目：</label>
            <textarea 
              className="w-full p-4 rounded-2xl border-2 border-stone-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-50 outline-none transition-all resize-none h-28 bg-stone-50/50"
              placeholder="描述您的職業抱負或感興趣的特殊領域..."
              value={formData.otherInterests}
              onChange={(e) => setFormData(prev => ({ ...prev, otherInterests: e.target.value }))}
            />
          </div>
        </section>

        <div className="flex justify-center pt-8 print:hidden">
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-200 bg-amber-600 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 shadow-xl shadow-amber-100 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" /> 正在深度分析中...</>
            ) : (
              <><Sparkles className="mr-2 group-hover:animate-pulse" /> 生成適性分析報告</>
            )}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {showResult && (
        <div id="analysis-result" className="mt-16 md:mt-24 scroll-mt-10 print:mt-0">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-stone-400 print:hidden">
              <Loader2 className="animate-spin mb-4 text-amber-600" size={48} />
              <p className="text-xl animate-pulse">正在生成專業適性報告與雷達圖...</p>
            </div>
          ) : result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 print:space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:space-y-8">
                {/* Radar Chart Section */}
                <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-stone-100 p-8 print:shadow-none print:border-stone-200">
                  <h3 className="text-xl font-bold text-stone-800 mb-8 flex items-center gap-2">
                    <BarChart3 className="text-amber-600" size={24} />
                    適性雷達分析
                  </h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.radarData}>
                        <PolarGrid stroke="#e7e5e4" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 11, fontWeight: 'bold' }} />
                        <Radar
                          name="Competency"
                          dataKey="A"
                          stroke="#d97706"
                          strokeWidth={3}
                          fill="#d97706"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Personal Advice Section */}
                <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-stone-100 p-8 flex flex-col print:shadow-none print:border-stone-200">
                  <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <UserCircle className="text-amber-600" size={24} />
                    個人適性建議
                  </h3>
                  <div className="flex-1 text-stone-600 leading-relaxed space-y-4 text-lg">
                    {result.suitabilityAdvice.split('\n').map((para, i) => (
                      para.trim() && <p key={i}>{para}</p>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-stone-50 italic text-stone-400 text-sm print:mt-4 print:pt-4">
                    此建議專注於「照顧管家」核心職能發展與自我成長路徑。
                  </div>
                </div>
              </div>

              {/* AI Assistance Section */}
              <div className="bg-gradient-to-br from-amber-900 via-orange-950 to-stone-950 rounded-3xl shadow-2xl p-8 md:p-12 text-white relative overflow-hidden print:bg-white print:text-stone-800 print:shadow-none print:border print:border-stone-200">
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center p-3 bg-amber-500/20 rounded-2xl mb-6 backdrop-blur-xl border border-amber-400/20 print:hidden">
                    <Cpu className="text-amber-300" size={32} />
                  </div>
                  <h3 className="text-3xl font-bold mb-8 print:text-amber-900 print:text-2xl print:mb-4">AI 可以怎麼協助你</h3>
                  <div className="space-y-4">
                    {result.aiAssistance.split('\n').map((line, i) => {
                      const trimmedLine = line.trim();
                      if (!trimmedLine) return null;
                      // Detect if it's a list item
                      const isListItem = trimmedLine.startsWith('-') || trimmedLine.match(/^\d\./);
                      return (
                        <div key={i} className={`flex gap-3 ${isListItem ? 'pl-4' : 'font-bold text-orange-200 mt-4 print:text-orange-900'}`}>
                          {isListItem && <ArrowRight className="shrink-0 text-orange-400 mt-1.5" size={16} />}
                          <span className="text-lg print:text-base leading-relaxed">
                            {trimmedLine.replace(/^[-*]\s*/, '').replace(/^\d\.\s*/, '')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none print:hidden">
                  <Sparkles size={400} />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-12 pb-12 print:hidden">
                <button 
                  onClick={handleExportPDF}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-orange-100 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  <Download size={20} /> 匯出分析報告 (PDF)
                </button>
                <button 
                  onClick={() => {
                    setShowResult(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-stone-500 font-bold hover:text-amber-600 transition-colors flex items-center gap-2 px-6 py-2 rounded-full hover:bg-stone-100"
                >
                  重新調整資料
                </button>
              </div>
              
              {/* Footer text for print only */}
              <div className="hidden print:block text-center text-stone-400 text-xs pt-10">
                照顧管家適性判斷系統報告 - 由 AI 技術分析生成
              </div>
            </div>
          )}
        </div>
      )}

      {/* Styles for print */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
          }
          .max-w-5xl {
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
          header h1 {
            color: #44403c !important;
            font-size: 24pt;
          }
          #analysis-result {
            margin-top: 0;
          }
          .recharts-responsive-container {
            break-inside: avoid;
          }
          h3 {
            color: #b45309 !important;
          }
          .bg-stone-50 {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
