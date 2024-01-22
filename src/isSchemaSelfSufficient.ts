import swc from '@swc/core'

type TypeOrInterfaceDeclaration =
  | swc.TsTypeAliasDeclaration
  | swc.TsInterfaceDeclaration

type ExportDeclarationWithEitherTypeOrInterface =
  & swc.ExportDeclaration
  & {
      declaration: TypeOrInterfaceDeclaration
    }

const isTsInterfaceDeclaration = (node: swc.Node): node is swc.TsInterfaceDeclaration => {
  return node.type === 'TsInterfaceDeclaration'
}

const isTsUnionType = (node: swc.Node): node is swc.TsUnionType => {
  return node.type === 'TsUnionType'
}

const isTsTupleType = (node: swc.Node): node is swc.TsTupleType => {
  return node.type === 'TsTupleType'
}

export const isSchemaSelfSufficient = async (code: string) => {
  const ast = await swc.parse(code, { comments: false, syntax: 'typescript', target: 'es2022' })
  const { body } = ast
  
  const { declaration } = body[0] as ExportDeclarationWithEitherTypeOrInterface
  
  if (isTsInterfaceDeclaration(declaration)) {
    return false
  }

  const { typeAnnotation } = declaration

  if (!isTsUnionType(typeAnnotation)) {
    return false
  }

  const { types } = typeAnnotation

  for (const type of types) {
    if (!isTsTupleType(type)) {
      return false
    }
  }

  return true
}