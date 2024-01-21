import type { JSONSchema4 } from 'json-schema'

type Action = 
  | ExitAction
  | PopReferenceAction

type ExitAction = { action: 'exit' }
type PopReferenceAction = { action: 'popReference' }

type SimpleObject = Record<PropertyKey, unknown>

const isObject = (value: unknown): value is SimpleObject => {
  return !!value && typeof value === 'object' 
}

const actionIs = (value: SimpleObject, action: Action['action']) => {
  return Reflect.get(value, 'action') === action
}

const isExitAction = (value: unknown): value is ExitAction => {
  return isObject(value) && actionIs(value, 'exit')
}

const isPopReferenceAction = (value: unknown): value is PopReferenceAction => {
  return isObject(value) && actionIs(value, 'popReference')
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

    else if (isObject(value)) {
      stack.push({ action: 'popReference' }, ...Object.keys(value))
      referenceStack.push(value)
    }
  }

  return schema
}