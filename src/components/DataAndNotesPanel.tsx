import {
  Check,
  Copy,
  Download,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { getCanonicalUrlForLang } from '../config/seo';
import type { TranslationBundle } from '../i18n/types';
import type { StudyNote, SupportedLang, UserProgress } from '../types/toefl';
import { getTodayIsoDate, sanitizeProgress } from '../utils/storage';

interface DataAndNotesPanelProps {
  lang: SupportedLang;
  t: TranslationBundle;
  progress: UserProgress;
  onImportProgress: (next: UserProgress) => void;
  onResetProgress: () => void;
  onAddNote: (note: StudyNote) => void;
  onDeleteNote: (id: string) => void;
}

export function DataAndNotesPanel({
  lang,
  t,
  progress,
  onImportProgress,
  onResetProgress,
  onAddNote,
  onDeleteNote,
}: DataAndNotesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const handleExport = () => {
    const payload = JSON.stringify(progress, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toeflcue-progress-${getTodayIsoDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== 'object' || !('sectionStats' in parsed)) {
        throw new Error('Invalid schema');
      }
      const clean = sanitizeProgress(parsed);
      onImportProgress(clean);
      setStatusMessage({ type: 'ok', text: t.dataPanel.importSuccess });
    } catch {
      setStatusMessage({ type: 'err', text: t.dataPanel.importError });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getCanonicalUrlForLang(lang);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatusMessage({ type: 'ok', text: shareUrl });
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() && !noteTitle.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      section: 'general',
      title: noteTitle.trim() || 'TOEFL Note',
      content: noteContent.trim(),
      updatedAt: new Date().toISOString(),
    });
    setNoteTitle('');
    setNoteContent('');
  };

  return (
    <section
      className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="data-panel-heading"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="data-panel-heading" className="text-lg font-bold tracking-tight text-slate-900">
            {t.dataPanel.title}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">{t.dataPanel.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.dataPanel.exportJson}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.dataPanel.importJson}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="sr-only"
            aria-label={t.dataPanel.importJson}
          />

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copied ? t.dataPanel.copiedLink : t.dataPanel.copyLink}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-800 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-900 whitespace-nowrap shrink-0"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.dataPanel.printSheet}</span>
          </button>

          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.dataPanel.resetProgress}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmingReset(false);
                }}
                className="inline-flex h-10 items-center rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-rose-700 whitespace-nowrap shrink-0"
              >
                {t.dataPanel.confirmReset}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                {t.dataPanel.cancelReset}
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <p
          className={`mt-3 text-xs font-semibold ${
            statusMessage.type === 'ok' ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {statusMessage.text}
        </p>
      )}

      {/* Personal Study Notes */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-bold text-slate-900">{t.dataPanel.notesHeading}</h3>

        <form onSubmit={handleCreateNote} className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_2fr_auto]">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder={t.dataPanel.noteTitlePlaceholder}
            maxLength={120}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:bg-white focus:outline-none"
          />
          <input
            type="text"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder={t.dataPanel.noteContentPlaceholder}
            maxLength={500}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.dataPanel.addNote}</span>
          </button>
        </form>

        {progress.notes.length > 0 && (
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {progress.notes.map((note) => (
              <li
                key={note.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">{note.title}</p>
                  {note.content && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{note.content}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                  aria-label={`${t.dataPanel.deleteNote}: ${note.title}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
