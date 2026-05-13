"use client";

import { useLayoutEffect } from "react";

export default function ScrollToTop({ resetKey }: { resetKey: string }) {
  useLayoutEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0 });
    };

    let secondFrame = 0;

    scrollToTop();
    const firstFrame = window.requestAnimationFrame(() => {
      scrollToTop();
      secondFrame = window.requestAnimationFrame(scrollToTop);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);

      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [resetKey]);

  return null;
}
