import { X } from "lucide-react";

const PopupHeader = ({ title, onClose }: { title: string, onClose: (show: boolean) => void }) => {
    return (
        <>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <button
            onClick={() => onClose(false)}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
            <X className="w-5 h-5 text-gray-600" />
        </button>
    </div>
    </>
    )
}

export default PopupHeader;