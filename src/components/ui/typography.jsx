import * as React from 'react';
import { cn } from '@/lib/utils';

export function TypographyH1({ className, ...props }) {
  return (
    <h1
      className={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', className)}
      {...props}
    />
  );
}

export function TypographyH2({ className, ...props }) {
  return (
    <h2
      className={cn('scroll-m-20 text-3xl font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

export function TypographyH3({ className, ...props }) {
  return (
    <h3
      className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

export function TypographyH4({ className, ...props }) {
  return (
    <h4
      className={cn('scroll-m-20 text-xl font-medium tracking-tight', className)}
      {...props}
    />
  );
}

export function TypographyP({ className, ...props }) {
  return (
    <p
      className={cn('leading-7 [&:not(:first-child)]:mt-4 text-muted-foreground', className)}
      {...props}
    />
  );
}

export function TypographyMuted({ className, ...props }) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function TypographyBlockquote({ className, ...props }) {
  return (
    <blockquote
      className={cn('mt-6 border-l-2 pl-6 italic text-muted-foreground', className)}
      {...props}
    />
  );
}

export function TypographyInlineCode({ className, ...props }) {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className
      )}
      {...props}
    />
  );
}

export function TypographyList({ className, ...props }) {
  return (
    <ul className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)} {...props} />
  );
}
