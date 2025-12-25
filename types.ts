
export interface TaskEntry {
  name: string;
  hours: number;
}

export interface AssessmentData {
  userName: string;
  totalDailyHours: number;
  tasks: TaskEntry[];
  otherTasks: string;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
  webhookUrl: string;
  mode: 'api' | 'webhook';
}

export interface AnalysisResult {
  radarData: Array<{
    subject: string;
    A: number;
    fullMark: number;
  }>;
  pieData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  suitabilityAdvice: string;
  aiAssistance: string;
  tags: string[];
  summary: {
    userName: string;
    totalDailyHours: number;
    trackedHours: number;
    miscHours: number;
    otherTaskHours: number;
  };
}
