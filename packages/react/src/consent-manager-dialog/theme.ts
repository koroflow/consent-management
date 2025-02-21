import type { ConsentManagerWidgetTheme } from '../consent-manager-widget/theme';
import type { ThemeValue } from '../theme';

/**
 * Configuration object for styling different parts of the ConsentManagerWidget component.
 * @public
 */
export type ConsentManagerDialogTheme = Partial<
	{
		/** @remarks Styles for the root container element */
		dialog: ThemeValue;
		/** @remarks Styles for the root container element */
		'dialog.root': ThemeValue;
		'dialog.header': ThemeValue;
		'dialog.title': ThemeValue;
		'dialog.description': ThemeValue;
		'dialog.content': ThemeValue;
		'dialog.footer': ThemeValue;
		'dialog.overlay': ThemeValue;
	} & ConsentManagerWidgetTheme
>;
