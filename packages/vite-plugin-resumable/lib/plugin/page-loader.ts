import path from 'node:path';
import { transformServer } from '../transform/server';
import { _getCombinedSourcemap } from './combine-sourcemaps';
import { transformClient } from '../transform/client';
import { fileToUrl } from '../utils';
/* use page module because we want to transform source code to resumable script just for the entry file and it's dependencies
 * We also dont want this transform to has effect when same source code is loaded
 */

import type { SourceMap } from 'rollup';
import type { ViteDevServer } from 'vite';
const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;

type Target = 'server' | 'client';

export const RESUMABLE_CLIENT_RE = /\/@client(\[([^\)]+)\])?\//;
export const RESUMABLE_SERVER_RE = /\/@server\//;

const ssrModuleExportsKey = `__vite_ssr_exports__`;
const ssrImportKey = `__vite_ssr_import__`;
const ssrDynamicImportKey = `__vite_ssr_dynamic_import__`;
const ssrExportAllKey = `__vite_ssr_exportAll__`;
const ssrImportMetaKey = `__vite_ssr_import_meta__`;
const NULL_BYTE_PLACEHOLDER = `__x00__`;
const VALID_ID_PREFIX = `/@id/`;
const AsyncFunction = async function () {}.constructor as any;
let fnDeclarationLineCount = 0;
{
  const body = '/*code*/';
  const source = new AsyncFunction('a', 'b', body).toString();
  fnDeclarationLineCount =
    source.slice(0, source.indexOf(body)).split('\n').length - 1;
}

function loadModule(
  vite: ViteDevServer,
  load: (
    url: string,
    target: Target,
    mod: Record<string, any>
  ) => Promise<Record<string, any> | null>
) {
  const loadCache = new Map<string, Promise<Record<string, any> | null>>();
  const moduleCache = new Map<string, Record<string, any>>();

  const loadstack: string[] = [];
  function moduleLoader(url: string) {
    if (loadstack.includes(url)) {
      // cyclic, return possibly non initialized module and brace for impact
      return Promise.resolve(moduleCache.get(url));
    }

    if (loadCache.has(url)) {
      return loadCache.get(url)!;
    }

    if (CSS_LANGS_RE.test(url)) {
      return vite.ssrLoadModule(url);
    }

    const ssrModule: Record<string, any> = {
      [Symbol.toStringTag]: 'Module',
    };
    moduleCache.set(url, ssrModule);

    loadstack.push(url);
    const promise = load(url, 'server', ssrModule);

    promise.then((m) => {
      const end = loadstack.pop()!;
      if (url !== end || m !== ssrModule) {
        debugger;
      }
    });

    loadCache.set(url, promise);
    return promise;
  }

  return moduleLoader;
}

export function createLoader(server: ViteDevServer) {
  const loadResumableModule = loadModule(
    server,
    async (url: string, target: Target, ssrModule: Record<string, any>) => {
      const resumeResult = await loadAndTransform(url, target);
      if (!resumeResult) return null;

      const filename = resumeResult.file;

      const sourcemapChain: SourceMap[] = [];

      if (resumeResult.map) {
        sourcemapChain.push(resumeResult.map);
      }

      const ssrResult = await server.ssrTransform(
        resumeResult.code,
        resumeResult.map,
        url
      );
      if (!ssrResult) return null;

      if (ssrResult.map) {
        sourcemapChain.push(ssrResult.map);
      }

      const ssrImport = (dep: string) => {
        if (dep[0] !== '.' && dep[0] !== '/') {
          throw new Error(
            'node module is not supported in a resumable context ' + dep
          );
        }

        if (dep.startsWith('/@resumable')) {
          return loadResumableModule(dep.substring('/@resumable'.length));
        }

        return loadResumableModule(unwrapId(dep));
      };
      const ssrDynamicImport = (dep: string) => {
        // #3087 dynamic import vars is ignored at rewrite import path,
        // so here need process relative path
        if (dep[0] === '.') {
          dep = path.posix.resolve(path.dirname(url), dep);
        }
        return ssrImport(dep);
      };
      function ssrExportAll(sourceModule: any) {
        for (const key in sourceModule) {
          if (key !== 'default') {
            Object.defineProperty(ssrModule, key, {
              enumerable: true,
              configurable: true,
              get() {
                return sourceModule[key];
              },
            });
          }
        }
      }

      let sourceMapSuffix = '';

      const map = _getCombinedSourcemap(filename, sourcemapChain); // combineSourcemaps(filename, sourcemapChain as any, false);

      if (map) {
        const moduleSourceMap = Object.assign({}, map, {
          // currently we need to offset the line
          // https://github.com/nodejs/node/issues/43047#issuecomment-1180632750
          mappings: ';'.repeat(fnDeclarationLineCount) + map.mappings,
        });
        sourceMapSuffix =
          '\n//# sourceMappingURL=' + genSourceMapUrl(moduleSourceMap);
      }

      const initModule = new AsyncFunction(
        `global`,
        ssrModuleExportsKey,
        ssrImportMetaKey,
        ssrImportKey,
        ssrDynamicImportKey,
        ssrExportAllKey,
        '"use strict";' +
          ssrResult.code +
          `\n//# sourceURL=${filename}${sourceMapSuffix}`
      );
      const ssrImportMeta = {
        url,
      };

      await initModule(
        { global },
        ssrModule,
        ssrImportMeta,
        ssrImport,
        ssrDynamicImport,
        ssrExportAll
      );
      // } catch (e) {
      //   // if (e.stack && fixStacktrace) {
      //   //   ssrFixStacktrace(e, moduleGraph);
      //   //   server.config.logger.error(
      //   //     `Error when evaluating SSR module ${url}:\n${e.stack}`,
      //   //     {
      //   //       timestamp: true,
      //   //       clear: server.config.clearScreen,
      //   //       error: e,
      //   //     }
      //   //   );
      //   // }
      //   throw e;
      // }
      return ssrModule;
    }
  );

  // function parseUrl(url: string): readonly [string, Entry[]] {
  //   const resMatch = url.match(RESUMABLE_URL_RE);

  //   if (resMatch) {
  //     const resMatchIndex = resMatch.index || 0;
  //     const resMatchLength = resMatch[0].length || 0;
  //     const moduleUrl =
  //       url.substring(0, resMatchIndex) +
  //       '/' +
  //       url.substring(resMatchIndex + resMatchLength);

  //     const entries = resMatch[1]
  //       .split(',')
  //       .map((e) =>
  //         e.endsWith('()')
  //           ? new Entry(e.substring(0, e.length - 2), true)
  //           : new Entry(e, false)
  //       );

  //     return [moduleUrl, entries] as const;
  //   }
  //   return [url, []];
  // }

  async function loadAndTransform(
    url: string,
    target: Target = 'server',
    entries: null | string[] = null
  ) {
    let source = url;
    const resolved = await server.pluginContainer.resolveId(url);
    if (!resolved) {
      return null;
    }
    source = resolved.id;

    const baseResult = await server.transformRequest(source);

    if (!baseResult) return null;

    const sourcemapChain: SourceMap[] = [];
    if (baseResult.map) {
      // if (target === 'client') {
      // const targettedMap = {
      //   ...baseResult.map,
      //   sources: baseResult.map.sources.map((x) =>
      //     fileToUrl(x, server.config.root)
      //   ),
      // };
      sourcemapChain.push(baseResult.map);
      // }
    }

    const resumeResult =
      target === 'server'
        ? transformServer(baseResult.code, {})
        : transformClient(baseResult.code, {
            entries,
          });

    if (!resumeResult) return null;
    sourcemapChain.push(resumeResult.map);

    return {
      code: resumeResult.code,
      file: source,
      map: _getCombinedSourcemap(source, sourcemapChain),
      genSourceMap() {
        const { map } = this;
        if (target === 'client')
          return `\n//# sourceMappingURL=` + genSourceMapUrl(map);
        else
          return (
            `\n//# sourceURL=${source}\n//# sourceMappingURL=` +
            genSourceMapUrl(map)
          );
      },
    };
  }

  return {
    loadResumableModule,
    loadAndTransform,
  };
}

function unwrapId(id: string) {
  return id.startsWith(VALID_ID_PREFIX)
    ? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, '\0')
    : id;
}

function genSourceMapUrl(map: any) {
  if (typeof map !== 'string') {
    map = JSON.stringify(map);
  }
  return `data:application/json;base64,${Buffer.from(map).toString('base64')}`;
}

// function combineSourceMapChain(url: string, chain: SourceMap[]) {
//   if (chain.length === 0) return null;
//   let retval = chain[0];

//   for(let i=1 ; i<chain.length ; i++ ){
//     const inMap = chain[i];

//     if (inMap && inMap.mappings && inMap.sources.length > 0) {
//       retval = combineSourcemaps(
//         url,
//         [
//           {
//             ...retval,
//             sources: inMap.sources,
//             sourcesContent: inMap.sourcesContent,
//           },
//           inMap,
//         ],
//         false,
//         ) as SourceMap
//       }
//     }

// }

// const selectEntryClosures = (
//   rootScope: Scope
// ): readonly [Closure[], Unresolved[]] => {
//   const stack: Scope[] = [rootScope];

//   const retval = new Set<Closure>();
//   const rootClosures: Closure[] = [];
//   for (const closure of rootScope.closures) {
//     if (closure.entry) {
//       switch (closure.entry.type) {
//         case 'FunctionDeclaration':
//           for (const entry of entries) {
//             if (entry.name === closure.entry.id?.name) {
//               if (entry.body) rootClosures.push(closure);
//               else retval.add(closure);
//             }
//           }
//           break;
//         case 'VariableDeclaration':
//           for (const declarator of closure.entry.declarations) {
//             if (declarator.id.type === 'Identifier') {
//               for (const entry of entries) {
//                 if (entry.name === declarator.id.name) {
//                   if (entry.body) rootClosures.push(closure);
//                   else retval.add(closure);
//                 }
//               }
//             } else {
//               debugger;
//             }
//           }
//           break;
//       }
//     }
//   }

//   // while (stack.length) {
//   //   const scope = stack.pop()!;
//   //   rootClosures.push(...scope.closures);

//   //   for (const child of scope.children) {
//   //     if (rootClosures.every((cl) => cl.scope !== child)) stack.push(child);
//   //   }
//   // }

//   const unresolved = new Set<Unresolved>();
//   for (let i = 0, len = rootClosures.length; i < len; i++) {
//     const rootClosure = rootClosures[i];
//     const rootScope = rootClosure.scope;
//     for (const ref of rootScope.references) {
//       if (ref instanceof Closure) {
//         // retval.add(ref);
//       } else if (ref.type === 'Identifier') {
//         const closure = resolve(rootScope, ref.name);
//         if (closure) {
//           retval.add(closure);
//         } else {
//           unresolved.add(new Unresolved(ref.name, rootScope));
//         }
//       }
//     }
//   }

//   function resolve(leaf: Scope, name: string) {
//     let scope: Scope | undefined = leaf;
//     while (scope) {
//       if (scope.declarations.has(name)) {
//         const decl = scope.declarations.get(name)!;
//         return scope.closures.find((cl) => cl.scope.owner === decl);
//       }

//       scope = scope.parent;
//     }
//     return null;
//   }

//   return [[...retval], [...unresolved]];
// };

// export class Entry {
//   constructor(public name: string, public body: boolean) {}
// }

export function parseResumableUrl(url: string): {
  moduleUrl: string;
  target: 'server' | 'client';
  entries: string[] | null;
} | null {
  const clientMatch = url.match(RESUMABLE_CLIENT_RE);
  if (clientMatch) {
    return {
      moduleUrl: createModuleUrl(clientMatch),
      target: 'client',
      entries: clientMatch[2] ? clientMatch[2].split(',') : null,
    };
  }

  const serverMatch = url.match(RESUMABLE_SERVER_RE);
  if (serverMatch) {
    return {
      moduleUrl: createModuleUrl(clientMatch),
      target: 'server',
      entries: null,
    };
  }

  return null;

  function createModuleUrl(match: any) {
    const resMatchIndex = match.index || 0;
    const resMatchLength = match[0].length || 0;
    return (
      url.substring(0, resMatchIndex) +
      '/' +
      url.substring(resMatchIndex + resMatchLength)
    );
  }
}
