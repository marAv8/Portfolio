// src/clusters/registry.js
export const ROOT_CLUSTER_ID = 'cluster-root';

// Map cluster id -> dynamic import (each becomes its own chunk)
export const CLUSTERS = {
  'cluster-root': () =>
    import('../components/MainContent/ConceptCluster')
      .then(m => ({ default: m.default ?? m.ConceptCluster })),

  'cluster-abyss': () =>
    import('../components/MainContent/AbyssCluster')
      .then(m => ({ default: m.default ?? m.AbyssCluster })),
};

// In dev, mount these immediately so you can work on them (authoring mode)
export const ALWAYS_MOUNT_IN_DEV = ['cluster-abyss'];

// Helper if you need to iterate
export const ALL_CLUSTER_IDS = Object.keys(CLUSTERS);
