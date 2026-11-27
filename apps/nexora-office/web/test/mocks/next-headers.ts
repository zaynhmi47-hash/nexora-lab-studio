export async function headers() {
  return new Headers();
}

export async function cookies() {
  return {
    get: (_name: string) => undefined,
    getAll: () => [] as Array<{ name: string; value: string }>,
    has: (_name: string) => false,
    set: (_name: string, _value: string) => undefined,
    delete: (_name: string) => undefined,
  };
}

export async function draftMode() {
  return {
    isEnabled: false,
    enable: () => undefined,
    disable: () => undefined,
  };
}
