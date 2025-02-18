'use client';

/**
 * @packageDocumentation
 * A collection of components for building privacy consent management dialogs.
 * Built with accessibility and customization in mind, following GDPR, CCPA, and other privacy regulation requirements.
 */

import { type ReactNode, type Ref, forwardRef } from 'react';

import { useTranslations } from '../../common/store/use-translations';
import { ConsentManagerWidget } from '../../consent-manager-widget/consent-manager-widget';
import { Box, type BoxProps } from '../../primitives/box';
import type { ClassNameStyle } from '../../theme';
import { ConsentManagementIcon } from '../../ui/components/logo';
/**
 * Props for the DialogCard and related components
 * @public
 */
type DialogCardProps = {
	/** The content to be rendered inside the dialog card */
	children?: ReactNode;
} & ClassNameStyle;

/**
 * The root component for creating a privacy consent dialog card.
 * Provides the main container and styling for the consent interface.
 *
 * @example
 * ```tsx
 * <DialogCard>
 *   <DialogHeader>
 *     <DialogHeaderTitle>Privacy Settings</DialogHeaderTitle>
 *   </DialogHeader>
 *   <DialogContent>
 *     <ConsentManagerWidget />
 *   </DialogContent>
 * </DialogCard>
 * ```
 */
const DialogCard = forwardRef<HTMLDivElement, DialogCardProps>(
	({ children, ...props }, ref) => {
		return (
			<Box
				ref={ref as Ref<HTMLDivElement>}
				baseClassName="c15t-card c15t-consent-manager-dialog-card"
				{...props}
				themeKey="consent-manager-dialog.root"
				data-testid="consent-manager-dialog-root"
			>
				{children}
			</Box>
		);
	}
);

/**
 * The header section of the privacy dialog.
 * Should contain the DialogHeaderTitle and optionally DialogHeaderDescription.
 *
 * @remarks
 * - Provides semantic structure for accessibility
 * - Should be the first child of DialogCard
 * - Styled according to the theme configuration
 */
const DialogHeader = forwardRef<HTMLDivElement, Omit<BoxProps, 'themeKey'>>(
	({ children, ...props }, ref) => {
		return (
			<Box
				ref={ref as Ref<HTMLDivElement>}
				baseClassName="c15t-card-header c15t-consent-manager-dialog-card"
				{...props}
				themeKey="consent-manager-dialog.header"
				data-testid="consent-manager-dialog-header"
			>
				{children}
			</Box>
		);
	}
);

/**
 * The title component for the privacy dialog header.
 * Displays the main heading of the consent management interface.
 *
 * @remarks
 * - Uses proper heading semantics for accessibility
 * - Should be used within DialogHeader
 * - Supports theme customization
 */
const DialogHeaderTitle = forwardRef<
	HTMLDivElement,
	Omit<BoxProps, 'themeKey'>
>(({ children, ...props }, ref) => {
	return (
		<Box
			ref={ref as Ref<HTMLDivElement>}
			baseClassName="c15t-card-title"
			themeKey="consent-manager-dialog.title"
			{...props}
			data-testid="consent-manager-dialog-title"
		>
			{children}
		</Box>
	);
});

/**
 * The description component for the privacy dialog header.
 * Provides additional context about privacy settings and consent choices.
 *
 * @remarks
 * - Should be used after DialogHeaderTitle
 * - Supports theme customization
 * - Important for explaining privacy choices to users
 */
const DialogHeaderDescription = forwardRef<
	HTMLDivElement,
	Omit<BoxProps, 'themeKey'>
>(({ children, ...props }, ref) => {
	return (
		<Box
			ref={ref as Ref<HTMLDivElement>}
			baseClassName="c15t-card-description"
			themeKey="consent-manager-dialog.description"
			{...props}
			data-testid="consent-manager-dialog-description"
		>
			{children}
		</Box>
	);
});

/**
 * The main content area of the privacy dialog.
 * Contains the consent management interface and privacy controls.
 *
 * @remarks
 * - Typically contains ConsentManagerWidget
 * - Supports custom content and styling
 * - Handles user interactions with privacy settings
 */
const DialogContent = forwardRef<HTMLDivElement, Omit<BoxProps, 'themeKey'>>(
	({ children, ...props }, ref) => {
		return (
			<Box
				ref={ref as Ref<HTMLDivElement>}
				baseClassName="c15t-card-content"
				themeKey="consent-manager-dialog.content"
				data-testid="consent-manager-dialog-content"
				{...props}
			>
				{children}
			</Box>
		);
	}
);

/**
 * The footer section of the privacy dialog.
 * Contains branding and additional privacy-related links.
 *
 * @remarks
 * - Should be the last child of DialogCard
 * - Includes c15t.com branding by default
 * - Can be customized through theme configuration
 */
const DialogFooter = forwardRef<HTMLDivElement, Omit<BoxProps, 'themeKey'>>(
	({ ...props }, ref) => {
		return (
			<Box
				ref={ref as Ref<HTMLDivElement>}
				baseClassName="c15t-card-footer"
				themeKey="consent-manager-dialog.footer"
				{...props}
				data-testid="consent-manager-dialog-footer"
			>
				<a
					className="c15t-consent-manager-widget-branding-link"
					href="https://c15t.com"
				>
					Secured by <ConsentManagementIcon />
				</a>
			</Box>
		);
	}
);

/**
 * A pre-configured privacy settings dialog card.
 * Combines all dialog components with default content for privacy customization.
 *
 * @param {Object} props - Component props
 * @param {boolean} [props.noStyle] - When true, removes default styling
 *
 * @example
 * ```tsx
 * <ConsentCustomizationCard noStyle={false} />
 * ```
 *
 * @remarks
 * - Provides a complete privacy settings interface
 * - Follows GDPR and CCPA requirements
 * - Includes consent type management
 * - Built-in accessibility features
 */
const ConsentCustomizationCard = ({ noStyle }: { noStyle?: boolean }) => {
	const translations = useTranslations();

	return (
		<DialogCard>
			<DialogHeader>
				<DialogHeaderTitle>
					{translations.consentManagerDialog.title}
				</DialogHeaderTitle>
				<DialogHeaderDescription>
					{translations.consentManagerDialog.description}
				</DialogHeaderDescription>
			</DialogHeader>
			<DialogContent>
				<ConsentManagerWidget
					hideBrading
					noStyle={noStyle}
					useProvider={false}
				/>
			</DialogContent>
			<DialogFooter />
		</DialogCard>
	);
};

const Card = DialogCard;
const Header = DialogHeader;
const HeaderTitle = DialogHeaderTitle;
const HeaderDescription = DialogHeaderDescription;
const Content = DialogContent;
const Footer = DialogFooter;

export {
	Card,
	Header,
	HeaderTitle,
	HeaderDescription,
	Content,
	Footer,
	ConsentCustomizationCard,
	DialogFooter,
	DialogHeader,
	DialogHeaderTitle,
	DialogHeaderDescription,
	DialogContent,
};
