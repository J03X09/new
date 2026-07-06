import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { course } from "@/lib/course-data";
import { useProgressStore } from "@/lib/progress-store";
import { cn } from "@/lib/utils";

export function Sidebar({
	activeModuleSlug,
	activeLessonSlug,
}: {
	activeModuleSlug: string;
	activeLessonSlug: string;
}) {
	return (
		<nav className="space-y-6 lg:sticky lg:top-20">
			{course.map((mod) => (
				<div key={mod.slug}>
					<p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
						{mod.title}
					</p>
					<ul className="space-y-0.5">
						{mod.lessons.map((lesson) => (
							<SidebarLesson
								key={lesson.slug}
								moduleSlug={mod.slug}
								lessonSlug={lesson.slug}
								title={lesson.title}
								active={
									mod.slug === activeModuleSlug &&
									lesson.slug === activeLessonSlug
								}
							/>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}

function SidebarLesson({
	moduleSlug,
	lessonSlug,
	title,
	active,
}: {
	moduleSlug: string;
	lessonSlug: string;
	title: string;
	active: boolean;
}) {
	const complete = useProgressStore((s) => s.isComplete(moduleSlug, lessonSlug));
	return (
		<li>
			<Link
				to="/lesson/$moduleSlug/$lessonSlug"
				params={{ moduleSlug, lessonSlug }}
				className={cn(
					"flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition",
					active
						? "bg-amber-400/15 font-medium text-amber-600 dark:text-amber-400"
						: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
				)}
			>
				{complete ? (
					<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
				) : (
					<Circle className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-700" />
				)}
				<span className="truncate">{title}</span>
			</Link>
		</li>
	);
}
