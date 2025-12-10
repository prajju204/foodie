import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface OrderMenuItem {
  id: string;
  name: string;
  price: string;
  description: string;
  image_url: string;
  food_type: "veg" | "non-veg";
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  const [orderMenuItems, setOrderMenuItems] = useState<OrderMenuItem[]>([]);

  useEffect(() => {
    fetchOrder();
    fetchCustomers();
    fetchStaff();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        customers(id, name, email, phone),
        staff(id, name)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast.error("Order not found");
      navigate("/orders");
      return;
    }

    setOrder(data);
    setFormData({
      customer_id: data.customer_id || "",
      event_name: data.event_name,
      event_date: format(new Date(data.event_date), "yyyy-MM-dd'T'HH:mm"),
      event_location: data.event_location || "",
      guest_count: data.guest_count.toString(),
      status: data.status,
      assigned_staff_id: data.assigned_staff_id || "",
      total_amount: data.total_amount?.toString() || "",
      notes: data.notes || "",
    });

    // Load saved menu items from order notes or localStorage
    const savedMenuItems = localStorage.getItem(`order_menu_${id}`);
    if (savedMenuItems) {
      setOrderMenuItems(JSON.parse(savedMenuItems));
    }
    
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("name");
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

  const handleSave = async () => {
    setSaving(true);
    
    const orderData = {
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

    const { error } = await supabase
      .from("orders")
      .update(orderData)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update order");
    } else {
      // Save menu items to localStorage
      localStorage.setItem(`order_menu_${id}`, JSON.stringify(orderMenuItems));
      toast.success("Order updated successfully");
    }
    
    setSaving(false);
  };

  const addMenuItem = (foodType: "veg" | "non-veg") => {
    const newItem: OrderMenuItem = {
      id: crypto.randomUUID(),
      name: "",
      price: "",
      description: "",
      image_url: "",
      food_type: foodType,
    };
    setOrderMenuItems([...orderMenuItems, newItem]);
  };

  const updateMenuItem = (id: string, field: keyof OrderMenuItem, value: string) => {
    setOrderMenuItems(
      orderMenuItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeMenuItem = (id: string) => {
    setOrderMenuItems(orderMenuItems.filter((item) => item.id !== id));
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      updateMenuItem(id, "image_url", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"} className="text-sm">
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const vegItems = orderMenuItems.filter((item) => item.food_type === "veg");
  const nonVegItems = orderMenuItems.filter((item) => item.food_type === "non-veg");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading order...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/orders")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{formData.event_name}</h1>
              <p className="text-muted-foreground">Order Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(formData.status)}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Order Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
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
              {order.customers && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Email: {order.customers.email}</p>
                  <p>Phone: {order.customers.phone || "N/A"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input
                  value={formData.event_name}
                  onChange={(e) =>
                    setFormData({ ...formData, event_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.event_location}
                  onChange={(e) =>
                    setFormData({ ...formData, event_location: e.target.value })
                  }
                  placeholder="Event location"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
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
                <Label>Assigned Staff</Label>
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
              <div className="space-y-2">
                <Label>Guest Count</Label>
                <Input
                  type="number"
                  value={formData.guest_count}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_count: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amount and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Total Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, total_amount: e.target.value })
                  }
                  className="text-2xl font-bold"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any special instructions or notes..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Menu Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="veg" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="veg" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Veg Menu ({vegItems.length})
                </TabsTrigger>
                <TabsTrigger value="non-veg" className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Non-Veg Menu ({nonVegItems.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="veg" className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => addMenuItem("veg")}
                  className="w-full border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Veg Item
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vegItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onUpdate={updateMenuItem}
                      onRemove={removeMenuItem}
                      onImageUpload={handleImageUpload}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="non-veg" className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => addMenuItem("non-veg")}
                  className="w-full border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Non-Veg Item
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nonVegItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onUpdate={updateMenuItem}
                      onRemove={removeMenuItem}
                      onImageUpload={handleImageUpload}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface MenuItemCardProps {
  item: OrderMenuItem;
  onUpdate: (id: string, field: keyof OrderMenuItem, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
}

function MenuItemCard({ item, onUpdate, onRemove, onImageUpload }: MenuItemCardProps) {
  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => onRemove(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <CardContent className="pt-6 space-y-4">
        {/* Image Upload */}
        <div className="relative">
          {item.image_url ? (
            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="h-6 w-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImageUpload(item.id, file);
                  }}
                />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(item.id, file);
                }}
              />
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label>Dish Name</Label>
          <Input
            value={item.name}
            onChange={(e) => onUpdate(item.id, "name", e.target.value)}
            placeholder="Enter dish name"
          />
        </div>

        <div className="space-y-2">
          <Label>Price (₹)</Label>
          <Input
            type="number"
            value={item.price}
            onChange={(e) => onUpdate(item.id, "price", e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={item.description}
            onChange={(e) => onUpdate(item.id, "description", e.target.value)}
            placeholder="Describe the dish..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
