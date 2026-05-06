import jsEslint from '@eslint/js'
import globals from 'globals'
import tsEslint from 'typescript-eslint'
import eslintPluginVue from 'eslint-plugin-vue'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import { resolve } from 'path'

const cwd = process.cwd()

export default tsEslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/.cache/**',
      '**/.vite/**',
      '**/.vite-temp/**',
      '**/.temp/**',
      '**/public/**',
      '**/docker/supabase/.generated/**',
      '**/application/custom-comp-app/src/views/Slam/data/**',
      'main-app/src/micro-apps.json',
    ],
  },

  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs,vue}'],
    plugins: {
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', resolve(cwd, 'src')]],
          extensions: ['.js', '.jsx', '.vue', '.ts', '.tsx'],
        },
      },
    },
  },

  // ✅ JavaScript 配置
  {
    files: ['**/*.{js,jsx,mjs,cjs,vue}'],
    ...jsEslint.configs.recommended,
    rules: {
      'no-console': 'off',
      'prettier/prettier': 'warn',
    },
  },

  // ✅ TypeScript 配置
  ...tsEslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },

  // ✅ Vue 配置
  ...eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsEslint.parser,
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'vue/no-mutating-props': ['error', { shallowOnly: true }],
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: 1, // 单行只允许一个属性，触发换行
          multiline: 1, // 每行最多一个属性
        },
      ],
    },
  },

  {
    files: ['**/*.{tsx,jsx}'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/one-component-per-file': 'off',
      'vue/require-default-prop': 'off',
    },
  },

  // ✅ 全局变量
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        process: true,
      },
    },
  },

  /**
   * prettier 配置
   * 会合并根目录下的.prettier.config.js 文件
   * @see https://prettier.io/docs/en/options
   */
  eslintPluginPrettierRecommended,
)
