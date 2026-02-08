/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 启用暗色模式
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 温暖治愈色系 - 基于用户提供的配色图片
        primary: {
          50: '#fef5f7',
          100: '#fde8ed',
          200: '#fbd1db',
          300: '#f9aac0',
          400: '#f57d9d',
          500: '#DD617C',  // 主粉红色
          600: '#c94d68',
          700: '#a83d54',
          800: '#8a3245',
          900: '#6d2837',
        },
        secondary: {
          50: '#f0f4f1',
          100: '#dce6df',
          200: '#b9cdbf',
          300: '#96b49f',
          400: '#819d8b',
          500: '#6D9978',
          600: '#5a8064',
          700: '#496750',
          800: '#3a523f',
          900: '#2d3f31',
        },
        success: {
          50: '#f0f4f1',
          100: '#dce6df',
          200: '#b9cdbf',
          300: '#96b49f',
          400: '#819d8b',
          500: '#6D9978',
          600: '#5a8064',
          700: '#496750',
          800: '#3a523f',
          900: '#2d3f31',
        },
        warning: {
          50: '#fef9ed',
          100: '#fdf2d4',
          200: '#fbe5a9',
          300: '#f5d67e',
          400: '#eec85e',
          500: '#E8C259',
          600: '#d4a93d',
          700: '#b08a2a',
          800: '#8c6d1e',
          900: '#6e5515',
        },
        accent: {
          50: '#fef5f5',
          100: '#fde8e8',
          200: '#fbd0d0',
          300: '#f7a8a8',
          400: '#f17979',
          500: '#AC0327',
          600: '#980222',
          700: '#7d021c',
          800: '#640117',
          900: '#4d0112',
        },
        beige: {
          50: '#fdfcfa',
          100: '#f9f7f3',
          200: '#f3efe7',
          300: '#ebe5d9',
          400: '#e1d8c7',
          500: '#D1CBBA',
          600: '#b8b09d',
          700: '#9a9280',
          800: '#7c7566',
          900: '#625d50',
        },
        // 中性色
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
        '26': '104px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '16px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.12)',
        'DEFAULT': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 25px rgba(0,0,0,0.1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '250ms',
        'slow': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 250ms ease-in-out',
        'slide-up': 'slideUp 250ms ease-in-out',
        'scale-in': 'scaleIn 250ms ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

