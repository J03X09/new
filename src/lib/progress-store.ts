import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAllLessons } from "@/lib/course-data";

function key(moduleSlug: string, lessonSlug: string) {
	return `${moduleSlug}/${lessonSlug}`;
}

interface ProgressState {
	completed: Record<string, boolean>;
	isComplete: (moduleSlug: string, lessonSlug: string) => boolean;
	toggleComplete: (moduleSlug: string, lessonSlug: string) => void;
	completedCount: () => number;
}

export const useProgressStore = create<ProgressState>()(
	persist(
		(set, get) => ({
			completed: {},
			isComplete: (moduleSlug, lessonSlug) =>
				Boolean(get().completed[key(moduleSlug, lessonSlug)]),
			toggleComplete: (moduleSlug, lessonSlug) =>
				set((state) => {
					const k = key(moduleSlug, lessonSlug);
					const next = { ...state.completed };
					if (next[k]) {
						delete next[k];
					} else {
						next[k] = true;
					}
					return { completed: next };
				}),
			completedCount: () =>
				Object.keys(get().completed).filter((k) => get().completed[k])
					.length,
		}),
		{ name: "sales-course-progress" },
	),
);

export function totalLessonCount() {
	return getAllLessons().length;
}
