const fs = require('fs');
const file = 'src/components/social/OneXCommunity.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix aside container
content = content.replace(
  '<aside className="ox-sidebar ox-right-sidebar" style={{ position: "sticky", top: 0, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 16, maxHeight: "calc(100vh - 100px)", overflowY: "auto", overflowX: "hidden", zIndex: 1, padding: "4px 0 4px 0", scrollbarWidth: "thin" }}>',
  '<aside className="ox-sidebar ox-right-sidebar" style={{ position: "sticky", top: 12, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 20, maxHeight: "calc(100vh - 100px)", overflowY: "auto", overflowX: "hidden", zIndex: 1, padding: "0 4px 16px 4px", scrollbarWidth: "none" }}>'
);

// 2. Search Bar
content = content.replace(
  'padding: "8px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14',
  'padding: "12px 18px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.02)"'
);

// 3. Improve Card Base Styling
// They all start with <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20
content = content.replace(
  /background: T\.surface, border: `1px solid \$\{T\.border\}`, borderRadius: 20, padding: 20/g,
  'background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: "20px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.03)"'
);

// 4. Update Suggested Friends to have an orb
content = content.replace(
  '<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>\n                  <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(245,166,35,.15)"',
  '<div style={{ position: "absolute", top: "-20%", right: "-10%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.04), transparent 70%)", pointerEvents: "none" }} />\n                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, position: "relative" }}>\n                  <div style={{ width: 26, height: 26, borderRadius: 10, background: "rgba(245,166,35,.15)"'
);

// 5. Update Suggested Groups to have an orb
content = content.replace(
  '<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>\n                  <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(91,94,247,.15)"',
  '<div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,94,247,0.04), transparent 70%)", pointerEvents: "none" }} />\n                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, position: "relative" }}>\n                  <div style={{ width: 26, height: 26, borderRadius: 10, background: "rgba(91,94,247,.15)"'
);

// 6. Make all headers consistent: gap: 8, marginBottom: 16 (from 14)
content = content.replace(/marginBottom: 14, position: "relative"/g, 'marginBottom: 16, position: "relative"');

// 7. Make all inner lists look cleaner by adding hover scaling
content = content.replace(
  /transition: "all \.15s", border: "1px solid transparent"/g,
  'transition: "all .2s ease", border: "1px solid transparent", transform: "translateZ(0)"'
);

// Update list hovers to scale a bit
content = content.replace(
  /onMouseEnter=\{e => \{ \(e\.currentTarget as HTMLElement\)\.style\.background = T\.hover; \(e\.currentTarget as HTMLElement\)\.style\.borderColor = T\.border; \}\}/g,
  'onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover; (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.transform = "scale(1.01) translateY(-1px)"; }}'
);
content = content.replace(
  /onMouseLeave=\{e => \{ \(e\.currentTarget as HTMLElement\)\.style\.background = "none"; \(e\.currentTarget as HTMLElement\)\.style\.borderColor = "transparent"; \}\}/g,
  'onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; (e.currentTarget as HTMLElement).style.transform = "none"; }}'
);

// Add missing relative and overflow hidden to the suggested blocks if needed (they use maxHeight: 520...)
content = content.replace(
  /maxHeight: 520, minHeight: 200, overflowY: "auto"/g,
  'maxHeight: 520, minHeight: 200, overflowY: "auto", position: "relative", overflowX: "hidden"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Right sidebar styled');
