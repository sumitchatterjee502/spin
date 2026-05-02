"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/config/AdminMenu";
import type { MenuItem, MenuChild } from "@/config/AdminMenu";
import { useSession } from "next-auth/react";

const LeftNavigation = ({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}) => {
  const pathname = usePathname();
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const [hoveredParentId, setHoveredParentId] = useState<string | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 0, left: 0 });
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data: session } = useSession();

  const permissions: string[] = useMemo(
    () => (session as any)?.permissions ?? [],
    [session]
  );

  const hasPermission = useCallback(
    (requiredPermission: string | undefined) => {
      if (!requiredPermission) return true;
      return permissions.includes(requiredPermission);
    },
    [permissions]
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .map((item): MenuItem | null => {
        if (item.children?.length) {
          const visibleChildren = item.children.filter((c) => hasPermission(c.requiredPermission));
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }
        if (!hasPermission(item.requiredPermission)) return null;
        return item;
      })
      .filter((i): i is MenuItem => i !== null);
  }, [permissions, hasPermission]);

  const isPathActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const isChildActive = (child: MenuChild) => isPathActive(child.href);
  const getExpandedFromPath = () => {
    const parent = filteredMenuItems.find((i) => i.children?.some((c) => isPathActive(c.href)));
    return parent?.id ?? null;
  };
  const expandedByPath = getExpandedFromPath();
  const effectiveExpanded = expandedParentId ?? expandedByPath;


  const handleParentMouseEnter = useCallback(
    (itemId: string) => {
      if (!isCollapsed) return;
      const el = itemRefs.current[itemId];
      if (el) {
        const rect = el.getBoundingClientRect();
        setFlyoutPosition({ top: rect.top, left: rect.right + 4 });
      }
      setHoveredParentId(itemId);
    },
    [isCollapsed]
  );

  const handleParentMouseLeave = useCallback(() => {
    setHoveredParentId(null);
  }, []);

  const toggleExpand = (itemId: string) => {
    setExpandedParentId((prev) => (prev === itemId ? null : itemId));
  };

  const renderChildList = (children: MenuChild[], parentId: string, collapsed = false) => (
    <div
      className={
        collapsed
          ? "py-1"
          : "pl-4 mt-0.5 space-y-0.5 border-l-2 border-slate-200 ml-3 py-1"
      }
    >
      {children.map((child) => {
        const ChildIcon = child.icon;
        const isActive = isChildActive(child);
        return (
          <Link
            key={child.id}
            href={child.href}
            className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              collapsed
                ? "text-slate-700 hover:bg-slate-100"
                : isActive
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ChildIcon className="w-4 h-4 flex-shrink-0" />
            <span>{child.label}</span>
          </Link>
        );
      })}
    </div>
  );

  const renderFlyout = () => {
    if (hoveredParentId === null || typeof document === "undefined") return null;
    const item = filteredMenuItems.find((i) => i.id === hoveredParentId && i.children?.length);
    if (!item?.children) return null;
    return createPortal(
      <div
        className="fixed z-[100] min-w-[200px] py-2 bg-white rounded-lg shadow-lg border border-slate-200"
        style={{ top: flyoutPosition.top, left: flyoutPosition.left }}
        onMouseEnter={() => setHoveredParentId(hoveredParentId)}
        onMouseLeave={handleParentMouseLeave}
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
          {item.label}
        </div>
        {renderChildList(item.children, item.id, true)}
      </div>,
      document.body
    );
  };

  return (
    <>
      <nav className="flex-1 flex flex-col min-h-0 py-4 px-2 overflow-visible">
        <div className="overflow-y-auto overflow-x-visible min-h-0 flex-1">

          {filteredMenuItems.length > 0 ? 
            (filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isParentActive = hasChildren
                ? item.children!.some((c) => isPathActive(c.href))
                : isPathActive(item.href);
              const isParentExpanded = effectiveExpanded === item.id;

              if (hasChildren) {
                return (
                  <div
                    key={item.id}
                    className="relative mb-1"
                    ref={(el) => {
                      itemRefs.current[item.id] = el;
                    }}
                    onMouseEnter={() => handleParentMouseEnter(item.id)}
                    onMouseLeave={handleParentMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className={`cursor-pointer w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg transition-all duration-200 group ${
                        isParentActive || isParentExpanded
                          ? "bg-slate-900 text-white shadow-lg"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            isParentActive || isParentExpanded
                              ? "text-white"
                              : "text-slate-600 group-hover:text-slate-900"
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="font-medium truncate">{item.label}</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="flex-shrink-0">
                          {isParentExpanded ? (
                            <ChevronDown
                              className={`w-4 h-4 ${
                                isParentActive || isParentExpanded ? "text-white" : "text-slate-500"
                              }`}
                            />
                          ) : (
                            <ChevronRight
                              className={`w-4 h-4 ${
                                isParentActive || isParentExpanded ? "text-white" : "text-slate-500"
                              }`}
                            />
                          )}
                        </span>
                      )}
                    </button>
                    {!isCollapsed && isParentExpanded && item.children && (
                      <div className="mt-0.5">
                        {renderChildList(item.children, item.id, false)}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`cursor-pointer w-full flex items-center space-x-3 px-3 py-3 rounded-lg mb-1 transition-all duration-200 group ${
                    isParentActive
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isParentActive ? "text-white" : "text-slate-600 group-hover:text-slate-900"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })):
            (
            <div className="px-3 py-4 text-sm text-slate-500">
              No menu items available. You may not have permissions assigned.
            </div>
            )
          }

        </div>
      </nav>
      {renderFlyout()}
    </>
  );
};

export default LeftNavigation;
