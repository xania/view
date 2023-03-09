export type SegmentMatcher = (s: string) => boolean | { [o: string]: any };
export type Segment = RegExp | string | SegmentMatcher;
export type PathTemplate = Segment[];

export function compilePathTemplate(pathTemplate: PathTemplate) {
  // compile path template
  var segmentMatchers: SegmentMatcher[] = [];
  for (const segment of pathTemplate) {
    if (typeof segment === 'string') {
      segmentMatchers.push(fromString(segment));
    } else if (segment instanceof RegExp) {
      segmentMatchers.push(segment.test);
    } else {
      segmentMatchers.push(segment);
    }
  }
  return segmentMatchers;
}

function fromString(segment: string): SegmentMatcher {
  if (segment.startsWith(':')) {
    const propName = segment.substring(1);
    return function (s: string) {
      return {
        [propName]: s,
      };
    };
  } else {
    return function (s: string) {
      return s == segment;
    };
  }
}
