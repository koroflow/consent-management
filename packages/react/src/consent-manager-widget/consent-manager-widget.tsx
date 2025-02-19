'use client';

/**
 * @packageDocumentation
 * Provides the main widget component for privacy consent management.
 * Implements a compound component pattern for flexible consent interface building.
 */

import './consent-manager-widget.css';
import '../ui/components/card.css';
import { Box } from '../primitives/box';

import { useState } from 'react';
import { useTranslations } from '../common/store/use-translations';
import { ConsentManagementIcon } from '../ui/components/logo';
import {
	ConsentManagerWidgetAccordion,
	ConsentManagerWidgetAccordionItems,
} from './atoms/accordion';
import {
	ConsentManagerWidgetAcceptAllButton,
	ConsentManagerWidgetRejectButton,
	ConsentManagerWidgetSaveButton,
} from './atoms/button';
import {
	ConsentManagerWidgetFooter,
	ConsentManagerWidgetFooterSubGroup,
} from './atoms/footer';
import { ConsentManagerWidgetRoot } from './atoms/root';
import type { ConsentManagerWidgetProps } from './types';

/**
 * The main consent management widget component.
 * Provides a pre-configured interface for managing privacy consents.
 *
 * @remarks
 * Key features:
 * - Implements compound component pattern for flexible composition
 * - Manages consent state and user interactions
 * - Provides accessible controls for consent management
 * - Supports comprehensive theming
 * - Handles accordion state management
 *
 * @example
 * Basic usage:
 * ```tsx
 * <ConsentManagerWidget>
 *   <ConsentManagerWidget.AccordionItems />
 *   <ConsentManagerWidget.Footer>
 *     <ConsentManagerWidget.RejectButton>
 *       Deny
 *     </ConsentManagerWidget.RejectButton>
 *     <ConsentManagerWidget.AcceptAllButton>
 *       Accept All
 *     </ConsentManagerWidget.AcceptAllButton>
 *   </ConsentManagerWidget.Footer>
 * </ConsentManagerWidget>
 * ```
 *
 * @example
 * With custom styling:
 * ```tsx
 * <ConsentManagerWidget
 *   theme={{
 *     root: "custom-root-class",
 *     accordion: "custom-accordion-class",
 *     footer: "custom-footer-class"
 *   }}
 *   hideBrading={true}
 * />
 * ```
 */
export const ConsentManagerWidget = ({
	hideBrading,
	...props
}: ConsentManagerWidgetProps) => {
	const [openItems, setOpenItems] = useState<string[]>([]);
	const { consentManagerWidget } = useTranslations();
	return (
		<ConsentManagerWidgetRoot {...props}>
			<ConsentManagerWidgetAccordion
				themeKey="consent-manager-widget.accordion"
				type="multiple"
				value={openItems}
				onValueChange={setOpenItems}
			>
				<ConsentManagerWidgetAccordionItems />
			</ConsentManagerWidgetAccordion>
			<ConsentManagerWidgetFooter>
				<ConsentManagerWidgetFooterSubGroup themeKey="consent-manager-widget.footer.sub-group">
					<ConsentManagerWidgetRejectButton themeKey="consent-manager-widget.footer.reject-button">
						{consentManagerWidget.rejectAll}
					</ConsentManagerWidgetRejectButton>
					<ConsentManagerWidgetAcceptAllButton themeKey="consent-manager-widget.footer.accept-button">
						{consentManagerWidget.acceptAll}
					</ConsentManagerWidgetAcceptAllButton>
				</ConsentManagerWidgetFooterSubGroup>
				<ConsentManagerWidgetSaveButton themeKey="consent-manager-widget.footer.save-button">
					{consentManagerWidget.save}
				</ConsentManagerWidgetSaveButton>
			</ConsentManagerWidgetFooter>
			{!hideBrading && (
				<Box
					baseClassName="c15t-consent-manager-widget-branding"
					themeKey="consent-manager-widget.branding"
				>
					<a
						className="c15t-consent-manager-widget-branding-link"
						href="https://c15t.com"
					>
						Secured by <ConsentManagementIcon className="h-4" />
					</a>
				</Box>
			)}
		</ConsentManagerWidgetRoot>
	);
};
