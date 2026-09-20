import React, { useState } from 'react';
import { Award, Video, ArrowRight } from 'lucide-react';
import { CertificationItem, WebinarItem } from '../../../types';
import { CertificationCard } from './CertificationCard';
import { WebinarCard } from './WebinarCard';

interface CertificationsWebinarsSectionProps {
  certifications: CertificationItem[];
  webinars: WebinarItem[];
  onSelectCertification: (cert: CertificationItem) => void;
  onSelectWebinar: (webinar: WebinarItem) => void;
}

export const CertificationsWebinarsSection: React.FC<CertificationsWebinarsSectionProps> = ({
  certifications,
  webinars,
  onSelectCertification,
  onSelectWebinar,
}) => {
  const [activeTab, setActiveTab] = useState<'certifications' | 'webinars'>('certifications');

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Credentials & Live Events
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Earn verified industry standard certifications or attend high-impact live masterclasses.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('certifications')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'certifications'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-500" />
            <span>Accredited Certs ({certifications.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webinars')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'webinars'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-500" />
            <span>Live Webinars ({webinars.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {certifications.slice(0, 4).map((cert) => (
            <CertificationCard
              key={cert.id}
              certification={cert}
              onSelect={onSelectCertification}
            />
          ))}
        </div>
      )}

      {activeTab === 'webinars' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {webinars.slice(0, 4).map((webinar) => (
            <WebinarCard
              key={webinar.id}
              webinar={webinar}
              onSelect={onSelectWebinar}
            />
          ))}
        </div>
      )}
    </section>
  );
};
