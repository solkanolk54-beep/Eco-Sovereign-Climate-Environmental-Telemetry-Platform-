import React from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { Language } from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';

interface WorkspaceToolbarProps {
  t: TranslationBundle;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
  isOfflineSimulated: boolean;
  onToggleOffline: () => void;
  queuedCount: number;
  isSyncing: boolean;
  onSyncQueued: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  t,
  language,
  onChangeLanguage,
  isOfflineSimulated,
  onToggleOffline,
  queuedCount,
  isSyncing,
  onSyncQueued,
}) => {
  return (
    <div className="bg-[#0b111d] border-b border-slate-800/80">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left/Start: Connectivity status & ecosystem transect (unboxed clean text) */}
        <div className="flex flex-wrap items-center gap-3 text-slate-400">
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              isOfflineSimulated ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isOfflineSimulated ? (
              <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {isOfflineSimulated ? t.toolbar.connectivityOffline : t.toolbar.connectivityOnline}
            </span>
          </span>
          <span aria-hidden="true" className="text-slate-600 hidden sm:inline">
            ·
          </span>
          <span className="hidden sm:inline text-slate-400">{t.toolbar.ecosystemFocus}</span>
        </div>

        {/* Right/End: Offline controls, queue sync, and Language Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {queuedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono tabular-nums text-amber-300">
                {queuedCount} {t.toolbar.queuedLabel}
              </span>
              {!isOfflineSimulated && (
                <button
                  type="button"
                  onClick={onSyncQueued}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{t.toolbar.syncPending}</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onToggleOffline}
            aria-pressed={isOfflineSimulated}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isOfflineSimulated
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {t.toolbar.simulateOffline}
          </button>

          <div
            role="group"
            aria-label="Language selector"
            className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5"
          >
            {(['ar', 'en', 'fr'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onChangeLanguage(lang)}
                aria-pressed={language === lang}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  language === lang
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {lang === 'ar' ? 'العربية' : lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
