"use client";
import { cn } from "@koroflow/shadcn/libs";
import { motion } from "motion/react";
import React, { useId } from "react";

interface PathAnimation {
	startColor: string;
	stopColor: string;
	delay: number;
}

export const GoogleGeminiEffect = ({
	pathAnimations,
	className,
}: {
	pathAnimations: PathAnimation[];
	className?: string;
}) => {
	const ids = pathAnimations.map(() => useId());

	return (
		<svg
			viewBox="0 0 1240 310"
			className={cn("h-full w-full", className)}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title> diagram </title>
			{pathAnimations.map((animation, index) => (
				<React.Fragment key={ids[index]}>
					<path
						d={
							[
								"M1238.04 8.79777C1134.41 10.9375 1068.73 22.3533 1028.5 48.66C972 85.6021 969.5 98.66 929.5 125.16C907.5 138.66 911.5 136.16 867.5 146.896C834.5 155.396 832.8 165.743 816 165.396C798.141 165.026 786.961 154.498 766.535 147.878C760.624 145.962 754.243 145.329 748.364 147.339C729.35 153.84 710.375 173.896 694 173.896C678.421 174.308 661.362 154.017 643.812 145.739C636.716 142.391 628.505 143.148 621.274 146.196C597.81 156.084 585.171 173.896 569.5 173.896C552.5 174.396 531.5 143.896 511.5 143.896C490 143.896 471.5 166.396 451.5 166.396C441.149 166.071 417.104 156.718 403.511 150.534C401.16 149.464 398.746 148.556 396.259 147.859C356.916 136.837 324.176 123.809 311 112.66C299.182 102.66 222 36.383 165.5 23.16C114.469 11.2166 74.3293 8.36318 1.13916 8.32422",
								"M1237.56 83.8094C1169.32 83.5489 1135.31 84.167 1085 91.66C1042.23 98.031 1022.5 102.16 971 126.66C947.5 137.84 934.5 151.895 863 151.895C823 149.395 807.8 169.243 791 168.895C773.089 168.525 759.178 153.924 737.992 146.354C732.141 144.264 725.718 143.629 719.903 145.817C701.211 152.847 683.364 174.729 667 174.729C651.454 175.14 635.448 155.049 618.298 146.777C611.231 143.368 603.017 144.168 595.751 147.132C572.076 156.79 558.676 173.729 543 173.729C526 174.229 504.5 146.395 484.5 146.395C464.814 146.395 447 166.395 423 163.895C404.5 161.968 403.786 157.372 387 152.895C372 148.895 347.371 146.625 323.5 139.66C287.517 129.161 251 109.66 223.5 101.66C186.797 90.9828 81.6422 86.6385 1.0874 84.8712",
								"M1237.88 158.357C1189.59 158.671 1194.33 159.562 1141 159.562C1078.99 159.562 1077.5 158.395 1024 158.395C990.5 158.395 1014.5 158.395 955.5 158.395C936.5 158.395 906.3 160.243 889.5 159.895C870.679 159.506 866.993 156.408 837.176 150.791C832.097 149.834 826.856 149.415 821.814 150.552C802.316 154.946 782.791 169.395 766 169.395C750.418 169.808 732.335 152.224 714.423 144.905C707.16 141.937 698.991 142.625 691.793 145.75C668.77 155.743 657.654 173.895 642 173.895C625 174.395 600.5 144.395 580.5 144.395C559 144.395 547.5 160.562 527.5 164.562C516 166.862 488 161.593 475 158.895C469.162 157.684 464.04 156.866 459.508 156.357C418.631 151.765 377.503 159.963 336.37 160.283C322.849 160.388 305.976 160.1 280.5 158.895C214.323 158.895 112.027 159.249 1.17773 159.261",
								"M1237.9 232.8C1163.76 232.59 1137.15 231.947 1080.5 224.395C1016.5 215.864 1002.24 201.787 956.5 182.16C937.5 175.957 920.91 165.846 882.951 165.223C857.139 164.799 830.879 166.867 807.429 156.071C796.865 151.207 786.47 146.757 779.5 146.902C761.599 147.272 749.246 164.053 728.451 172.151C722.661 174.406 716.218 175.001 710.403 172.814C691.711 165.783 673.864 143.902 657.5 143.902C641.932 143.49 624.886 162.735 607.349 170.665C600.2 173.898 592.004 173.149 584.774 170.102C561.31 160.212 548.671 142.395 533 142.395C516 141.895 492 168.895 476 168.895C455.5 168.395 454.5 161.895 434.5 157.895C423 155.595 394 157.889 379 160.395C326 171.395 334 168.66 308 180.16C292.5 188.66 248 208.16 210 218.66C184.863 229.324 103.444 231.865 1.10107 232.471",
								"M1237.9 308.17C1159.7 307.769 1086.08 302.786 1040 274.16C982.5 239.66 977.5 218.519 934 194.16C907.42 179.278 896.012 175.771 872.199 170.114C863.095 167.952 854.234 164.92 845.817 160.833C835.293 155.722 822.677 150.331 803.5 148.896C789.748 147.866 775.952 158.209 762.827 165.229C750.214 171.975 735.13 170.331 722.469 163.675C704.103 154.019 694.831 141.63 682 141.895C664.085 142.266 651.726 162.275 630.902 171.125C625.184 173.555 618.727 174.094 612.903 171.929C593.545 164.732 573.408 141.895 557 141.895C541.446 141.484 524.755 160.355 507.356 168.179C500.2 171.397 492.042 170.568 484.66 167.909C462.429 159.899 453.591 149.396 438 149.396C421 148.896 409.664 164.508 390 168.16C355 174.66 339 176.66 297.5 211.16C239.5 266.16 226.5 275.16 169 292.16C112.713 306.062 73.3509 308.232 1.12207 308.363",
							][index]
						}
						stroke="currentColor"
						strokeOpacity={0.1}
						strokeWidth="1.5"
						fill="none"
					/>
					<path
						d={
							[
								"M1238.04 8.79777C1134.41 10.9375 1068.73 22.3533 1028.5 48.66C972 85.6021 969.5 98.66 929.5 125.16C907.5 138.66 911.5 136.16 867.5 146.896C834.5 155.396 832.8 165.743 816 165.396C798.141 165.026 786.961 154.498 766.535 147.878C760.624 145.962 754.243 145.329 748.364 147.339C729.35 153.84 710.375 173.896 694 173.896C678.421 174.308 661.362 154.017 643.812 145.739C636.716 142.391 628.505 143.148 621.274 146.196C597.81 156.084 585.171 173.896 569.5 173.896C552.5 174.396 531.5 143.896 511.5 143.896C490 143.896 471.5 166.396 451.5 166.396C441.149 166.071 417.104 156.718 403.511 150.534C401.16 149.464 398.746 148.556 396.259 147.859C356.916 136.837 324.176 123.809 311 112.66C299.182 102.66 222 36.383 165.5 23.16C114.469 11.2166 74.3293 8.36318 1.13916 8.32422",
								"M1237.56 83.8094C1169.32 83.5489 1135.31 84.167 1085 91.66C1042.23 98.031 1022.5 102.16 971 126.66C947.5 137.84 934.5 151.895 863 151.895C823 149.395 807.8 169.243 791 168.895C773.089 168.525 759.178 153.924 737.992 146.354C732.141 144.264 725.718 143.629 719.903 145.817C701.211 152.847 683.364 174.729 667 174.729C651.454 175.14 635.448 155.049 618.298 146.777C611.231 143.368 603.017 144.168 595.751 147.132C572.076 156.79 558.676 173.729 543 173.729C526 174.229 504.5 146.395 484.5 146.395C464.814 146.395 447 166.395 423 163.895C404.5 161.968 403.786 157.372 387 152.895C372 148.895 347.371 146.625 323.5 139.66C287.517 129.161 251 109.66 223.5 101.66C186.797 90.9828 81.6422 86.6385 1.0874 84.8712",
								"M1237.88 158.357C1189.59 158.671 1194.33 159.562 1141 159.562C1078.99 159.562 1077.5 158.395 1024 158.395C990.5 158.395 1014.5 158.395 955.5 158.395C936.5 158.395 906.3 160.243 889.5 159.895C870.679 159.506 866.993 156.408 837.176 150.791C832.097 149.834 826.856 149.415 821.814 150.552C802.316 154.946 782.791 169.395 766 169.395C750.418 169.808 732.335 152.224 714.423 144.905C707.16 141.937 698.991 142.625 691.793 145.75C668.77 155.743 657.654 173.895 642 173.895C625 174.395 600.5 144.395 580.5 144.395C559 144.395 547.5 160.562 527.5 164.562C516 166.862 488 161.593 475 158.895C469.162 157.684 464.04 156.866 459.508 156.357C418.631 151.765 377.503 159.963 336.37 160.283C322.849 160.388 305.976 160.1 280.5 158.895C214.323 158.895 112.027 159.249 1.17773 159.261",
								"M1237.9 232.8C1163.76 232.59 1137.15 231.947 1080.5 224.395C1016.5 215.864 1002.24 201.787 956.5 182.16C937.5 175.957 920.91 165.846 882.951 165.223C857.139 164.799 830.879 166.867 807.429 156.071C796.865 151.207 786.47 146.757 779.5 146.902C761.599 147.272 749.246 164.053 728.451 172.151C722.661 174.406 716.218 175.001 710.403 172.814C691.711 165.783 673.864 143.902 657.5 143.902C641.932 143.49 624.886 162.735 607.349 170.665C600.2 173.898 592.004 173.149 584.774 170.102C561.31 160.212 548.671 142.395 533 142.395C516 141.895 492 168.895 476 168.895C455.5 168.395 454.5 161.895 434.5 157.895C423 155.595 394 157.889 379 160.395C326 171.395 334 168.66 308 180.16C292.5 188.66 248 208.16 210 218.66C184.863 229.324 103.444 231.865 1.10107 232.471",
								"M1237.9 308.17C1159.7 307.769 1086.08 302.786 1040 274.16C982.5 239.66 977.5 218.519 934 194.16C907.42 179.278 896.012 175.771 872.199 170.114C863.095 167.952 854.234 164.92 845.817 160.833C835.293 155.722 822.677 150.331 803.5 148.896C789.748 147.866 775.952 158.209 762.827 165.229C750.214 171.975 735.13 170.331 722.469 163.675C704.103 154.019 694.831 141.63 682 141.895C664.085 142.266 651.726 162.275 630.902 171.125C625.184 173.555 618.727 174.094 612.903 171.929C593.545 164.732 573.408 141.895 557 141.895C541.446 141.484 524.755 160.355 507.356 168.179C500.2 171.397 492.042 170.568 484.66 167.909C462.429 159.899 453.591 149.396 438 149.396C421 148.896 409.664 164.508 390 168.16C355 174.66 339 176.66 297.5 211.16C239.5 266.16 226.5 275.16 169 292.16C112.713 306.062 73.3509 308.232 1.12207 308.363",
							][index]
						}
						stroke={`url(#${ids[index]})`}
						strokeWidth="1.5"
						fill="none"
					/>
					<defs>
						<motion.linearGradient
							id={ids[index]}
							gradientUnits="userSpaceOnUse"
							initial={{
								x1: "-100%",
								x2: "-100%",
							}}
							animate={{
								x1: ["-100%", "200%"],
								x2: ["0%", "300%"],
							}}
							transition={{
								duration: 4,
								delay: animation.delay,
								repeat: Number.POSITIVE_INFINITY,
								repeatType: "loop",
								ease: "linear",
							}}
						>
							<stop
								stopColor={animation.startColor}
								stopOpacity="0"
								offset="0%"
							/>
							<stop
								stopColor={animation.startColor}
								stopOpacity="0.1"
								offset="15%"
							/>
							<stop stopColor={animation.startColor} offset="35%" />
							<stop stopColor={animation.stopColor} offset="65%" />
							<stop
								stopColor={animation.stopColor}
								stopOpacity="0.1"
								offset="85%"
							/>
							<stop
								stopColor={animation.stopColor}
								stopOpacity="0"
								offset="100%"
							/>
						</motion.linearGradient>
					</defs>
				</React.Fragment>
			))}
		</svg>
	);
};
