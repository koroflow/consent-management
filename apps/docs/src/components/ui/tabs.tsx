'use client';
import { cn } from '@c15t/shadcn/libs';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
	type ComponentPropsWithoutRef,
	type ComponentRef,
	forwardRef,
} from 'react';

const Tabs = forwardRef<
	ComponentRef<typeof TabsPrimitive.Root>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>((props, ref) => {
	return (
		<TabsPrimitive.Root
			ref={ref}
			{...props}
			className={cn(
				'flex flex-col overflow-hidden rounded-xl border bg-fd-card',
				props.className
			)}
		/>
	);
});

Tabs.displayName = 'Tabs';

const TabsList = forwardRef<
	ComponentRef<typeof TabsPrimitive.List>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>((props, ref) => (
	<TabsPrimitive.List
		ref={ref}
		{...props}
		className={cn(
			'flex flex-row items-end gap-4 overflow-x-auto overflow-y-hidden bg-fd-secondary px-4 text-fd-muted-foreground',
			props.className
		)}
	/>
));
TabsList.displayName = 'TabsList';

const TabsTrigger = forwardRef<
	ComponentRef<typeof TabsPrimitive.Trigger>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>((props, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		{...props}
		className={cn(
			'whitespace-nowrap border-transparent border-b py-2 font-medium text-sm transition-colors hover:text-fd-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-fd-primary data-[state=active]:text-fd-primary',
			props.className
		)}
	/>
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = forwardRef<
	ComponentRef<typeof TabsPrimitive.Content>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>((props, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		{...props}
		className={cn('p-4', props.className)}
	/>
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
