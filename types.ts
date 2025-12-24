
export interface TaskEntry {
  name: string;
  hours: number;
}

export interface AssessmentData {
  userName: string;
  totalWeeklyHours: number;
  tasks: TaskEntry[];
  otherTasks: string;
  interests: string[];
  otherInterests: string;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
  useProxy: boolean;
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
    totalWeeklyHours: number;
    trackedHours: number;
    miscHours: number;
    otherTaskHours: number;
  };
}
