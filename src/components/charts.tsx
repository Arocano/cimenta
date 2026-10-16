export function GanttChart({
  tasks,
  scale,
}: {
  tasks: { name: string; start: string; end: string }[];
  scale: string;
}) {
  if (!tasks.length) return <p className="text-sm text-muted-foreground">No hay rubros en el cronograma.</p>;
  const starts = tasks.map((task) => new Date(`${task.start}T12:00:00Z`).getTime());
  const ends = tasks.map((task) => new Date(`${task.end}T12:00:00Z`).getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends, min + 86400000);
  const day = 86400000;
  const width = scale === "dia" ? 26 : scale === "semana" ? 14 : scale === "mes" ? 5 : scale === "trimestre" ? 2.4 : 1;
  const totalDays = Math.max(1, Math.round((max - min) / day) + 1);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max space-y-2">
        {tasks.map((task) => {
          const left = Math.round((new Date(`${task.start}T12:00:00Z`).getTime() - min) / day);
          const span = Math.max(1, Math.round((new Date(`${task.end}T12:00:00Z`).getTime() - new Date(`${task.start}T12:00:00Z`).getTime()) / day) + 1);
          return (
            <div key={task.name + task.start} className="grid grid-cols-[14rem_1fr] items-center gap-3 text-sm">
              <span className="truncate">{task.name}</span>
              <div className="relative h-7 rounded bg-muted" style={{ width: totalDays * width }}>
                <div className="absolute top-1 h-5 rounded bg-primary" style={{ left: left * width, width: span * width }} title={`${task.start} → ${task.end}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
