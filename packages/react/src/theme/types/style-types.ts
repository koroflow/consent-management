import type { ClassValue } from 'clsx';
import type { CSSProperties } from 'react';
import type { AllThemeKeys } from './style-keys';

/**
 * Represents CSS properties with optional CSS variables
 * @public
 */
export type CSSPropertiesWithVars<
	T extends Record<string, string | number> = Record<string, never>,
> = CSSProperties & Partial<T>;

/**
 * Represents a style configuration that can include both inline styles and class names.
 * @public
 */
export type ClassNameStyle<
	T extends Record<string, string | number> = Record<string, never>,
> = {
	/** @remarks CSS properties to be applied inline to the component */
	style?: CSSPropertiesWithVars<T>;
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
export type ThemeValue<
	T extends Record<string, string | number> = Record<string, never>,
> = string | ClassNameStyle<T>;

export interface ExtendThemeKeys<
	T extends Record<string, string | number> = Record<string, never>,
> extends ClassNameStyle<T> {
	themeKey: AllThemeKeys;
}
