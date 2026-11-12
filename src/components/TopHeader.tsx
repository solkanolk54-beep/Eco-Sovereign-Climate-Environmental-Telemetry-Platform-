import React from 'react';
import { Menu, X } from 'lucide-react';
import type { ModuleId } from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';

interface TopHeaderProps {
  t: TranslationBundle;
  activeModule: ModuleId;
  onSelectModule: (mod: ModuleId) => void;
  onOpenReportModal: () => void;
}

const MODULE_ORDER: ModuleId[] = ['gis', 'hydrology', 'wildfire', 'analytics', 'architecture'];

export const TopHeader: React.FC<TopHeaderProps> = ({
  t,
  activeModule,
  onSelectModule,
  onOpenReportModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#070b12]/95 backdrop-blur border-b border-slate-800/90">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 lg:gap-8">
        {/* Zone 1: Brand Title (single line, no descriptor/pill) */}
        <button
          type="button"
          onClick={() => onSelectModule('gis')}
          className="text-sm sm:text-lg font-bold tracking-tight text-slate-100 hover:text-emerald-400 transition-colors whitespace-nowrap truncate max-w-[175px] sm:max-w-none cursor-pointer"
        >
          {t.brandTitle}
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav aria-label="Main modules" className="hidden lg:flex items-center gap-6">
          {MODULE_ORDER.map((mod) => {
            const isActive = activeModule === mod;
            return (
              <button
                key={mod}
                type="button"
                onClick={() => onSelectModule(mod)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {t.nav[mod]}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-emerald-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            {t.primaryCta}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 rounded-md border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile modules"
          className="lg:hidden border-t border-slate-800 bg-[#0b111d] px-4 py-3 flex flex-col gap-1"
        >
          {MODULE_ORDER.map((mod) => {
            const isActive = activeModule === mod;
            return (
              <button
                key={mod}
                type="button"
                onClick={() => {
                  onSelectModule(mod);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-start px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800/70'
                }`}
              >
                {t.nav[mod]}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
