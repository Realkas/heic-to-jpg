import { Settings2 } from 'lucide-react';
import type { ConversionSettings } from '../types/converter';

interface SettingsPanelProps {
  settings: ConversionSettings;
  onChange: (s: ConversionSettings) => void;
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const set = <K extends keyof ConversionSettings>(key: K, value: ConversionSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <section
      aria-labelledby="settings-title"
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <Settings2 className="w-4 h-4 text-indigo-500" />
        <h2 id="settings-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Налаштування конвертації
        </h2>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Quality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="quality-slider" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Якість JPG
            </label>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {settings.quality}%
            </span>
          </div>
          <input
            id="quality-slider"
            type="range"
            min={50}
            max={100}
            step={1}
            value={settings.quality}
            onChange={(e) => set('quality', Number(e.target.value))}
            className="w-full h-2 rounded-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>50% (менший розмір)</span>
            <span>100% (максимальна)</span>
          </div>
        </div>

        {/* Max width */}
        <div className="space-y-2">
          <label htmlFor="max-width" className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Макс. ширина (px)
          </label>
          <input
            id="max-width"
            type="number"
            min={1}
            max={99999}
            placeholder="Оригінальний розмір"
            value={settings.maxWidth ?? ''}
            onChange={(e) =>
              set('maxWidth', e.target.value === '' ? null : Math.max(1, Number(e.target.value)))
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Max height */}
        <div className="space-y-2">
          <label htmlFor="max-height" className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Макс. висота (px)
          </label>
          <input
            id="max-height"
            type="number"
            min={1}
            max={99999}
            placeholder="Оригінальний розмір"
            value={settings.maxHeight ?? ''}
            onChange={(e) =>
              set('maxHeight', e.target.value === '' ? null : Math.max(1, Number(e.target.value)))
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Checkboxes spanning full grid on mobile */}
        <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CheckboxItem
            id="keep-folder-structure"
            label="Зберігати структуру папок у ZIP"
            checked={settings.keepFolderStructure}
            onChange={(v) => set('keepFolderStructure', v)}
          />
          <CheckboxItem
            id="auto-convert"
            label="Автоматично конвертувати після вибору"
            checked={settings.autoConvert}
            onChange={(v) => set('autoConvert', v)}
          />
          <CheckboxItem
            id="strip-exif"
            label="Видаляти метадані EXIF"
            checked={settings.stripExif}
            onChange={(v) => set('stripExif', v)}
          />
        </div>
      </div>
    </section>
  );
}

interface CheckboxItemProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function CheckboxItem({ id, label, checked, onChange }: CheckboxItemProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all flex items-center justify-center">
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-slate-600 dark:text-slate-300 leading-tight">{label}</span>
    </label>
  );
}
