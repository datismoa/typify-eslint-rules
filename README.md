# typify-eslint-rules

## Why

This package allows you to generate typescript types for any ESLint rules based on their meta schema

### Install

Using pnpm:
```sh
pnpm install 
```

Using npm:
```sh
npm install 
```

### Usage

```ts
import { typify } from 'typify-eslint-rules'

import tsPlugin from '@typescript-eslint/eslint-plugin'

const { rules: tsRules } = ts

await typify(tsRules, {
  distFolder: 'dist'
})
```

This'll generate types for `@typescript-eslint/eslint-plugin` and place them in `dist/rules` folder, which are exported in `dist/index.d.ts` file under `RuleOptions` type:

```ts
// dist/index.d.ts

import type { AdjacentOverloadSignatures } from './rules/adjacent-overload-signatures'
// ... more imports

export type RuleOptions = {
  'adjacent-overload-signatures': AdjacentOverloadSignatures,
  // ... more rules
}
```

You can also provide an optional prefix:

```ts
// ...

await typify(tsRules, {
  distFolder: 'dist',
  rulesPrefix: 'ts/'
})
```

That prefix will be added to all rules:
```ts
// dist/index.d.ts

import type { AdjacentOverloadSignatures } from './rules/adjacent-overload-signatures'
// ... more imports

export type RuleOptions = {
  'ts/adjacent-overload-signatures': AdjacentOverloadSignatures,
  // ... more rules
}
```

You can also use `compileRule` and `compileSchema` to compile a sole rule or a sole schema.