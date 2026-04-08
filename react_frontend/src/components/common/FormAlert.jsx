const VARIANTS = {
  danger: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
  success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
  info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
};

export default function FormAlert({ variant = 'danger', children, style: extra = {} }) {
  if (children == null || children === '') return null;
  const v = VARIANTS[variant] || VARIANTS.danger;
  return (
    <div
      role="alert"
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 14,
        fontSize: 14,
        lineHeight: 1.5,
        whiteSpace: 'pre-line',
        ...extra,
      }}
    >
      {children}
    </div>
  );
}
