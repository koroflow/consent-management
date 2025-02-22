'use client';

/**
 * @packageDocumentation
 * Provides the dialog component for detailed privacy consent management.
 * Implements an accessible, animated modal interface for consent customization.
 */

import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
	LocalThemeContext,
	type ThemeContextValue,
} from '~/context/theme-context';
import { useConsentManager } from '~/hooks/use-consent-manager';
import { ConsentCustomizationCard } from './atoms/dialog-card';
import { Overlay } from './atoms/overlay';
import type { ConsentManagerDialogTheme } from './theme';

import styles from './consent-manager-dialog.module.css';

/**
 * Animation variants for the dialog container
 * @internal
 */
const dialogVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
};

/**
 * Animation variants for the dialog content
 * @internal
 */
const contentVariants = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { type: 'spring', stiffness: 300, damping: 30 },
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		transition: { duration: 0.2 },
	},
};

/**
 * Props for the ConsentManagerDialog component
 *
 * @remarks
 * Extends ThemeContextValue to provide comprehensive theming support
 * while maintaining type safety for consent management specific features.
 */
export interface ConsentManagerDialogProps
	extends ThemeContextValue<ConsentManagerDialogTheme> {
	/** Disables animation when true */
	disableAnimation?: boolean;
	/** Removes default styling when true */
	noStyle?: boolean;
	/** Whether the dialog is open */
	open?: boolean;
}

/**
 * A modal dialog component for detailed privacy consent management.
 *
 * @remarks
 * Key features:
 * - Provides an accessible modal interface for consent customization
 * - Implements smooth enter/exit animations
 * - Manages proper focus handling
 * - Supports theme customization
 * - Handles client-side portal rendering
 *
 * @example
 * ```tsx
 * <ConsentManagerDialog
 *   theme={customTheme}
 *   disableAnimation={false}
 *   noStyle={false}
 * />
 * ```
 *
 * @public
 */
export const ConsentManagerDialog: FC<ConsentManagerDialogProps> = ({
	theme,
	disableAnimation,
	noStyle,
	open = false,
}) => {
	const consentManager = useConsentManager();
	const [isMounted, setIsMounted] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	// Handle client-side mounting
	useEffect(() => {
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	const contextValue: ThemeContextValue = {
		theme,
		noStyle,
		disableAnimation,
	};

	/**
	 * Dialog content with theme context and animation support
	 * @internal
	 */
	const dialogContentRoot = (
		<LocalThemeContext.Provider value={contextValue}>
			<AnimatePresence mode="wait">
				{(open || consentManager.isPrivacyDialogOpen) && (
					<>
						<Overlay open={open} />
						<motion.dialog
							className={styles.root}
							variants={dialogVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							aria-modal="true"
							aria-labelledby="privacy-settings-title"
						>
							<motion.div
								ref={contentRef}
								className={styles.container}
								variants={contentVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
							>
								<ConsentCustomizationCard noStyle={noStyle} />
							</motion.div>
						</motion.dialog>
					</>
				)}
			</AnimatePresence>
		</LocalThemeContext.Provider>
	);

	// Only render on client-side to prevent hydration issues
	return isMounted && createPortal(dialogContentRoot, document.body);
};
