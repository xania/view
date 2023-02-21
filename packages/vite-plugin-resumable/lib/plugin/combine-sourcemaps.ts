import remapping from '@ampproject/remapping';
import type { DecodedSourceMap, RawSourceMap } from '@ampproject/remapping';
import type { SourceMap } from 'rollup';

const nullSourceMap: RawSourceMap = {
  names: [],
  sources: [],
  mappings: '',
  version: 3,
};

export function combineSourcemaps(
  filename: string,
  sourcemapList: Array<DecodedSourceMap | RawSourceMap>,
  excludeContent = true
) {
  if (
    sourcemapList.length === 0 ||
    sourcemapList.every((m) => m.sources.length === 0)
  ) {
    return { ...nullSourceMap };
  }

  // hack for parse broken with normalized absolute paths on windows (C:/path/to/something).
  // escape them to linux like paths
  // also avoid mutation here to prevent breaking plugin's using cache to generate sourcemaps like vue (see #7442)
  sourcemapList = sourcemapList.map((sourcemap) => {
    const newSourcemaps = { ...sourcemap };
    newSourcemaps.sources = sourcemap.sources.map((source) =>
      source ? escapeToLinuxLikePath(source) : null
    );
    if (sourcemap.sourceRoot) {
      newSourcemaps.sourceRoot = escapeToLinuxLikePath(sourcemap.sourceRoot);
    }
    return newSourcemaps;
  });
  const escapedFilename = escapeToLinuxLikePath(filename);

  // We don't declare type here so we can convert/fake/map as RawSourceMap
  let map; //: SourceMap
  let mapIndex = 1;
  const useArrayInterface =
    sourcemapList.slice(0, -1).find((m) => m.sources.length !== 1) ===
    undefined;
  if (useArrayInterface) {
    map = remapping(sourcemapList, () => null, excludeContent);
  } else {
    map = remapping(
      sourcemapList[0],
      function loader(sourcefile) {
        if (sourcefile === escapedFilename && sourcemapList[mapIndex]) {
          return sourcemapList[mapIndex++];
        } else {
          return null;
        }
      },
      excludeContent
    );
  }
  if (!map.file) {
    delete map.file;
  }

  // unescape the previous hack
  map.sources = map.sources.map((source) =>
    source ? unescapeToLinuxLikePath(source) : source
  );
  map.file = filename;

  return map;
}

function escapeToLinuxLikePath(path: string) {
  if (/^[A-Z]:/.test(path)) {
    return path.replace(/^([A-Z]):\//, '/windows/$1/');
  }
  if (/^\/[^/]/.test(path)) {
    return `/linux${path}`;
  }
  return path;
}

function unescapeToLinuxLikePath(path: string) {
  if (path.startsWith('/linux/')) {
    return path.slice('/linux'.length);
  }
  if (path.startsWith('/windows/')) {
    return path.replace(/^\/windows\/([A-Z])\//, '$1:/');
  }
  return path;
}

export function _getCombinedSourcemap(
  filename: string,
  sourcemapChain: SourceMap[]
) {
  let combinedMap: SourceMap | null = null;
  for (let m of sourcemapChain) {
    if (typeof m === 'string') continue;
    if (!combinedMap) {
      combinedMap = m as SourceMap;
    } else {
      combinedMap = combineSourcemaps(filename, [
        {
          ...(m as RawSourceMap),
          sourcesContent: combinedMap.sourcesContent,
        },
        combinedMap as RawSourceMap,
      ]) as SourceMap;
    }
  }
  return combinedMap;
}
