/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0b1320',
        // Semantic accents — section 3.5 (Neomorphic Glass Aerodynamics). Map app meaning to
        // these, not to raw Tailwind color names, so a future palette tweak only happens here.
        safe: {
          DEFAULT: '#10b981', // Safe / Active — hotspot tier GREEN, verified states
        },
        route: {
          DEFAULT: '#06b6d4', // Route / Navigation — route lines, nav UI
        },
        warning: {
          DEFAULT: '#f59e0b', // Warning / Mid-Hotspot — hotspot tiers YELLOW/ORANGE
        },
        emergency: {
          DEFAULT: '#ef4444', // Emergency / High-Hotspot — hotspot tier RED
        },
      },
      boxShadow: {
        // Primary Glass Shadow — section 3.5
        glass: '8px 8px 24px rgba(0,0,0,0.45), -4px -4px 16px rgba(255,255,255,0.02)',
      },
      backdropBlur: {
        xl: '24px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
