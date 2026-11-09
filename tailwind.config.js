/** Colours and fonts come straight from the Coreview Visual Guide. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#345464', // solid backgrounds, text on platinum
          'teal-dark': '#2a4452', // hover/pressed state of teal (darker shade of the same hue)
          ink: '#4a494a', // "Dark Grey": paragraphs on light backgrounds
          platinum: '#e5e5e5', // paragraphs on teal; page background; logo stroke
          red: '#FF000D', // highlight, used sparingly
          orange: '#F37421', // highlight, used sparingly
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'Archivo', 'system-ui', 'sans-serif'], // titles
        sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'], // paragraphs
      },
    },
  },
  plugins: [],
};
