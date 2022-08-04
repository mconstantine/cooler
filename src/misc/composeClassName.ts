export function composeClassName(...classNames: string[]): string {
  return classNames.filter(s => !!s).join(' ')
}
