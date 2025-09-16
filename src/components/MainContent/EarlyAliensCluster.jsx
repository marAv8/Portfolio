// src/components/MainContent/EarlyAliensCluster.jsx
import React from 'react';
import SatelliteRingCluster from './SatelliteRingCluster';

export default function EarlyAliensCluster({
  id = 'cluster-early-aliens',
  assets = [],
  onActivate = () => {},
  ...rest
}) {
  return (
    <SatelliteRingCluster
      id={id}
      assets={assets}
      // click-only mini cluster → parent opens overlay
      onActivate={() => onActivate(id)}
      // ring layout/motion
      panelSize={[0.46, 0.62]}
      fitByHeight
      gap={0.02}
      startAt="top"
      spinSpeed={0.35}
      // keep any extra props (position, rotation, baseScale, etc.)
      {...rest}
    />
  );
}
