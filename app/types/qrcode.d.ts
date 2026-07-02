declare module "qrcode" {
  interface QRCodeToCanvasOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeToCanvasOptions, callback?: (error: Error | null) => void): void;
  export function toCanvas(text: string, options?: QRCodeToCanvasOptions): Promise<HTMLCanvasElement>;
  export function toDataURL(text: string, options?: QRCodeToCanvasOptions): Promise<string>;
  export function toString(text: string, options?: QRCodeToCanvasOptions): Promise<string>;
}
