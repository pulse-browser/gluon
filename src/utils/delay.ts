export const delay = (delay: number): Promise<boolean> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(true), delay)
  })
