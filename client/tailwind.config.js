/** @type {import('tailwindcss').Config} */
export default {
  // The content array tells Tailwind which files to scan for class names.
  // Any class name found in these files will be included in the generated CSS.
  // If a class is not referenced in these files, Tailwind will purge it from the final CSS.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
