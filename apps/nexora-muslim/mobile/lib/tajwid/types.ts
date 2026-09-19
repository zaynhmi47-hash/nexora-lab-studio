export type TajwidTopicId =
  | 'makharij'
  | 'sifat-huruf'
  | 'nun-sukun-tanwin'
  | 'mim-sukun'
  | 'mad'
  | 'qalqalah'
  | 'waqaf-ibtida';

export type TajwidLessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type TajwidTopic = {
  id: TajwidTopicId;
  title: string;
  shortDescription: string;
  order: number;
  status: TajwidLessonStatus;
  xpReward: number;
};

export type TajwidPracticeItem = {
  id: string;
  topicId: TajwidTopicId;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

export type TajwidProgress = {
  userId: string;
  completedTopicIds: TajwidTopicId[];
  practiceCompleted: number;
  assessmentCompleted: boolean;
  xpEarned: number;
};

export type TajwidAssessmentResult = {
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  xpEarned: number;
};

export interface TajwidPort {
  getTopics(): Promise<TajwidTopic[]>;
  getProgress(userId: string): Promise<TajwidProgress>;
  getPractice(topicId: TajwidTopicId): Promise<TajwidPracticeItem[]>;
  completePractice(userId: string, practiceId: string, correct: boolean): Promise<TajwidProgress>;
  completeTopic(userId: string, topicId: TajwidTopicId): Promise<TajwidProgress>;
  completeAssessment(
    userId: string,
    correctAnswers: number,
    totalQuestions: number,
  ): Promise<TajwidProgress>;
}
