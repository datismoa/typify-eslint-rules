import { describe, it, expect } from 'vitest'
import dedent from 'dedent'
import type { JSONSchema4 } from 'json-schema'

import { compileRule } from '../src'
import { RuleAlikeWithSchema } from '../src'

const createAlikeRuleWithSchema = (schema: JSONSchema4): RuleAlikeWithSchema => {
  return {
    meta: {
      schema
    }
  }
}

const jsttOptions = { bannerComment: '', style: { semi: false, singleQuote: true } } as const

describe('compileRule', () => {
  it('compiles a blank schema', async () => {
    const schema = [] as const

    const compiled = await compileRule(createAlikeRuleWithSchema(schema), 'Test', jsttOptions)

    expect(compiled).toBe('export type Test = []')
  })

  it('compiles a sole schema', async () => {
    const schema = [{ enum: ['always', 'never'] }] as const

    const compiled = await compileRule(createAlikeRuleWithSchema(schema), 'Test', jsttOptions)

    expect(compiled).toBe(
      dedent`
        export type Schema0 = 'always' | 'never'
        export type Test = [Schema0?]
      `
    )
  })

  it('compiles a multi schema', async () => {
    const schema = [
      { enum: [ 'always', 'never' ] },
      {
        type: 'object',
        properties: {
          singleValue: { type: 'boolean' },
          objectsInArrays: { type: 'boolean' },
          arraysInArrays: { type: 'boolean' }
        },
        additionalProperties: false
      }
    ] as const

    const compiled = await compileRule(createAlikeRuleWithSchema(schema), 'Test', jsttOptions)

    expect(compiled).toBe(
      dedent`
        export type Schema0 = 'always' | 'never'
        export interface Schema1 {
          singleValue?: boolean
          objectsInArrays?: boolean
          arraysInArrays?: boolean
        }
        export type Test = [Schema0?, Schema1?]
      `
    )
  })

  it('compiles a schema which has #/item/0/$defs reference', async () => {
    const schema = [
      {
        '$defs': {
          arrayOption: {
            type: 'string',
            enum: [ 'array', 'generic', 'array-simple' ]
          }
        },
        additionalProperties: false,
        properties: {
          default: {
            '$ref': '#/items/0/$defs/arrayOption',
            description: 'The array type expected for mutable cases.'
          },
          readonly: {
            '$ref': '#/items/0/$defs/arrayOption',
            description: 'The array type expected for readonly cases. If omitted, the value for `default` will be used.'
          }
        },
        type: 'object'
      }
    ] as const

    const compiled = await compileRule(createAlikeRuleWithSchema(schema), 'Test', jsttOptions)

    expect(compiled).toBe(
      dedent`
        export interface Schema0 {
          /**
           * The array type expected for mutable cases.
           */
          default?: 'array' | 'generic' | 'array-simple'
          /**
           * The array type expected for readonly cases. If omitted, the value for \`default\` will be used.
           */
          readonly?: 'array' | 'generic' | 'array-simple'
        }
        export type Test = [Schema0?]
      `
    )
  })
})