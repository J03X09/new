import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock, Layers, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import { CourseProgress } from "@/components/CourseProgress";
import { CurriculumList } from "@/components/CurriculumList";
import { course, getAllLessons } from "@/lib/course-data";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const allLessons = getAllLessons();
	const totalMinutes = allLessons.reduce((sum, l) => sum + l.lesson.minutes, 0);
	const first = allLessons[0];

	return (
		<div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
			<div className="mb-10">
				<p className="mb-3 text-sm font-medium uppercase tracking-wide text-amber-500">
					Zero to first close
				</p>
				<h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
					High-Ticket Sales Mastery
				</h1>
				<p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
					A complete, no-fluff course for beginners breaking into high-ticket
					sales — real frameworks (SPIN, Sandler, Challenger Sale, Straight
					Line, Never Split the Difference) and the mindset and closing
					techniques used by top-performing sellers.
				</p>
				<div className="mt-6 flex flex-wrap items-center gap-4">
					{first && (
						<Link
							to="/lesson/$moduleSlug/$lessonSlug"
							params={{
								moduleSlug: first.module.slug,
								lessonSlug: first.lesson.slug,
							}}
							className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 font-medium text-zinc-900 transition hover:bg-amber-300"
						>
							Start the course
							<ArrowRight className="h-4 w-4" />
						</Link>
					)}
				</div>
			</div>

			<div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
				<StatCard
					icon={<Layers className="h-4 w-4" />}
					label="Modules"
					value={String(course.length)}
				/>
				<StatCard
					icon={<ListChecks className="h-4 w-4" />}
					label="Lessons"
					value={String(allLessons.length)}
				/>
				<StatCard
					icon={<Clock className="h-4 w-4" />}
					label="Total time"
					value={`~${totalMinutes} min`}
				/>
			</div>

			<div className="mb-10 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
				<CourseProgress />
			</div>

			<h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
				Full curriculum
			</h2>
			<CurriculumList />
		</div>
	);
}

function StatCard({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
			<span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
				{icon}
			</span>
			<div>
				<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
					{value}
				</p>
				<p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
			</div>
		</div>
	);
}
