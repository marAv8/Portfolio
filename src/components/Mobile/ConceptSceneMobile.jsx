// latest/src/components/Mobile/ConceptSceneMobile.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

import "./MobileCarousel.css";
import MobileInlineCarousel from "./MobileInlineCarousel";
import { conceptAssets } from "../../assets/assetData";
import { getLumenAll } from "../../assets/assetsRight";
import { getConceptLayout } from "../../config/conceptsLayout";

const ConceptCluster = React.lazy(() =>
  import("../MainContent/ConceptCluster").then((module) => ({
    default: module.default ?? module.ConceptCluster,
  }))
);
const PenumbraCluster = React.lazy(() => import("../MainContent/PenumbraCluster"));
const LumenCluster = React.lazy(() => import("../MainContent/LumenCluster"));
const AbyssCluster = React.lazy(() => import("../MainContent/AbyssCluster"));
const HatsCluster = React.lazy(() => import("../MainContent/HatsCluster"));
const EarlyAliensCluster = React.lazy(() => import("../MainContent/EarlyAliensCluster"));

const PRELOAD_MODULES = [
  () => import("../MainContent/ConceptCluster"),
  () => import("../MainContent/PenumbraCluster"),
  () => import("../MainContent/LumenCluster"),
  () => import("../MainContent/AbyssCluster"),
  () => import("../MainContent/HatsCluster"),
  () => import("../MainContent/EarlyAliensCluster"),
];

function toScaleArray(value) {
  if (Array.isArray(value)) return value;
  const v = typeof value === "number" ? value : 1;
  return [v, v, v];
}

function PreviewCanvas({ children, preview }) {
  const devicePixelRatio =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const maxDpr = Math.max(1, Math.min(1.5, devicePixelRatio));

  const rotation = preview?.rotation ?? [0, 0, 0];
  const centerOffset = preview?.centerOffset ?? [0, 0, 0];
  const translate = preview?.translate ?? [0, 0, 0];
  const biasY = preview?.biasY ?? 0;
  const scale = toScaleArray(preview?.scale);
  const position = [
    (translate[0] ?? 0) + (centerOffset[0] ?? 0),
    (translate[1] ?? 0) + (centerOffset[1] ?? 0) + biasY,
    (translate[2] ?? 0) + (centerOffset[2] ?? 0),
  ];

  const cameraZ = preview?.cameraZ ?? 18;
  const cameraY = preview?.cameraY ?? 1.5;
  const cameraFov = preview?.fov ?? 42;

  return (
    <div className="concept-mobile__preview">
      <Canvas
        className="concept-mobile__canvas"
        dpr={[1, maxDpr]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        shadows={false}
      >
        <PerspectiveCamera makeDefault position={[0, cameraY, cameraZ]} fov={cameraFov} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <group position={position} rotation={rotation} scale={scale}>
            {children}
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}

function SectionPreview({ section }) {
  const noop = () => {};
  const controlsStub = useMemo(() => ({ current: null }), []);
  const preview = section.preview ?? {};

  switch (section.type) {
    case "root":
      return (
        <PreviewCanvas preview={preview}>
          <ConceptCluster
            id={section.cluster.id}
            images={section.cluster.images}
            layout={section.cluster.layout}
            title={section.cluster.title}
            subtitle={section.cluster.subtitle}
            year={section.cluster.year}
            isActive={false}
            mobile
            enableStones
            preferThumb
            onActivate={noop}
            onShowCarousel={noop}
            setControlsEnabled={noop}
          />
        </PreviewCanvas>
      );
    case "penumbra":
      return (
        <PreviewCanvas preview={preview}>
          <PenumbraCluster
            id={section.cluster.id}
            images={section.cluster.images}
            layout={section.cluster.layout}
            title={section.cluster.title}
            subtitle={section.cluster.subtitle}
            year={section.cluster.year}
            palette={section.cluster.palette}
            extrusion={section.cluster.extrusion}
            isActive={false}
            mobile
            preview
            setControlsEnabled={noop}
            onActivate={noop}
          />
        </PreviewCanvas>
      );
    case "lumen":
      return (
        <PreviewCanvas preview={preview}>
          <LumenCluster
            id="cluster-lumen"
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={[1, 1, 1]}
            setControlsEnabled={noop}
            controlsRef={controlsStub}
            interactive={false}
            visibleSub="all"
          />
        </PreviewCanvas>
      );
    case "abyss":
      return (
        <PreviewCanvas preview={preview}>
          <AbyssCluster
            id={section.cluster.id}
            images={section.cluster.images}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            baseScale={section.layout?.baseScale ?? section.cluster.baseScale ?? 1}
            isActive={false}
            mobile
            setControlsEnabled={noop}
            controlsRef={controlsStub}
            onActivate={noop}
          />
        </PreviewCanvas>
      );
    case "hats":
      return (
        <PreviewCanvas preview={preview}>
          <HatsCluster
            id={section.cluster.id}
            assets={section.cluster.assets ?? []}
            isActive={false}
            baseScale={section.layout?.baseScale ?? 1}
            setControlsEnabled={noop}
            onActivate={noop}
          />
        </PreviewCanvas>
      );
    case "early":
      return (
        <PreviewCanvas preview={preview}>
          <EarlyAliensCluster
            id={section.cluster.id}
            assets={section.cluster.assets ?? []}
            isActive={false}
            baseScale={section.layout?.baseScale ?? 1}
            setControlsEnabled={noop}
            onActivate={noop}
          />
        </PreviewCanvas>
      );
    default:
      return null;
  }
}

function SectionWrapper({ section, onVisible, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onVisible(section.key);
        });
      },
      { rootMargin: "25% 0px 25% 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [section.key, onVisible]);

  return (
    <article ref={ref} className="concept-mobile__section" data-section-key={section.key}>
      {children}
    </article>
  );
}

const MOBILE_LAYOUT = getConceptLayout({ isMobile: true, isTablet: false });

function buildSections(lumenAssets) {
  const layoutMap = MOBILE_LAYOUT?.clusters ?? {};

  const root = conceptAssets.find((cluster) => cluster.id === "cluster-root");
  const penumbra = conceptAssets.find((cluster) => cluster.id === "cluster-penumbra");
  const abyss = conceptAssets.find((cluster) => cluster.id === "cluster-abyss");
  const hats = conceptAssets.find((cluster) => cluster.id === "cluster-hats");
  const early = conceptAssets.find((cluster) => cluster.id === "cluster-early-aliens");

  const applyPreview = (key, cluster, overrides = {}) => {
    const layout = layoutMap[key] ?? {};
    const previewCfg = layout.preview ?? {};
    const centerOffset =
      previewCfg.centerFromLayout && Array.isArray(layout.position)
        ? layout.position.map((v) => (typeof v === "number" ? -v : 0))
        : [0, 0, 0];

    return {
      key: overrides.key ?? cluster?.id ?? `cluster-${key}`,
      type: overrides.type ?? key,
      title: overrides.title ?? cluster?.title ?? "",
      subtitle: overrides.subtitle ?? cluster?.subtitle ?? "",
      year: overrides.year ?? cluster?.year ?? "",
      cluster: cluster ?? overrides.cluster ?? {},
      preview: {
        ...previewCfg,
        centerOffset,
        translate: overrides.preview?.translate ?? [0, 0, 0],
        cameraZ: overrides.preview?.cameraZ ?? previewCfg.cameraZ,
        cameraY: overrides.preview?.cameraY ?? previewCfg.cameraY,
        fov: overrides.preview?.fov ?? previewCfg.fov,
      },
      layout,
    };
  };

  return [
    root && applyPreview("root", root),
    penumbra && applyPreview("penumbra", penumbra),
    applyPreview("lumen", null, {
      key: "cluster-lumen",
      type: "lumen",
      title: "Lumen",
      subtitle: "Surveillance and astral echoes",
      year: "2023",
      cluster: { images: lumenAssets },
    }),
    abyss && applyPreview("abyss", abyss),
    hats && applyPreview("hats", hats),
    early && applyPreview("early", early),
  ].filter(Boolean);
}

export default function ConceptSceneMobile() {
  const lumenAssets = useMemo(() => getLumenAll(), []);
  const sections = useMemo(() => buildSections(lumenAssets), [lumenAssets]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("orientationchange", setVh);
    return () => window.removeEventListener("orientationchange", setVh);
  }, []);
  const initialKeys = useMemo(
    () => sections.slice(0, 1).map((section) => section.key),
    [sections]
  );
  const [visibleKeys, setVisibleKeys] = useState(() => initialKeys);
  useEffect(() => {
    setVisibleKeys((prev) => {
      const merged = new Set([...initialKeys, ...prev]);
      return Array.from(merged);
    });
  }, [initialKeys]);
  const visibleSet = useMemo(() => new Set(visibleKeys), [visibleKeys]);
  const handleVisible = useCallback((key) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  }, []);
  useEffect(() => {
    PRELOAD_MODULES.forEach((loader) => {
      try {
        loader();
      } catch {
        /* ignore prefetch issues */
      }
    });
  }, []);

  return (
    <div className="concept-mobile">
      {sections.map((section) => (
        <SectionWrapper key={section.key} section={section} onVisible={handleVisible}>
          {visibleSet.has(section.key) ? (
            <SectionPreview section={section} />
          ) : (
            <div className="concept-mobile__preview concept-mobile__preview--placeholder">
              Loading…
            </div>
          )}

          <div className="concept-mobile__meta">
            <h2 className="concept-mobile__title">{section.title}</h2>
            {section.subtitle ? (
              <p className="concept-mobile__subtitle">{section.subtitle}</p>
            ) : null}
            {section.year ? (
              <p className="concept-mobile__year">{section.year}</p>
            ) : null}
          </div>

          <div className="concept-mobile__carousel">
            <MobileInlineCarousel
              type={section.type}
              cluster={section.cluster}
              showMeta={false}
            />
          </div>
        </SectionWrapper>
      ))}
    </div>
  );
}
