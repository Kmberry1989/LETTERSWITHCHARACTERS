declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      poster?: string;
      alt?: string;
      ar?: boolean;
      autoplay?: boolean;
      'camera-controls'?: boolean;
      'disable-zoom'?: boolean;
      exposure?: string;
      shadowIntensity?: string;
      shadowSoftness?: string;
      environmentImage?: string;
      interactionPrompt?: string;
      style?: React.CSSProperties;
    };
  }
}
