'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	forwardRef,
} from 'react';
import './scroll-area.css';

const ScrollArea = forwardRef<
	ElementRef<typeof ScrollAreaPrimitive.Root>,
	ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
	<ScrollAreaPrimitive.Root
		ref={ref}
		className={`c15t-devtool-scroll-root ${className || ''}`}
		{...props}
	>
		<ScrollAreaPrimitive.Viewport className="c15t-devtool-scroll-viewport">
			{children}
		</ScrollAreaPrimitive.Viewport>
		<ScrollBar />
		<ScrollAreaPrimitive.Corner />
	</ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = forwardRef<
	ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
	ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
	<ScrollAreaPrimitive.ScrollAreaScrollbar
		ref={ref}
		orientation={orientation}
		className={`c15t-devtool-scroll-bar ${className || ''}`}
		{...props}
	>
		<ScrollAreaPrimitive.ScrollAreaThumb className="c15t-devtool-scroll-thumb" />
	</ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
