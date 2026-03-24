'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useCreateUniversity, useUpdateUniversity } from '@/lib/hooks/useUniversities';
import type { UniversityDetail, CreateUniversityInput } from '@/types/api';

interface UniversityModalProps {
  open:      boolean;
  onClose:   () => void;
  initial?:  UniversityDetail | null;
}

const EMPTY: CreateUniversityInput = {
  name:        '',
  website:     '',
  location:    '',
  type:        'PRIVATE',
  description: '',
  scrapeable:  true,
  scrapeUrls:  [],
};

export default function UniversityModal({ open, onClose, initial }: UniversityModalProps) {
  const [form, setForm]     = useState<CreateUniversityInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUniversityInput, string>>>({});
  const [urlInput, setUrlInput] = useState('');
  const toast                   = useToast();

  const createMutation = useCreateUniversity();
  const updateMutation = useUpdateUniversity(initial?.id ?? 0);

  const isSaving = createMutation.isMutating || updateMutation.isMutating;
  const isEdit   = !!initial;

  // Sync form when modal opens
  useEffect(() => {
    if (!open) return;
    
    if (initial) {
      setForm({
        name:        initial.name,
        website:     initial.website,
        location:    initial.location ?? '',
        type:        initial.type,
        description: initial.description ?? '',
        scrapeable:  initial.scrapeable,
        scrapeUrls:  initial.scrapeUrls ?? [],
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setUrlInput('');
  }, [initial, open]);

  if (!open) return null;

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name?.trim() || form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';
    if (!form.website?.trim())
      e.website = 'Website URL is required';
    else {
      try { new URL(form.website); }
      catch { e.website = 'Must be a valid URL (include https://)'; }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let finalScrapeUrls = [...(form.scrapeUrls ?? [])];
    if (urlInput.trim()) {
      try { new URL(urlInput.trim()); finalScrapeUrls.push(urlInput.trim()); } catch {}
    }

    const finalForm: CreateUniversityInput = { ...form, scrapeUrls: finalScrapeUrls };

    setForm(finalForm); 
  
    if (!validate()) return;

    try {
      if (isEdit) {
        await updateMutation.trigger(finalForm);
        toast.success('University updated successfully');
      } else {
        await createMutation.trigger(finalForm as CreateUniversityInput);
        toast.success('University added successfully');
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  function addUrl() {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput.trim());
      setForm(f => ({ ...f, scrapeUrls: [...(f.scrapeUrls ?? []), urlInput.trim()] }));
      setUrlInput('');
    } catch {
    }
  }

  function removeUrl(i: number) {
    setForm(f => ({ ...f, scrapeUrls: (f.scrapeUrls ?? []).filter((_, idx) => idx !== i) }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border-md)] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ animation: 'modal-in 0.2s var(--ease-spring) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {isEdit ? 'Edit university' : 'Add university'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

            <Input
              label="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. BRAC University"
              error={errors.name}
              required
            />

            <Input
              label="Website URL"
              type="url"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://www.bracu.ac.bd"
              error={errors.website}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Location"
                value={form.location ?? ''}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Dhaka"
              />
              <Select
                label="Type"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as 'PUBLIC' | 'PRIVATE' }))}
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Brief description…"
                className="
                  w-full rounded-[var(--radius-md)] border border-[var(--border-md)]
                  bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]
                  placeholder:text-[var(--text-tertiary)] resize-none
                  focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-40
                  hover:border-[var(--border-strong)] transition-colors
                "
              />
            </div>

            {/* Scrape URLs */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Scrape URLs <span className="normal-case font-normal text-[var(--text-tertiary)]">(optional, max 10)</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
                  placeholder="https://uni.edu/fees"
                  className="
                    flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--border-md)]
                    bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]
                    placeholder:text-[var(--text-tertiary)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-40
                  "
                />
                <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={13} />} onClick={addUrl}>
                  Add
                </Button>
              </div>
              {(form.scrapeUrls ?? []).length > 0 && (
                <ul className="space-y-1.5 mt-1">
                  {(form.scrapeUrls ?? []).map((url, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs bg-[var(--bg-subtle)] rounded-[var(--radius-md)] px-3 py-2">
                      <span className="flex-1 truncate font-mono text-[var(--text-secondary)]">{url}</span>
                      <button type="button" onClick={() => removeUrl(i)} className="text-[var(--text-tertiary)] hover:text-[var(--danger-text)] transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Scrapeable toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.scrapeable ?? true}
                  onChange={e => setForm(f => ({ ...f, scrapeable: e.target.checked }))}
                  className="sr-only"
                />
                <div
                  className="w-9 h-5 rounded-full transition-colors duration-200"
                  style={{ background: form.scrapeable ? 'var(--brand)' : 'var(--border-strong)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: form.scrapeable ? 'translateX(17px)' : 'translateX(2px)' }}
                  />
                </div>
              </div>
              <span className="text-sm text-[var(--text-primary)]">Enable scraping</span>
            </label>

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-cardshape-title)]">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add university'}
            </Button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}
