import type { JSONSchema4 } from 'json-schema'

type Action = 
  | ExitAction
  | PopReferenceAction

type ExitAction = { action: 'exit' }
type PopReferenceAction = { action: 'popReference' }

const isObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  return !!value && typeof value === 'object' 
}

const isExitAction = (value: unknown): value is ExitAction => {
  return isObject(value) && Reflect.get(value, 'action') === 'exit'
}

const isPopReferenceAction = (value: unknown): value is PopReferenceAction => {
  return isObject(value) && Reflect.get(value, 'action') === 'popReference'
}

export const relinkItemRefsOnSchema = (schema: JSONSchema4) => {
  const stack: (Action | string)[] = [{ action: 'exit' }, ...Object.keys(schema)]
  const referenceStack = [schema]

  const badPrefix = '#/items/0/'

  while (stack.length) {
    const head = stack.pop()!

    if (isExitAction(head)) {
      break
    }

    if (isPopReferenceAction(head)) {
      referenceStack.pop()

      continue
    }

    const reference = referenceStack.at(-1)!

    const value = reference[head]

    if (typeof value === 'string' && value.startsWith(badPrefix)) {
      reference[head] = '#/' + value.slice(badPrefix.length)
    }

    else if (typeof value === 'object' && value !== null) {
      stack.push({ action: 'popReference' }, ...Object.keys(value))
      referenceStack.push(value)
    }
  }
}