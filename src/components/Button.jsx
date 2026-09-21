export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
  }) {
    return (
      <button
        className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }