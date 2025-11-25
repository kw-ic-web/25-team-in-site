interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="h-2 flex-1 bg-progress-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-progress-fill transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="ml-4 text-sm font-medium text-option-muted">
          {current}/{total}
        </span>
      </div>
    </div>
  );
};
