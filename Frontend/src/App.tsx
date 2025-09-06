import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './pages/Dashboard';
import ProductsList from './pages/Products/List';
import ProductAdd from './pages/Products/Add';
import ProductDetails from './pages/Products/Details';
import LowStock from './pages/Products/LowStock';
import SalesList from './pages/Sales/List';
import SaleNew from './pages/Sales/New';
import SaleDetails from './pages/Sales/Details';
import PurchasesList from './pages/Purchases/List';
import PurchaseNew from './pages/Purchases/New';
import PurchaseDetails from './pages/Purchases/Details';
import CategoriesIndex from './pages/Categories/Index';
import SuppliersIndex from './pages/Suppliers/Index';
import ReportsIndex from './pages/Reports/Index';
import ReportsSales from './pages/Reports/Sales';
import ReportsInventory from './pages/Reports/Inventory';
import ReportsProfit from './pages/Reports/Profit';
import UsersIndex from './pages/Users/Index';
import SettingsIndex from './pages/Settings/Index';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/Common/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={
        <ProtectedRoute roles={["owner"]}>
          <Register />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />

        <Route path="/products" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
        <Route path="/products/add" element={<ProtectedRoute roles={["owner","manager"]}><ProductAdd /></ProtectedRoute>} />
        <Route path="/products/low-stock" element={<ProtectedRoute><LowStock /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />

        <Route path="/sales" element={<ProtectedRoute><SalesList /></ProtectedRoute>} />
        <Route path="/sales/new" element={<ProtectedRoute><SaleNew /></ProtectedRoute>} />
        <Route path="/sales/:id" element={<ProtectedRoute><SaleDetails /></ProtectedRoute>} />

        <Route path="/purchases" element={<ProtectedRoute><PurchasesList /></ProtectedRoute>} />
        <Route path="/purchases/new" element={<ProtectedRoute roles={["owner","manager"]}><PurchaseNew /></ProtectedRoute>} />
        <Route path="/purchases/:id" element={<ProtectedRoute><PurchaseDetails /></ProtectedRoute>} />

        <Route path="/categories" element={<ProtectedRoute roles={["owner","manager"]}><CategoriesIndex /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute roles={["owner","manager"]}><SuppliersIndex /></ProtectedRoute>} />

        <Route path="/reports" element={<ProtectedRoute><ReportsIndex /></ProtectedRoute>} />
        <Route path="/reports/sales" element={<ProtectedRoute><ReportsSales /></ProtectedRoute>} />
        <Route path="/reports/inventory" element={<ProtectedRoute><ReportsInventory /></ProtectedRoute>} />
        <Route path="/reports/profit" element={<ProtectedRoute roles={["owner","manager"]}><ReportsProfit /></ProtectedRoute>} />

        <Route path="/users" element={<ProtectedRoute roles={["owner","manager"]}><UsersIndex /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={["owner","manager"]}><SettingsIndex /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
