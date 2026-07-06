import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { GraduationCap, Moon, Sun } from "lucide-react";
import { ThemeProvider, useTheme } from "next-themes";

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	return (
		<button
			type="button"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
			aria-label="Toggle theme"
		>
			<Sun className="h-4 w-4 dark:hidden" />
			<Moon className="hidden h-4 w-4 dark:block" />
		</button>
	);
}

function RootLayout() {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			<div className="flex min-h-screen flex-col">
				<header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
					<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
						<Link to="/" className="flex items-center gap-2 font-semibold">
							<span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-zinc-900">
								<GraduationCap className="h-5 w-5" />
							</span>
							<span className="hidden sm:inline">High-Ticket Sales Mastery</span>
							<span className="sm:hidden">Sales Mastery</span>
						</Link>
						<ThemeToggle />
					</div>
				</header>
				<main className="flex-1">
					<Outlet />
				</main>
			</div>
		</ThemeProvider>
	);
}

export const Route = createRootRoute({
	component: RootLayout,
});
