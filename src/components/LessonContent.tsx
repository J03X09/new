import { Quote, Sparkles } from "lucide-react";
import type { Block } from "@/lib/course-data";

export function LessonContent({ blocks }: { blocks: Block[] }) {
	return (
		<div className="space-y-6">
			{blocks.map((block, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static content, order never changes
				<BlockView key={i} block={block} />
			))}
		</div>
	);
}

function BlockView({ block }: { block: Block }) {
	switch (block.type) {
		case "p":
			return (
				<p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
					{block.text}
				</p>
			);
		case "list":
			return (
				<ul className="space-y-2">
					{block.items.map((item) => (
						<li
							key={item}
							className="flex gap-3 leading-relaxed text-zinc-700 dark:text-zinc-300"
						>
							<span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
							<span>{item}</span>
						</li>
					))}
				</ul>
			);
		case "quote":
			return (
				<blockquote className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
					<Quote className="h-5 w-5 shrink-0 text-amber-400" />
					<div>
						<p className="italic leading-relaxed text-zinc-800 dark:text-zinc-200">
							"{block.text}"
						</p>
						<cite className="mt-2 block text-sm not-italic text-zinc-500 dark:text-zinc-400">
							— {block.author}
						</cite>
					</div>
				</blockquote>
			);
		case "technique":
			return (
				<div className="rounded-lg border border-amber-300/50 bg-amber-50 p-5 dark:border-amber-400/20 dark:bg-amber-400/5">
					<div className="mb-2 flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-amber-500" />
						<p className="font-semibold text-zinc-900 dark:text-zinc-100">
							{block.name}
						</p>
						<span className="text-xs text-zinc-500 dark:text-zinc-400">
							— {block.source}
						</span>
					</div>
					<p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
						{block.text}
					</p>
				</div>
			);
		case "script":
			return (
				<div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
					<p className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
						Script: {block.title}
					</p>
					<div className="space-y-2 px-4 py-3 font-mono text-sm">
						{block.lines.map((line) => (
							<p key={line} className="leading-relaxed text-zinc-700 dark:text-zinc-300">
								{line}
							</p>
						))}
					</div>
				</div>
			);
		default:
			return null;
	}
}
