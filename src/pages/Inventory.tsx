import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "",
    reorder_level: "",
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to fetch inventory");
    } else {
      setInventory(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData: any = {
      name: formData.name,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      reorder_level: parseFloat(formData.reorder_level),
      last_restocked: new Date().toISOString(),
    };

    if (editingItem) {
      const { error } = await supabase
        .from("inventory")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Failed to update inventory item");
      } else {
        toast.success("Inventory item updated successfully");
        setIsDialogOpen(false);
        fetchInventory();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("inventory").insert([itemData]);

      if (error) {
        toast.error("Failed to create inventory item");
      } else {
        toast.success("Inventory item created successfully");
        setIsDialogOpen(false);
        fetchInventory();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete inventory item");
    } else {
      toast.success("Inventory item deleted successfully");
      fetchInventory();
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      reorder_level: item.reorder_level.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      unit: "",
      reorder_level: "",
    });
    setEditingItem(null);
  };

  const isLowStock = (item: any) => {
    return parseFloat(item.quantity) <= parseFloat(item.reorder_level);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track ingredients and supplies
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Inventory Item" : "Create New Inventory Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update inventory item details"
                    : "Add a new item to inventory"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="kg, lbs, pcs"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorder_level">Reorder Level</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    step="0.01"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_level: e.target.value })
                    }
                    required
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
                    {editingItem ? "Update" : "Create"} Item
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
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isLowStock(item) && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{parseFloat(item.quantity).toFixed(2)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{parseFloat(item.reorder_level).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={isLowStock(item) ? "destructive" : "default"}
                    >
                      {isLowStock(item) ? "Low Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.last_restocked
                      ? format(new Date(item.last_restocked), "MMM dd, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
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
