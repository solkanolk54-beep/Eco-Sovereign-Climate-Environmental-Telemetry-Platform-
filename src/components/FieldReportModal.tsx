import React, { useEffect, useState } from 'react';
import { Camera, Crosshair, Lock, X } from 'lucide-react';
import type { ReportCategory } from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';

interface FieldReportModalProps {
  t: TranslationBundle;
  isOpen: boolean;
  initialCoords: { lat: number; lng: number } | null;
  isOffline: boolean;
  onClose: () => void;
  onSubmitReport: (payload: {
    category: ReportCategory;
    details: string;
    lat: number;
    lng: number;
    is_anonymous: boolean;
    photo_attached: boolean;
    photo_name?: string;
  }) => Promise<{ ok: boolean; offlineQueued?: boolean; error?: string }>;
}

export const FieldReportModal: React.FC<FieldReportModalProps> = ({
  t,
  isOpen,
  initialCoords,
  isOffline,
  onClose,
  onSubmitReport,
}) => {
  const [category, setCategory] = useState<ReportCategory>('smoke_alert');
  const [details, setDetails] = useState('');
  const [lat, setLat] = useState('36.4503');
  const [lng, setLng] = useState('6.2644');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [photoName, setPhotoName] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialCoords) {
      setLat(initialCoords.lat.toFixed(4));
      setLng(initialCoords.lng.toFixed(4));
    }
  }, [initialCoords]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setLat('35.5559');
      setLng('6.1741');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
      },
      () => {
        setLat('35.5559');
        setLng('6.1741');
      },
      { timeout: 3500 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (details.trim().length < 5) {
      setErrorMsg(t.modal.validationDetails);
      return;
    }
    if (
      !Number.isFinite(parsedLat) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      !Number.isFinite(parsedLng) ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      setErrorMsg(t.modal.validationCoords);
      return;
    }

    setSubmitting(true);
    const res = await onSubmitReport({
      category,
      details: details.trim(),
      lat: parsedLat,
      lng: parsedLng,
      is_anonymous: isAnonymous,
      photo_attached: Boolean(photoName),
      photo_name: photoName,
    });
    setSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.error || t.modal.validationDetails);
      return;
    }

    setDetails('');
    setPhotoName(undefined);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="field-report-modal-title"
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 p-4"
    >
      <div className="bg-[#0c121e] border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2
              id="field-report-modal-title"
              className="text-lg font-bold text-emerald-400"
            >
              {t.modal.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              {t.modal.coordsCaptured}: {lat}, {lng}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.modal.cancel}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label htmlFor="report-lat" className="block text-xs text-slate-300 mb-1">
                Lat
              </label>
              <input
                id="report-lat"
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="report-lng" className="block text-xs text-slate-300 mb-1">
                Lng
              </label>
              <input
                id="report-lng"
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleUseGps}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.modal.useGps}</span>
            </button>
          </div>

          <div>
            <label htmlFor="report-category" className="block text-xs text-slate-300 mb-1">
              {t.modal.categoryLabel}
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="smoke_alert">{t.categories.smoke_alert}</option>
              <option value="illegal_logging">{t.categories.illegal_logging}</option>
              <option value="water_leak">{t.categories.water_leak}</option>
              <option value="sand_encroachment">{t.categories.sand_encroachment}</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-details" className="block text-xs text-slate-300 mb-1">
              {t.modal.detailsLabel}
            </label>
            <textarea
              id="report-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t.modal.detailsPlaceholder}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-emerald-500"
              />
              <Lock className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{t.modal.anonymousLabel}</span>
            </label>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs text-slate-300 cursor-pointer">
              <Camera className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{photoName ?? t.modal.photoLabel}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPhotoName(f ? f.name : undefined);
                }}
              />
            </label>
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              {t.modal.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {isOffline ? t.modal.submitOffline : t.modal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
