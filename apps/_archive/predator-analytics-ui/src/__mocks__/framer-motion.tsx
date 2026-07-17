import { Button } from '@/components/ui/button';
import React from 'react'

export const motion = {
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  button: ({ children, ...props }: any) => <Button variant="cyber" {...props}>{children}</Button>,
  section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}

export const AnimatePresence = ({ children }: any) => <>{children}</>

export const useAnimation = () => ({ start: () => { } })

export const useMotionValue = () => ({ get: () => 0, set: () => { } })

export const useTransform = () => 0

export const useSpring = () => 0

export const useMotionTemplate = () => ''
