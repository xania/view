// import kleur from 'kleur';
export class FileRouteResolver implements RouteResolver {
  constructor(public baseDir: string) {}

  resolvePage = (path?: string) => {
    if (path === null || path === undefined) return null;

    const scriptPath =
      this.baseDir +
      (path.endsWith('/') ? path + 'index' : path || '/index') +
      '.tsx';

    return scriptPath;
  };
}

export interface RouteResolver {
  resolvePage(path: string): string | null;
}
