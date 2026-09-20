import {
  Award,
  BookOpen,
  ChevronRight,
  Flame,
  GraduationCap,
  Settings,
  Trophy,
} from 'lucide-react';
import type {
  Achievement,
  AppRoute,
  Certificate,
  Course,
  User,
} from '../../types';

export interface ProfileScreenProps {
  user: User;
  certificates: Certificate[];
  achievements: Achievement[];
  completedCourses: Course[];
  onSelectCourse: (course: Course) => void;
  onNavigate: (route: AppRoute, params?: Record<string, unknown>) => void;
}

export function ProfileScreen({
  user,
  certificates,
  achievements,
  completedCourses,
  onSelectCourse,
  onNavigate,
}: ProfileScreenProps) {
  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="h-28 bg-slate-900" />

          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-slate-200 text-2xl font-bold shadow-sm">
                  {(user.name ?? 'U').slice(0, 1).toUpperCase()}
                </div>

                <div className="pb-1">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <Flame className="mb-2 h-5 w-5" />
                <strong className="block text-xl">7</strong>
                <span className="text-xs text-slate-500">Day streak</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <BookOpen className="mb-2 h-5 w-5" />
                <strong className="block text-xl">{completedCourses.length}</strong>
                <span className="text-xs text-slate-500">Courses completed</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <Trophy className="mb-2 h-5 w-5" />
                <strong className="block text-xl">{achievements.length}</strong>
                <span className="text-xs text-slate-500">Achievements</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Achievements</h2>
                <p className="mt-1 text-sm text-slate-500">Milestones you have unlocked.</p>
              </div>
              <Award className="h-5 w-5 text-slate-500" />
            </div>

            <div className="space-y-3">
              {achievements.slice(0, 5).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}

              {achievements.length === 0 && (
                <p className="text-sm text-slate-500">No achievements yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Certificates</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your earned credentials.
                </p>
              </div>
              <GraduationCap className="h-5 w-5 text-slate-500" />
            </div>

            <div className="space-y-3">
              {certificates.slice(0, 4).map((certificate) => (
                <div
                  key={certificate.id}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{certificate.courseTitle}</p>
                    <p className="text-xs text-slate-500">
                      {certificate.issuedAt}
                    </p>
                  </div>
                </div>
              ))}

              {certificates.length === 0 && (
                <p className="text-sm text-slate-500">No certificates yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5">
            <h2 className="font-bold">Completed courses</h2>
            <p className="mt-1 text-sm text-slate-500">
              Continue reviewing what you have learned.
            </p>
          </div>

          <div className="space-y-2">
            {completedCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course)}
                className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-xs text-slate-500">
                    {course.instructor?.name ?? 'Dignity Learning'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}

            {completedCourses.length === 0 && (
              <p className="text-sm text-slate-500">
                You have not completed a course yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
