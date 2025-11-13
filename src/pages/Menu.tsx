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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function Menu() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    is_available: true,
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select(`
        *,
        menu_categories(name)
      `)
      .order("name");

    if (error) {
      toast.error("Failed to fetch menu items");
    } else {
      setMenuItems(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("menu_categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData: any = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category_id: formData.category_id || null,
      is_available: formData.is_available,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Failed to update menu item");
      } else {
        toast.success("Menu item updated successfully");
        setIsDialogOpen(false);
        fetchMenuItems();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("menu_items").insert([itemData]);

      if (error) {
        toast.error("Failed to create menu item");
      } else {
        toast.success("Menu item created successfully");
        setIsDialogOpen(false);
        fetchMenuItems();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete menu item");
    } else {
      toast.success("Menu item deleted successfully");
      fetchMenuItems();
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category_id: item.category_id || "",
      is_available: item.is_available,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      is_available: true,
    });
    setEditingItem(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">
              Manage your catering menu items and categories
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                New Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update menu item details"
                    : "Add a new item to your menu"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_available: checked })
                    }
                  />
                  <Label htmlFor="available">Available</Label>
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
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.description || "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.menu_categories?.name || "Uncategorized"}
                  </TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_available ? "default" : "secondary"}>
                      {item.is_available ? "Available" : "Unavailable"}
                    </Badge>
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
