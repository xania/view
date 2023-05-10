import { Path } from './path';

export type SegmentMatcher = (
  path: Path,
  from: number
) => false | ({ length: number } & { [o: string]: any });
export type Segment = // RegExp
  string | SegmentMatcher;
export type PathTemplate = Segment[];

// export const star: SegmentMatcher = function (path: Path, from: number) {
//   return { length: path.length - from };
// };

export function compilePathTemplate(pathTemplate: PathTemplate) {
  // compile path template
  var segmentMatchers: SegmentMatcher[] = [];
  for (const segment of pathTemplate) {
    // if (segment === '*') {
    //   segmentMatchers.push(star);
    // } else
    if (typeof segment === 'string') {
      segmentMatchers.push(fromString(segment));
      // } else if (segment instanceof RegExp) {
      //   segmentMatchers.push(fromRegex(segment));
    } else {
      segmentMatchers.push(segment);
    }
  }
  return segmentMatchers;
}

function fromString(segment: string): SegmentMatcher {
  if (segment.startsWith(':')) {
    const propName = segment.substring(1);
    return function (path: Path, from: number) {
      return {
        length: 1,
        [propName]: path[from],
      };
    };
  } else {
    return function (path: Path, from: number) {
      if (path[from] !== segment) {
        return false;
      }
      return {
        length: 1,
      };
    };
  }
}

// function fromRegex(segment: string): SegmentMatcher {
//   return () => ({ length: 0 });
//   // if (segment.startsWith(':')) {
//   //   const propName = segment.substring(1);
//   //   return function (s: string) {
//   //     return {
//   //       [propName]: s,
//   //     };
//   //   };
//   // } else {
//   //   return function (s: string) {
//   //     return s == segment;
//   //   };
//   // }
// }
