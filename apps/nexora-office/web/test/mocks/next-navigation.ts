export function useRouter() {
  return {
    push: (_href: string) => undefined,
    replace: (_href: string) => undefined,
    back: () => undefined,
    forward: () => undefined,
    refresh: () => undefined,
    prefetch: async (_href: string) => undefined,
  };
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function useParams() {
  return {};
}

export function useSelectedLayoutSegment() {
  return null;
}

export function useSelectedLayoutSegments() {
  return [];
}

export function redirect(destination: string | URL): never {
  throw new Error(`NEXT_REDIRECT:${destination.toString()}`);
}

export const permanentRedirect = redirect;

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}
