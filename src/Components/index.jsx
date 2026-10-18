import { Outlet } from "react-router-dom";
import MainLayout from "./Layout/MainLayout";

export default function Layout() {
    console.log("📐 [Layout] mounted");
    
    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    );
}