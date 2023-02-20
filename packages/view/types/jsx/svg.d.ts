declare module JSX {
  interface SVGTagNameMap {
    svg: {
      xmlns?: string;
      width?: number;
      height?: number;
      fill?: string;
      viewBox?: string;
      stroke?: string;
    };
    g: {
      fill?: string;
      'fill-rule'?: string;
    };
    path: {
      d?: string;
      fill?: string;
      'fill-rule'?: string;
    };
  }
}
