export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <div style={{ padding: "2rem", border: "1px solid #333", borderRadius: "8px", color: "#ccc", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", color: "#e44" }}>404 — Page Not Found</h1>
        <p style={{ marginTop: "1rem", color: "#888" }}>Did you forget to add the page to the router?</p>
      </div>
    </div>
  );
}
