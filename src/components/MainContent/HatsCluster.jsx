import React from 'react';
import SatelliteRingCluster from './SatelliteRingCluster';

export default function HatsCluster({
  id = 'cluster-hats',
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
      // identical ring layout/motion to Early Aliens
      panelSize={[0.46, 0.62]}
      fitByHeight
      gap={0.02}
      startAt="top"
      spinSpeed={0.35}
      {...rest}
    />
  );
}