declare module JSX {
  interface AnimationElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      ConditionalProcessingSVGAttributes {}

  interface ExternalResourceSVGAttributes {
    externalResourcesRequired?: 'true' | 'false';
  }
  interface ConditionalProcessingSVGAttributes {
    requiredExtensions?: string;
    requiredFeatures?: string;
    systemLanguage?: string;
  }
  interface AnimationAttributeTargetSVGAttributes {
    attributeName?: string;
    attributeType?: 'CSS' | 'XML' | 'auto';
  }
  interface AnimationTimingSVGAttributes {
    begin?: string;
    dur?: string;
    end?: string;
    min?: string;
    max?: string;
    restart?: 'always' | 'whenNotActive' | 'never';
    repeatCount?: number | 'indefinite';
    repeatDur?: string;
    fill?: 'freeze' | 'remove';
  }
  interface AnimationValueSVGAttributes {
    calcMode?: 'discrete' | 'linear' | 'paced' | 'spline';
    values?: string;
    keyTimes?: string;
    keySplines?: string;
    from?: number | string;
    to?: number | string;
    by?: number | string;
  }
  interface AnimationAdditionSVGAttributes {
    attributeName?: string;
    additive?: 'replace' | 'sum';
    accumulate?: 'none' | 'sum';
  }
  interface PresentationSVGAttributes {
    'alignment-baseline'?:
      | 'auto'
      | 'baseline'
      | 'before-edge'
      | 'text-before-edge'
      | 'middle'
      | 'central'
      | 'after-edge'
      | 'text-after-edge'
      | 'ideographic'
      | 'alphabetic'
      | 'hanging'
      | 'mathematical'
      | 'inherit';
    'baseline-shift'?: number | string;
    clip?: string;
    'clip-path'?: string;
    'clip-rule'?: 'nonzero' | 'evenodd' | 'inherit';
    color?: string;
    'color-interpolation'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
    'color-interpolation-filters'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
    'color-profile'?: string;
    'color-rendering'?:
      | 'auto'
      | 'optimizeSpeed'
      | 'optimizeQuality'
      | 'inherit';
    cursor?: string;
    direction?: 'ltr' | 'rtl' | 'inherit';
    display?: string;
    'dominant-baseline'?:
      | 'auto'
      | 'text-bottom'
      | 'alphabetic'
      | 'ideographic'
      | 'middle'
      | 'central'
      | 'mathematical'
      | 'hanging'
      | 'text-top'
      | 'inherit';
    'enable-background'?: string;
    fill?: string;
    'fill-opacity'?: number | string | 'inherit';
    'fill-rule'?: 'nonzero' | 'evenodd' | 'inherit';
    filter?: string;
    'flood-color'?: string;
    'flood-opacity'?: number | string | 'inherit';
    'font-family'?: string;
    'font-size'?: string;
    'font-size-adjust'?: number | string;
    'font-stretch'?: string;
    'font-style'?: 'normal' | 'italic' | 'oblique' | 'inherit';
    'font-variant'?: string;
    'font-weight'?: number | string;
    'glyph-orientation-horizontal'?: string;
    'glyph-orientation-vertical'?: string;
    'image-rendering'?:
      | 'auto'
      | 'optimizeQuality'
      | 'optimizeSpeed'
      | 'inherit';
    kerning?: string;
    'letter-spacing'?: number | string;
    'lighting-color'?: string;
    'marker-end'?: string;
    'marker-mid'?: string;
    'marker-start'?: string;
    mask?: string;
    opacity?: number | string | 'inherit';
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'inherit';
    pathLength?: string | number;
    'pointer-events'?:
      | 'bounding-box'
      | 'visiblePainted'
      | 'visibleFill'
      | 'visibleStroke'
      | 'visible'
      | 'painted'
      | 'color'
      | 'fill'
      | 'stroke'
      | 'all'
      | 'none'
      | 'inherit';
    'shape-rendering'?:
      | 'auto'
      | 'optimizeSpeed'
      | 'crispEdges'
      | 'geometricPrecision'
      | 'inherit';
    'stop-color'?: string;
    'stop-opacity'?: number | string | 'inherit';
    stroke?: string;
    'stroke-dasharray'?: string;
    'stroke-dashoffset'?: number | string;
    'stroke-linecap'?: 'butt' | 'round' | 'square' | 'inherit';
    'stroke-linejoin'?:
      | 'arcs'
      | 'bevel'
      | 'miter'
      | 'miter-clip'
      | 'round'
      | 'inherit';
    'stroke-miterlimit'?: number | string | 'inherit';
    'stroke-opacity'?: number | string | 'inherit';
    'stroke-width'?: number | string;
    'text-anchor'?: 'start' | 'middle' | 'end' | 'inherit';
    'text-decoration'?:
      | 'none'
      | 'underline'
      | 'overline'
      | 'line-through'
      | 'blink'
      | 'inherit';
    'text-rendering'?:
      | 'auto'
      | 'optimizeSpeed'
      | 'optimizeLegibility'
      | 'geometricPrecision'
      | 'inherit';
    'unicode-bidi'?: string;
    visibility?: 'visible' | 'hidden' | 'collapse' | 'inherit';
    'word-spacing'?: number | string;
    'writing-mode'?:
      | 'lr-tb'
      | 'rl-tb'
      | 'tb-rl'
      | 'lr'
      | 'rl'
      | 'tb'
      | 'inherit';
  }
  // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
  interface AriaAttributes {
    /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
    'aria-activedescendant'?: string;
    /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
    'aria-atomic'?: boolean | 'false' | 'true';
    /**
     * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
     * presented if they are made.
     */
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
    /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
    'aria-busy'?: boolean | 'false' | 'true';
    /**
     * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
     * @see aria-pressed @see aria-selected.
     */
    'aria-checked'?: boolean | 'false' | 'mixed' | 'true';
    /**
     * Defines the total number of columns in a table, grid, or treegrid.
     * @see aria-colindex.
     */
    'aria-colcount'?: number | string;
    /**
     * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
     * @see aria-colcount @see aria-colspan.
     */
    'aria-colindex'?: number | string;
    /**
     * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-colindex @see aria-rowspan.
     */
    'aria-colspan'?: number | string;
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current element.
     * @see aria-owns.
     */
    'aria-controls'?: string;
    /** Indicates the element that represents the current item within a container or set of related elements. */
    'aria-current'?:
      | boolean
      | 'false'
      | 'true'
      | 'page'
      | 'step'
      | 'location'
      | 'date'
      | 'time';
    /**
     * Identifies the element (or elements) that describes the object.
     * @see aria-labelledby
     */
    'aria-describedby'?: string;
    /**
     * Identifies the element that provides a detailed, extended description for the object.
     * @see aria-describedby.
     */
    'aria-details'?: string;
    /**
     * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
     * @see aria-hidden @see aria-readonly.
     */
    'aria-disabled'?: boolean | 'false' | 'true';
    /**
     * Indicates what functions can be performed when a dragged object is released on the drop target.
     * @deprecated in ARIA 1.1
     */
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    /**
     * Identifies the element that provides an error message for the object.
     * @see aria-invalid @see aria-describedby.
     */
    'aria-errormessage'?: string;
    /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
    'aria-expanded'?: boolean | 'false' | 'true';
    /**
     * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
     * allows assistive technology to override the general default of reading in document source order.
     */
    'aria-flowto'?: string;
    /**
     * Indicates an element's "grabbed" state in a drag-and-drop operation.
     * @deprecated in ARIA 1.1
     */
    'aria-grabbed'?: boolean | 'false' | 'true';
    /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
    'aria-haspopup'?:
      | boolean
      | 'false'
      | 'true'
      | 'menu'
      | 'listbox'
      | 'tree'
      | 'grid'
      | 'dialog';
    /**
     * Indicates whether the element is exposed to an accessibility API.
     * @see aria-disabled.
     */
    'aria-hidden'?: boolean | 'false' | 'true';
    /**
     * Indicates the entered value does not conform to the format expected by the application.
     * @see aria-errormessage.
     */
    'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
    /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
    'aria-keyshortcuts'?: string;
    /**
     * Defines a string value that labels the current element.
     * @see aria-labelledby.
     */
    'aria-label'?: string;
    /**
     * Identifies the element (or elements) that labels the current element.
     * @see aria-describedby.
     */
    'aria-labelledby'?: string;
    /** Defines the hierarchical level of an element within a structure. */
    'aria-level'?: number | string;
    /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
    'aria-live'?: 'off' | 'assertive' | 'polite';
    /** Indicates whether an element is modal when displayed. */
    'aria-modal'?: boolean | 'false' | 'true';
    /** Indicates whether a text box accepts multiple lines of input or only a single line. */
    'aria-multiline'?: boolean | 'false' | 'true';
    /** Indicates that the user may select more than one item from the current selectable descendants. */
    'aria-multiselectable'?: boolean | 'false' | 'true';
    /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
    'aria-orientation'?: 'horizontal' | 'vertical';
    /**
     * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
     * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
     * @see aria-controls.
     */
    'aria-owns'?: string;
    /**
     * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
     * A hint could be a sample value or a brief description of the expected format.
     */
    'aria-placeholder'?: string;
    /**
     * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-setsize.
     */
    'aria-posinset'?: number | string;
    /**
     * Indicates the current "pressed" state of toggle buttons.
     * @see aria-checked @see aria-selected.
     */
    'aria-pressed'?: boolean | 'false' | 'mixed' | 'true';
    /**
     * Indicates that the element is not editable, but is otherwise operable.
     * @see aria-disabled.
     */
    'aria-readonly'?: boolean | 'false' | 'true';
    /**
     * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
     * @see aria-atomic.
     */
    'aria-relevant'?:
      | 'additions'
      | 'additions removals'
      | 'additions text'
      | 'all'
      | 'removals'
      | 'removals additions'
      | 'removals text'
      | 'text'
      | 'text additions'
      | 'text removals';
    /** Indicates that user input is required on the element before a form may be submitted. */
    'aria-required'?: boolean | 'false' | 'true';
    /** Defines a human-readable, author-localized description for the role of an element. */
    'aria-roledescription'?: string;
    /**
     * Defines the total number of rows in a table, grid, or treegrid.
     * @see aria-rowindex.
     */
    'aria-rowcount'?: number | string;
    /**
     * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
     * @see aria-rowcount @see aria-rowspan.
     */
    'aria-rowindex'?: number | string;
    /**
     * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-rowindex @see aria-colspan.
     */
    'aria-rowspan'?: number | string;
    /**
     * Indicates the current "selected" state of various widgets.
     * @see aria-checked @see aria-pressed.
     */
    'aria-selected'?: boolean | 'false' | 'true';
    /**
     * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-posinset.
     */
    'aria-setsize'?: number | string;
    /** Indicates if items in a table or grid are sorted in ascending or descending order. */
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
    /** Defines the maximum allowed value for a range widget. */
    'aria-valuemax'?: number | string;
    /** Defines the minimum allowed value for a range widget. */
    'aria-valuemin'?: number | string;
    /**
     * Defines the current value for a range widget.
     * @see aria-valuetext.
     */
    'aria-valuenow'?: number | string;
    /** Defines the human readable text alternative of aria-valuenow for a range widget. */
    'aria-valuetext'?: string;
    role?:
      | 'alert'
      | 'alertdialog'
      | 'application'
      | 'article'
      | 'banner'
      | 'button'
      | 'cell'
      | 'checkbox'
      | 'columnheader'
      | 'combobox'
      | 'complementary'
      | 'contentinfo'
      | 'definition'
      | 'dialog'
      | 'directory'
      | 'document'
      | 'feed'
      | 'figure'
      | 'form'
      | 'grid'
      | 'gridcell'
      | 'group'
      | 'heading'
      | 'img'
      | 'link'
      | 'list'
      | 'listbox'
      | 'listitem'
      | 'log'
      | 'main'
      | 'marquee'
      | 'math'
      | 'menu'
      | 'menubar'
      | 'menuitem'
      | 'menuitemcheckbox'
      | 'menuitemradio'
      | 'meter'
      | 'navigation'
      | 'none'
      | 'note'
      | 'option'
      | 'presentation'
      | 'progressbar'
      | 'radio'
      | 'radiogroup'
      | 'region'
      | 'row'
      | 'rowgroup'
      | 'rowheader'
      | 'scrollbar'
      | 'search'
      | 'searchbox'
      | 'separator'
      | 'slider'
      | 'spinbutton'
      | 'status'
      | 'switch'
      | 'tab'
      | 'table'
      | 'tablist'
      | 'tabpanel'
      | 'term'
      | 'textbox'
      | 'timer'
      | 'toolbar'
      | 'tooltip'
      | 'tree'
      | 'treegrid'
      | 'treeitem';
  }
  interface AnimateSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationAttributeTargetSVGAttributes,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes,
      Pick<
        PresentationSVGAttributes,
        'color-interpolation' | 'color-rendering'
      > {}
  interface CoreSVGAttributes<T> extends AriaAttributes {
    id?: string;
    lang?: string;
    tabIndex?: number | string;
    tabindex?: number | string;
  }

  interface ContainerElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'clip-path'
        | 'mask'
        | 'cursor'
        | 'opacity'
        | 'filter'
        | 'enable-background'
        | 'color-interpolation'
        | 'color-rendering'
      > {}

  interface NewViewportSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
    viewBox?: string;
  }
  interface ZoomAndPanSVGAttributes {
    zoomAndPan?: 'disable' | 'magnify';
  }
  interface SvgSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      NewViewportSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      ZoomAndPanSVGAttributes,
      PresentationSVGAttributes {
    version?: string;
    baseProfile?: string;
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    contentScriptType?: string;
    contentStyleType?: string;
    xmlns?: string;
  }

  interface GraphicsElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'clip-rule'
        | 'mask'
        | 'pointer-events'
        | 'cursor'
        | 'opacity'
        | 'filter'
        | 'display'
        | 'visibility'
        | 'color-interpolation'
        | 'color-rendering'
      > {}

  interface ShapeElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'color'
        | 'fill'
        | 'fill-rule'
        | 'fill-opacity'
        | 'stroke'
        | 'stroke-width'
        | 'stroke-linecap'
        | 'stroke-linejoin'
        | 'stroke-miterlimit'
        | 'stroke-dasharray'
        | 'stroke-dashoffset'
        | 'stroke-opacity'
        | 'shape-rendering'
        | 'pathLength'
      > {}
  interface TransformableSVGAttributes {
    transform?: string;
  }
  interface PathSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      // StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<
        PresentationSVGAttributes,
        'marker-start' | 'marker-mid' | 'marker-end'
      > {
    d?: string;
    pathLength?: number | string;
  }

  interface RectSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      // StylableSVGAttributes,
      TransformableSVGAttributes {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    rx?: number | string;
    ry?: number | string;
  }

  interface DefsSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      // StylableSVGAttributes,
      TransformableSVGAttributes {}
  interface DescSVGAttributes<T> extends CoreSVGAttributes<T> {}
  interface EllipseSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      // StylableSVGAttributes,
      TransformableSVGAttributes {
    cx?: number | string;
    cy?: number | string;
    rx?: number | string;
    ry?: number | string;
  }
  interface SVGElementTagNameMap {
    // animate: AnimateSVGAttributes<SVGAnimateElement>;
    // animateMotion: AnimateMotionSVGAttributes<SVGAnimateMotionElement>;
    // animateTransform: AnimateTransformSVGAttributes<SVGAnimateTransformElement>;
    // circle: CircleSVGAttributes<SVGCircleElement>;
    // clipPath: ClipPathSVGAttributes<SVGClipPathElement>;
    defs: DefsSVGAttributes<SVGDefsElement>;
    // desc: DescSVGAttributes<SVGDescElement>;
    // ellipse: EllipseSVGAttributes<SVGEllipseElement>;
    // feBlend: FeBlendSVGAttributes<SVGFEBlendElement>;
    // feColorMatrix: FeColorMatrixSVGAttributes<SVGFEColorMatrixElement>;
    // feComponentTransfer: FeComponentTransferSVGAttributes<SVGFEComponentTransferElement>;
    // feComposite: FeCompositeSVGAttributes<SVGFECompositeElement>;
    // feConvolveMatrix: FeConvolveMatrixSVGAttributes<SVGFEConvolveMatrixElement>;
    // feDiffuseLighting: FeDiffuseLightingSVGAttributes<SVGFEDiffuseLightingElement>;
    // feDisplacementMap: FeDisplacementMapSVGAttributes<SVGFEDisplacementMapElement>;
    // feDistantLight: FeDistantLightSVGAttributes<SVGFEDistantLightElement>;
    // feDropShadow: Partial<SVGFEDropShadowElement>;
    // feFlood: FeFloodSVGAttributes<SVGFEFloodElement>;
    // feFuncA: FeFuncSVGAttributes<SVGFEFuncAElement>;
    // feFuncB: FeFuncSVGAttributes<SVGFEFuncBElement>;
    // feFuncG: FeFuncSVGAttributes<SVGFEFuncGElement>;
    // feFuncR: FeFuncSVGAttributes<SVGFEFuncRElement>;
    // feGaussianBlur: FeGaussianBlurSVGAttributes<SVGFEGaussianBlurElement>;
    // feImage: FeImageSVGAttributes<SVGFEImageElement>;
    // feMerge: FeMergeSVGAttributes<SVGFEMergeElement>;
    // feMergeNode: FeMergeNodeSVGAttributes<SVGFEMergeNodeElement>;
    // feMorphology: FeMorphologySVGAttributes<SVGFEMorphologyElement>;
    // feOffset: FeOffsetSVGAttributes<SVGFEOffsetElement>;
    // fePointLight: FePointLightSVGAttributes<SVGFEPointLightElement>;
    // feSpecularLighting: FeSpecularLightingSVGAttributes<SVGFESpecularLightingElement>;
    // feSpotLight: FeSpotLightSVGAttributes<SVGFESpotLightElement>;
    // feTile: FeTileSVGAttributes<SVGFETileElement>;
    // feTurbulence: FeTurbulanceSVGAttributes<SVGFETurbulenceElement>;
    // filter: FilterSVGAttributes<SVGFilterElement>;
    // foreignObject: ForeignObjectSVGAttributes<SVGForeignObjectElement>;
    // g: GSVGAttributes<SVGGElement>;
    // image: ImageSVGAttributes<SVGImageElement>;
    // line: LineSVGAttributes<SVGLineElement>;
    // linearGradient: LinearGradientSVGAttributes<SVGLinearGradientElement>;
    // marker: MarkerSVGAttributes<SVGMarkerElement>;
    // mask: MaskSVGAttributes<SVGMaskElement>;
    // metadata: MetadataSVGAttributes<SVGMetadataElement>;
    // mpath: Partial<SVGMPathElement>;
    path: PathSVGAttributes<SVGPathElement>;
    // pattern: PatternSVGAttributes<SVGPatternElement>;
    // polygon: PolygonSVGAttributes<SVGPolygonElement>;
    // polyline: PolylineSVGAttributes<SVGPolylineElement>;
    // radialGradient: RadialGradientSVGAttributes<SVGRadialGradientElement>;
    rect: RectSVGAttributes<SVGRectElement>;
    // set: Partial<SVGSetElement>;
    // stop: StopSVGAttributes<SVGStopElement>;
    svg: SvgSVGAttributes<SVGSVGElement>;
    // switch: SwitchSVGAttributes<SVGSwitchElement>;
    // symbol: SymbolSVGAttributes<SVGSymbolElement>;
    // text: TextSVGAttributes<SVGTextElement>;
    // textPath: TextPathSVGAttributes<SVGTextPathElement>;
    // tspan: TSpanSVGAttributes<SVGTSpanElement>;
    // use: UseSVGAttributes<SVGUseElement>;
    // view: ViewSVGAttributes<SVGViewElement>;
  }

  interface AnimateSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationAttributeTargetSVGAttributes,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes,
      Pick<
        PresentationSVGAttributes,
        'color-interpolation' | 'color-rendering'
      > {}
}

SVGAnimateElement;
