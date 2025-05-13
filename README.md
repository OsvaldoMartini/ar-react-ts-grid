# React App with Webpack + Terser + JavaScript Obfuscator

This project is configured to build and protect your JavaScript code using:

- [Webpack](https://webpack.js.org/)
- [Terser](https://github.com/terser/terser) for minification
- [JavaScript Obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator) for code protection
- [SCSS](https://sass-lang.com/) for styling
---

## 📦 Installation

Install the required dev dependencies:

```bash
npm install --save-dev webpack webpack-cli webpack-dev-server babel-loader @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript typescript sass sass-loader css-loader style-loader html-webpack-plugin terser-webpack-plugin webpack-obfuscator
```





📁 Project Structure
```lua
my-project/
│
├── src/
│   ├── index.tsx
│   ├── components/
│   │   └── griditem.scss
│   └── App.tsx
├── public/
│   └── index.html
├── dist/                  # Regular Webpack build output
├── dist-obfuscated/       # Obfuscated JavaScript output
├── webpack.config.js
├── obfuscator-config.json
└── package.json
```


🧠 Execution Flow
The recommended flow is:
```bash
# Step 1: Build your app (minified with Terser)
npm run build

# Step 2: Obfuscate the JS output
npm run obfuscate

# Step 3: Deploy the obfuscated version
# → Use the contents of dist-obfuscated/ as your production build
```



🔐 obfuscator-config.json Guide
This file contains all configuration settings used by the JavaScript Obfuscator CLI.

➤ Sample **obfuscator-config.json**

```json
{
  "compact": true,
  "controlFlowFlattening": true,
  "deadCodeInjection": true,
  "debugProtection": true,
  "disableConsoleOutput": true,
  "stringArray": true,
  "rotateStringArray": true,
  "stringArrayEncoding": ["base64"],
  "stringArrayThreshold": 0.75
}
```


➤ Key Settings Explained

| Option                  | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `compact`               | Minifies code as much as possible                                                    |
| `controlFlowFlattening` | Converts control structures into a single block with switches — harder to understand |
| `deadCodeInjection`     | Inserts fake code to confuse decompilers                                             |
| `debugProtection`       | Prevents opening dev tools (disables console/debugging)                              |
| `disableConsoleOutput`  | Removes all `console.*` output                                                       |
| `stringArray`           | Converts all strings into array form                                                 |
| `rotateStringArray`     | Shuffles the order of strings in the array                                           |
| `stringArrayEncoding`   | Encodes strings using `base64` or RC4                                                |
| `stringArrayThreshold`  | Percentage of strings to convert (0–1.0)                                             |



🔧 Webpack Configuration

The webpack.config.js file is set up to:
- Use TerserPlugin to minify and remove comments/console
- Use webpack-obfuscator to obfuscate during build (optional)
- Support React/JSX/JS out of the box

>If you prefer CLI-based obfuscation instead of the plugin, skip the Webpack plugin and use npx javascript-obfuscator directly after the build.


✅ Summary

| Task               | Command             |
| ------------------ | ------------------- |
| Run dev server     | `npm start`         |
| Build optimized JS | `npm run build`     |
| Obfuscate JS       | `npm run obfuscate` |
| Deploy this folder | `dist-obfuscated/`  |
