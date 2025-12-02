import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Leaf, Drumstick, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

type FoodType = "veg" | "non_veg" | "platter";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  food_type: FoodType;
}

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<FoodType>("veg");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
    food_type: "veg" as FoodType,
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to fetch menu items");
    } else {
      setMenuItems((data || []).map(item => ({
        ...item,
        food_type: (item.food_type || "veg") as FoodType,
      })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      is_available: formData.is_available,
      food_type: formData.food_type,
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

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      is_available: item.is_available,
      food_type: item.food_type || "veg",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      is_available: true,
      food_type: activeTab,
    });
    setEditingItem(null);
  };

  const openAddDialog = (foodType: FoodType) => {
    resetForm();
    setFormData((prev) => ({ ...prev, food_type: foodType }));
    setIsDialogOpen(true);
  };

  const filterItemsByType = (type: FoodType) => {
    return menuItems.filter((item) => item.food_type === type);
  };

  const getFoodTypeLabel = (type: FoodType) => {
    switch (type) {
      case "veg":
        return "Veg";
      case "non_veg":
        return "Non-Veg";
      case "platter":
        return "Platter";
    }
  };

  const getFoodTypeBadgeVariant = (type: FoodType) => {
    switch (type) {
      case "veg":
        return "veg" as const;
      case "non_veg":
        return "nonVeg" as const;
      case "platter":
        return "platter" as const;
    }
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <Card className="group bg-card hover:shadow-lg transition-all duration-300 border border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                <Badge variant={getFoodTypeBadgeVariant(item.food_type)} className="shrink-0">
                  {getFoodTypeLabel(item.food_type)}
                </Badge>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-primary">{formatCurrency(item.price)}</p>
            </div>
          </div>
          
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <Badge variant={item.is_available ? "default" : "secondary"} className="text-xs">
              {item.is_available ? "Available" : "Unavailable"}
            </Badge>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(item)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ type }: { type: FoodType }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/30 rounded-xl border-2 border-dashed border-border">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {type === "veg" && <Leaf className="h-8 w-8 text-[hsl(var(--veg))]" />}
        {type === "non_veg" && <Drumstick className="h-8 w-8 text-[hsl(var(--non-veg))]" />}
        {type === "platter" && <UtensilsCrossed className="h-8 w-8 text-[hsl(var(--platter))]" />}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">No {getFoodTypeLabel(type)} Items</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start adding {getFoodTypeLabel(type).toLowerCase()} items to your menu
      </p>
      <Button onClick={() => openAddDialog(type)} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add {getFoodTypeLabel(type)} Item
      </Button>
    </div>
  );

  const CategorySection = ({ type }: { type: FoodType }) => {
    const items = filterItemsByType(type);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {type === "veg" && <Leaf className="h-5 w-5 text-[hsl(var(--veg))]" />}
            {type === "non_veg" && <Drumstick className="h-5 w-5 text-[hsl(var(--non-veg))]" />}
            {type === "platter" && <UtensilsCrossed className="h-5 w-5 text-[hsl(var(--platter))]" />}
            <h2 className="text-xl font-semibold text-foreground">
              {getFoodTypeLabel(type)} Items
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({items.length} items)
              </span>
            </h2>
          </div>
          <Button onClick={() => openAddDialog(type)} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState type={type} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menu Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your catering menu items across categories
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-[hsl(var(--veg)/0.1)] to-card border-[hsl(var(--veg)/0.2)]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[hsl(var(--veg)/0.15)] flex items-center justify-center">
                <Leaf className="h-6 w-6 text-[hsl(var(--veg))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filterItemsByType("veg").length}</p>
                <p className="text-sm text-muted-foreground">Veg Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[hsl(var(--non-veg)/0.1)] to-card border-[hsl(var(--non-veg)/0.2)]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[hsl(var(--non-veg)/0.15)] flex items-center justify-center">
                <Drumstick className="h-6 w-6 text-[hsl(var(--non-veg))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filterItemsByType("non_veg").length}</p>
                <p className="text-sm text-muted-foreground">Non-Veg Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[hsl(var(--platter)/0.1)] to-card border-[hsl(var(--platter)/0.2)]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[hsl(var(--platter)/0.15)] flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-[hsl(var(--platter))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filterItemsByType("platter").length}</p>
                <p className="text-sm text-muted-foreground">Platters</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FoodType)} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 bg-muted/50">
                <TabsTrigger 
                  value="veg" 
                  className="gap-2 data-[state=active]:bg-[hsl(var(--veg))] data-[state=active]:text-[hsl(var(--veg-foreground))]"
                >
                  <Leaf className="h-4 w-4" />
                  <span className="hidden sm:inline">Veg</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="non_veg"
                  className="gap-2 data-[state=active]:bg-[hsl(var(--non-veg))] data-[state=active]:text-[hsl(var(--non-veg-foreground))]"
                >
                  <Drumstick className="h-4 w-4" />
                  <span className="hidden sm:inline">Non-Veg</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="platter"
                  className="gap-2 data-[state=active]:bg-[hsl(var(--platter))] data-[state=active]:text-[hsl(var(--platter-foreground))]"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="hidden sm:inline">Platters</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="veg" className="mt-0">
                <CategorySection type="veg" />
              </TabsContent>
              <TabsContent value="non_veg" className="mt-0">
                <CategorySection type="non_veg" />
              </TabsContent>
              <TabsContent value="platter" className="mt-0">
                <CategorySection type="platter" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update menu item details"
                  : `Add a new ${getFoodTypeLabel(formData.food_type).toLowerCase()} item to your menu`}
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
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
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
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="food_type">Food Type</Label>
                  <Select
                    value={formData.food_type}
                    onValueChange={(value: FoodType) =>
                      setFormData({ ...formData, food_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select food type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-[hsl(var(--veg))]" />
                          Veg
                        </div>
                      </SelectItem>
                      <SelectItem value="non_veg">
                        <div className="flex items-center gap-2">
                          <Drumstick className="h-4 w-4 text-[hsl(var(--non-veg))]" />
                          Non-Veg
                        </div>
                      </SelectItem>
                      <SelectItem value="platter">
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4 text-[hsl(var(--platter))]" />
                          Platter
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="flex justify-end gap-2 pt-4">
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
    </DashboardLayout>
  );
}
