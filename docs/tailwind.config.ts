import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';
import { createPreset } from "fumadocs-ui/tailwind-plugin";

export const texts = {
  'title-h1': [
    '3.5rem',
    {
      lineHeight: '4rem',
      letterSpacing: '-0.01em',
      fontWeight: '500',
    },
  ],
  'title-h2': [
    '3rem',
    {
      lineHeight: '3.5rem',
      letterSpacing: '-0.01em',
      fontWeight: '500',
    },
  ],
  'title-h3': [
    '2.5rem',
    {
      lineHeight: '3rem',
      letterSpacing: '-0.01em',
      fontWeight: '500',
    },
  ],
  'title-h4': [
    '2rem',
    {
      lineHeight: '2.5rem',
      letterSpacing: '-0.005em',
      fontWeight: '500',
    },
  ],
  'title-h5': [
    '1.5rem',
    {
      lineHeight: '2rem',
      letterSpacing: '0em',
      fontWeight: '500',
    },
  ],
  'title-h6': [
    '1.25rem',
    {
      lineHeight: '1.75rem',
      letterSpacing: '0em',
      fontWeight: '500',
    },
  ],
  'label-xl': [
    '1.5rem',
    {
      lineHeight: '2rem',
      letterSpacing: '-0.015em',
      fontWeight: '500',
    },
  ],
  'label-lg': [
    '1.125rem',
    {
      lineHeight: '1.5rem',
      letterSpacing: '-0.015em',
      fontWeight: '500',
    },
  ],
  'label-md': [
    '1rem',
    {
      lineHeight: '1.5rem',
      letterSpacing: '-0.011em',
      fontWeight: '500',
    },
  ],
  'label-sm': [
    '.875rem',
    {
      lineHeight: '1.25rem',
      letterSpacing: '-0.006em',
      fontWeight: '500',
    },
  ],
  'label-xs': [
    '.75rem',
    {
      lineHeight: '1rem',
      letterSpacing: '0em',
      fontWeight: '500',
    },
  ],
  'paragraph-xl': [
    '1.5rem',
    {
      lineHeight: '2rem',
      letterSpacing: '-0.015em',
      fontWeight: '400',
    },
  ],
  'paragraph-lg': [
    '1.125rem',
    {
      lineHeight: '1.5rem',
      letterSpacing: '-0.015em',
      fontWeight: '400',
    },
  ],
  'paragraph-md': [
    '1rem',
    {
      lineHeight: '1.5rem',
      letterSpacing: '-0.011em',
      fontWeight: '400',
    },
  ],
  'paragraph-sm': [
    '.875rem',
    {
      lineHeight: '1.25rem',
      letterSpacing: '-0.006em',
      fontWeight: '400',
    },
  ],
  'paragraph-xs': [
    '.75rem',
    {
      lineHeight: '1rem',
      letterSpacing: '0em',
      fontWeight: '400',
    },
  ],
  'subheading-md': [
    '1rem',
    {
      lineHeight: '1.5rem',
      letterSpacing: '0.06em',
      fontWeight: '500',
    },
  ],
  'subheading-sm': [
    '.875rem',
    {
      lineHeight: '1.25rem',
      letterSpacing: '0.06em',
      fontWeight: '500',
    },
  ],
  'subheading-xs': [
    '.75rem',
    {
      lineHeight: '1rem',
      letterSpacing: '0.04em',
      fontWeight: '500',
    },
  ],
  'subheading-2xs': [
    '.6875rem',
    {
      lineHeight: '.75rem',
      letterSpacing: '0.02em',
      fontWeight: '500',
    },
  ],
  'doc-label': [
    '1.125rem',
    {
      lineHeight: '2rem',
      letterSpacing: '-0.015em',
      fontWeight: '500',
    },
  ],
  'doc-paragraph': [
    '1.125rem',
    {
      lineHeight: '2rem',
      letterSpacing: '-0.015em',
      fontWeight: '400',
    },
  ],
} as unknown as Record<string, string>;

export const shadows = {
  'regular-xs': '0 1px 2px 0 #0a0d1408',
  'regular-sm': '0 2px 4px #1b1c1d0a',
  'regular-md': '0 16px 32px -12px #0e121b1a',
  'button-primary-focus': [
    '0 0 0 2px theme(colors.bg[white-0])',
    '0 0 0 4px theme(colors.primary[alpha-10])',
  ],
  'button-important-focus': [
    '0 0 0 2px theme(colors.bg[white-0])',
    '0 0 0 4px theme(colors.neutral[alpha-16])',
  ],
  'button-error-focus': [
    '0 0 0 2px theme(colors.bg[white-0])',
    '0 0 0 4px theme(colors.red[alpha-10])',
  ],
  'fancy-buttons-neutral': ['0 1px 2px 0 #1b1c1d7a', '0 0 0 1px #242628'],
  'fancy-buttons-primary': [
    '0 1px 2px 0 #0e121b3d',
    '0 0 0 1px theme(colors.primary[base])',
  ],
  'fancy-buttons-error': [
    '0 1px 2px 0 #0e121b3d',
    '0 0 0 1px theme(colors.error[base])',
  ],
  'fancy-buttons-stroke': [
    '0 1px 3px 0 #0e121b1f',
    '0 0 0 1px theme(colors.stroke[soft-200])',
  ],
  'toggle-switch': ['0 6px 10px 0 #0e121b0f', '0 2px 4px 0 #0e121b08'],
  'switch-thumb': ['0 4px 8px 0 #1b1c1d0f', '0 2px 4px 0 #0e121b14'],
  "tooltip": ['0 12px 24px 0 #0e121b0f', '0 1px 2px 0 #0e121b08'],
  'custom-xs': [
    '0 0 0 1px rgba(51, 51, 51, 0.04)',
    '0 4px 8px -2px rgba(51, 51, 51, 0.06)',
    '0 2px 4px rgba(51, 51, 51, 0.04)',
    '0 1px 2px rgba(51, 51, 51, 0.04)',
    'inset 0 -1px 1px -0.5px rgba(51, 51, 51, 0.06)',
  ],
  'custom-sm': [
    '0 0 0 1px rgba(51, 51, 51, 0.04)',
    '0 16px 8px -8px rgba(51, 51, 51, 0.01)',
    '0 12px 6px -6px rgba(51, 51, 51, 0.02)',
    '0 5px 5px -2.5px rgba(51, 51, 51, 0.08)',
    '0 1px 3px -1.5px rgba(51, 51, 51, 0.16)',
    'inset 0 -0.5px 0.5px rgba(51, 51, 51, 0.08)',
  ],
  'custom-md': [
    '0 0 0 1px rgba(51, 51, 51, 0.04)',
    '0 1px 1px 0.5px rgba(51, 51, 51, 0.04)',
    '0 3px 3px -1.5px rgba(51, 51, 51, 0.02)',
    '0 6px 6px -3px rgba(51, 51, 51, 0.04)',
    '0 12px 12px -6px rgba(51, 51, 51, 0.04)',
    '0 24px 24px -12px rgba(51, 51, 51, 0.04)',
    '0 48px 48px -24px rgba(51, 51, 51, 0.04)',
    'inset 0 -1px 1px -0.5px rgba(51, 51, 51, 0.06)',
  ],
  'custom-lg': [
    '0 0 0 1px rgba(51, 51, 51, 0.04)',
    '0 1px 1px 0.5px rgba(51, 51, 51, 0.04)',
    '0 3px 3px -1.5px rgba(51, 51, 51, 0.02)',
    '0 6px 6px -3px rgba(51, 51, 51, 0.04)',
    '0 12px 12px -6px rgba(51, 51, 51, 0.04)',
    '0 24px 24px -12px rgba(51, 51, 51, 0.04)',
    '0 48px 48px -24px rgba(51, 51, 51, 0.04)',
    '0 96px 96px -32px rgba(51, 51, 51, 0.06)',
    'inset 0 -1px 1px -0.5px rgba(51, 51, 51, 0.06)',
  ],
} as unknown as Record<string, string>;

export const borderRadii = {
  '10': '.625rem',
  '20': '1.25rem',
} as unknown as Record<string, string>;

const config = {
  darkMode: ['class'],
  safelist: ['.dark'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/fumadocs-ui/dist/**/*.js",
    "./node_modules/@koroflow/shadcn/dist/**/*.js"
  ],
  presets: [
    createPreset({
			cssPrefix: "fuma-",
      preset: "dusk"
		}),
    {
      plugins: [require("tailwindcss-animate")],
	theme: {
		extend: {
			animation: {
				ripple: "ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite",
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				ripple: {
					"0%, 100%": {
						transform: "translate(-50%, -50%) scale(1)",
					},
					"50%": {
						transform: "translate(-50%, -50%) scale(0.9)",
					},
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			colors: {
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				chart: {
					1: "hsl(var(--chart-1))",
					2: "hsl(var(--chart-2))",
					3: "hsl(var(--chart-3))",
					4: "hsl(var(--chart-4))",
					5: "hsl(var(--chart-5))",
				},
			},
		},
    }
  },
  ],
  theme: {
    colors: {
      "gray": {
        '0': 'hsl(var(--gray-0))',
        '50': 'hsl(var(--gray-50))',
        '100': 'hsl(var(--gray-100))',
        '200': 'hsl(var(--gray-200))',
        '300': 'hsl(var(--gray-300))',
        '400': 'hsl(var(--gray-400))',
        '500': 'hsl(var(--gray-500))',
        '600': 'hsl(var(--gray-600))',
        '700': 'hsl(var(--gray-700))',
        '800': 'hsl(var(--gray-800))',
        '900': 'hsl(var(--gray-900))',
        '950': 'hsl(var(--gray-950))',
        'alpha-24': 'hsl(var(--gray-alpha-24))',
        'alpha-16': 'hsl(var(--gray-alpha-16))',
        'alpha-10': 'hsl(var(--gray-alpha-10))',
      },
      "slate": {
        '0': 'hsl(var(--slate-0))',
        '50': 'hsl(var(--slate-50))',
        '100': 'hsl(var(--slate-100))',
        '200': 'hsl(var(--slate-200))',
        '300': 'hsl(var(--slate-300))',
        '400': 'hsl(var(--slate-400))',
        '500': 'hsl(var(--slate-500))',
        '600': 'hsl(var(--slate-600))',
        '700': 'hsl(var(--slate-700))',
        '800': 'hsl(var(--slate-800))',
        '900': 'hsl(var(--slate-900))',
        '950': 'hsl(var(--slate-950))',
        'alpha-24': 'hsl(var(--slate-alpha-24))',
        'alpha-16': 'hsl(var(--slate-alpha-16))',
        'alpha-10': 'hsl(var(--slate-alpha-10))',
      },
      "neutral": {
        '0': 'hsl(var(--neutral-0))',
        '50': 'hsl(var(--neutral-50))',
        '100': 'hsl(var(--neutral-100))',
        '200': 'hsl(var(--neutral-200))',
        '300': 'hsl(var(--neutral-300))',
        '400': 'hsl(var(--neutral-400))',
        '500': 'hsl(var(--neutral-500))',
        '600': 'hsl(var(--neutral-600))',
        '700': 'hsl(var(--neutral-700))',
        '800': 'hsl(var(--neutral-800))',
        '900': 'hsl(var(--neutral-900))',
        '950': 'hsl(var(--neutral-950))',
        'alpha-24': 'hsl(var(--neutral-alpha-24))',
        'alpha-16': 'hsl(var(--neutral-alpha-16))',
        'alpha-10': 'hsl(var(--neutral-alpha-10))',
      },
      "blue": {
        '50': 'hsl(var(--blue-50))',
        '100': 'hsl(var(--blue-100))',
        '200': 'hsl(var(--blue-200))',
        '300': 'hsl(var(--blue-300))',
        '400': 'hsl(var(--blue-400))',
        '500': 'hsl(var(--blue-500))',
        '600': 'hsl(var(--blue-600))',
        '700': 'hsl(var(--blue-700))',
        '800': 'hsl(var(--blue-800))',
        '900': 'hsl(var(--blue-900))',
        '950': 'hsl(var(--blue-950))',
        'alpha-24': 'hsl(var(--blue-alpha-24))',
        'alpha-16': 'hsl(var(--blue-alpha-16))',
        'alpha-10': 'hsl(var(--blue-alpha-10))',
      },
      "orange": {
        '50': 'hsl(var(--orange-50))',
        '100': 'hsl(var(--orange-100))',
        '200': 'hsl(var(--orange-200))',
        '300': 'hsl(var(--orange-300))',
        '400': 'hsl(var(--orange-400))',
        '500': 'hsl(var(--orange-500))',
        '600': 'hsl(var(--orange-600))',
        '700': 'hsl(var(--orange-700))',
        '800': 'hsl(var(--orange-800))',
        '900': 'hsl(var(--orange-900))',
        '950': 'hsl(var(--orange-950))',
        'alpha-24': 'hsl(var(--orange-alpha-24))',
        'alpha-16': 'hsl(var(--orange-alpha-16))',
        'alpha-10': 'hsl(var(--orange-alpha-10))',
      },
      "red": {
        '50': 'hsl(var(--red-50))',
        '100': 'hsl(var(--red-100))',
        '200': 'hsl(var(--red-200))',
        '300': 'hsl(var(--red-300))',
        '400': 'hsl(var(--red-400))',
        '500': 'hsl(var(--red-500))',
        '600': 'hsl(var(--red-600))',
        '700': 'hsl(var(--red-700))',
        '800': 'hsl(var(--red-800))',
        '900': 'hsl(var(--red-900))',
        '950': 'hsl(var(--red-950))',
        'alpha-24': 'hsl(var(--red-alpha-24))',
        'alpha-16': 'hsl(var(--red-alpha-16))',
        'alpha-10': 'hsl(var(--red-alpha-10))',
      },
      'green': {
        '50': 'hsl(var(--green-50))',
        '100': 'hsl(var(--green-100))',
        '200': 'hsl(var(--green-200))',
        '300': 'hsl(var(--green-300))',
        '400': 'hsl(var(--green-400))',
        '500': 'hsl(var(--green-500))',
        '600': 'hsl(var(--green-600))',
        '700': 'hsl(var(--green-700))',
        '800': 'hsl(var(--green-800))',
        '900': 'hsl(var(--green-900))',
        '950': 'hsl(var(--green-950))',
        'alpha-24': 'hsl(var(--green-alpha-24))',
        'alpha-16': 'hsl(var(--green-alpha-16))',
        'alpha-10': 'hsl(var(--green-alpha-10))',
      },
      "yellow": {
        '50': 'hsl(var(--yellow-50))',
        '100': 'hsl(var(--yellow-100))',
        '200': 'hsl(var(--yellow-200))',
        '300': 'hsl(var(--yellow-300))',
        '400': 'hsl(var(--yellow-400))',
        '500': 'hsl(var(--yellow-500))',
        '600': 'hsl(var(--yellow-600))',
        '700': 'hsl(var(--yellow-700))',
        '800': 'hsl(var(--yellow-800))',
        '900': 'hsl(var(--yellow-900))',
        '950': 'hsl(var(--yellow-950))',
        'alpha-24': 'hsl(var(--yellow-alpha-24))',
        'alpha-16': 'hsl(var(--yellow-alpha-16))',
        'alpha-10': 'hsl(var(--yellow-alpha-10))',
      },
      "purple": {
        '50': 'hsl(var(--purple-50))',
        '100': 'hsl(var(--purple-100))',
        '200': 'hsl(var(--purple-200))',
        '300': 'hsl(var(--purple-300))',
        '400': 'hsl(var(--purple-400))',
        '500': 'hsl(var(--purple-500))',
        '600': 'hsl(var(--purple-600))',
        '700': 'hsl(var(--purple-700))',
        '800': 'hsl(var(--purple-800))',
        '900': 'hsl(var(--purple-900))',
        '950': 'hsl(var(--purple-950))',
        'alpha-24': 'hsl(var(--purple-alpha-24))',
        'alpha-16': 'hsl(var(--purple-alpha-16))',
        'alpha-10': 'hsl(var(--purple-alpha-10))',
      },
      "sky": {
        '50': 'hsl(var(--sky-50))',
        '100': 'hsl(var(--sky-100))',
        '200': 'hsl(var(--sky-200))',
        '300': 'hsl(var(--sky-300))',
        '400': 'hsl(var(--sky-400))',
        '500': 'hsl(var(--sky-500))',
        '600': 'hsl(var(--sky-600))',
        '700': 'hsl(var(--sky-700))',
        '800': 'hsl(var(--sky-800))',
        '900': 'hsl(var(--sky-900))',
        '950': 'hsl(var(--sky-950))',
        'alpha-24': 'hsl(var(--sky-alpha-24))',
        'alpha-16': 'hsl(var(--sky-alpha-16))',
        'alpha-10': 'hsl(var(--sky-alpha-10))',
      },
      "pink": {
        '50': 'hsl(var(--pink-50))',
        '100': 'hsl(var(--pink-100))',
        '200': 'hsl(var(--pink-200))',
        '300': 'hsl(var(--pink-300))',
        '400': 'hsl(var(--pink-400))',
        '500': 'hsl(var(--pink-500))',
        '600': 'hsl(var(--pink-600))',
        '700': 'hsl(var(--pink-700))',
        '800': 'hsl(var(--pink-800))',
        '900': 'hsl(var(--pink-900))',
        '950': 'hsl(var(--pink-950))',
        'alpha-24': 'hsl(var(--pink-alpha-24))',
        'alpha-16': 'hsl(var(--pink-alpha-16))',
        'alpha-10': 'hsl(var(--pink-alpha-10))',
      },
      "teal": {
        '50': 'hsl(var(--teal-50))',
        '100': 'hsl(var(--teal-100))',
        '200': 'hsl(var(--teal-200))',
        '300': 'hsl(var(--teal-300))',
        '400': 'hsl(var(--teal-400))',
        '500': 'hsl(var(--teal-500))',
        '600': 'hsl(var(--teal-600))',
        '700': 'hsl(var(--teal-700))',
        '800': 'hsl(var(--teal-800))',
        '900': 'hsl(var(--teal-900))',
        '950': 'hsl(var(--teal-950))',
        'alpha-24': 'hsl(var(--teal-alpha-24))',
        'alpha-16': 'hsl(var(--teal-alpha-16))',
        'alpha-10': 'hsl(var(--teal-alpha-10))',
      },
      'white': {
        DEFAULT: '#fff',
        'alpha-24': 'hsl(var(--white-alpha-24))',
        'alpha-16': 'hsl(var(--white-alpha-16))',
        'alpha-10': 'hsl(var(--white-alpha-10))',
      },
      "black": {
        DEFAULT: '#000',
        'alpha-24': 'hsl(var(--black-alpha-24))',
        'alpha-16': 'hsl(var(--black-alpha-16))',
        'alpha-10': 'hsl(var(--black-alpha-10))',
      },
      "primary": {
        dark: 'hsl(var(--primary-dark))',
        darker: 'hsl(var(--primary-darker))',
        base: 'hsl(var(--primary-base))',
        'alpha-24': 'hsl(var(--primary-alpha-24))',
        'alpha-16': 'hsl(var(--primary-alpha-16))',
        'alpha-10': 'hsl(var(--primary-alpha-10))',
      },
      "static": {
        black: 'hsl(var(--static-black))',
        white: 'hsl(var(--static-white))',
      },
      "bg": {
        'strong-950': 'hsl(var(--bg-strong-950))',
        'surface-800': 'hsl(var(--bg-surface-800))',
        'sub-300': 'hsl(var(--bg-sub-300))',
        'soft-200': 'hsl(var(--bg-soft-200))',
        'weak-50': 'hsl(var(--bg-weak-50))',
        'white-0': 'hsl(var(--bg-white-0))',
      },
      "text": {
        'strong-950': 'hsl(var(--text-strong-950))',
        'sub-600': 'hsl(var(--text-sub-600))',
        'soft-400': 'hsl(var(--text-soft-400))',
        'disabled-300': 'hsl(var(--text-disabled-300))',
        'white-0': 'hsl(var(--text-white-0))',
      },
      "stroke": {
        'strong-950': 'hsl(var(--stroke-strong-950))',
        'sub-300': 'hsl(var(--stroke-sub-300))',
        'soft-200': 'hsl(var(--stroke-soft-200))',
        'white-0': 'hsl(var(--stroke-white-0))',
      },
      "faded": {
        dark: 'hsl(var(--faded-dark))',
        base: 'hsl(var(--faded-base))',
        light: 'hsl(var(--faded-light))',
        lighter: 'hsl(var(--faded-lighter))',
      },
      "information": {
        dark: 'hsl(var(--information-dark))',
        base: 'hsl(var(--information-base))',
        light: 'hsl(var(--information-light))',
        lighter: 'hsl(var(--information-lighter))',
      },
      "warning": {
        dark: 'hsl(var(--warning-dark))',
        base: 'hsl(var(--warning-base))',
        light: 'hsl(var(--warning-light))',
        lighter: 'hsl(var(--warning-lighter))',
      },
      "error": {
        dark: 'hsl(var(--error-dark))',
        base: 'hsl(var(--error-base))',
        light: 'hsl(var(--error-light))',
        lighter: 'hsl(var(--error-lighter))',
      },
      "success": {
        dark: 'hsl(var(--success-dark))',
        base: 'hsl(var(--success-base))',
        light: 'hsl(var(--success-light))',
        lighter: 'hsl(var(--success-lighter))',
      },
      "away": {
        dark: 'hsl(var(--away-dark))',
        base: 'hsl(var(--away-base))',
        light: 'hsl(var(--away-light))',
        lighter: 'hsl(var(--away-lighter))',
      },
      "feature": {
        dark: "hsl(var(--feature-dark))",
        base: "hsl(var(--feature-base))",
        light: "hsl(var(--feature-light))",
        lighter: "hsl(var(--feature-lighter))",
      },
      "verified": {
        dark: 'hsl(var(--verified-dark))',
        base: 'hsl(var(--verified-base))',
        light: 'hsl(var(--verified-light))',
        lighter: 'hsl(var(--verified-lighter))',
      },
      "highlighted": {
        dark: 'hsl(var(--highlighted-dark))',
        base: 'hsl(var(--highlighted-base))',
        light: 'hsl(var(--highlighted-light))',
        lighter: 'hsl(var(--highlighted-lighter))',
      },
      "stable": {
        dark: 'hsl(var(--stable-dark))',
        base: 'hsl(var(--stable-base))',
        light: 'hsl(var(--stable-light))',
        lighter: 'hsl(var(--stable-lighter))',
      },
      "social": {
        apple: 'hsl(var(--social-apple))',
        twitter: 'hsl(var(--social-twitter))',
        github: 'hsl(var(--social-github))',
        notion: 'hsl(var(--social-notion))',
        tidal: 'hsl(var(--social-tidal))',
        amazon: 'hsl(var(--social-amazon))',
        zendesk: 'hsl(var(--social-zendesk))',
      },
      "overlay": {
        DEFAULT: 'hsl(var(--overlay))',
      },
      "transparent": 'transparent',
      "current": 'currentColor',
    },
    fontSize: {
      ...texts,
      inherit: 'inherit',
    },
    boxShadow: {
      ...shadows,
      none: defaultTheme.boxShadow.none,
    },
    extend: {
      borderRadius: {
        ...borderRadii,
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
            opacity: '1',
          },
          to: { height: '0', opacity: '0' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
