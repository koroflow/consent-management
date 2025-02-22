'use client';

import * as React from 'react';
import type { ConsentManagerContextValue } from '../types/consent-manager';

/**
 * React context for sharing consent management state.
 *
 * @remarks
 * This context provides access to both the current consent state and
 * the methods to modify it throughout the application.
 *
 * @internal
 */
export const ConsentStateContext = React.createContext<
	ConsentManagerContextValue | undefined
>(undefined);
