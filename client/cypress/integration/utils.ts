export function createError(code: string, message: string) {
  return {
    errors: [
      {
        extensions: {
          code
        },
        message
      }
    ]
  }
}
