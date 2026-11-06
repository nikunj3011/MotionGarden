// Only explicitly addressed messages are interpreted as renderer commands.
export function sendRenderer(target: Window | null | undefined, command: unknown) {
  target?.postMessage({ channel: 'motiongarden:renderer', version: 1, command }, location.origin);
}
