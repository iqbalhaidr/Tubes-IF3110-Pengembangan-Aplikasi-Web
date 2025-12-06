/**
 * Spinner Component - Loading Indicator
 * 
 * A customizable loading spinner with different sizes.
 * 
 * @module components/common/Spinner
 */

import './Spinner.css';

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
    const spinnerStyle = color ? { borderTopColor: color } : {};

    const content = (
        <div className={`spinner-wrapper ${fullPage ? 'spinner-fullpage' : ''}`}>
            <div
                className={`spinner spinner-${size}`}
                style={spinnerStyle}
                role="status"
                aria-label="Loading"
            />
            {text && <p className="spinner-text">{text}</p>}
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
    const style = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '16px' : variant === 'circle' ? '40px' : '100px'),
        borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? '4px' : '8px'
    };

    if (variant === 'text' && lines > 1) {
        return (
            <div className="skeleton-lines">
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        className="skeleton"
                        style={{
                            ...style,
                            width: index === lines - 1 ? '60%' : '100%',
                            marginBottom: index < lines - 1 ? '8px' : 0
                        }}
                    />
                ))}
            </div>
        );
    }

    return <div className="skeleton" style={style} />;
}
