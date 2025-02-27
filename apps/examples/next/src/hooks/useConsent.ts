'use client';

import { useState, useEffect } from 'react';

interface ConsentState {
	analytics: boolean;
	marketing: boolean;
	preferences: boolean;
}

export function useConsent() {
	const [loading, setLoading] = useState(true);
	const [consented, setConsented] = useState(false);
	const [preferences, setPreferences] = useState<ConsentState>({
		analytics: false,
		marketing: false,
		preferences: false,
	});

	// Fetch the current consent state on mount
	useEffect(() => {
		const fetchConsentState = async () => {
			try {
				const response = await fetch('/api/consent/status');
				const data = await response.json();

				setConsented(data.consented);
				if (data.preferences) {
					setPreferences(data.preferences);
				}
			} catch (error) {
				console.error('Error fetching consent state:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchConsentState();
	}, []);

	// Function to update consent preferences
	const updateConsent = async (newPreferences: Partial<ConsentState>) => {
		setLoading(true);

		try {
			const updatedPreferences = { ...preferences, ...newPreferences };
			const response = await fetch('/api/consent/set', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ preferences: updatedPreferences }),
			});

			if (response.ok) {
				setPreferences(updatedPreferences);
				setConsented(true);
			}
		} catch (error) {
			console.error('Error updating consent:', error);
		} finally {
			setLoading(false);
		}
	};

	return {
		loading,
		consented,
		preferences,
		updateConsent,
		acceptAll: () =>
			updateConsent({
				analytics: true,
				marketing: true,
				preferences: true,
			}),
		rejectAll: () =>
			updateConsent({
				analytics: false,
				marketing: false,
				preferences: false,
			}),
	};
}
