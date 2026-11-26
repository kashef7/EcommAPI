import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

const FEATURE_NAMES = ['auth', 'catalog', 'product', 'cart', 'profile', 'admin'];

function forbidLayerPatterns(layers, extraRegexes = []) {
  const joined = layers.join('|');
  const patterns = [
    {
      regex: `^(?:@/(?:${joined})(?:/|$)|(?:\\.\\./)+(?:${joined})(?:/|$))`,
      message: `Forbidden cross-layer import from [${layers.join(', ')}].`,
    },
    ...extraRegexes.map((regex) => ({
      regex,
      message: 'Forbidden layer import.',
    })),
  ];
  return ['error', { patterns }];
}

function crossFeatureSubpaths(currentFeature) {
  return FEATURE_NAMES.filter((name) => name !== currentFeature).map(
    (other) => `features/${other}`,
  );
}

function buildFeatureConfigs(feature) {
  const cross = crossFeatureSubpaths(feature);
  return [
    {
      files: [`src/features/${feature}/**/*.ts`, `src/features/${feature}/**/*.tsx`],
      rules: {
        'no-restricted-imports': forbidLayerPatterns([...cross, 'layouts', 'app', 'pages']),
      },
    },
    {
      files: [`src/features/${feature}/model/**/*.ts`, `src/features/${feature}/*/model/**/*.ts`],
      rules: {
        'no-restricted-imports': forbidLayerPatterns(
          [...cross, 'api', 'ui', 'core/http', 'core/auth', 'core/data', 'layouts', 'app', 'pages'],
          [
            '^(?:preact(?:/|$)|@preact/signals$|lucide-preact$)',
            '^(?:\\.\\./)+(?:hooks|components)(?:/|$)',
          ],
        ),
      },
    },
    {
      files: [
        `src/features/${feature}/components/**/*.ts`,
        `src/features/${feature}/components/**/*.tsx`,
        `src/features/${feature}/*/components/**/*.ts`,
        `src/features/${feature}/*/components/**/*.tsx`,
      ],
      rules: {
        'no-restricted-imports': forbidLayerPatterns([
          ...cross,
          'api',
          'core/http',
          'layouts',
          'app',
          'pages',
        ]),
      },
    },
    {
      files: [
        `src/features/${feature}/hooks/**/*.ts`,
        `src/features/${feature}/hooks/**/*.tsx`,
        `src/features/${feature}/*/hooks/**/*.ts`,
        `src/features/${feature}/*/hooks/**/*.tsx`,
      ],
      rules: {
        'no-restricted-imports': forbidLayerPatterns([...cross, 'ui', 'layouts', 'app', 'pages']),
      },
    },
  ];
}

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-console': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-restricted-properties': [
        'error',
        {
          property: 'innerHTML',
          message: 'Never use innerHTML. Render via Preact or textContent.',
        },
        {
          property: 'outerHTML',
          message: 'Never use outerHTML.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.type="MetaProperty"][property.name="env"]',
          message: 'Read environment variables only inside src/config/env.ts.',
        },
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Never use dangerouslySetInnerHTML.',
        },
      ],
    },
  },
  {
    files: ['src/config/env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Never use dangerouslySetInnerHTML.',
        },
      ],
    },
  },
  {
    files: ['src/core/logging/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/config/**/*.ts'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns(
        ['api', 'core', 'ui', 'features', 'layouts', 'app', 'pages'],
        ['^(?:preact(?:/|$)|@preact/signals$|lucide-preact$)'],
      ),
    },
  },
  {
    files: ['src/ui/**/*.ts', 'src/ui/**/*.tsx'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns([
        'api',
        'core',
        'features',
        'config',
        'layouts',
        'app',
        'pages',
      ]),
    },
  },
  {
    files: ['src/core/**/*.ts', 'src/core/**/*.tsx'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns([
        'api',
        'ui',
        'features',
        'layouts',
        'app',
        'pages',
      ]),
    },
  },
  {
    files: ['src/api/**/*.ts'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns(
        ['config', 'ui', 'features', 'layouts', 'app', 'pages'],
        ['^(?:preact(?:/|$)|@preact/signals$|lucide-preact$)'],
      ),
    },
  },
  ...FEATURE_NAMES.flatMap(buildFeatureConfigs),
  {
    files: ['src/layouts/**/*.ts', 'src/layouts/**/*.tsx'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns(
        [
          'api',
          'app',
          'pages',
          ...FEATURE_NAMES.filter((name) => name !== 'cart').map((name) => `features/${name}`),
        ],
        ['^(?:@/features/cart/(?!summary$).+|(?:\\.\\./)+features/cart/(?!summary$).+)$'],
      ),
    },
  },
  {
    files: ['src/app/**/*.ts', 'src/app/**/*.tsx'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns(['api', 'features', 'layouts', 'pages']),
    },
  },
  {
    files: ['src/pages/**/*.ts', 'src/pages/**/*.tsx'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns(
        ['api', 'ui'],
        [
          '^(?:@/features/(?:auth|catalog|product|profile)/.+|(?:\\.\\./)+features/(?:auth|catalog|product|profile)/.+)$',
          '^(?:@/features/admin/(?!categories$|products$|product-editor$).+|(?:\\.\\./)+features/admin/(?!categories$|products$|product-editor$).+)$',
          '^(?:@/features/cart/(?!summary$).+|(?:\\.\\./)+features/cart/(?!summary$).+)$',
        ],
      ),
    },
  },
  {
    files: ['src/pages/ui-kit/**/*.ts', 'src/pages/ui-kit/**/*.tsx'],
    rules: {
      'no-restricted-imports': forbidLayerPatterns(['api', 'features', 'layouts']),
    },
  },
);
