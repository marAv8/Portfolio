import React from 'react';
import './ClusterTitleChip.css';

export default function ClusterTitleChip({
  title = '',
  visible = false,
  align = 'bottom-left', // 'bottom-left' | 'bottom-right'
  className = '',
}) {
  if (!visible) return null;
  return (
    <div className={['title-chip', `title-chip--${align}`, className].join(' ')}>
      <div className="title-chip__inner">{title}</div>
    </div>
  );
}
