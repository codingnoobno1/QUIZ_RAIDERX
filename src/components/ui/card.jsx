'use client';

import Link from 'next/link';

/**
 * Tokenised card surface (plan §22.2). NOT MUI <Paper>, so it never inherits the
 * light-theme white background. Styling lives in globals.css (.ui-card*).
 *
 * Props:
 *  - variant: 'surface' | 'elevated' | 'outline' | 'gradient' | 'interactive'
 *  - accent:  CSS color driving hover border/glow (via --accent)
 *  - href / onClick: makes the whole card a single <a>/<button> (a11y: no nested
 *    interactives inside a clickable card)
 *  - media:   node rendered in an aspect-ratio media slot at the top
 *
 * Compound parts: <Card.Header> <Card.Body> <Card.Footer>.
 */
export default function Card({
  variant = 'surface',
  accent,
  href,
  onClick,
  media,
  className = '',
  children,
  ...rest
}) {
  const interactive = !!href || !!onClick || variant === 'interactive';
  const cls = [
    'ui-card',
    `ui-card--${variant}`,
    interactive && variant !== 'interactive' ? 'ui-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const style = accent ? { '--accent': accent } : undefined;

  const inner = (
    <>
      {media && <div className="ui-card-media">{media}</div>}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} style={style} {...rest}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick} {...rest}>
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} style={style} {...rest}>
      {inner}
    </div>
  );
}

function CardHeader({ children, className = '', ...rest }) {
  return (
    <div className={`ui-card-header ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
function CardBody({ children, className = '', ...rest }) {
  return (
    <div className={`ui-card-body ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
function CardFooter({ children, className = '', ...rest }) {
  return (
    <div className={`ui-card-footer ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { CardHeader, CardBody, CardFooter };
