import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import { PageLoader } from './components/ui/Feedback'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Products from './pages/Products'
import Videos from './pages/Videos'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Admins from './pages/Admins'
import Settings from './pages/Settings'
import TrackOrder from './pages/TrackOrder'
import Storefront from './pages/Storefront'
import NotFound from './pages/NotFound'

function RequireAuth({ children, superadmin }) {
  const { admin, loading, isSuperadmin } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader label="Checking your session…" />
  if (!admin) return <Navigate to="/login" replace state={{ from: location }} />
  if (superadmin && !isSuperadmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<Products />} />
        {/* <Route path="videos" element={<Videos />} /> */}
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="storefront" element={<Storefront />} />
        <Route
          path="admins"
          element={
            <RequireAuth superadmin>
              <Admins />
            </RequireAuth>
          }
        />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
