
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
  ChevronUp
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
  const [showNotionHelp, setShowNotionHelp] = useState(false);
  const [notionCopied, setNotionCopied] = useState(false);
  const [notionSaving, setNotionSaving] = useState(false);
  const [notionSuccess, setNotionSuccess] = useState(false);
  
  const [notionConfig, setNotionConfig] = useState<NotionConfig>(() => {
    const saved = localStorage.getItem('notion_config');
    return saved ? JSON.parse(saved) : { apiKey: '', databaseId: '', useProxy: true };
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

  const extractOtherTaskHours = (text: string): number => {
    const regex = /(\d+(\.\d+)?)\s*(小時|h|H)/g;
    let total = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      total += parseFloat(match[1]);
    }
    return total;
  };

  const generateNotionMarkdown = () => {
    if (!result) return "";
    const tagStr = result.tags.map(t => `\x60#${t}\x60`).join(' ');
    const scoreStr = result.radarData.map(d => `- **${d.subject}**: ${d.A}/100`).join('\n');
    const taskStr = formData.tasks.map(t => `- [x] ${t.name}: **${t.hours}h**`).join('\n');
    
    return `# 照顧管家職能鑑定：${result.summary.userName}
> 生成日期：${new Date().toLocaleDateString()}

${tagStr}

## 📊 核心職能評分
${scoreStr}

## ⏱️ 工時分配統計
- **上周總工時**: ${result.summary.totalWeeklyHours}h
- **已紀錄工時**: ${result.summary.trackedHours + result.summary.otherTaskHours}h
${taskStr}
${result.summary.otherTaskHours > 0 ? `- [x] 其他補充任務: **${result.summary.otherTaskHours}h**` : ''}

## 📝 資深主管適性評語
${result.suitabilityAdvice}

## 🤖 AI 協作轉型建議
${result.aiAssistance.split('\n').map(l => l.trim() ? `- ${l.replace(/^[-*]\s*/, '')}` : '').join('\n')}

---
*由「照顧管家適性判斷系統」自動生成*`;
  };

  const copyToNotion = () => {
    const md = generateNotionMarkdown();
    navigator.clipboard.writeText(md);
    setNotionCopied(true);
    setTimeout(() => setNotionCopied(false), 2000);
  };

  const handleSaveToNotionAPI = async () => {
    if (!notionConfig.apiKey || !notionConfig.databaseId) {
      alert("請先完成 Notion API 與資料庫 ID 的設定。");
      return;
    }

    setNotionSaving(true);
    try {
      const payload = {
        parent: { database_id: notionConfig.databaseId },
        properties: {
          "姓名": { title: [{ text: { content: result?.summary.userName || "" } }] },
          "上周總工時": { number: result?.summary.totalWeeklyHours || 0 },
          "人才標籤": { multi_select: result?.tags.map(tag => ({ name: tag })) || [] },
          "情感支持評分": { number: result?.radarData.find(d => d.subject === "情感支持與社交")?.A || 0 },
          "醫藥安全評分": { number: result?.radarData.find(d => d.subject === "醫藥安全監測")?.A || 0 },
          "行政管理評分": { number: result?.radarData.find(d => d.subject === "行政管理效能")?.A || 0 },
          "生活支援評分": { number: result?.radarData.find(d => d.subject === "生活支援實務")?.A || 0 },
          "活動策劃評分": { number: result?.radarData.find(d => d.subject === "活動策劃引導")?.A || 0 },
          "鑑定日期": { date: { start: new Date().toISOString().split('T')[0] } }
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ text: { content: '資深主管適性評語' } }] }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: result?.suitabilityAdvice.substring(0, 2000) || "" } }] }
          }
        ]
      };

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("API 呼叫受阻");
      }

      setNotionSuccess(true);
      setTimeout(() => {
        setNotionSuccess(false);
        setShowNotionModal(false);
      }, 2000);
    } catch (err: any) {
      alert("存入失敗：瀏覽器安全性限制 (CORS) 阻止了前端直連。建議：1. 使用「一鍵複製」手動貼上 2. 確認該資料庫已在 Notion 中設定「Add connections」連結到您的 Integration。");
    } finally {
      setNotionSaving(false);
    }
  };

  const runAnalysis = async () => {
    if (!formData.userName.trim()) {
      alert("請輸入姓名。");
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
      const otherTaskHours = extractOtherTaskHours(formData.otherTasks);
      const miscHours = Math.max(0, formData.totalWeeklyHours - trackedHours - otherTaskHours);
      const pieData = formData.tasks.map((t, idx) => ({
        name: t.name,
        value: t.hours,
        color: COLORS[idx % (COLORS.length - 2)]
      }));
      if (otherTaskHours > 0) pieData.push({ name: '其他任務補充', value: otherTaskHours, color: '#a8a29e' });
      pieData.push({ name: '移動或雜務時數', value: miscHours, color: '#e7e5e4' });

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
          otherTaskHours,
          miscHours
        }
      });
    } catch (error: any) {
      setErrorStatus("分析過程出錯，請確認 API Key。");
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
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <User className="text-amber-600" />
            1. 基本資訊收集
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-500 mb-2">姓名</label>
              <input type="text" className="w-full p-4 rounded-xl border-2 border-stone-100 outline-none focus:border-amber-500 transition-colors" placeholder="輸入照顧管家姓名" value={formData.userName} onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-500 mb-2">前周上班總時數</label>
              <input type="number" className="w-full p-4 rounded-xl border-2 border-stone-100 outline-none focus:border-amber-500 transition-colors" value={formData.totalWeeklyHours} onChange={(e) => setFormData(prev => ({ ...prev, totalWeeklyHours: Number(e.target.value) }))} />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-3">
            <Clock className="text-amber-600" />
            2. 任務與時數統計
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {SKILL_OPTIONS.map((option) => {
              const task = formData.tasks.find(t => t.name === option.label);
              return (
                <div key={option.id} className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${task ? 'border-amber-500 bg-amber-50' : 'border-stone-100 bg-white'}`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input type="checkbox" className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500" checked={!!task} onChange={() => handleTaskToggle(option.label)} />
                    <span className="text-sm font-bold text-stone-700">{option.label}</span>
                  </label>
                  {task && (
                    <div className="flex items-center justify-between bg-white rounded-xl p-2 mt-auto border border-amber-200 shadow-inner">
                      <button onClick={() => updateHours(option.label, -0.5)} className="p-1 text-stone-400 hover:text-amber-600"><Minus size={16} /></button>
                      <span className="text-sm font-black text-amber-700">{task.hours} 小時</span>
                      <button onClick={() => updateHours(option.label, 0.5)} className="p-1 text-stone-400 hover:text-amber-600"><Plus size={16} /></button>
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
            3. 感興趣項目
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {INTEREST_OPTIONS.map((option) => (
              <button key={option.id} onClick={() => handleInterestToggle(option.label)} className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all ${formData.interests.includes(option.label) ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'bg-white border-stone-100 text-stone-600'}`}>
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-center pt-8">
          <button onClick={runAnalysis} disabled={loading} className="px-12 py-5 font-bold text-white bg-amber-600 rounded-2xl shadow-xl hover:bg-amber-700 disabled:opacity-50 flex items-center gap-3">
            {loading ? <><Loader2 className="animate-spin" /> 分析中...</> : <><Sparkles /> 產出分析報告</>}
          </button>
        </div>
      </div>

      {showResult && !loading && result && (
        <div id="analysis-result" className="mt-16 animate-in fade-in slide-in-from-bottom-10">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 border-l-8 border-l-amber-600 mb-8">
            <h2 className="text-3xl font-bold text-stone-900">{result.summary.userName} 的評估報告</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.tags.map((tag, idx) => <span key={idx} className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">#{tag}</span>)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-stone-800"><BarChart3 className="text-amber-600" /> 職能分析</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={result.radarData}>
                    <PolarGrid stroke="#e7e5e4" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 11, fontWeight: 'bold' }} />
                    <Radar dataKey="A" stroke="#d97706" strokeWidth={3} fill="#d97706" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-800"><PieIcon className="text-amber-600" /> 工時分配</h3>
              <div className="h-[250px] w-full">
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

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 lg:p-12 mb-8">
            <h3 className="text-2xl font-bold mb-8 border-b pb-4">資深主管深度評語</h3>
            <div className="text-stone-700 leading-relaxed space-y-4 text-lg whitespace-pre-wrap">{result.suitabilityAdvice}</div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 pb-12 print:hidden">
            <button onClick={() => window.print()} className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"><Download size={20} /> 匯出 PDF</button>
            <button onClick={() => setShowNotionModal(true)} className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"><Share2 size={20} /> 確認並存入notion</button>
            <button onClick={() => setShowResult(false)} className="text-stone-400 font-bold px-8 py-4 hover:text-stone-700">返回修正</button>
          </div>
        </div>
      )}

      {showNotionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-stone-900 text-white p-2 rounded-lg"><Database size={24} /></div>
                <div>
                  <h3 className="text-2xl font-bold text-stone-900">Notion 資料同步</h3>
                  <p className="text-stone-500 text-sm italic">整合您的專業人才庫</p>
                </div>
              </div>
              <button onClick={() => setShowNotionModal(false)} className="text-stone-400 hover:text-stone-600"><Plus className="rotate-45" size={24} /></button>
            </div>

            <div className="space-y-4">
              {/* 教學導引區塊 */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <button 
                  onClick={() => setShowNotionHelp(!showNotionHelp)}
                  className="flex items-center justify-between w-full text-amber-800 font-bold text-sm"
                >
                  <span className="flex items-center gap-2"><HelpCircle size={16}/> 如何獲取金鑰與 ID？</span>
                  {showNotionHelp ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                {showNotionHelp && (
                  <div className="mt-4 text-xs text-amber-700 leading-relaxed space-y-2 border-t border-amber-200 pt-3">
                    <p><strong>1. API 金鑰：</strong>前往 <a href="https://www.notion.so/my-integrations" target="_blank" className="underline font-bold flex items-center gap-1 inline-flex">Notion Integrations <ExternalIcon size={10}/></a> 建立新項目並複製 Token。</p>
                    <p><strong>2. 資料庫 ID：</strong>打開瀏覽器中的 Notion 資料庫，URL 中在 <code>notion.so/</code> 之後、<code>?</code> 之前的那串 32 位代碼即是 ID。</p>
                    <p className="bg-amber-100 p-2 rounded font-bold"><strong>※ 必做：</strong>請至 Notion 頁面點擊右上方「...」→「Add connections」搜尋並連結您剛建立的 Integration，否則會失敗。</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase mb-1">Notion Integration Token</label>
                  <input type="password" placeholder="secret_..." className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:border-amber-500 text-sm" value={notionConfig.apiKey} onChange={(e) => setNotionConfig(prev => ({ ...prev, apiKey: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase mb-1">Database ID</label>
                  <input type="text" placeholder="32 位英數代碼" className="w-full p-3 rounded-xl border border-stone-200 outline-none focus:border-amber-500 text-sm" value={notionConfig.databaseId} onChange={(e) => setNotionConfig(prev => ({ ...prev, databaseId: e.target.value }))} />
                </div>
              </div>

              <button 
                onClick={handleSaveToNotionAPI}
                disabled={notionSaving || notionSuccess}
                className={`w-full mt-2 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${notionSuccess ? 'bg-green-600 text-white' : 'bg-stone-900 text-white hover:bg-black'}`}
              >
                {notionSaving ? <><Loader2 className="animate-spin" size={18} /> 儲存中...</> : notionSuccess ? <><Check size={18} /> 存入成功</> : <><Send size={18} /> 確認並存入notion</>}
              </button>

              <div className="relative py-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-100"></span></div><div className="relative flex justify-center text-[10px] uppercase font-bold text-stone-300 bg-white px-2">手動備案</div></div>

              <button onClick={copyToNotion} className={`w-full py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${notionCopied ? 'border-green-600 text-green-600' : 'border-stone-100 text-stone-600'}`}>
                {notionCopied ? <Check size={16}/> : <Copy size={16}/>} {notionCopied ? '已複製 Markdown' : '複製格式文字'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
