import type { Plugin } from 'vite';

import kleur from 'kleur';
import { createLoader, FileRouteResolver, parseResumableUrl } from './plugin';
import { HibernationWriter } from './hibernate/writer';
import path from 'node:path';
import fs from 'fs';

export interface Options {
  fileExists?(file: string): Promise<boolean>;
  directories?: string[];
}

export function createPageResolver(baseDir: string) {
  new FileRouteResolver(baseDir).resolvePage;
}

function fileExists(file: string) {
  return new Promise((resolve, reject) => {
    fs.stat(file, (err, stats) => {
      if (stats) resolve(stats.isFile());
      else resolve(false);
    });
  });
}

export function resumable(xn: Options = {}) {
  return {
    name: 'vite-plugin-resumable',
    config() {
      return {
        resolve: {
          alias: {
            '@resumable': path.resolve(__dirname),
          },
        },
      };
    },
    configureServer(vite) {
      function createDefaultPageResolver() {
        console.log(
          'Resumable scripts will be resolved from: ' +
            kleur.gray(vite.config.root) +
            kleur.green('/pages')
        );
        const resolver = new FileRouteResolver(vite.config.root + '/pages');
        return (url: string) => {
          return resolver.resolvePage(url);
        };
      }
      const resolvePage = createDefaultPageResolver();
      vite.middlewares.use('/@resumable/*', (req, res, next) => {});
      vite.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        const loader = createLoader(vite);
        const parseResult = parseResumableUrl(reqUrl);
        if (parseResult) {
          const result = await loader.loadAndTransform(
            parseResult.moduleUrl,
            parseResult.target,
            parseResult.entries
          );
          if (result) {
            res.setHeader('Content-Type', 'application/javascript');
            res.write(result.code);
            res.write(result.genSourceMap());
            res.end();
            return;
          }
        } else if (req.headers.accept?.includes('text/html')) {
          res.setHeader('Content-Type', 'text/html');
          const pageUrl = resolvePage(reqUrl);
          if (pageUrl && (await fileExists(pageUrl))) {
            try {
              const loader = createLoader(vite);
              const page = await loader.loadResumableModule(pageUrl);
              if (!page) {
                return next();
              }
              const handler = page.default ?? page?.view;
              if (handler instanceof Function) {
                let responseHtml = '';
                const writer = new HibernationWriter(vite.config.root, res);
                await writer.write(await handler());
                const transformedHtml = await vite.transformIndexHtml(
                  pageUrl,
                  responseHtml,
                  req.originalUrl
                );
                res.write(transformedHtml);
                res.end();
                return;
              } else {
                console.warn(
                  kleur.yellow(
                    `page as '${pageUrl}' does not define view handler`
                  )
                );
              }
            } catch (err: any) {
              console.log(kleur.red(err));
              throw err;
            }
          }
        }
        return next();
      });
    },
    async resolveId(source) {
      const prefix = '/@resumable/';
      if (source && source.startsWith(prefix)) {
        const resolved = path.resolve(
          __dirname,
          './' + source.substring(prefix.length)
        );
        return {
          id: resolved,
        };
      }
      return;
    },
  } satisfies Plugin;
}
