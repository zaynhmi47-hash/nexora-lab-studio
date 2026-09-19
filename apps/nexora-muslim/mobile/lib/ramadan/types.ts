export type RamadanDateStatus = 'expected' | 'outside_season';

export type RamadanTargets = {
  quranPages: number;
  dhikrCount: number;
  learningMinutes: number;
};

export type RamadanFastingSummary = {
  fastedDays: number;
  brokenDays: number;
  excusedDays: number;
};

export type RamadanDashboard = {
  isRamadan: boolean;
  year: number | null;
  day: number | null;
  startDate: string | null;
  endDate: string | null;
  dateStatus: RamadanDateStatus;
  sourceStatus: string;
  fasting: RamadanFastingSummary;
  targets: RamadanTargets;
};

export interface RamadanPort {
  getDashboard(): Promise<RamadanDashboard>;
}
