import { compile } from 'json-schema-to-typescript'
import type { Options as JSTTOptions } from 'json-schema-to-typescript'

import type { JSONSchema4 } from 'json-schema'

import fs from 'node:fs/promises'
import path from 'node:path'

import { parseName } from './internal'
import { relinkItemRefsOnSchema } from './relink'

export type RuleAlikeWithSchema = {
  meta: {
    schema: JSONSchema4 | readonly JSONSchema4[]
  }
}

export type Rules = Record<string, RuleAlikeWithSchema>

export type Options = {
  distFolder?: string
  rulesPrefix?: string
}

const DEFAULT_OPTIONS: Required<Options> = {
  distFolder: 'dist',
  rulesPrefix: ''
} as const

const DEFAULT_JSTT_OPTIONS: Partial<JSTTOptions> = {
  bannerComment: '',
  style: {
    semi: false,
    singleQuote: true
  }
} as const

export const typify = async (rules: Rules, options: Options = {}, jsttOptions: Partial<JSTTOptions> = {}) => {
  const rulesEntries = Object.entries(rules)

  const gatheredOptions: Required<Options> = {
    ...DEFAULT_OPTIONS,
    ...options
  } as const

  const gatheredJSTTOptions: Partial<JSTTOptions> = {
    ...DEFAULT_JSTT_OPTIONS,
    ...jsttOptions
  } as const

  const deferredRulesCompiling: Promise<string>[] = []

  for (const [ruleName, rule] of rulesEntries) {
    deferredRulesCompiling.push(
      compileRule(rule, parseName(ruleName), gatheredJSTTOptions)
    )
  }

  const compiledRules = await Promise.all(deferredRulesCompiling)

  const rulesFolder = path.join(gatheredOptions.distFolder, 'rules')

  await fs.mkdir(rulesFolder, { recursive: true })

  const rulesImport: string[] = []
  const rulesReassignWithinType: string[] = []

  const defferedFilesWriting: Promise<void>[] = []

  for (const [ruleId, compiledRule] of Object.entries(compiledRules)) {
    const originalRuleName = rulesEntries[+ruleId][0]

    defferedFilesWriting.push(
      fs.writeFile(path.join(rulesFolder, `${originalRuleName}.d.ts`), compiledRule)
    )

    const parsedRuleName = parseName(originalRuleName)

    rulesImport.push(
      `import type { ${parsedRuleName} } from './rules/${originalRuleName}'`
    )

    rulesReassignWithinType.push(
      `  '${gatheredOptions.rulesPrefix}${originalRuleName}': ${parsedRuleName}`
    )
  }

  await Promise.all(defferedFilesWriting)

  const parts = [
    rulesImport.join('\n'),
    '\n\n',
    `export type RuleOptions = {\n${rulesReassignWithinType.join(',\n')}\n}`
  ]

  await fs.writeFile(
    path.join(gatheredOptions.distFolder, 'index.d.ts'),
    parts.join('')
  )
}

export const compileRule = async (rule: RuleAlikeWithSchema, name: string, jsttOptions: Partial<JSTTOptions> = {}) => {
  const { schema: rawSchema = [] } = rule.meta

  const isRawSchemaInArrayFormat = Array.isArray(rawSchema)
  const isRawSchemaConsistentByItself = isRawSchemaInArrayFormat && rawSchema.length === 0

  if (isRawSchemaConsistentByItself) {
    return Promise.resolve(
      `export type ${name} = []`
    )
  }

  const deferredSchemasCompiling: Promise<string>[] = []
  const schemas = [rawSchema].flat(1) as JSONSchema4[]

  for (const [id, schema] of Object.entries(schemas)) {
    relinkItemRefsOnSchema(schema)

    deferredSchemasCompiling.push(compileSchema(schema, `Schema${id}`, jsttOptions))
  }

  const compiledSchemas = await Promise.all(deferredSchemasCompiling)

  const schemaIdentifiersOptional = compiledSchemas.map((_, id) => `Schema${id}?`)

  const compiledRuleWrapper = `export type ${name} = [${schemaIdentifiersOptional.join(', ')}]`

  return compiledSchemas.join('') + compiledRuleWrapper
}

export const compileSchema = async (schema: JSONSchema4, name: string, options: Partial<JSTTOptions> = {}) => {
  return compile(schema, name, options)
}