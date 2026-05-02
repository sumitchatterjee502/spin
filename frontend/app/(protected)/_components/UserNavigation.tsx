import { User } from "lucide-react";
import { useSession } from "next-auth/react";

const UserNavigation = () => {
    const { data: session } = useSession();
    return (
        <div className="border-t border-slate-200 p-4">
            <button className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
            </div>
            
                <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-slate-500">{session?.user?.email || 'admin@admin.com'}</p>
                </div>
            
            </button>
        </div>
    )
}

export default UserNavigation;