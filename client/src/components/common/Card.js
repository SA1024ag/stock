import React from 'react';

const Card = ({ children, className = '', title, action, ...props }) => {
    return (
        <div className={`card ${className}`} {...props}>
            {(title || action) && (
                <div className="card-header">
                    {title && <span>{title}</span>}
                    {action && <div className="card-action">{action}</div>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </div>
    );
};

export default Card;
