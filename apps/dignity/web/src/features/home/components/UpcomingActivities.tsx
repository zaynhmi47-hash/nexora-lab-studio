import React from 'react';
import { Calendar, Video, FileText, HelpCircle, Users, Clock, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Card, CardBody } from '../../../components/ui/Card';
import { UpcomingEvent } from '../../../types';

export interface UpcomingActivitiesProps {
  events: UpcomingEvent[];
  onSelectEvent: (event: UpcomingEvent) => void;
}

export const UpcomingActivities: React.FC<UpcomingActivitiesProps> = ({
  events,
  onSelectEvent,
}) => {
  const getEventMeta = (type: UpcomingEvent['type']) => {
    switch (type) {
      case 'live_class':
        return {
          icon: <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
          badge: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',
          label: 'Live Masterclass',
        };
      case 'assignment_due':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50',
          label: 'Assignment Due',
        };
      case 'quiz_due':
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
          badge: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50',
          label: 'Module Quiz',
        };
      case 'mentorship_session':
        return {
          icon: <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
          badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50',
          label: 'Mentorship',
        };
    }
  };

  return (
    <Card elevation="subtle" className="border border-slate-200/90 dark:border-slate-800/90">
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Schedule
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Upcoming Activities
              </h3>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {events.length} sessions
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {events.map((event) => {
            const meta = getEventMeta(event.type);
            return (
              <div key={event.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.badge}`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                  </span>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{event.scheduledTime}</span>
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {event.title}
                </h4>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {event.courseTitle}
                  </span>

                  <button
                    onClick={() => onSelectEvent(event)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shrink-0"
                  >
                    <span>{event.linkText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
