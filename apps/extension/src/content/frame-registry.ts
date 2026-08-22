export interface FrameMetadata {
  frameId: number;
  isTop: boolean;
  origin: string;
  isCrossOrigin: boolean;
}

export class FrameRegistry {
  private static frameId: number = 0;
  private static isInitialized: boolean = false;
  private static isCrossOrigin: boolean = false;

  public static initialize(): FrameMetadata {
    if (this.isInitialized) {
      return this.getMetadata();
    }

    const isTop = window === window.top;

    if (isTop) {
      this.frameId = 0;
      this.isCrossOrigin = false;
    } else {
      // Determine if parent is accessible (same-origin vs cross-origin)
      try {
        if (window.parent && window.parent.location.href) {
          this.isCrossOrigin = false;
        }
      } catch {
        this.isCrossOrigin = true;
      }

      // Generate a stable frame ID for this frame context
      const originSeed = window.location.origin || "frame";
      let hash = 0;
      for (let i = 0; i < originSeed.length; i++) {
        hash = (hash << 5) - hash + originSeed.charCodeAt(i);
        hash |= 0;
      }
      this.frameId = Math.abs(hash) % 900000 + 100000;
    }

    this.isInitialized = true;
    return this.getMetadata();
  }

  public static getFrameId(): number {
    return this.frameId;
  }

  public static isTopFrame(): boolean {
    return window === window.top;
  }

  public static getMetadata(): FrameMetadata {
    return {
      frameId: this.frameId,
      isTop: window === window.top,
      origin: window.location.origin,
      isCrossOrigin: this.isCrossOrigin,
    };
  }
}
