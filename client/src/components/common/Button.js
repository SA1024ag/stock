import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled,
    fullWidth = false,
    ...props
}) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
    const widthStyle = fullWidth ? { width: '100%' } : {};

    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
            disabled={disabled || isLoading}
            style={widthStyle}
            {...props}
        >
            {isLoading ? (
                <span className="btn-loader">...</span>
            ) : children}
        </button>
    );
};

export default Button;
