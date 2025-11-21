import { useState } from 'react';
import type { ReactNode } from 'react';

interface TooltipProps {
  message: string;
  show: boolean;
  children: ReactNode;
}

export default function Tooltip({ message, show, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {show && visible && <span className="tooltip">{message}</span>}
    </span>
  );
}
