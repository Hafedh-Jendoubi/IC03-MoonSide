module.exports = {
  // Run ESLint and Prettier on staged files
  "*.{ts,tsx}": [
    "eslint --fix",  // This will fix what it can
    "prettier --write",
    "tsc --noEmit"   // Type check staged files
  ],
  "*.{js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,css}": [
    "prettier --write"
  ]
};