"use client";

import { motion, stagger, useAnimate, useInView } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type TextGenerateEffectProps = Omit<React.ComponentProps<"div">, "children"> & {
  words: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
};

function TextGenerateEffect({
  ref,
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.2,
  ...props
}: TextGenerateEffectProps) {
  const localRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, {
    amount: 0.35,
    once: false,
  });
  const wordsArray = React.useMemo(() => words.split(" "), [words]);

  React.useEffect(() => {
    if (!scope.current) {
      return;
    }

    if (!isInView) {
      animate(
        "span",
        {
          opacity: 0,
          filter: filter ? "blur(10px)" : "none",
        },
        {
          duration: 0,
        },
      );
      return;
    }

    animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration,
        delay: stagger(staggerDelay),
      },
    );
  }, [animate, duration, filter, isInView, scope, staggerDelay]);

  return (
    <div
      className={cn("font-bold", className)}
      data-slot="text-generate-effect"
      ref={localRef}
      {...props}
    >
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            className="opacity-0 will-change-transform will-change-opacity will-change-filter"
            key={`${word}-${idx}`}
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

export { TextGenerateEffect, type TextGenerateEffectProps };
export default TextGenerateEffect;
