import React from 'react';
import './MetaInfo.css';

/** Overlay meta block: Title · Year · Description */
export default function MetaInfo({
  title = 'Untitled',
  year = '',
  description = '',
  className = '',
  align = 'top-left', // 'top-left' | 'top-right'
}) {
  return (
    <div className={['meta-info', `meta-info--${align}`, className].join(' ')}>
      <div className="meta-info__title">{title}</div>
      {year ? <div className="meta-info__year">{year}</div> : null}
      {description ? <div className="meta-info__desc">{description}</div> : null}
    </div>
  );
}
