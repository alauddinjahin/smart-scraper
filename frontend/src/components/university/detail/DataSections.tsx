import { ExternalLink, Calendar, Globe } from 'lucide-react';
import type { AdmissionInfo, TuitionFee, EligibilityCriteria, Scholarship } from '@/types/api';

function Section({ title, children, empty }: {
  title:    string;
  children: React.ReactNode;
  empty?:   string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden bg-glow-top">
      <div className="px-5 py-3.5 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="p-5">
        {children ?? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-4">{empty}</p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-tertiary)] w-44 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[var(--text-primary)] flex-1">{value}</span>
    </div>
  );
}

export function AdmissionSection({ data }: { data: AdmissionInfo | null }) {
  if (!data) {
    return (
      <Section title="Admission information" empty="No admission data scraped yet. Click Scrape to fetch." />
    );
  }
  return (
    <Section title="Admission information">
      <InfoRow label="Application deadline" value={data.applicationDeadline} />
      <InfoRow label="Intake months"        value={data.intakeMonths} />
      <InfoRow label="Requirements"         value={data.requirementsText} />
      {data.applyUrl && (
        <div className="mt-4">
          <a
            href={data.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2 h-8 px-3 rounded-[var(--radius-md)]
              text-xs font-medium bg-[var(--brand)] text-white
              hover:bg-[var(--brand-hover)] transition-colors
            "
          >
            <Globe size={12} /> Apply now <ExternalLink size={11} />
          </a>
        </div>
      )}
    </Section>
  );
}

// ── Tuition fees ──────────────────────────────────────────────────────────────
const PERIOD_LABEL: Record<string, string> = {
  'one-time':     'One-time',
  'per credit':   'Per credit',
  'per semester': 'Per semester',
  'per year':     'Per year',
};

export function FeesSection({ data }: { data: TuitionFee[] }) {
  if (!data.length) {
    return <Section title="Tuition fees" empty="No fee data scraped yet." />;
  }
  return (
    <Section title="Tuition fees">
      <div className="overflow-x-auto -mx-5 -mb-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              {['Program', 'Amount', 'Currency', 'Period'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(fee => (
              <tr key={fee.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                <td className="px-5 py-3 text-[var(--text-primary)]">{fee.program}</td>
                <td className="px-5 py-3 font-mono font-medium text-[var(--text-primary)]">
                  {fee.amountLocal?.toLocaleString() ?? '—'}
                </td>
                <td className="px-5 py-3 text-[var(--text-secondary)] text-xs">{fee.currency}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                    {PERIOD_LABEL[fee.period] ?? fee.period}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ── Eligibility ───────────────────────────────────────────────────────────────
export function EligibilitySection({ data }: { data: EligibilityCriteria | null }) {
  if (!data) {
    return <Section title="Eligibility criteria" empty="No eligibility data scraped yet." />;
  }
  return (
    <Section title="Eligibility criteria">
      <InfoRow label="Minimum GPA / result" value={data.minGPA} />
      <InfoRow label="Language requirements" value={data.languageReqs} />
      <InfoRow label="Other requirements"    value={data.otherRequirements} />
    </Section>
  );
}

// ── Scholarships ──────────────────────────────────────────────────────────────
export function ScholarshipsSection({ data }: { data: Scholarship[] }) {
  if (!data.length) {
    return <Section title="Scholarships" empty="No scholarship data scraped yet." />;
  }
  return (
    <Section title="Scholarships">
      <div className="grid gap-3">
        {data.map(s => (
          <div
            key={s.id}
            className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-cardshape-title)]"
          >
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1.5">{s.name}</p>
            {s.amount && (
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="text-[var(--text-tertiary)]">Amount:</span> {s.amount}
              </p>
            )}
            {s.eligibility && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                <span className="text-[var(--text-tertiary)]">Eligibility:</span> {s.eligibility}
              </p>
            )}
            {s.deadline && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                <Calendar size={11} className="text-[var(--text-tertiary)]" />
                {s.deadline}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
