export default function Star({ size = 32, filled = true, className = '' }: { size?: number; filled?: boolean; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
            <path
                d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z"
                fill={filled ? '#fbbf24' : '#e2e8f0'}
                stroke={filled ? '#d97706' : '#cbd5e1'}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}
