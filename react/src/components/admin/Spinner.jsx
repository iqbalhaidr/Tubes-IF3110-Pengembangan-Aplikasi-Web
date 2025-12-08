/**
 * Spinner Component - Loading Indicator
 * 
 * A customizable loading spinner with different sizes.
 * Uses Tailwind CSS for styling.
 * 
 * @module components/common/Spinner
 */

/**
 * Loading spinner component
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} props.color - CSS color value (default: uses primary-green)
 * @param {string} props.text - Optional loading text below spinner
 * @param {boolean} props.fullPage - Center in full page (default: false)
 */
export default function Spinner({
    size = 'medium',
    color,
    text,
    fullPage = false
}) {
    // Size classes mapping
    const sizeClasses = {
        small: 'w-5 h-5 border-2',
        medium: 'w-10 h-10 border-[3px]',
        large: 'w-[60px] h-[60px] border-4',
    };

    const spinnerStyle = color ? { borderTopColor: color } : {};

    const content = (
        <div
            className={`flex flex-col items-center justify-center gap-3 ${fullPage ? 'fixed inset-0 bg-white/90 z-[9999]' : ''
                }`}
        >
            <div
                className={`rounded-full border-border-color border-t-primary-green animate-spinner ${sizeClasses[size] || sizeClasses.medium}`}
                style={spinnerStyle}
                role="status"
                aria-label="Loading"
            />
            {text && <p className="text-sm text-text-medium m-0">{text}</p>}
        </div>
    );

    return content;
}

/**
 * Skeleton Loader Component - For content placeholder
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Type: 'text', 'circle', 'rect' (default: 'text')
 * @param {string} props.width - CSS width value
 * @param {string} props.height - CSS height value
 * @param {number} props.lines - Number of text lines to render
 */
export function Skeleton({
    variant = 'text',
    width,
    height,
    lines = 1
}) {
    // Variant-specific default styles
    const getVariantClasses = () => {
        switch (variant) {
            case 'circle':
                return 'rounded-full';
            case 'rect':
                return 'rounded-lg';
            case 'text':
            default:
                return 'rounded';
        }
    };

    const defaultStyle = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '16px' : variant === 'circle' ? '40px' : '100px'),
    };

    const baseClasses = `bg-gradient-to-r from-background-gray via-[#e8e8e8] to-background-gray bg-[length:200%_100%] animate-skeleton ${getVariantClasses()}`;

    if (variant === 'text' && lines > 1) {
        return (
            <div className="flex flex-col">
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        className={baseClasses}
                        style={{
                            ...defaultStyle,
                            width: index === lines - 1 ? '60%' : '100%',
                            marginBottom: index < lines - 1 ? '8px' : 0
                        }}
                    />
                ))}
            </div>
        );
    }

    return <div className={baseClasses} style={defaultStyle} />;
}
