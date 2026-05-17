export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <rect width="32" height="32" rx="16" fill="#111"/>
      <polygon points="16,9 24,15 24,25 8,25 8,15" fill="#22C55E"/>
      <rect x="10" y="21" width="3" height="3" fill="#000"/>
      <rect x="14.5" y="18" width="3" height="6" fill="#000"/>
      <rect x="19" y="14" width="3" height="10" fill="#000"/>
      <polyline points="11.5,22.5 16,19.5 20.5,15.5" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="8,15 16,9 24,15" fill="none" stroke="#000" strokeWidth="1.2"/>
      <circle cx="16" cy="16" r="14" fill="none" stroke="#22C55E" strokeWidth="2" strokeDasharray="22 66" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="0.8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}
