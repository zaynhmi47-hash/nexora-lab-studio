import type {
  TajwidPort,
  TajwidPracticeItem,
  TajwidProgress,
  TajwidTopic,
  TajwidTopicId,
} from './types';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const topics: TajwidTopic[] = [
  {
    id: 'makharij',
    title: 'Makharijul Huruf',
    shortDescription: 'Mengenal tempat keluarnya huruf hijaiyah.',
    order: 1,
    status: 'completed',
    xpReward: 30,
  },
  {
    id: 'sifat-huruf',
    title: 'Sifat Huruf',
    shortDescription: 'Mengenal karakter dan sifat utama huruf.',
    order: 2,
    status: 'in_progress',
    xpReward: 30,
  },
  {
    id: 'nun-sukun-tanwin',
    title: 'Nun Sukun & Tanwin',
    shortDescription: 'Mempelajari hukum bacaan nun sukun dan tanwin.',
    order: 3,
    status: 'available',
    xpReward: 40,
  },
  {
    id: 'mim-sukun',
    title: 'Mim Sukun',
    shortDescription: 'Mempelajari hukum bacaan mim sukun.',
    order: 4,
    status: 'locked',
    xpReward: 40,
  },
  {
    id: 'mad',
    title: 'Mad',
    shortDescription: 'Memahami dasar panjang-pendek bacaan mad.',
    order: 5,
    status: 'locked',
    xpReward: 40,
  },
  {
    id: 'qalqalah',
    title: 'Qalqalah',
    shortDescription: 'Berlatih karakter pantulan pada huruf qalqalah.',
    order: 6,
    status: 'locked',
    xpReward: 40,
  },
  {
    id: 'waqaf-ibtida',
    title: "Waqaf & Ibtida'",
    shortDescription: 'Memahami dasar berhenti dan memulai bacaan.',
    order: 7,
    status: 'locked',
    xpReward: 50,
  },
];

const practice: Record<TajwidTopicId, TajwidPracticeItem[]> = {
  makharij: [
    {
      id: 'makharij-1',
      topicId: 'makharij',
      prompt: 'Apa yang dipelajari dalam Makharijul Huruf?',
      options: ['Tempat keluarnya huruf', 'Jenis perjalanan', 'Sejarah mushaf', 'Perhitungan zakat'],
      correctOptionIndex: 0,
      explanation: 'Makharijul Huruf membahas tempat keluarnya huruf saat dilafalkan.',
    },
  ],
  'sifat-huruf': [
    {
      id: 'sifat-1',
      topicId: 'sifat-huruf',
      prompt: 'Apa fokus utama pembelajaran Sifat Huruf?',
      options: ['Karakteristik huruf saat dibaca', 'Jadwal shalat', 'Arah kiblat', 'Manasik haji'],
      correctOptionIndex: 0,
      explanation: 'Sifat Huruf membantu memahami karakteristik bunyi huruf ketika dilafalkan.',
    },
  ],
  'nun-sukun-tanwin': [
    {
      id: 'nun-1',
      topicId: 'nun-sukun-tanwin',
      prompt: 'Topik apa yang menjadi fokus bab ini?',
      options: ['Hukum nun sukun dan tanwin', 'Hukum waris', 'Bahasa isyarat', 'Sejarah Andalusia'],
      correctOptionIndex: 0,
      explanation: 'Bab ini memperkenalkan hukum bacaan yang berkaitan dengan nun sukun dan tanwin.',
    },
  ],
  'mim-sukun': [
    {
      id: 'mim-1',
      topicId: 'mim-sukun',
      prompt: 'Bab Mim Sukun membahas apa?',
      options: ['Hukum bacaan mim sukun', 'Tata cara wudhu', 'Ilmu falak', 'Adab bertamu'],
      correctOptionIndex: 0,
      explanation: 'Bab ini membahas kaidah bacaan yang berkaitan dengan mim sukun.',
    },
  ],
  mad: [
    {
      id: 'mad-1',
      topicId: 'mad',
      prompt: 'Apa konsep dasar yang dikenalkan dalam bab Mad?',
      options: ['Panjang-pendek bacaan', 'Pembagian warisan', 'Arah kiblat', 'Kalender hijriah'],
      correctOptionIndex: 0,
      explanation: 'Mad berkaitan dengan pemanjangan suara dalam bacaan sesuai kaidahnya.',
    },
  ],
  qalqalah: [
    {
      id: 'qalqalah-1',
      topicId: 'qalqalah',
      prompt: 'Apa yang dilatih dalam bab Qalqalah?',
      options: ['Pantulan suara pada huruf tertentu', 'Kecepatan membaca', 'Terjemahan bahasa Arab', 'Tata cara safar'],
      correctOptionIndex: 0,
      explanation: 'Qalqalah adalah karakter pantulan suara pada huruf-huruf tertentu dalam kondisi yang sesuai.',
    },
  ],
  'waqaf-ibtida': [
    {
      id: 'waqaf-1',
      topicId: 'waqaf-ibtida',
      prompt: "Apa fokus dasar Waqaf & Ibtida'?",
      options: ['Berhenti dan memulai bacaan dengan tepat', 'Menghitung zakat', 'Mencari arah kiblat', 'Membuat jadwal belajar'],
      correctOptionIndex: 0,
      explanation: "Waqaf berkaitan dengan berhenti, sedangkan ibtida' berkaitan dengan memulai bacaan.",
    },
  ],
};

const completedPracticeIds = new Set<string>(['makharij-1']);

let progress: TajwidProgress = {
  userId: DEMO_USER_ID,
  completedTopicIds: ['makharij'],
  practiceCompleted: 1,
  assessmentCompleted: false,
  xpEarned: 30,
};

function cloneProgress(): TajwidProgress {
  return {
    ...progress,
    completedTopicIds: [...progress.completedTopicIds],
  };
}

export const mockTajwid: TajwidPort = {
  async getTopics() {
    return topics.map((topic) => ({ ...topic }));
  },

  async getProgress(userId) {
    if (userId !== progress.userId) return { ...cloneProgress(), userId };
    return cloneProgress();
  },

  async getPractice(topicId) {
    return (practice[topicId] ?? []).map((item) => ({
      ...item,
      options: [...item.options],
    }));
  },

  async completePractice(userId, practiceId, correct) {
    if (userId !== progress.userId) progress = { ...progress, userId };
    if (!completedPracticeIds.has(practiceId)) {
      completedPracticeIds.add(practiceId);
      progress = {
        ...progress,
        practiceCompleted: progress.practiceCompleted + 1,
        xpEarned: progress.xpEarned + (correct ? 5 : 0),
      };
    }
    return cloneProgress();
  },

  async completeTopic(userId, topicId) {
    if (userId !== progress.userId) progress = { ...progress, userId };

    if (!progress.completedTopicIds.includes(topicId)) {
      const topic = topics.find((item) => item.id === topicId);
      progress = {
        ...progress,
        completedTopicIds: [...progress.completedTopicIds, topicId],
        xpEarned: progress.xpEarned + (topic?.xpReward ?? 0),
      };
    }

    return cloneProgress();
  },

  async completeAssessment(userId, correctAnswers, totalQuestions) {
    if (userId !== progress.userId) progress = { ...progress, userId };
    const passed = totalQuestions > 0 && correctAnswers / totalQuestions >= 0.7;
    const reward = passed && !progress.assessmentCompleted ? 100 : 0;

    progress = {
      ...progress,
      assessmentCompleted: progress.assessmentCompleted || passed,
      xpEarned: progress.xpEarned + reward,
    };

    return cloneProgress();
  },
};
