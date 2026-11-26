import { FileText, Pause, Play, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TranslationBundle } from '../i18n/types';
import type { TranscriptLine } from '../types/toefl';

interface ListeningPlayerProps {
  drillId: string;
  transcript: TranscriptLine[];
  t: TranslationBundle;
}

export function ListeningPlayer({ drillId, transcript, t }: ListeningPlayerProps) {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined';
    setSpeechSupported(supported);
    if (!supported) {
      setShowTranscript(true);
    }
  }, []);

  const stopPlayback = () => {
    cancelledRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveLineIdx(null);
  };

  useEffect(() => {
    stopPlayback();
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [drillId]);

  const speakFromLine = (startIndex: number, playbackRate: number) => {
    if (!speechSupported || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    cancelledRef.current = false;

    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));

    const speakNext = (idx: number) => {
      if (cancelledRef.current || idx >= transcript.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveLineIdx(null);
        return;
      }

      const line = transcript[idx];
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = 'en-US';
      utterance.rate = playbackRate;
      if (enVoices.length > 0) {
        utterance.voice = enVoices[idx % enVoices.length];
      }

      setActiveLineIdx(idx);
      utterance.onend = () => {
        if (!cancelledRef.current) {
          speakNext(idx + 1);
        }
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveLineIdx(null);
        setShowTranscript(true);
      };

      window.speechSynthesis.speak(utterance);
    };

    setIsPlaying(true);
    setIsPaused(false);
    speakNext(startIndex);
  };

  const handlePlayPause = () => {
    if (!speechSupported) {
      setShowTranscript(true);
      return;
    }

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    speakFromLine(0, rate);
  };

  const cycleRate = () => {
    const next = rate === 1.0 ? 1.15 : rate === 1.15 ? 0.88 : 1.0;
    setRate(next);
    if (isPlaying && activeLineIdx !== null) {
      speakFromLine(activeLineIdx, next);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Volume2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <span>{t.audio.listeningTitle}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePlayPause}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 whitespace-nowrap shrink-0"
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.audio.pause}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.audio.play}</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={stopPlayback}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.audio.stop}</span>
            </button>
          )}

          <button
            type="button"
            onClick={cycleRate}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 tabular-nums transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
            aria-label={`${t.audio.speed} ${rate}x`}
          >
            <span>{rate.toFixed(2).replace(/\.00$/, '.0')}x</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{showTranscript ? t.audio.hideTranscript : t.audio.showTranscript}</span>
          </button>
        </div>
      </div>

      {!speechSupported && (
        <p className="mt-2.5 text-xs text-amber-800">{t.audio.fallbackNotice}</p>
      )}

      {showTranscript && (
        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
          {transcript.map((line, i) => {
            const active = activeLineIdx === i;
            return (
              <div
                key={`${drillId}-line-${i}`}
                className={`rounded-md px-3 py-2 text-sm leading-relaxed transition-colors ${
                  active ? 'bg-emerald-50 text-slate-900 ring-1 ring-emerald-200' : 'bg-white text-slate-700'
                }`}
              >
                <span className="font-semibold text-slate-900">{line.speaker}: </span>
                <span lang="en">{line.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
