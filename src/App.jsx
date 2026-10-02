import { BrowserRouter, Routes, Route } from "react-router-dom";

// #region Started components

import Layout from "./Components";
import Home from "./Components/views/Home";
import Error from "./Components/Layout/Error";
import Orders from "./Components/views/Orders";
import Auth from "./Components/views/Auth";
import OrdersNew from "./Components/views/OrdersNew";
import OrdersCancel from "./Components/views/OrdersCancel";
import Products from "./Components/views/Products";
import ProductForm from "./Components/views/ProductForm";
import ProductDetails from "./Components/views/ProductDetails";
import Clients from "./Components/views/Clients";
import ClientForm from "./Components/views/ClientForm";
import ClientDetails from "./Components/views/ClientDetails";
import Shipping from "./Components/views/Shipping";
import ShippingForm from "./Components/views/ShippingForm";
import ShippingDetails from "./Components/views/ShippingDetails";
import Payments from "./Components/views/Payments";
import PaymentForm from "./Components/views/PaymentForm";
import PaymentDetails from "./Components/views/PaymentDetails";
import Users from "./Components/views/Users";
import UserForm from "./Components/views/UserForm";
import UserDetails from "./Components/views/UserDetails";
import Reports from "./Components/views/Reports";
import Agents from "./Components/views/Agents";
import AgentForm from "./Components/views/AgentForm";
import AgentDetails from "./Components/views/AgentDetails";
import Settings from "./Components/views/Settings";
import Profile from "./Components/views/Profile";
import OrderForm from "./Components/views/OrderForm";
import OrderDetails from "./Components/views/OrderDetails";
import Categories from "./Components/views/Categories";
import CategoryForm from "./Components/views/CategoryForm";
import CategoryDetails from "./Components/views/CategoryDetails";

import ShippingCarriers from "./Components/views/ShippingCarriers";
import ShippingCarrierForm from "./Components/views/ShippingCarrierForm";
import ShippingCarrierDetails from "./Components/views/ShippingCarrierDetails";

// #region End components

import { loadSession, setSession } from "./Store/AuthSlice";
import { onAuthStateChange } from "./Services/AuthService";
import ProtectedRoute from "./Components/SubComponents/ProtectedRoute";
import PaymentGateways from "./Components/views/PaymentGateways";
import PaymentGatewayForm from "./Components/views/PaymentGatewayForm";
import PaymentGatewayDetails from "./Components/views/PaymentGatewayDetails";

import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

function App() {
  const dispatch = useDispatch();
  const { initialized } = useSelector((s) => s.auth);

  // ✅ تحميل الجلسة أول ما يفتح التطبيق
  useEffect(() => {
    dispatch(loadSession());

    // ✅ راقب تغيّر الجلسة
    const { data: { subscription } } = onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          dispatch(setSession(session));
        } else if (event === "SIGNED_OUT") {
          dispatch(setSession(null));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch]);

  // ⏳ ننتظر تحميل الجلسة
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-main)">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--bg-border) border-t-(--color-lavender)" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ مسار تسجيل الدخول — مستقل */}
        <Route path="/login" element={<Auth />} />

        {/* ✅ المسارات المحمية */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/new" element={<OrdersNew />} />
          <Route path="/orders/cancel" element={<OrdersCancel />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/orders/:id/edit" element={<OrderForm />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/shipping/new" element={<ShippingForm />} />
          <Route path="/shipping/:id" element={<ShippingDetails />} />
          <Route path="/shipping/:id/edit" element={<ShippingForm />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/new" element={<PaymentForm />} />
          <Route path="/payments/:id" element={<PaymentDetails />} />
          <Route path="/payments/:id/edit" element={<PaymentForm />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/:id" element={<UserDetails />} />
          <Route path="/users/:id/edit" element={<UserForm />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/new" element={<AgentForm />} />
          <Route path="/agents/:id" element={<AgentDetails />} />
          <Route path="/agents/:id/edit" element={<AgentForm />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/new" element={<CategoryForm />} />
          <Route path="/categories/:id" element={<CategoryDetails />} />
          <Route path="/categories/:id/edit" element={<CategoryForm />} />
          <Route path="/shipping-carriers" element={<ShippingCarriers />} />
          <Route path="/shipping-carriers/new" element={<ShippingCarrierForm />} />
          <Route path="/shipping-carriers/:id" element={<ShippingCarrierDetails />} />
          <Route path="/payment-gateways" element={<PaymentGateways />} />
          <Route path="/payment-gateways/new" element={<PaymentGatewayForm />} />
          <Route path="/payment-gateways/:id" element={<PaymentGatewayDetails />} />
          <Route path="/payment-gateways/:id/edit" element={<PaymentGatewayForm />} />
          <Route
            path="/shipping-carriers/:id/edit"
            element={<ShippingCarrierForm />}
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Error />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;