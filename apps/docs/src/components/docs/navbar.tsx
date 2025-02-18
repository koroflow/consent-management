'use client';

import { cn } from '@c15t/shadcn/libs';
import { ThemeToggle } from 'fumadocs-ui/components/layout/theme-toggle';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogoWithBadge } from '../logo';
import { navigation } from './navigation';
import { LargeSearchToggle } from './search';

const Navbar = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	const isLinkActive = (href: string) => {
		// Handle exact matches for root docs
		if (href === '/docs') {
			return pathname === '/docs' || pathname === '/docs/';
		}
		// Handle nested routes like /docs/release-notes
		if (href.startsWith('/docs/')) {
			return pathname === href || pathname.startsWith(`${href}/`);
		}
		// Handle home page
		if (href === '/') {
			return pathname === '/';
		}
		return false;
	};

	return (
		<nav
			id="custom-nav"
			className="sticky top-0 z-40 hidden w-full border-fd-border border-b bg-fd-background/80 backdrop-blur-sm md:block"
		>
			{/* Main Navbar */}
			<div className="mx-auto flex h-16 max-w-[var(--fd-layout-width)] items-center justify-between px-2 lg:px-4">
				<Link href="/">
					<LogoWithBadge />
				</Link>

				<div className="hidden flex-1 justify-center lg:flex">
					<div className="w-full max-w-lg">
						<LargeSearchToggle />
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* Desktop Navigation */}
					<div className="hidden items-center gap-4 lg:flex">
						{navigation.mainLinks.map((link) => (
							<Link
								key={link.text}
								href={link.url}
								className={cn(
									'font-medium text-sm transition-colors',
									isLinkActive(link.url)
										? 'text-fd-foreground'
										: 'text-fd-muted-foreground hover:text-fd-foreground'
								)}
							>
								{link.icon ? link.icon : link.text}
							</Link>
						))}
						<ThemeToggle />
					</div>

					{/* Mobile Menu Button */}
					<button
						type="button"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="inline-flex items-center justify-center rounded-md p-2 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground lg:hidden"
					>
						<span className="sr-only">Open main menu</span>
						{isMobileMenuOpen ? (
							<X className="h-6 w-6" />
						) : (
							<Menu className="h-6 w-6" />
						)}
					</button>
				</div>
			</div>

			{/* Secondary Navigation */}
			<div className="mx-auto hidden max-w-[var(--fd-layout-width)] border-fd-border border-t px-2 pt-1 lg:block lg:px-4">
				<div className="-mb-px flex h-12 space-x-4">
					{navigation.secondaryLinks.map((link) => (
						<Link
							key={link.name}
							href={link.href}
							className={cn(
								'inline-flex items-center border-b-2 px-1 pt-px font-medium text-sm transition-colors',
								isLinkActive(link.href)
									? 'border-fd-primary text-fd-foreground'
									: 'border-transparent text-fd-muted-foreground hover:border-fd-border hover:text-fd-foreground'
							)}
						>
							{link.name}
						</Link>
					))}
				</div>
			</div>

			{/* Mobile Navigation */}
			{isMobileMenuOpen && (
				<div className="lg:hidden">
					<div className="space-y-1 px-4 pt-2 pb-3">
						{navigation.mainLinks.map((link) => (
							<Link
								key={link.text}
								href={link.url}
								className={cn(
									'block rounded-md px-3 py-2 font-medium text-base transition-colors',
									isLinkActive(link.url)
										? 'bg-fd-accent text-fd-foreground'
										: 'text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-foreground'
								)}
								onClick={() => setIsMobileMenuOpen(false)}
							>
								{link.icon ? link.icon : link.text}
							</Link>
						))}
						{navigation.secondaryLinks.map((link) => (
							<Link
								key={link.name}
								href={link.href}
								className={cn(
									'block rounded-md px-3 py-2 font-medium text-base transition-colors',
									isLinkActive(link.href)
										? 'bg-fd-accent text-fd-foreground'
										: 'text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-foreground'
								)}
								onClick={() => setIsMobileMenuOpen(false)}
							>
								{link.name}
							</Link>
						))}
						<div className="mt-4 flex items-center px-3">
							<ThemeToggle />
						</div>
					</div>
				</div>
			)}
		</nav>
	);
};

export default Navbar;
