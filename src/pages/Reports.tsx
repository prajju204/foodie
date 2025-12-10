import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const downloadCSV = (data: string, filename: string) => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Reports() {
  const handleDownloadOrderReport = async () => {
    try {
      toast.info("Generating Order Report...");
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(name, email, phone),
          staff(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const headers = ['Order ID', 'Event Name', 'Customer Name', 'Customer Email', 'Customer Phone', 'Event Date', 'Event Location', 'Guest Count', 'Status', 'Total Amount', 'Assigned Staff', 'Notes', 'Created At'];
      
      const rows = orders?.map(order => [
        order.id,
        order.event_name,
        order.customers?.name || 'N/A',
        order.customers?.email || 'N/A',
        order.customers?.phone || 'N/A',
        format(new Date(order.event_date), 'dd/MM/yyyy HH:mm'),
        order.event_location || 'N/A',
        order.guest_count,
        order.status,
        order.total_amount || 0,
        order.staff?.name || 'Unassigned',
        order.notes || '',
        format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')
      ]) || [];

      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      downloadCSV(csvContent, `order_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      toast.success(`Order Report downloaded! ${orders?.length || 0} orders exported.`);
    } catch (error) {
      console.error('Error generating order report:', error);
      toast.error("Failed to generate Order Report");
    }
  };

  const handleDownloadRevenueReport = async () => {
    try {
      toast.info("Generating Revenue Report...");
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;

      // Group by month
      const monthlyRevenue: { [key: string]: { total: number; count: number; pending: number; completed: number } } = {};
      
      orders?.forEach(order => {
        const month = format(new Date(order.event_date), 'yyyy-MM');
        if (!monthlyRevenue[month]) {
          monthlyRevenue[month] = { total: 0, count: 0, pending: 0, completed: 0 };
        }
        monthlyRevenue[month].total += order.total_amount || 0;
        monthlyRevenue[month].count += 1;
        if (order.status === 'completed') {
          monthlyRevenue[month].completed += order.total_amount || 0;
        } else if (order.status === 'pending') {
          monthlyRevenue[month].pending += order.total_amount || 0;
        }
      });

      const headers = ['Month', 'Total Orders', 'Total Revenue (₹)', 'Completed Revenue (₹)', 'Pending Revenue (₹)', 'Average Order Value (₹)'];
      
      const rows = Object.entries(monthlyRevenue).map(([month, data]) => [
        format(new Date(month + '-01'), 'MMMM yyyy'),
        data.count,
        data.total,
        data.completed,
        data.pending,
        data.count > 0 ? Math.round(data.total / data.count) : 0
      ]);

      // Add summary row
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      rows.push(['--- TOTAL ---', totalOrders, totalRevenue, '', '', totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0]);

      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      downloadCSV(csvContent, `revenue_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      toast.success(`Revenue Report downloaded! Total: ${formatCurrency(totalRevenue)}`);
    } catch (error) {
      console.error('Error generating revenue report:', error);
      toast.error("Failed to generate Revenue Report");
    }
  };

  const handleDownloadInventoryReport = async () => {
    try {
      toast.info("Generating Inventory Report...");
      
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const headers = ['Item Name', 'Quantity', 'Unit', 'Reorder Level', 'Stock Status', 'Last Restocked', 'Needs Reorder'];
      
      const rows = inventory?.map(item => {
        const isLowStock = item.quantity <= item.reorder_level;
        return [
          item.name,
          item.quantity,
          item.unit,
          item.reorder_level,
          isLowStock ? 'LOW STOCK' : 'OK',
          item.last_restocked ? format(new Date(item.last_restocked), 'dd/MM/yyyy') : 'Never',
          isLowStock ? 'YES' : 'NO'
        ];
      }) || [];

      const lowStockCount = inventory?.filter(item => item.quantity <= item.reorder_level).length || 0;
      rows.push(['--- SUMMARY ---', '', '', '', '', '', '']);
      rows.push(['Total Items', inventory?.length || 0, '', '', '', '', '']);
      rows.push(['Low Stock Items', lowStockCount, '', '', '', '', '']);

      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      downloadCSV(csvContent, `inventory_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      toast.success(`Inventory Report downloaded! ${lowStockCount} items need reorder.`);
    } catch (error) {
      console.error('Error generating inventory report:', error);
      toast.error("Failed to generate Inventory Report");
    }
  };

  const handleDownloadCustomerReport = async () => {
    try {
      toast.info("Generating Customer Report...");
      
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (customersError) throw customersError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, total_amount, status');

      if (ordersError) throw ordersError;

      // Calculate order stats per customer
      const customerStats: { [key: string]: { orderCount: number; totalSpent: number } } = {};
      orders?.forEach(order => {
        if (order.customer_id) {
          if (!customerStats[order.customer_id]) {
            customerStats[order.customer_id] = { orderCount: 0, totalSpent: 0 };
          }
          customerStats[order.customer_id].orderCount += 1;
          customerStats[order.customer_id].totalSpent += order.total_amount || 0;
        }
      });

      const headers = ['Customer Name', 'Email', 'Phone', 'Address', 'Total Orders', 'Total Spent (₹)', 'Member Since'];
      
      const rows = customers?.map(customer => {
        const stats = customerStats[customer.id] || { orderCount: 0, totalSpent: 0 };
        return [
          customer.name,
          customer.email,
          customer.phone || 'N/A',
          customer.address || 'N/A',
          stats.orderCount,
          stats.totalSpent,
          format(new Date(customer.created_at), 'dd/MM/yyyy')
        ];
      }) || [];

      const totalCustomers = customers?.length || 0;
      const totalOrderValue = Object.values(customerStats).reduce((sum, s) => sum + s.totalSpent, 0);
      rows.push(['--- SUMMARY ---', '', '', '', '', '', '']);
      rows.push(['Total Customers', totalCustomers, '', '', '', totalOrderValue, '']);

      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      downloadCSV(csvContent, `customer_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      toast.success(`Customer Report downloaded! ${totalCustomers} customers exported.`);
    } catch (error) {
      console.error('Error generating customer report:', error);
      toast.error("Failed to generate Customer Report");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and download business reports
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Report</CardTitle>
              <CardDescription>
                Complete order history with customer details and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleDownloadOrderReport}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Order Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Report</CardTitle>
              <CardDescription>
                Financial overview with revenue breakdown by period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleDownloadRevenueReport}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Revenue Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
              <CardDescription>
                Stock levels, low stock alerts, and reorder recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleDownloadInventoryReport}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Inventory Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Report</CardTitle>
              <CardDescription>
                Customer database with order history and contact info
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleDownloadCustomerReport}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Customer Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
