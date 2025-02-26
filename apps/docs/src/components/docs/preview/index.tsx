'use client';
import { AppWindowIcon, CodeIcon, TerminalIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ComponentProps, useEffect, useState } from 'react';
import {
	SandboxCodeEditor,
	SandboxConsole,
	SandboxFileExplorer,
	SandboxLayout,
	SandboxPreview,
	SandboxProvider,
	SandboxTabs,
	SandboxTabsContent,
	SandboxTabsList,
	SandboxTabsTrigger,
} from '~/components/docs/preview/sandbox';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '~/components/docs/resizable';
import { cn } from '~/lib/cn';

// ----- Constants -----

/**
 * TypeScript config used in sandboxes
 */
const tsconfig = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`;

/**
 * Utility functions used in sandboxes
 */
const utils = `
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function setupDarkMode() {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
		document.documentElement.classList.toggle('dark', e.matches);
		document.documentElement.classList.toggle('light', !e.matches);
	};

	handleChange(mediaQuery);
	mediaQuery.addEventListener('change', handleChange);
	return () => mediaQuery.removeEventListener('change', handleChange);
}

export function clearLocalStorage() {
	if (typeof window !== 'undefined') {
		try {
			localStorage.clear();
		} catch (error) {
			console.warn('Error during cleanup:', error);
		}
	}
}
`;

/**
 * Basic app component for React sandboxes
 */
const appTsx = `
import { setupDarkMode } from './lib/utils';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => setupDarkMode(), []);
  return null;
}`;

// ----- Type Definitions -----

/**
 * Sandbox template types
 */
type SandboxTemplate =
	| 'react'
	| 'react-ts'
	| 'vanilla'
	| 'vanilla-ts'
	| 'vue'
	| 'vue-ts'
	| 'angular'
	| 'nextjs'
	| 'vite'
	| 'vite-react'
	| 'vite-react-ts';

/**
 * Props for the Preview component
 */
export type PreviewProps = {
	/** Name/identifier for the preview */
	name: string;
	/** Code content, either as a string or map of files */
	code: string | Record<string, string>;
	/** Optional extra dependencies to include */
	dependencies?: Record<string, string>;
	/** Default file to show in the editor */
	defaultFile?: string;
	/** Template type (react-ts, etc.) */
	template?: SandboxTemplate;
};

/**
 * Props for the PreviewProvider component
 */
type PreviewProviderProps = Omit<
	ComponentProps<typeof SandboxProvider>,
	'theme'
>;

// ----- Utility Functions -----

/**
 * Prepare sandbox files from code input
 */
function prepareSandboxFiles(
	code: string | Record<string, string>,
	defaultFile: string
): ComponentProps<typeof SandboxProvider>['files'] {
	const baseFiles = {
		'/tsconfig.json': tsconfig,
		'/lib/utils.ts': utils,
	};

	if (typeof code === 'string') {
		const normalizedDefaultFile = defaultFile.startsWith('/')
			? defaultFile
			: `/${defaultFile}`;

		return Object.assign({}, baseFiles, {
			[normalizedDefaultFile]: code,
		});
	}

	const codeFiles = Object.entries(code).reduce(
		(acc, [filename, content]) => {
			const normalizedFilename = filename.startsWith('/')
				? filename
				: `/${filename}`;
			acc[normalizedFilename] = content;
			return acc;
		},
		{} as Record<string, string>
	);

	return Object.assign({}, baseFiles, codeFiles);
}

/**
 * Get external resources based on template
 */
function getExternalResources(template: SandboxTemplate): string[] {
	const resources: string[] = [];

	// Add Tailwind for React TS templates
	if (template === 'react-ts') {
		resources.push('https://unpkg.com/@tailwindcss/browser@4');
	}

	// Add fonts for all templates
	resources.push(
		'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
	);

	return resources;
}

/**
 * Get dependencies based on template and user-provided dependencies
 */
function getDependencies(
	template: SandboxTemplate,
	userDependencies: Record<string, string> = {}
): Record<string, string> {
	const dependencies = Object.assign({}, userDependencies);

	// Add template-specific dependencies
	if (template === 'react-ts') {
		dependencies['@c15t/react'] = 'latest';
	}

	// Add common dependencies
	dependencies['@c15t/dev-tools'] = 'latest';

	return dependencies;
}

// ----- Components -----

/**
 * Loading skeleton component when the preview is initializing
 */
const PreviewSkeleton = () => (
	<div className="not-prose relative max-h-[30rem]">
		<div className="flex min-h-[30rem] items-center justify-center dark:bg-[#18191c]">
			<main className="mx-auto max-w-2xl text-center">
				<div className="overflow-visible bg-gradient-to-t light:from-black/40 light:to-black/10 bg-clip-text font-bold text-[120px] text-transparent tracking-tighter dark:from-white/40 dark:to-white/10">
					Loading
				</div>
			</main>
		</div>
	</div>
);

/**
 * Provider component for the preview
 */
const PreviewProvider = ({ options, ...props }: PreviewProviderProps) => {
	const { resolvedTheme } = useTheme();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<SandboxProvider
			theme={(resolvedTheme as 'light' | 'dark') ?? 'light'}
			{...props}
			options={{
				...options,
				externalResources: [...(options?.externalResources || [])],
			}}
		/>
	);
};

/**
 * Code editor tab content with file explorer and code editor panels
 */
const CodeEditorTab = () => (
	<ResizablePanelGroup direction="horizontal" className="overflow-hidden">
		<ResizablePanel
			className="!overflow-y-auto bg-[var(--sp-colors-surface1)]"
			defaultSize={25}
			minSize={20}
			maxSize={40}
		>
			<SandboxFileExplorer />
		</ResizablePanel>
		<ResizableHandle withHandle />
		<ResizablePanel className="!overflow-y-auto bg-[var(--sp-colors-surface1)]">
			<SandboxCodeEditor />
		</ResizablePanel>
	</ResizablePanelGroup>
);

/**
 * Preview tab content showing the rendered application
 */
const PreviewTab = () => <SandboxPreview />;

/**
 * Console tab content showing console output
 */
const ConsoleTab = () => <SandboxConsole />;

/**
 * Complete tabs container for the sandbox with code, preview, and console tabs
 */
const SandboxTabsContainer = () => (
	<SandboxTabs defaultValue="preview">
		<SandboxTabsList>
			<SandboxTabsTrigger value="code">
				<CodeIcon size={14} />
				Code
			</SandboxTabsTrigger>
			<SandboxTabsTrigger value="preview">
				<AppWindowIcon size={14} />
				Preview
			</SandboxTabsTrigger>
			<SandboxTabsTrigger value="console">
				<TerminalIcon size={14} />
				Console
			</SandboxTabsTrigger>
		</SandboxTabsList>
		<SandboxTabsContent value="code" className="overflow-hidden">
			<CodeEditorTab />
		</SandboxTabsContent>
		<SandboxTabsContent value="preview">
			<PreviewTab />
		</SandboxTabsContent>
		<SandboxTabsContent value="console">
			<ConsoleTab />
		</SandboxTabsContent>
	</SandboxTabs>
);

/**
 * Code preview component
 *
 * Renders a live preview of code with editor, preview, and console tabs
 */
export const Preview = ({
	code,
	defaultFile = '/App.tsx',
	template = 'react-ts',
	dependencies: demoDependencies,
}: PreviewProps) => {
	// Prepare files for the sandbox
	const files = prepareSandboxFiles(code, defaultFile);

	// Get dependencies based on template and user deps
	const dependencies = getDependencies(
		template as SandboxTemplate,
		demoDependencies || {}
	);

	// Get external resources based on template
	const externalResources = getExternalResources(template as SandboxTemplate);

	// Empty dev dependencies
	const devDependencies = {};

	return (
		<div
			className={cn(
				'not-prose relative overflow-hidden rounded-lg border-1 bg-gradient-to-b from-fd-card/80 to-fd-card shadow-[0_0_1px_1px_rgba(0,0,0,0.1)]'
			)}
		>
			{/* Loading state */}
			<div className="transition-opacity duration-500" aria-hidden="true">
				<PreviewSkeleton />
			</div>

			{/* Actual preview content */}
			<div className="absolute inset-0 overflow-hidden">
				<PreviewProvider
					template={template as SandboxTemplate}
					options={{
						externalResources,
						initMode: 'lazy',
						classes: {
							'sp-wrapper': 'opacity-0 transition-opacity duration-500',
							'sp-loading': 'opacity-100',
						},
					}}
					customSetup={{
						dependencies,
						devDependencies,
					}}
					files={files}
					className="not-prose max-h-[30rem]"
				>
					<SandboxLayout>
						<SandboxTabsContainer />
					</SandboxLayout>
				</PreviewProvider>
			</div>
		</div>
	);
};
