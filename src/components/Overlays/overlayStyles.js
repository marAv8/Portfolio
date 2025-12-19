// Shared style utilities for desktop/tablet overlay panes
export const overlayPaneStyle = {
  position: "relative",
  flex: "0 0 50vw",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.08)",
  color: "#ffffff",
  padding: "2rem",
  overflowY: "auto",
  zIndex: 101,
  backdropFilter: "blur(10px)",
  boxShadow: "0 0 16px rgba(0, 0, 0, 0.45)",
  borderRadius: "22px",
  fontFamily: '"Open Sans", sans-serif',
  WebkitFontSmoothing: "antialiased",
  textRendering: "geometricPrecision",
};
