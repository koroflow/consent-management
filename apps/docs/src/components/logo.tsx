import { ConsentManagementIcon } from './icons/logo';

export const LogoWithBadge = () => {
	return (
		<div className="flex items-center gap-2">
			<ConsentManagementIcon className="h-6 w-auto text-black dark:text-white" />
			<span className="inline-flex items-center rounded-full border bg-fd-primary/10 px-2.5 py-0.5 font-semibold text-fd-primary text-xs">
				RC 4
			</span>
		</div>
	);
};
