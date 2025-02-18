import {
	SandboxCodeEditor,
	SandboxConsole,
	SandboxFileExplorer,
	SandboxLayout,
	SandboxPreview,
	type SandboxProvider,
	SandboxTabs,
	SandboxTabsContent,
	SandboxTabsList,
	SandboxTabsTrigger,
} from '@c15t/shadcn/components';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@c15t/shadcn/components';
import { cn } from '@c15t/shadcn/libs';
import { AppWindowIcon, CodeIcon, TerminalIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { PreviewProvider, type PreviewProviderProps } from './provider';
import { tsconfig } from './tsconfig';
import { utils } from './utils';

type PreviewProps = {
	name: string;
	code: string | Record<string, string>;
	dependencies?: Record<string, string>;
	defaultFile?: string;
	template?: PreviewProviderProps['template'];
};

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

export const Preview = ({
	code,
	defaultFile = '/App.tsx',
	template = 'react-ts',
	dependencies: demoDependencies,
}: PreviewProps) => {
	const dependencies: Record<string, string> = {};
	const devDependencies: Record<string, string> = {};

	const files: ComponentProps<typeof SandboxProvider>['files'] = {
		'/tsconfig.json': tsconfig,
		'/lib/utils.ts': utils,
		...(typeof code === 'string'
			? {
					[defaultFile.startsWith('/') ? defaultFile : `/${defaultFile}`]: code,
				}
			: Object.entries(code).reduce(
					(acc, [filename, content]) =>
						Object.assign(acc, {
							[filename.startsWith('/') ? filename : `/${filename}`]: content,
						}),
					{}
				)),
	};

	// Scan the demo code for any imports of shadcn/ui components
	// await parseShadcnComponents(code);

	// Load demo dependencies
	if (demoDependencies) {
		for (const [name, version] of Object.entries(demoDependencies)) {
			dependencies[name] = version;
		}
	}

	return (
		<div
			className={cn(
				'not-prose relative overflow-hidden rounded-lg border-1 bg-gradient-to-b from-fd-card/80 to-fd-card shadow-[0_0_1px_1px_rgba(0,0,0,0.1)]'
			)}
		>
			<div className="transition-opacity duration-500" aria-hidden="true">
				<PreviewSkeleton />
			</div>
			<div className="absolute inset-0 overflow-hidden">
				<PreviewProvider
					template={template}
					options={{
						externalResources: [
							...(template === 'react-ts'
								? ['https://unpkg.com/@tailwindcss/browser@4']
								: []),
							'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
						],
						initMode: 'lazy',
						classes: {
							'sp-wrapper': 'opacity-0 transition-opacity duration-500',
							'sp-loading': 'opacity-100',
						},
					}}
					customSetup={{
						dependencies: {
							...dependencies,
							...(template === 'react-ts' ? { '@c15t/react': 'latest' } : {}),
							'@c15t/dev-tools': 'latest',
						},
						devDependencies: {
							...devDependencies,
						},
					}}
					files={files}
					className="not-prose max-h-[30rem]"
				>
					<SandboxLayout>
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
								<ResizablePanelGroup
									direction="horizontal"
									className="overflow-hidden"
								>
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
							</SandboxTabsContent>
							<SandboxTabsContent value="preview">
								<SandboxPreview />
							</SandboxTabsContent>
							<SandboxTabsContent value="console">
								<SandboxConsole />
							</SandboxTabsContent>
						</SandboxTabs>
					</SandboxLayout>
				</PreviewProvider>
			</div>
		</div>
	);
};
