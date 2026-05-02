"use client";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import LeftNavigation from "./LeftNavigation";

const Sidebar = ({isCollapsed, setIsCollapsed}: {isCollapsed: boolean, setIsCollapsed: (isCollapsed: boolean) => void}) => {
    return (
        <>
            {/* Top Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
                {!isCollapsed && (
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">AP</span>
                        </div>
                        <span className="font-bold text-lg text-slate-900">
                            Admin Panel
                        </span>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    {isCollapsed ? (
                        <PanelLeftClose   className="w-5 h-5 text-slate-600" />
                    ) : (
                        <PanelLeftOpen   className="w-5 h-5 text-slate-600" />
                    )}
                </button>
            
            </div>
            {/* Left Navigation Component */}
            <LeftNavigation isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            
       </>
    )
}

export default Sidebar;