import { Bell, LogOut  } from "lucide-react";
import { signOut } from "next-auth/react";

const TopHeader = () => {
    return (
        <>
            <header 
                className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm ring-1 ring-slate-200/80"
                >
                <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                    {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" /> */}
                    {/* <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-500"
                    /> */}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                        <Bell className="w-5 h-5 text-slate-600" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <button 
                    onClick={() => signOut()}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </header>
        </>
    )
}

export default TopHeader;