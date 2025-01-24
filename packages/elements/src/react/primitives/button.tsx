import { Slot } from "@radix-ui/react-slot";
import { forwardRef, useCallback } from "react";
import * as Button from "../ui/components/button";

import { useThemeContext } from "../theme/context";
import { useStyles } from "../theme/useStyle";
import type { ConsentButtonElement, ConsentButtonProps } from "./button.types";

/**
 * Button component that allows users to reject non-essential cookies.
 *
 * @remarks
 * When clicked, this button saves only necessary cookie consents and closes the banner.
 *
 * @example
 * ```tsx
 * <CookieBannerRejectButton>
 *   Reject All Cookies
 * </CookieBannerRejectButton>
 * ```
 *
 * @public
 */
export const ConsentButton = forwardRef<
	ConsentButtonElement,
	ConsentButtonProps<string> & {
		action: "accept-consent" | "reject-consent" | "custom-consent" | "open-consent-dialog";
		closeCustomizeDialog?: boolean;
		closeCookieBanner?: boolean;
	}
>(
	(
		{
			asChild,
			className: forwardedClassName,
			style,
			noStyle,
			action,
			styleKey = "acceptButton",
			baseClassName,
			variant = "neutral",
			mode = "stroke",
			size = "small",
			onClick: forwardedOnClick,
			closeCookieBanner = false,
			closeCustomizeDialog = false,
			...props
		},
		ref,
	) => {
		const { saveConsents, setShowPopup, setIsPrivacyDialogOpen } = useThemeContext();
		const buttonStyle = useStyles(styleKey, {
			baseClassName: [
				Button.buttonVariants({
					variant,
					mode,
					size,
				}).root(),
				baseClassName ? baseClassName : "consent-button",
			],
			style,
			className: forwardedClassName,
		});

		const buttonClick = useCallback(() => {
			switch (action) {
				case "accept-consent":
					saveConsents("all");
					break;
				case "reject-consent":
					saveConsents("necessary");
					break;
				case "custom-consent":
					saveConsents("custom");
					break;
				case "open-consent-dialog":
					setIsPrivacyDialogOpen(true);
					break;
			}
			if (closeCookieBanner) {
				setShowPopup(false);
			}
			if (closeCustomizeDialog) {
				setIsPrivacyDialogOpen(false);
			}
			if (forwardedOnClick) {
				forwardedOnClick();
			}
		}, [
			closeCookieBanner,
			closeCustomizeDialog,
			forwardedOnClick,
			saveConsents,
			setIsPrivacyDialogOpen,
			setShowPopup,
			action,
		]);

		const Comp = asChild ? Slot : Button.Root;

		return <Comp ref={ref} {...buttonStyle} onClick={buttonClick} {...props} />;
	},
);

ConsentButton.displayName = "ConsentButton";
