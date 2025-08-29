declare module 'react-signature-canvas' {
  import * as React from 'react';
  export interface SignaturePadProps {
    penColor?: string;
    canvasProps?: any;
    onEnd?: () => void;
    onClear?: () => void;
  }
  export default class SignaturePad extends React.Component<SignaturePadProps> {
    toDataURL(): string;
    clear(): void;
  }
}