import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "dist/**",
      "build/**",
      "out/**",
      "next-env.d.ts",
      "config*.js",
      "script.js",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
