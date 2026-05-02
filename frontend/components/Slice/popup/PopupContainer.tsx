type PopupContainerProps = {
    children: React.ReactNode;
    /** When true, popup width fits content (with min/max bounds) instead of fixed max-w-4xl */
    dynamicWidth?: boolean;
};

const PopupContainer = ({ children, dynamicWidth }: PopupContainerProps) => {
    return (
        <>
            <div className="fixed inset-0 bg-[#6783914d] flex items-center justify-center z-50 p-4">
            <div 
                className={`bg-white rounded-xl max-h-[90vh] overflow-y-auto ${dynamicWidth ? "w-auto min-w-[320px] max-w-[90vw]" : "max-w-4xl w-full"}`}
                style={{ boxShadow: '0 4px 15px #667eea4d' }}
            >
                {children}
            </div>
            </div>
        </>
    )
}

export default PopupContainer;