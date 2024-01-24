export const kebabToPascalCasing = (value: string) => {
  return value[0].toUpperCase() + value.slice(1).replaceAll(/-\w/g, ([_, char]) => {
    return char.toUpperCase()
  })
}

type CasingType = 'lower' | 'upper'

const casingFunctions: Record<CasingType, (value: string) => string> = {
  upper: value => value.toUpperCase(),
  lower: value => value.toLowerCase()
}

export const parseSlashedName = (value: string, casing: CasingType = 'lower') => {
  return value.replaceAll(/\/\w?/g, ([_, wordChar = '']) => {
    const transformedWordChar = casingFunctions[casing](wordChar)

    return '_' + transformedWordChar
  })
}