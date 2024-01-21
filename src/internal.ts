export const parseName = (name: string) => {
  return name[0].toUpperCase() + name.slice(1).replaceAll(/-\w/g, (result) => {
    return result[1].toUpperCase()
  })
}