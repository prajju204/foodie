import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    event_name: "",
    event_date: "",
    event_location: "",
    guest_count: "",
    status: "pending",
    assigned_staff_id: "",
    total_amount: "",
    notes: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchStaff();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        customers(name),
        staff(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders");
    } else {
      setOrders(data || []);
    }
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    setCustomers(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("*")
      .eq("status", "active")
      .order("name");
    setStaff(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderData: any = {
      event_name: formData.event_name,
      event_date: formData.event_date,
      event_location: formData.event_location,
      guest_count: parseInt(formData.guest_count),
      status: formData.status as "pending" | "in_progress" | "completed" | "cancelled",
      total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
      customer_id: formData.customer_id || null,
      assigned_staff_id: formData.assigned_staff_id || null,
      notes: formData.notes,
    };

    if (editingOrder) {
      const { error } = await supabase
        .from("orders")
        .update(orderData)
        .eq("id", editingOrder.id);

      if (error) {
        toast.error("Failed to update order");
      } else {
        toast.success("Order updated successfully");
        setIsDialogOpen(false);
        fetchOrders();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("orders").insert([orderData]);

      if (error) {
        toast.error("Failed to create order");
      } else {
        toast.success("Order created successfully");
        setIsDialogOpen(false);
        fetchOrders();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete order");
    } else {
      toast.success("Order deleted successfully");
      fetchOrders();
    }
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData({
      customer_id: order.customer_id || "",
      event_name: order.event_name,
      event_date: format(new Date(order.event_date), "yyyy-MM-dd'T'HH:mm"),
      event_location: order.event_location || "",
      guest_count: order.guest_count.toString(),
      status: order.status,
      assigned_staff_id: order.assigned_staff_id || "",
      total_amount: order.total_amount?.toString() || "",
      notes: order.notes || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      event_name: "",
      event_date: "",
      event_location: "",
      guest_count: "",
      status: "pending",
      assigned_staff_id: "",
      total_amount: "",
      notes: "",
    });
    setEditingOrder(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">
              Manage catering orders and event bookings
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? "Edit Order" : "Create New Order"}
                </DialogTitle>
                <DialogDescription>
                  {editingOrder
                    ? "Update order details"
                    : "Add a new catering order"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select
                      value={formData.customer_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customer_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_name">Event Name</Label>
                    <Input
                      id="event_name"
                      value={formData.event_name}
                      onChange={(e) =>
                        setFormData({ ...formData, event_name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date & Time</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) =>
                        setFormData({ ...formData, event_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guest_count">Guest Count</Label>
                    <Input
                      id="guest_count"
                      type="number"
                      value={formData.guest_count}
                      onChange={(e) =>
                        setFormData({ ...formData, guest_count: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_location">Event Location</Label>
                  <Input
                    id="event_location"
                    value={formData.event_location}
                    onChange={(e) =>
                      setFormData({ ...formData, event_location: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff">Assigned Staff</Label>
                    <Select
                      value={formData.assigned_staff_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assigned_staff_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total Amount ($)</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, total_amount: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingOrder ? "Update" : "Create"} Order
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.event_name}</TableCell>
                  <TableCell>{order.customers?.name || "N/A"}</TableCell>
                  <TableCell>
                    {format(new Date(order.event_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{order.guest_count}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.staff?.name || "Unassigned"}</TableCell>
                  <TableCell>
                    ${order.total_amount?.toLocaleString() || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(order)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
