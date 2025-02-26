'use client';

import {
	SandpackCodeEditor,
	SandpackConsole,
	SandpackFileExplorer,
	SandpackLayout,
	SandpackPreview,
	SandpackProvider,
} from '@codesandbox/sandpack-react';
import type {
	CodeEditorProps,
	PreviewProps,
	SandpackLayoutProps,
	SandpackProviderProps,
} from '@codesandbox/sandpack-react';
import type {
	ButtonHTMLAttributes,
	ComponentProps,
	HTMLAttributes,
} from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { cn } from '~/lib/cn';

export type SandboxProviderProps = SandpackProviderProps;

const githubLight = {
	colors: {
		surface1: '#ffffff',
		surface2: '#F3F3F3',
		surface3: '#f5f5f5',
		clickable: '#959da5',
		base: '#24292e',
		disabled: '#d1d4d8',
		hover: '#24292e',
		accent: '#24292e',
	},
	syntax: {
		keyword: '#d73a49',
		property: '#005cc5',
		plain: '#24292e',
		static: '#032f62',
		string: '#032f62',
		definition: '#6f42c1',
		punctuation: '#24292e',
		tag: '#22863a',
		comment: {
			color: '#6a737d',
			fontStyle: 'normal',
		},
	},
	font: {
		body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
		mono: '"Fira Mono", "DejaVu Sans Mono", Menlo, Consolas, "Liberation Mono", Monaco, "Lucida Console", monospace',
		size: '13px',
		lineHeight: '20px',
	},
};

const githubDark = {
	...githubLight,
	colors: {
		surface1: '#151616',
		surface2: '#151616',
		surface3: '#151616',
		clickable: '#959da5',
		base: '#e1e4e8',
		disabled: '#6a737d',
		hover: '#e1e4e8',
		accent: '#e1e4e8',
	},
	syntax: {
		keyword: '#f97583',
		property: '#79b8ff',
		plain: '#e1e4e8',
		static: '#9ecbff',
		string: '#9ecbff',
		definition: '#b392f0',
		punctuation: '#e1e4e8',
		tag: '#85e89d',
		comment: {
			color: '#6a737d',
			fontStyle: 'normal',
		},
	},
	font: {
		body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
		mono: '"Fira Mono", "DejaVu Sans Mono", Menlo, Consolas, "Liberation Mono", Monaco, "Lucida Console", monospace',
		size: '13px',
		lineHeight: '20px',
	},
};

const SandboxSkeleton = () => (
	<div className="flex h-full w-full animate-pulse flex-col gap-2 p-4">
		{/* Header skeleton */}
		<div className="flex items-center gap-2">
			<div className="h-4 w-20 rounded-md bg-muted/20" />
			<div className="h-4 w-16 rounded-md bg-muted/20" />
		</div>

		{/* Content skeleton */}
		<div className="flex flex-1 gap-2">
			{/* Code panel */}
			<div className="flex-1 space-y-2 rounded-md bg-muted/10 p-4">
				<div className="h-3 w-3/4 rounded bg-muted/20" />
				<div className="h-3 w-1/2 rounded bg-muted/20" />
				<div className="h-3 w-2/3 rounded bg-muted/20" />
				<div className="h-3 w-1/2 rounded bg-muted/20" />
			</div>

			{/* Preview panel */}
			<div className="flex-1 rounded-md bg-muted/10" />
		</div>
	</div>
);

export const SandboxProvider = ({
	className,
	theme = 'light',
	...props
}: SandpackProviderProps) => {
	const [isMounted, setIsMounted] = useState(false);
	const [isSSR, setIsSSR] = useState(true);

	useEffect(() => {
		setIsMounted(true);
		setIsSSR(false);
	}, []);

	return (
		<div
			className={cn(
				'not-prose relative',
				'size-full max-h-[30rem]',
				'bg-gradient-to-b from-fd-card/80 to-fd-card',
				className
			)}
		>
			{isMounted ? (
				<SandpackProvider
					className="!size-full !max-h-none"
					//@ts-ignore
					theme={theme === 'light' ? githubLight : githubDark}
					options={{
						initMode: isSSR ? 'user-visible' : 'immediate',
					}}
					{...props}
				/>
			) : (
				<SandboxSkeleton />
			)}
		</div>
	);
};

export type SandboxLayoutProps = SandpackLayoutProps;

export const SandboxLayout = ({ className, ...props }: SandpackLayoutProps) => (
	<SandpackLayout
		className={cn(
			'!rounded-lg !border-none',
			'!h-full overflow-hidden',
			'[&_.cm-editor]:!bg-background/50',
			'[&_.sp-wrapper]:!bg-background/50',
			'[&_.sp-preview-container]:!bg-background/50',
			'[&_.sp-preview-container]:!backdrop-blur-sm',
			className
		)}
		{...props}
	/>
);

export type SandboxTabsContextValue = {
	selectedTab: string | undefined;
	setSelectedTab: (value: string) => void;
};

const SandboxTabsContext = createContext<SandboxTabsContextValue | undefined>(
	undefined
);

const useSandboxTabsContext = () => {
	const context = useContext(SandboxTabsContext);

	if (!context) {
		throw new Error(
			'SandboxTabs components must be used within a SandboxTabsProvider'
		);
	}

	return context;
};

export type SandboxTabsProps = HTMLAttributes<HTMLDivElement> & {
	defaultValue?: string;
	value?: string;
	onValueChange?: (value: string) => void;
};

export const SandboxTabs = ({
	className,
	defaultValue,
	value,
	onValueChange,
	...props
}: SandboxTabsProps) => {
	const [selectedTab, setSelectedTabState] = useState(value || defaultValue);

	useEffect(() => {
		if (value !== undefined) {
			setSelectedTabState(value);
		}
	}, [value]);

	const setSelectedTab = useCallback(
		(newValue: string) => {
			if (value === undefined) {
				setSelectedTabState(newValue);
			}
			onValueChange?.(newValue);
		},
		[value, onValueChange]
	);

	return (
		<SandboxTabsContext.Provider value={{ selectedTab, setSelectedTab }}>
			<div
				className={cn(
					'group relative flex size-full flex-col',
					'overflow-hidden rounded-lg',
					'bg-gradient-to-b from-fd-card/80 to-fd-card',
					'shadow-[0_0_1px_1px_rgba(0,0,0,0.1)]',
					className
				)}
				{...props}
				data-selected={selectedTab}
			>
				{props.children}
			</div>
		</SandboxTabsContext.Provider>
	);
};

export type SandboxTabsListProps = HTMLAttributes<HTMLDivElement>;

export const SandboxTabsList = ({
	className,
	...props
}: SandboxTabsListProps) => (
	<div
		className={cn(
			'flex h-13 flex-row items-center gap-2 overflow-x-auto overflow-y-hidden border-fd-primary/10 border-b bg-gradient-to-b from-fd-background/80 to-transparent px-4 py-2 text-fd-muted-foreground shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]',
			className
		)}
		role="tablist"
		{...props}
	/>
);

export type SandboxTabsTriggerProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	'onClick'
> & {
	value: string;
};

export const SandboxTabsTrigger = ({
	className,
	value,
	...props
}: SandboxTabsTriggerProps) => {
	const { selectedTab, setSelectedTab } = useSandboxTabsContext();

	return (
		// biome-ignore lint/nursery/useAriaPropsSupportedByRole: <explanation>
		<button
			role="tab"
			aria-selected={selectedTab === value}
			onClick={() => setSelectedTab(value)}
			className={cn(
				'relative flex flex-row items-center justify-center gap-x-2 whitespace-nowrap border-transparent border-b',
				'px-3 py-1.5 font-medium text-sm',
				'transition-all duration-200',
				'text-fd-muted-foreground hover:text-fd-foreground',
				'rounded-md bg-transparent',
				'data-[state=active]:bg-fd-primary/[0.08]',
				'data-[state=active]:text-fd-primary',
				'data-[state=active]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]',
				'data-[state=active]:border-fd-primary/20',
				'focus-visible:outline-none focus-visible:ring-2',
				'focus-visible:ring-fd-primary/20',
				'disabled:pointer-events-none disabled:opacity-50',
				className
			)}
			data-state={selectedTab === value ? 'active' : 'inactive'}
			{...props}
		/>
	);
};

export type SandboxTabsContentProps = HTMLAttributes<HTMLDivElement> & {
	value: string;
};

export const SandboxTabsContent = ({
	className,
	value,
	...props
}: SandboxTabsContentProps) => {
	const { selectedTab } = useSandboxTabsContext();

	return (
		<div
			role="tabpanel"
			aria-hidden={selectedTab !== value}
			data-state={selectedTab === value ? 'active' : 'inactive'}
			className={cn(
				'ring-offset-background',
				'focus-visible:outline-none',
				'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				'h-full min-h-[300px]',
				selectedTab === value ? 'fade-in-0 animate-in' : 'hidden',
				className
			)}
			{...props}
		/>
	);
};

export type SandboxCodeEditorProps = CodeEditorProps;

export const SandboxCodeEditor = ({
	showTabs = false,
	...props
}: SandboxCodeEditorProps) => (
	<SandpackCodeEditor showTabs={showTabs} {...props} />
);

export type SandboxConsoleProps = ComponentProps<typeof SandpackConsole>;

export const SandboxConsole = ({
	className,
	...props
}: SandboxConsoleProps) => (
	<SandpackConsole className={cn('h-full', className)} {...props} />
);

export type SandboxPreviewProps = PreviewProps & {
	className?: string;
};

export const SandboxPreview = ({
	className,
	showOpenInCodeSandbox = false,
	...props
}: SandboxPreviewProps) => (
	<SandpackPreview
		className={cn(
			'h-full min-h-[300px]',
			'[&_.sp-preview-container]:!h-full',
			'[&_.sp-preview-iframe]:!h-full',
			'[&_.sp-preview-actions]:!bottom-4',
			className
		)}
		showOpenInCodeSandbox={showOpenInCodeSandbox}
		style={{
			height: '100%',
			flex: '1 1 auto',
			minHeight: '300px',
		}}
		{...props}
	/>
);

export type SandboxFileExplorerProps = ComponentProps<
	typeof SandpackFileExplorer
>;

export const SandboxFileExplorer = ({
	autoHiddenFiles = true,
	className,
	...props
}: SandboxFileExplorerProps) => (
	<SandpackFileExplorer
		className={cn('h-full', className)}
		autoHiddenFiles={autoHiddenFiles}
		{...props}
	/>
);
