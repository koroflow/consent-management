import type { SVGProps } from 'react';

interface ThailandIconProps {
	title?: string;
	titleId?: string;
}

export const ThailandIcon = ({
	title = 'Thailand',
	titleId = 'thailand',
	...props
}: SVGProps<SVGSVGElement> & ThailandIconProps) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 141 260"
		aria-labelledby={titleId}
		{...props}
	>
		<title id={titleId}>{title}</title>
		<polygon
			fill="currentColor"
			fillRule="evenodd"
			clipRule="evenodd"
			points="129.539,74.861 123.279,62.39 123.967,52.692 107.962,37.209 98.146,37.304 87.832,45.295 78.396,39.154   66.777,47.642 59.072,50.843 61.182,36.617 63.885,31.329 62.913,17.791 52.717,16.937 49.635,13.215 49.113,2 35.101,5.841   25.5,13.618 6.411,18.905 2.025,34.625 8.545,50.961 17.318,60.446 20.566,69.977 19.333,89.23 12.647,93.213 13.951,98.785   29.244,117.587 29.932,126.502 37.543,150.734 24.668,168.588 12.908,207.734 20.685,210.626 39.677,232.132 40.601,237.49   47.572,239.6 58.455,246.524 62.936,247.425 63.387,258 70.239,253.542 75.479,256.174 80.198,247.14 74.08,241.663 71.306,237.206   62.652,236.803 50.654,228.978 47.548,220.964 49.991,218.072 47.857,209.204 43.328,205.932 40.08,194.219 31.757,192.891   29.363,176.081 35.385,164.96 36.523,159.104 44.182,144.167 43.115,125.08 45.272,122.733 50.56,121.571 60.447,121.997   60.518,136.318 74.341,135.157 84.086,140.966 86.386,134.185 83.446,125.056 93.167,109.384 98.692,106.183 127.096,104.665   136.913,101.891 138.975,82.638 "
		/>
	</svg>
);
