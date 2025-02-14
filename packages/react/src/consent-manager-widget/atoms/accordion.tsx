import type { AllConsentNames } from '@consent-management/core';

import {
	type ComponentPropsWithoutRef,
	type ComponentRef,
	type Ref,
	forwardRef,
	useCallback,
} from 'react';
import { useConsentManager } from '../../common';
import { useTranslations } from '../../common/store/use-translations';
import { Box, type BoxProps } from '../../primitives/box';
import * as RadixAccordion from '../../ui/components/accordion';
import * as RadixSwitch from '../../ui/components/switch';

/**
 * Accordion Trigger Component
 *
 * @remarks
 * - Provides visual grouping for related consent options
 * - Supports theme customization
 * - Maintains accessibility structure
 */
const ConsentManagerWidgetAccordionTrigger = forwardRef<
	HTMLDivElement,
	BoxProps
>(({ children, themeKey, ...props }, ref) => {
	return (
		<Box
			ref={ref as Ref<HTMLDivElement>}
			baseClassName="c15t-accordion-trigger"
			themeKey={themeKey}
			{...props}
		>
			{children}
		</Box>
	);
});

const ConsentManagerWidgetAccordionTriggerInner = RadixAccordion.Trigger;
const ConsentManagerWidgetAccordionContent = RadixAccordion.Content;
const ConsentManagerWidgetAccordionArrow = RadixAccordion.Arrow;
const ConsentManagerWidgetAccordion = RadixAccordion.Root;
const ConsentManagerWidgetSwitch = RadixSwitch.Root;

/**
 * Renders a list of consent options as accordion items.
 *
 * @remarks
 * Key features:
 * - Automatically generates items from consent configuration
 * - Handles consent state management
 * - Implements accessible toggle controls
 * - Supports keyboard navigation
 *
 * @example
 * ```tsx
 * <ConsentManagerWidgetAccordion>
 *   <ConsentManagerWidgetAccordionItems />
 * </ConsentManagerWidgetAccordion>
 * ```
 */
const ConsentManagerWidgetAccordionItems = () => {
	const { consents, setConsent, getDisplayedConsents } = useConsentManager();
	const handleConsentChange = useCallback(
		(name: AllConsentNames, checked: boolean) => {
			setConsent(name, checked);
		},
		[setConsent]
	);

	function formatConsentName(name: AllConsentNames) {
		return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	const { consentTypes } = useTranslations();
	return getDisplayedConsents().map((consent) => (
		<ConsentManagerWidgetAccordionItem
			value={consent.name}
			key={consent.name}
			themeKey={`consent-manager-widget.accordion.item-${consent.name}`}
		>
			<ConsentManagerWidgetAccordionTrigger
				themeKey="consent-manager-widget.accordion.trigger"
				data-testid={`consent-manager-widget-accordion-trigger-${consent.name}`}
			>
				<ConsentManagerWidgetAccordionTriggerInner
					themeKey="consent-manager-widget.accordion.trigger-inner"
					data-testid={`consent-manager-widget-accordion-trigger-inner-${consent.name}`}
				>
					<ConsentManagerWidgetAccordionArrow
						data-testid={`consent-manager-widget-accordion-arrow-${consent.name}`}
					/>
					{consentTypes[consent.name]?.title ?? formatConsentName(consent.name)}
				</ConsentManagerWidgetAccordionTriggerInner>

				<ConsentManagerWidgetSwitch
					checked={consents[consent.name]}
					onClick={(e) => e.stopPropagation()}
					onKeyUp={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
					onCheckedChange={(checked) =>
						handleConsentChange(consent.name, checked)
					}
					disabled={consent.disabled}
					theme={{
						root: { themeKey: 'consent-manager-widget.switch' },
						thumb: { themeKey: 'consent-manager-widget.switch.thumb' },
						track: { themeKey: 'consent-manager-widget.switch.track' },
					}}
					data-testid={`consent-manager-widget-switch-${consent.name}`}
				/>
			</ConsentManagerWidgetAccordionTrigger>
			<ConsentManagerWidgetAccordionContent
				theme={{
					content: { themeKey: 'consent-manager-widget.accordion.content' },
					contentInner: {
						themeKey: 'consent-manager-widget.accordion.content',
					},
				}}
				data-testid={`consent-manager-widget-accordion-content-${consent.name}`}
			>
				{consentTypes[consent.name]?.description ?? consent.description}
			</ConsentManagerWidgetAccordionContent>
		</ConsentManagerWidgetAccordionItem>
	));
};

const ConsentManagerWidgetAccordionItem = forwardRef<
	ComponentRef<typeof RadixAccordion.Item>,
	ComponentPropsWithoutRef<typeof RadixAccordion.Item>
>(({ className, ...rest }, forwardedRef) => {
	return <RadixAccordion.Item ref={forwardedRef} {...rest} />;
});

const AccordionTriggerInner = ConsentManagerWidgetAccordionTriggerInner;
const AccordionTrigger = ConsentManagerWidgetAccordionTrigger;
const AccordionContent = ConsentManagerWidgetAccordionContent;
const AccordionArrow = ConsentManagerWidgetAccordionArrow;
const Accordion = ConsentManagerWidgetAccordion;
const Switch = ConsentManagerWidgetSwitch;
const AccordionItems = ConsentManagerWidgetAccordionItems;
const AccordionItem = ConsentManagerWidgetAccordionItem;

export {
	ConsentManagerWidgetAccordionTrigger,
	ConsentManagerWidgetAccordionTriggerInner,
	ConsentManagerWidgetAccordionContent,
	ConsentManagerWidgetAccordionArrow,
	ConsentManagerWidgetAccordion,
	ConsentManagerWidgetSwitch,
	ConsentManagerWidgetAccordionItems,
	ConsentManagerWidgetAccordionItem,
	AccordionTrigger,
	AccordionTriggerInner,
	AccordionContent,
	AccordionArrow,
	Accordion,
	Switch,
	AccordionItems,
	AccordionItem,
};
