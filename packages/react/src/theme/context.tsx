'use client';

/**
 * @packageDocumentation
 * Provides theme context and hooks for @c15t/react components.
 * Implements a flexible theming system with TypeScript support and runtime safety.
 */

import { createContext, useContext } from 'react';
import type { useConsentManager } from '../common/store/use-consent-manager';

/**
 * Configuration value type for the ThemeContext.
 *
 * @remarks
 * Provides type-safe theme customization options for components.
 * Supports generic theme types for different component variants.
 * Includes animation and style control features.
 *
 * @typeParam Theme - The theme configuration type for the component
 *
 * @example
 * ```tsx
 * type MyTheme = {
 *   colors: {
 *     primary: string;
 *     secondary: string;
 *   };
 * };
 *
 * const value: ThemeContextValue<MyTheme> = {
 *   theme: {
 *     colors: {
 *       primary: '#007bff',
 *       secondary: '#6c757d'
 *     }
 *   },
 *   noStyle: false,
 *   disableAnimation: false
 * };
 * ```
 *
 * @public
 */
export type ThemeContextValue<Theme = unknown> = {
	/**
	 * Theme configuration object for styling components
	 * @remarks Partial to allow incremental theme overrides
	 */
	theme?: Partial<Theme>;

	/**
	 * Disables all animations when true
	 * @remarks Useful for reduced motion preferences
	 */
	disableAnimation?: boolean;

	/**
	 * Removes default styles when true
	 * @remarks Enables fully custom styling
	 */
	noStyle?: boolean;
};

/**
 * Context for providing theme values to components.
 *
 * @remarks
 * Combines consent management state with theme configuration.
 * Must be provided by a parent Theme.Root component.
 * Supports TypeScript generic themes for type safety.
 *
 * @example
 * ```tsx
 * <ThemeContext.Provider value={{ theme: myTheme, noStyle: false }}>
 *   <App />
 * </ThemeContext.Provider>
 * ```
 *
 * @public
 */
export const ThemeContext = createContext<
	(ReturnType<typeof useConsentManager> & ThemeContextValue<unknown>) | null
>(null);

/**
 * Hook to access the current theme context.
 *
 * @remarks
 * Provides type-safe access to theme values and consent management state.
 * Throws an error if used outside of a Theme.Root component.
 * Supports TypeScript inference for theme types.
 *
 * @throws {Error} When used outside of a Theme.Root component
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { theme, noStyle, disableAnimation } = useThemeContext();
 *
 *   return (
 *     <div className={theme?.myClass}>
 *       {!disableAnimation && <AnimatedContent />}
 *     </div>
 *   );
 * };
 * ```
 *
 * @returns The current theme context value
 * @public
 */
export const useThemeContext = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('Theme components must be used within Theme.Root');
	}
	return context;
};
