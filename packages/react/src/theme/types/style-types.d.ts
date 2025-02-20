import type { ClassValue } from 'clsx';
import type { CSSProperties } from 'react';
import type { AllThemeKeys } from './style-keys';
/**
 * Represents a style configuration that can include both inline styles and class names.
 * @public
 */
export type ClassNameStyle = {
	/** @remarks CSS properties to be applied inline to the component */
	style?: CSSProperties;
	/** @remarks CSS class names to be applied to the component */
	className?: string;
	/** @remarks The type of style to apply to the component */
	noStyle?: boolean;
	/** @internal used to pass default class names to the component */
	baseClassName?: ClassValue;
};

/**
 * Represents a style value that can be either a class name string or a {@link ClassNameStyle} object.
 * @public
 */
export type ThemeValue = string | ClassNameStyle ;

export interface ExtendThemeKeys extends ClassNameStyle {
	themeKey: AllThemeKeys;
}
