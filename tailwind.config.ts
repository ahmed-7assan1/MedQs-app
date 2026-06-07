import type { Config } from "tailwindcss"; // Rebuild trigger

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		boxShadow: {
  			'sm': '0 1px 2px 0 var(--shadow-clr, rgb(0 0 0 / 0.05))',
  			'DEFAULT': '0 1px 3px 0 var(--shadow-clr, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--shadow-clr, rgb(0 0 0 / 0.1))',
  			'md': '0 4px 6px -1px var(--shadow-clr, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--shadow-clr, rgb(0 0 0 / 0.1))',
  			'lg': '0 10px 15px -3px var(--shadow-clr, rgb(0 0 0 / 0.1)), 0 4px 6px -4px var(--shadow-clr, rgb(0 0 0 / 0.1))',
  			'xl': '0 20px 25px -5px var(--shadow-clr, rgb(0 0 0 / 0.1)), 0 8px 10px -6px var(--shadow-clr, rgb(0 0 0 / 0.1))',
  			'2xl': '0 25px 50px -12px var(--shadow-clr, rgb(0 0 0 / 0.25))',
  			'inner': 'inset 0 2px 4px 0 var(--shadow-clr, rgb(0 0 0 / 0.05))',
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-geist-sans)',
  				'var(--font-cairo)',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'var(--font-geist-sans)',
  				'var(--font-cairo)',
  				'system-ui',
  				'sans-serif'
  			],
  			arabic: [
  				'var(--font-cairo)',
  				'var(--font-geist-sans)',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'monospace'
  			],
  			'dm-sans': [
  				'var(--font-dm-sans)',
  				'sans-serif'
  			],
  			syne: [
  				'var(--font-syne)',
  				'sans-serif'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			medq: {
  				'50': '#f0fdfa',
  				'100': '#ccfbf1',
  				'200': '#99f6e4',
  				'300': '#5eead4',
  				'400': '#2dd4bf',
  				'500': '#14b8a6',
  				'600': '#0d9488',
  				'700': '#0f766e',
  				'800': '#115e59',
  				'900': '#134e4a',
  				'950': '#042f2e'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			brand: {
  				emerald: '#10b981',
  				rose: '#f43f5e',
  				amber: '#f59e0b',
  				violet: '#8b5cf6',
  				indigo: '#6366f1',
  				cyan: '#06b6d4',
  				midnight: '#0f172a'
  			},
  			drq: {
  				DEFAULT: '#06b6d4',
  				glow: '#22d3ee',
  				deep: '#083344',
  				dark: '#042f2e',
  				base: '#07080f',
  				panel: '#111827',
  				surface: '#1f2937',
  				border: '#374151',
  				primary: '#06b6d4',
  				secondary: '#94a3b8'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'pop-in': {
  				from: {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			'slide-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-right': {
  				from: {
  					opacity: '0',
  					transform: 'translateX(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'pulse-soft': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.6'
  				}
  			},
  			shimmer: {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'pop-in': 'pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'slide-in': 'slide-in-right 0.3s ease-out',
  			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
  			shimmer: 'shimmer 2s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
