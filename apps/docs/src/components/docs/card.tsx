import { cn } from '@consent-management/shadcn/libs';
import Link from 'fumadocs-core/link';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

export function Cards(props: HTMLAttributes<HTMLDivElement>): ReactElement {
	return (
		<div
			{...props}
			className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', props.className)}
		>
			{props.children}
		</div>
	);
}

export type CardProps = HTMLAttributes<HTMLElement> & {
	icon?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	href?: string;
	external?: boolean;
	showBackgroundIcon?: boolean;
};

export function Card({
	icon,
	title,
	description,
	showBackgroundIcon = true,
	...props
}: CardProps): ReactElement {
	const E = props.href ? Link : 'div';

	return (
		<E
			{...props}
			data-card
			className={cn(
				'group block rounded-lg border bg-fd-card p-4 text-fd-card-foreground shadow transition-all duration-200',
				'hover:border-fd-primary/20 hover:shadow-fd-primary/5 hover:shadow-lg',
				'relative overflow-hidden',
				props.href && 'hover:bg-fd-accent/80',
				props.className
			)}
		>
			{/* Main content */}
			<div className="relative z-10">
				{icon ? (
					<div className="not-prose mb-2 w-fit rounded-md border bg-gradient-to-t from-fd-primary/5 to-fd-background/80 p-1.5 text-fd-primary/80 transition-colors group-hover:border-fd-primary/30 group-hover:text-fd-primary [&_svg]:size-8">
						{icon}
					</div>
				) : null}
				<h3 className="not-prose mb-1 font-medium text-sm tracking-tight transition-colors group-hover:text-fd-primary">
					{title}
				</h3>
				{description ? (
					<p className="my-0 text-fd-muted-foreground text-sm transition-colors group-hover:text-fd-muted-foreground/80">
						{description}
					</p>
				) : null}
				{props.children ? (
					<div className="prose-no-margin text-fd-muted-foreground text-sm">
						{props.children}
					</div>
				) : null}
			</div>

			{/* Background effects */}
			<div className="absolute inset-0 z-1 bg-gradient-to-t from-transparent to-fd-primary/[0.4] opacity-0 transition-opacity group-hover:opacity-100" />

			{/* Background icon */}
			{showBackgroundIcon && icon && (
				<div className="-right-6 -translate-y-1/2 group-hover:-right-4 absolute top-1/2 z-2 opacity-[0.02] transition-all duration-300 group-hover:opacity-[0.04]">
					<div className="rotate-12 text-fd-card-foreground [&_svg]:size-32">
						{icon}
					</div>
				</div>
			)}
		</E>
	);
}
