import { cn } from '~/lib/cn';
import { DotPattern } from '../ui/dot-pattern';

export const HeaderBg = ({ className }: { className?: string }) => (
	<div
		className={cn(
			'-z-10 -mt-1 absolute inset-x-0 h-64 overflow-hidden',
			className
		)}
	>
		<div className="absolute inset-0 bg-gradient-to-b from-fd-primary/[0.02] to-transparent" />
		<DotPattern
			width={20}
			height={20}
			cx={1}
			cy={1}
			cr={1}
			className="absolute inset-0 h-full w-full fill-fd-primary/[0.3] [mask-image:linear-gradient(to_bottom,white,transparent,transparent)]"
		/>
	</div>
);
