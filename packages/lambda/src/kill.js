export async function kill () {
  const isRunning = await isChromeRunning()

  if (isRunning) await psKill({ command: 'headless_shell' })
}
