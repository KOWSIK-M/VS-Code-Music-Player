import globals from "globals";

export default [{
    files: ["**/*.js"],
    languageOptions: {
        globals: {
            ...globals.commonjs,
            ...globals.node,
            ...globals.mocha,
        },

        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "no-const-assign": "warn",
        "no-this-before-super": "warn",
        "no-undef": "warn",
        "no-unreachable": "warn",
        "no-unused-vars": "warn",
        "constructor-super": "warn",
        "valid-typeof": "warn",
    },
},
// ✅ Specific override for webview scripts
{
    files: ["media/**/*.js"],
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        globals: {
            ...globals.browser,          // <--- enables 'document', 'window', etc.
            acquireVsCodeApi: "readonly" // <--- custom VS Code API global
        },
    },
},
];