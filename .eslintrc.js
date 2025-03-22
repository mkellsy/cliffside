module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    ignorePatterns: [".eslintrc.js"],
    rules: {
        eqeqeq: ["error", "always", { null: "ignore" }],
        quotes: ["error", "double", { allowTemplateLiterals: true }],
    },
    overrides: [
        {
            files: ["*.test.ts"],
            rules: {
                "@typescript-eslint/no-explicit-any": 0,
                "@typescript-eslint/no-var-requires": 0,
                "@typescript-eslint/ban-types": 0,
            },
        },
        {
            files: ["./src/Lambdas.ts"],
            rules: {
                "@typescript-eslint/no-var-requires": 0,
            },
        },
        {
            files: ["./src/Devices/Keypad.ts"],
            rules: {
                "@typescript-eslint/no-explicit-any": 0,
            },
        },
        {
            files: ["./src/Devices/Strip.ts"],
            rules: {
                "@typescript-eslint/no-explicit-any": 0,
            },
        },
        {
            files: ["./src/Devices/Timeclock.ts"],
            rules: {
                "@typescript-eslint/no-explicit-any": 0,
            },
        },
    ],
};
