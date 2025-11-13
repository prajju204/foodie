import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    totalCustomers: 0,
  });

  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch orders
    const { data: orders } = await supabase
      .from("orders")
      .select("*");

    // Fetch inventory with low stock
    const { data: inventory } = await supabase
      .from("inventory")
      .select("*")
      .lt("quantity", "reorder_level");

    // Fetch customers
    const { data: customers } = await supabase
      .from("customers")
      .select("id");

    // Calculate stats
    const totalRevenue = orders?.reduce((sum, order) => {
      const amount = order.total_amount ? parseFloat(order.total_amount.toString()) : 0;
      return sum + amount;
    }, 0) || 0;

    setStats({
      totalOrders: orders?.length || 0,
      totalRevenue,
      lowStockItems: inventory?.length || 0,
      totalCustomers: customers?.length || 0,
    });

    // Group orders by status
    const statusCounts = orders?.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(statusCounts || {}).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count as number,
    }));

    setOrdersByStatus(chartData);
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const monthlyData = [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 5000 },
    { month: 'Apr', revenue: 4500 },
    { month: 'May', revenue: 6000 },
    { month: 'Jun', revenue: 5500 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your catering business.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            description="All time orders"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            description="Total earnings"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={AlertTriangle}
            description="Need reordering"
          />
          <StatsCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={Package}
            description="Registered customers"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue for the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
