import React from 'react';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
    const [visible, setVisible] = React.useState(false);

    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-bold text-white bg-black dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-neo-sm whitespace-nowrap z-50">
                    {content}
                </div>
            )}
        </div>
    );
};