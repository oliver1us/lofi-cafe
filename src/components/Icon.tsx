import type { ButtonHTMLAttributes, CSSProperties } from 'react';

export function Icon({ name, style }: { name: string; style?: CSSProperties }) {
  return <img className="icon shadow" src={`/assets/icons/${name}.svg`} alt="" draggable={false} style={style} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
}

export function IconButton({ icon, label, className = '', ...props }: IconButtonProps) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} data-tooltip={label} {...props}>
    <Icon name={icon} />
  </button>;
}
