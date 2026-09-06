"use client";

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";

// ─── Animation presets ────────────────────────────────────────────────────────
const presets: Record<string, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 56, filter: "blur(5px)" },
    visible: {
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -44, filter: "blur(4px)" },
    visible: {
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -56, filter: "blur(4px)" },
    visible: {
      opacity: 1, x: 0, filter: "blur(0px)",
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 56, filter: "blur(4px)" },
    visible: {
      opacity: 1, x: 0, filter: "blur(0px)",
      transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    },
  },
  "scale-up": {
    hidden: { opacity: 0, scale: 0.88, filter: "blur(4px)" },
    visible: {
      opacity: 1, scale: 1, filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
    },
  },
  "slide-up-hard": {
    hidden: { opacity: 0, y: 90, filter: "blur(6px)" },
    visible: {
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    },
  },
  stagger: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
  },
  "stagger-child": {
    hidden: { opacity: 0, y: 36, filter: "blur(4px)" },
    visible: {
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  },
  "stagger-child-left": {
    hidden: { opacity: 0, x: -36, filter: "blur(4px)" },
    visible: {
      opacity: 1, x: 0, filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  },
  "stagger-child-scale": {
    hidden: { opacity: 0, scale: 0.86 },
    visible: {
      opacity: 1, scale: 1,
      transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
    },
  },
};

type Preset = keyof typeof presets;

// ─── ScrollReveal ─────────────────────────────────────────────────────────────
interface ScrollRevealProps {
  children: ReactNode;
  preset?: Preset;
  delay?: number;
  threshold?: number;
  viewportMargin?: string;
  className?: string;
}

export function ScrollReveal({
  children,
  preset = "fade-up",
  delay = 0,
  threshold = 0.1,
  viewportMargin = "-60px",
  className,
}: ScrollRevealProps) {
  const base = presets[preset] ?? presets["fade-up"];
  const variants: Variants =
    delay > 0
      ? {
          hidden: base.hidden,
          visible: {
            ...(base.visible as object),
            transition: {
              ...((base.visible as { transition?: object }).transition ?? {}),
              delay,
            },
          },
        }
      : base;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold, margin: viewportMargin }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerReveal ───────────────────────────────────────────────────────────
export function StaggerReveal({
  children,
  delay = 0,
  className,
  viewportMargin = "-60px",
  threshold = 0.1,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  viewportMargin?: string;
  threshold?: number;
}) {
  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13, delayChildren: delay } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold, margin: viewportMargin }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerChild ────────────────────────────────────────────────────────────
export function StaggerChild({
  children,
  preset = "stagger-child",
  className,
}: {
  children: ReactNode;
  preset?: "stagger-child" | "stagger-child-left" | "stagger-child-scale";
  className?: string;
}) {
  return (
    <motion.div variants={presets[preset]} className={className}>
      {children}
    </motion.div>
  );
}

