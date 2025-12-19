// src/components/MainContent/HatsCluster.jsx
import React, { useMemo } from 'react';
import SatelliteRingCluster from './SatelliteRingCluster';

export default function HatsCluster({
  id = 'cluster-hats',
  assets = [],
  onActivate = () => {},
  ...rest
}) {
  const normalized = useMemo(
    () =>
      (assets ?? [])
        .map((a) => {
          // allow either object assets or already-normalized {url}
          const url =
            (a && typeof a === 'object' && (a.url || a.full || a.mid || a.thumb)) ||
            (typeof a === 'string' ? a : null);

          return url ? { ...a, url } : null;
        })
        .filter(Boolean),
    [assets]
  );

  return (
    <SatelliteRingCluster
      id={id}
      assets={normalized}
      onActivate={() => onActivate(id)}
      panelSize={[0.46, 0.62]}
      fitByHeight
      gap={0.02}
      startAt="top"
      spinSpeed={0.35}
      {...rest}
    />
  );
}
