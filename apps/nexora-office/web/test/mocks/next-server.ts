export class NextResponse extends Response {
  static next(init?: ResponseInit) {
    return new NextResponse(null, init);
  }

  static redirect(destination: string | URL, init?: number | ResponseInit) {
    const status = typeof init === 'number' ? init : (init?.status ?? 307);
    const headers = new Headers(typeof init === 'object' ? init.headers : undefined);
    headers.set('location', destination.toString());
    return new NextResponse(null, { status, headers });
  }

  static rewrite(destination: string | URL, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set('x-middleware-rewrite', destination.toString());
    return new NextResponse(null, { ...init, headers });
  }

  static json(body: unknown, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set('content-type', 'application/json');
    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}

export class NextRequest extends Request {
  nextUrl: URL;
  cookies = {
    get: (_name: string) => undefined,
    getAll: () => [] as Array<{ name: string; value: string }>,
    has: (_name: string) => false,
  };

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new URL(this.url);
  }
}
