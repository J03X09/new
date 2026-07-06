import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { course } from "@/lib/course-data";
import { useProgressStore } from "@/lib/progress-store";
import { cn } from "@/lib/utils";

export function CurriculumList() {
	return (
		<div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
			{course.map((mod, i) => (
				<details key={mod.slug} open={i === 0} className="group">
					<summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900">
						<div>
							<p className="font-medium text-zinc-900 dark:text-zinc-100">
								{mod.title}
							</p>
							<p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
								{mod.description}
							</p>
						</div>
						<ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
					</summary>
					<ul className="border-t border-zinc-100 dark:border-zinc-800">
						{mod.lessons.map((lesson) => (
							<LessonRow
								key={lesson.slug}
								moduleSlug={mod.slug}
								lessonSlug={lesson.slug}
								title={lesson.title}
								minutes={lesson.minutes}
							/>
						))}
					</ul>
				</details>
			))}
		</div>
	);
}

function LessonRow({
	moduleSlug,
	lessonSlug,
	title,
	minutes,
}: {
	moduleSlug: string;
	lessonSlug: string;
	title: string;
	minutes: number;
}) {
	const complete = useProgressStore((s) => s.isComplete(moduleSlug, lessonSlug));
	return (
		<li>
			<Link
				to="/lesson/$moduleSlug/$lessonSlug"
				params={{ moduleSlug, lessonSlug }}
				className="flex items-center gap-3 px-5 py-3 pl-8 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
			>
				{complete ? (
					<CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
				) : (
					<Circle className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
				)}
				<span
					className={cn(
						"flex-1 text-zinc-700 dark:text-zinc-300",
						complete && "text-zinc-400 dark:text-zinc-500",
					)}
				>
					{title}
				</span>
				<span className="text-xs text-zinc-400 dark:text-zinc-500">
					{minutes} min
				</span>
			</Link>
		</li>
	);
}
