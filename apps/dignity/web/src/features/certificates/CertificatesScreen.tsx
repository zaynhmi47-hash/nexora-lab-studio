import React from 'react';
import { Award, CheckCircle2, Share2, ExternalLink } from 'lucide-react';
import { Certificate } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';

export interface CertificatesScreenProps {
  certificates: Certificate[];
}

export const CertificatesScreen: React.FC<CertificatesScreenProps> = ({ certificates }) => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Verified Certificates & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Cryptographically signed digital credentials verifying coursework completion and capstone evaluations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => (
          <Card key={cert.id} padding="lg" className="border-l-4 border-l-blue-600 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <Badge variant="success" size="sm">
                  Verified by Institution
                </Badge>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                {cert.courseTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instructor & Assessor: <strong>{cert.instructorName}</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Conferred: {cert.issuedAt}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                  Validated Competencies:
                </span>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cert.skillsValidated.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-slate-500">
                ID: {cert.verificationCode}
              </span>
              <div className="flex items-center gap-2">
                <SecondaryButton
                  size="sm"
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                  onClick={() => alert(`Credential link for ${cert.verificationCode} copied`)}
                >
                  Share
                </SecondaryButton>
                <PrimaryButton
                  size="sm"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => alert(`Opening verification registry for ${cert.verificationCode}`)}
                >
                  View Credential
                </PrimaryButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
