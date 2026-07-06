import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { LessonContent } from "@/components/LessonContent";
import { Sidebar } from "@/components/Sidebar";
import { getAdjacentLessons, getLesson } from "@/lib/course-data";
import { useProgressStore } from "@/lib/progress-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lesson/$moduleSlug/$lessonSlug")({
	loader: ({ params }) => {
		const found = getLesson(params.moduleSlug, params.lessonSlug);
		if (!found) throw notFound();
		return found;
	},
	component: LessonPage,
});

function LessonPage() {
	const { moduleSlug, lessonSlug } = Route.useParams();
	const { module: mod, lesson } = Route.useLoaderData();
	const { prev, next } = getAdjacentLessons(moduleSlug, lessonSlug);
	const complete = useProgressStore((s) => s.isComplete(moduleSlug, lessonSlug));
	const toggleComplete = useProgressStore((s) => s.toggleComplete);

	return (
		<div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
			<aside className="hidden lg:block">
				<Sidebar activeModuleSlug={moduleSlug} activeLessonSlug={lessonSlug} />
			</aside>

			<article className="min-w-0">
				<Link
					to="/"
					className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Full curriculum
				</Link>

				<p className="mb-1 text-sm font-medium text-amber-500">{mod.title}</p>
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
					{lesson.title}
				</h1>
				<div className="mt-3 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
					<span className="flex items-center gap-1">
						<Clock className="h-3.5 w-3.5" />
						{lesson.minutes} min
					</span>
					<span>{lesson.summary}</span>
				</div>

				<div className="mt-8">
					<LessonContent blocks={lesson.blocks} />
				</div>

				<div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
					<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
						Action step
					</p>
					<p className="text-zinc-800 dark:text-zinc-200">{lesson.action}</p>
				</div>

				<button
					type="button"
					onClick={() => toggleComplete(moduleSlug, lessonSlug)}
					className={cn(
						"mt-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition",
						complete
							? "border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-400"
							: "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600",
					)}
				>
					{complete ? (
						<CheckCircle2 className="h-4 w-4" />
					) : (
						<Circle className="h-4 w-4" />
					)}
					{complete ? "Marked complete" : "Mark as complete"}
				</button>

				<div className="mt-10 flex items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
					{prev ? (
						<Link
							to="/lesson/$moduleSlug/$lessonSlug"
							params={{
								moduleSlug: prev.module.slug,
								lessonSlug: prev.lesson.slug,
							}}
							className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
						>
							<ArrowLeft className="h-4 w-4" />
							{prev.lesson.title}
						</Link>
					) : (
						<span />
					)}
					{next ? (
						<Link
							to="/lesson/$moduleSlug/$lessonSlug"
							params={{
								moduleSlug: next.module.slug,
								lessonSlug: next.lesson.slug,
							}}
							className="flex items-center gap-2 text-right text-sm font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
						>
							{next.lesson.title}
							<ArrowRight className="h-4 w-4" />
						</Link>
					) : (
						<span />
					)}
				</div>
			</article>
		</div>
	);
}
