import { cn } from '@c15t/shadcn/libs';
import { useI18n, useSearchContext } from 'fumadocs-ui/provider';
import { SearchIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

export function LargeSearchToggle({
	hideIfDisabled,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	hideIfDisabled?: boolean;
}) {
	const { enabled, hotKey, setOpenSearch } = useSearchContext();
	const { text } = useI18n();
	if (hideIfDisabled && !enabled) {
		return null;
	}

	return (
		<button
			type="button"
			data-search-full=""
			{...props}
			className={cn(
				'flex w-full items-center gap-2 rounded-full border bg-fd-secondary/50 px-4 py-2 text-fd-muted-foreground text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground',
				props.className
			)}
			onClick={() => {
				setOpenSearch(true);
			}}
		>
			<SearchIcon className="ms-1 size-4" />
			{text.search}
			<div className="ms-auto inline-flex gap-0.5">
				{hotKey.map((k, i) => (
					<kbd key={i} className="rounded-md border bg-fd-background px-1.5">
						{k.display}
					</kbd>
				))}
			</div>
		</button>
	);
}
