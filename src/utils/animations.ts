/* ============================================
   Animation Utilities
   ============================================ */

import { Variants } from 'framer-motion';

/* ========== Fade Animations ========== */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/* ========== Scale Animations ========== */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const scaleInBounce: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    }
  },
  exit: { opacity: 0, scale: 0.8 },
};

/* ========== Slide Animations ========== */
export const slideInUp: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

export const slideInDown: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
};

export const slideInLeft: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

export const slideInRight: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

/* ========== Stagger Children ========== */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/* ========== Modal/Dialog Animations ========== */
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: {
      duration: 0.2,
    }
  },
};

/* ========== Number Counter Animation ========== */
export const counterAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

/* ========== Hover Animations ========== */
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

export const hoverLift = {
  y: -4,
  transition: { duration: 0.2 },
};

export const hoverGlow = {
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.2 },
};

/* ========== Tap Animations ========== */
export const tapScale = {
  scale: 0.95,
};

/* ========== Transition Presets ========== */
export const transitions = {
  fast: { duration: 0.15 },
  base: { duration: 0.25 },
  slow: { duration: 0.35 },
  slower: { duration: 0.5 },
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  bounce: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
  },
  elastic: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 15,
  },
};

/* ========== Page Transition ========== */
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    }
  },
};

/* ========== Loading Animations ========== */
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const spinAnimation = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

/* ========== Utility Functions ========== */
export const getStaggerDelay = (index: number, baseDelay: number = 0.1) => {
  return index * baseDelay;
};

export const getRandomDelay = (min: number = 0, max: number = 0.5) => {
  return Math.random() * (max - min) + min;
};

