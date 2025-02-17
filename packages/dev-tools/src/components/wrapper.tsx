'use client';

import { Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './wrapper.css';
import { Button } from './ui/button';
import { Card } from './ui/card';

/**
 * Dev Tool Wrapper Component
 *
 * This component serves as both an icon and a wrapper for the development tool interface.
 * It provides a button that, when clicked, toggles the visibility of a pop-up containing
 * the router pages.
 *
 * @component
 * @returns {JSX.Element} The rendered component
 */
export function DevToolWrapper({
	children,
	isOpen,
	toggleOpen,
	position = 'bottom-right',
}: {
	children: ReactNode;
	isOpen: boolean;
	toggleOpen: () => void;
	position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}) {
	// Track whether component is mounted to handle client-side only features
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	const DevToolContent = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="dev-tool-overlay"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						className="dev-tool-backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={toggleOpen}
					/>
					<motion.div
						className={`dev-tool-content ${position}`}
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 50 }}
						transition={{ type: 'spring', stiffness: 300, damping: 30 }}
					>
						<Card className="dev-tool-card">{children}</Card>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return (
		<>
			<AnimatePresence>
				{!isOpen && (
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="dev-tool-button-container"
					>
						<Button
							variant="outline"
							size="icon"
							className="dev-tool-button"
							onClick={toggleOpen}
						>
							<Shield className="dev-tool-icon" />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
			{isMounted && createPortal(DevToolContent, document.body)}
		</>
	);
}

export default DevToolWrapper;
