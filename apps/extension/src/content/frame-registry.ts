export interface FrameMetadata {
  frameId: number;
  isTop: boolean;
  origin: string;
  isCrossOrigin: boolean;
}

let frameId = 0;
let isInitialized = false;
let isCrossOrigin = false;

export const FrameRegistry = {
  initialize(): FrameMetadata {
    if (isInitialized) {
      return FrameRegistry.getMetadata();
    }

    const isTop = typeof window !== "undefined" && window === window.top;

    if (isTop) {
      frameId = 0;
      isCrossOrigin = false;
    } else if (typeof window !== "undefined") {
      try {
        if (window.parent && window.parent.location.href) {
          isCrossOrigin = false;
        }
      } catch {
        isCrossOrigin = true;
      }

      const originSeed = window.location.origin || "frame";
      let hash = 0;
      for (let i = 0; i < originSeed.length; i++) {
        hash = (hash << 5) - hash + originSeed.charCodeAt(i);
        hash |= 0;
      }
      frameId = Math.abs(hash) % 900000 + 100000;
    }

    isInitialized = true;
    return FrameRegistry.getMetadata();
  },

  getFrameId(): number {
    return frameId;
  },

  isTopFrame(): boolean {
    return typeof window !== "undefined" && window === window.top;
  },

  getMetadata(): FrameMetadata {
    return {
      frameId,
      isTop: typeof window !== "undefined" && window === window.top,
      origin: typeof window !== "undefined" ? window.location.origin : "",
      isCrossOrigin,
    };
  },
};
