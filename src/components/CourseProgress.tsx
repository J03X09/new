import { totalLessonCount, useProgressStore } from "@/lib/progress-store";

export function CourseProgress() {
	const completed = useProgressStore((s) => s.completedCount());
	const total = totalLessonCount();
	const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

	return (
		<div className="w-full">
			<div className="mb-2 flex items-center justify-between text-sm">
				<span className="font-medium text-zinc-700 dark:text-zinc-300">
					Your progress
				</span>
				<span className="text-zinc-500 dark:text-zinc-400">
					{completed} / {total} lessons ({pct}%)
				</span>
			</div>
			<div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
				<div
					className="h-full rounded-full bg-amber-400 transition-all duration-500"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
