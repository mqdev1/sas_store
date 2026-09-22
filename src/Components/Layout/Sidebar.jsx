import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Truck,
    CreditCard,
    UserCog,
    BarChart3,
    Settings,
    Rocket,
    FolderTree,
    Building2,
    Wallet,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
    updateSidebarStatus,
    TemplateSideBarStatus,
} from "../../Store/TemplateSettings";

const menuItems = [
    { path: ["/"], key: "nav.home", icon: LayoutDashboard },
    { path: ["/orders"], key: "nav.orders", icon: ShoppingCart },
    { path: ["/products"], key: "nav.products", icon: Package },
    { path: ["/categories"], key: "nav.categories", icon: FolderTree },
    { path: ["/clients"], key: "nav.clients", icon: Users },
    { path: ["/shipping"], key: "nav.shipping", icon: Truck },
    {
        path: ["/shipping-carriers"],
        key: "nav.shippingCarriers",
        icon: Building2,
    },
    { path: ["/payments"], key: "nav.payments", icon: CreditCard },
    {
        path: ["/payment-gateways"],
        key: "nav.paymentGateways",
        icon: Wallet,
    },
    { path: ["/users"], key: "nav.users", icon: UserCog },
    { path: ["/reports"], key: "nav.reports", icon: BarChart3 },
    { path: ["/agents"], key: "nav.agents", icon: Rocket },
    { path: ["/settings"], key: "nav.settings", icon: Settings },
];

export default function Sidebar() {
    const { pathname } = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const sideBarStatus = useSelector(TemplateSideBarStatus);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile && sideBarStatus) {
            dispatch(updateSidebarStatus());
        }
    }, [pathname]);

    const sidebarContent = useMemo(() => {
        return (
            <aside
                className={`fixed top-22 w-auto right-2 left-2 md:top-30 md:ms-18 md:w-60 bottom-6 z-40
                    bg-(--bg-card) rounded-xl p-4
                    shadow-xs
                    border border-(--bg-border)
                    overflow-y-auto
                    transition-colors duration-300
                    ${sideBarStatus ? "side_show" : "side_hidden"}`}
            >
                <ul className="space-y-1">
                    {menuItems.map(({ path, key, icon: Icon }) => {
                        const firstPath = pathname.split("/")[1];
                        const isActive =
                            pathname === "/" && path[0] === "/"
                                ? true
                                : path[0].replace("/", "") === firstPath;

                        return (
                            <li key={path}>
                                <Link
                                    to={path[0]}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg
                                        text-sm transition-all duration-200 font-bold
                                        ${
                                            isActive
                                                ? "text-(--color-lavender) bg-(--bg-elevated) font-bold"
                                                : "text-(--text-secondary) hover:text-(--color-lavender) hover:bg-(--bg-hover)"
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{t(key)}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </aside>
        );
    }, [sideBarStatus, pathname, t]);

    return <>{sidebarContent}</>;
}