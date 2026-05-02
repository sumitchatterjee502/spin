import type { LucideIcon } from "lucide-react";
import { 
  LayoutDashboard, 
  UserCog, 
  FileCog , 
  TruckElectric ,
  HatGlasses , 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  LayersPlus, 
  CreditCard, 
  FileText, 
  Settings, 
  Settings2, 
  FileChartColumn,
  FilePenLine,
  Tags,  
  CogIcon,
  Cog,
  Spline,
  GrapeIcon,
  Calendar,
  CalendarDays,
  Rotate3D,
  RotateCcw,
  Box,
  User,
  QrCode,
} from "lucide-react";

export interface MenuChild {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Permission required to show this item (e.g. "category:read"). If not set, shown when user has any permission. */
  requiredPermission?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  children?: MenuChild[];
  /** Permission required to show this item (e.g. "product:read"). If not set, shown when user has any permission. Parent with children is shown if any child is visible. */
  requiredPermission?: string;
}

const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboards' },
    { id: 'lead-profile', label: 'Leads Profile', icon: Users, href: '/lead-profile' },
    { id: 'verification-dashboard', label: 'Verification Dashboard', icon: FilePenLine, href: '/admin/verification' },
    { id: 'invoice-validation', label: 'Invoice Validation', icon: ShoppingCart, href: '/admin/invoice-tracking' },
    { id: 'fulfillment-management', label: 'Fulfillment Management', icon: TruckElectric, href: '/admin/fulfillment' },
    { id: 'configuration', label: 'Configuration', icon: CogIcon, href: '/configuration',
      children: [
        { id: 'prize-configuration', label: 'Prize Configuration', icon: Cog, href: '/admin/prize-config', requiredPermission: 'prize-configuration:read' },
        { id: 'spin-configuration', label: 'Spin Probability Configuration', icon: RotateCcw, href: '/admin/probability-config', requiredPermission: 'spin-configuration:read' },
        { id: 'product-setup', label: 'Product Setup', icon: Box, href: '/product-setup', requiredPermission: 'product-setup:read' },
        { id: 'campaign-setup', label: 'Campaign Setup', icon: CalendarDays, href: '/campaigns-setup', requiredPermission: 'campaign-setup:read' },
        { id: 'qr-mapping', label: 'QR Code Mapping', icon: QrCode, href: '/admin/qr-mapping', requiredPermission: 'qr-mapping:read' },
      ]
     },
    { id: 'Prize-management', label: 'Prize Management', icon: UserCog, href: '/prize-management',
        children: [
            { id: 'winner-confirmation', label: 'Winner Confirmation', icon: Users, href: '/winner-confirmation', requiredPermission: 'admin:read' },
            { id: 'prize-dispatch-management', label: 'Prize Dispatch Management', icon: HatGlasses, href: '/prize-dispatch-management', requiredPermission: 'role:read' },
            { id: 'transaction-freeze', label: 'Transaction Freeze', icon: Settings2, href: '/transaction-freeze', requiredPermission: 'permission:read' },
            { id: 'manual-verification', label: 'Manual Verification', icon: FileCog, href: '/manual-verification', requiredPermission: 'activitylog:read' },
            { id: 'user-data-access', label: 'User Data Access', icon: TruckElectric, href: '/user-data-access', requiredPermission: 'shipping:read' },
            { id: 'notifications-and-communication', label: 'Notifications and Communication', icon: FileCog, href: '/notifications-and-communication', requiredPermission: 'activitylog:read' },
          ]
    },
    { id: 'settings', label: 'Settings', icon: Settings , href: '/settings', requiredPermission: 'settings:read',
      children: [
        { id: 'admin-managements', label: 'Admin Management', icon: Users, href: '/admin-managements', requiredPermission: 'admin-management:read' },
        { id: 'role-managements', label: 'Role Management', icon: HatGlasses, href: '/role-managements', requiredPermission: 'settings:read' },
        { id: 'permission-managements', label: 'Permission Management', icon: Settings2, href: '/permission-managements', requiredPermission: 'settings:read' },
        
      ]
    },
];

export {
    menuItems
}