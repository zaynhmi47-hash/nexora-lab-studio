import React from 'react';
import { CourseReview } from '../../../types/courseExperience';
import { Card } from '../../../components/ui/Card';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';

interface CourseReviewsTabProps {
  reviews: CourseReview[];
  rating: number;
  ratingCount: number;
}

export const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({
  reviews,
  rating,
  ratingCount,
}) => {
  return (
    <div className="space-y-6">
      {/* Top summary card */}
      <Card padding="lg" className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {rating.toFixed(1)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(rating) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Based on {ratingCount.toLocaleString()} learner ratings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
              96% Positive Feedback
            </span>
          </div>
        </div>
      </Card>

      {/* Reviews list */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <span>Learner Testimonials ({reviews.length})</span>
        </h4>

        {reviews.map((rev) => (
          <Card key={rev.id} padding="md" className="border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={rev.userAvatar}
                  alt={rev.userName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">{rev.userName}</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rev.userHeadline}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-amber-500 shrink-0">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              "{rev.comment}"
            </p>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>{rev.createdAt}</span>
              <button
                type="button"
                className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Helpful ({rev.likes})</span>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
