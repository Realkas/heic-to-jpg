import type { StatsData } from '../types/converter';
import { formatBytes, compressionPercent } from '../lib/fileUtils';

interface StatsCardsProps {
  stats: StatsData;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const compressionPct = stats.totalOutputSize > 0
    ? compressionPercent(stats.totalOriginalSize, stats.totalOutputSize)
    : null;

  const cards = [
    {
      label: 'Додано',
      value: stats.total,
      color: 'text-slate-700 dark:text-slate-200',
      bg: 'bg-slate-50 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    {
      label: 'Готово',
      value: stats.done,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    {
      label: 'У процесі',
      value: stats.converting,
      color: 'text-indigo-700 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-800',
      dot: 'bg-indigo-500',
    },
    {
      label: 'Помилки',
      value: stats.errors,
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800',
      dot: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} ${card.bg} px-4 py-3 flex flex-col gap-0.5`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${card.dot} flex-shrink-0`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{card.label}</span>
            </div>
            <span className={`text-2xl font-bold ${card.color} tabular-nums`}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Size summary */}
      <div className="flex flex-wrap gap-4 px-1 text-sm text-slate-500 dark:text-slate-400">
        <span>
          Початковий розмір:{' '}
          <strong className="text-slate-700 dark:text-slate-300 font-semibold">
            {formatBytes(stats.totalOriginalSize)}
          </strong>
        </span>
        {stats.totalOutputSize > 0 && (
          <>
            <span>
              Розмір JPG:{' '}
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                {formatBytes(stats.totalOutputSize)}
              </strong>
            </span>
            {compressionPct !== null && (
              <span>
                Стиснення:{' '}
                <strong
                  className={
                    compressionPct > 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-red-500 dark:text-red-400 font-semibold'
                  }
                >
                  {compressionPct > 0 ? '-' : '+'}
                  {Math.abs(compressionPct)}%
                </strong>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
