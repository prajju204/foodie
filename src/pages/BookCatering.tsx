import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { CalendarIcon, Leaf, Drumstick, UtensilsCrossed, Plus, Minus, ShoppingCart, ArrowRight, ArrowLeft, Users, MapPin, FileText } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import foodieLogo from "@/assets/foodie-logo.png";

type FoodType = "veg" | "non_veg" | "platter";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  food_type: FoodType;
}

interface CartItem extends MenuItem {
  quantity: number;
}

type Step = "date" | "menu" | "details" | "confirm";

export default function BookCatering() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<FoodType>("veg");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Customer details
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    eventName: "",
    eventLocation: "",
    guestCount: "",
    notes: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/book");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMenuItems();
    }
  }, [user]);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("name");

    if (error) {
      toast.error("Failed to load menu items");
    } else {
      setMenuItems((data || []).map(item => ({
        ...item,
        food_type: (item.food_type || "veg") as FoodType,
      })));
    }
  };

  const filterItemsByType = (type: FoodType) => {
    return menuItems.filter((item) => item.food_type === type);
  };

  const getFoodTypeLabel = (type: FoodType) => {
    switch (type) {
      case "veg": return "Veg";
      case "non_veg": return "Non-Veg";
      case "platter": return "Platter";
    }
  };

  const getFoodTypeBadgeVariant = (type: FoodType) => {
    switch (type) {
      case "veg": return "veg" as const;
      case "non_veg": return "nonVeg" as const;
      case "platter": return "platter" as const;
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const getCartItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0;
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedDate || cart.length === 0) {
      toast.error("Please select a date and add items to cart");
      return;
    }

    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.eventName || !customerDetails.guestCount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create customer first
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([{
          name: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone,
          address: customerDetails.eventLocation,
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_id: customerData.id,
          event_date: selectedDate.toISOString(),
          event_name: customerDetails.eventName,
          event_location: customerDetails.eventLocation,
          guest_count: parseInt(customerDetails.guestCount),
          notes: customerDetails.notes,
          total_amount: getTotalAmount(),
          status: "pending",
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Your catering order has been placed successfully!");
      setCurrentStep("confirm");
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setSelectedDate(undefined);
    setCart([]);
    setCustomerDetails({
      name: "",
      email: "",
      phone: "",
      eventName: "",
      eventLocation: "",
      guestCount: "",
      notes: "",
    });
    setCurrentStep("date");
  };

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const MenuItemCard = ({ item }: { item: MenuItem }) => {
    const quantity = getCartItemQuantity(item.id);
    
    return (
      <Card className="bg-card hover:shadow-md transition-all duration-300 border border-border/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <Badge variant={getFoodTypeBadgeVariant(item.food_type)} className="text-xs">
                  {getFoodTypeLabel(item.food_type)}
                </Badge>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              )}
            </div>
            <p className="text-lg font-bold text-primary ml-4">{formatCurrency(item.price)}</p>
          </div>
          
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border/50">
            {quantity > 0 ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-foreground w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => addToCart(item)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addToCart(item)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const CategorySection = ({ type }: { type: FoodType }) => {
    const items = filterItemsByType(type);
    
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-xl border-2 border-dashed border-border">
          <p className="text-muted-foreground">No {getFoodTypeLabel(type).toLowerCase()} items available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  // Step indicator
  const steps = [
    { id: "date", label: "Select Date", icon: CalendarIcon },
    { id: "menu", label: "Choose Food", icon: UtensilsCrossed },
    { id: "details", label: "Your Details", icon: Users },
    { id: "confirm", label: "Confirmation", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={foodieLogo} alt="Foodie Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-foreground">Foodie Catering</span>
          </Link>
          
          {/* Cart summary */}
          {cart.length > 0 && currentStep !== "confirm" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingCart className="h-5 w-5" />
                <span>{getTotalItems()} items</span>
                <span className="font-semibold text-foreground">{formatCurrency(getTotalAmount())}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isPast && "bg-primary/20 text-primary",
                    !isActive && !isPast && "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline text-sm font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-2",
                      isPast ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Date Selection */}
        {currentStep === "date" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">When do you need catering?</CardTitle>
                <CardDescription>Select the date for your event</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full max-w-sm justify-start text-left font-normal h-14 text-lg",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {selectedDate && (
                  <div className="text-center p-4 bg-primary/10 rounded-lg w-full max-w-sm">
                    <p className="text-sm text-muted-foreground">Selected Date</p>
                    <p className="text-xl font-semibold text-foreground">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full max-w-sm gap-2"
                  disabled={!selectedDate}
                  onClick={() => setCurrentStep("menu")}
                >
                  Continue to Menu
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Menu Selection */}
        {currentStep === "menu" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Choose Your Menu</h1>
                <p className="text-muted-foreground">
                  Event Date: <span className="font-medium text-foreground">{selectedDate && format(selectedDate, "PPP")}</span>
                </p>
              </div>
              <Button variant="ghost" onClick={() => setCurrentStep("date")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Change Date
              </Button>
            </div>

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

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="sticky bottom-4 bg-card border-primary/20 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{getTotalItems()} items selected</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(getTotalAmount())}</p>
                      </div>
                    </div>
                    <Button size="lg" onClick={() => setCurrentStep("details")} className="w-full sm:w-auto gap-2">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === "details" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Your Details</h1>
                <p className="text-muted-foreground">Tell us about your event</p>
              </div>
              <Button variant="ghost" onClick={() => setCurrentStep("menu")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Menu
              </Button>
            </div>

            {/* Order Summary */}
            <Card className="bg-muted/30 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Event Date</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "PPP")}</span>
                </div>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(getTotalAmount())}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Form */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name *</Label>
                    <Input
                      id="eventName"
                      value={customerDetails.eventName}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, eventName: e.target.value }))}
                      placeholder="Birthday Party, Wedding, etc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestCount">Number of Guests *</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      min="1"
                      value={customerDetails.guestCount}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, guestCount: e.target.value }))}
                      placeholder="50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventLocation">Event Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="eventLocation"
                      className="pl-10"
                      value={customerDetails.eventLocation}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, eventLocation: e.target.value }))}
                      placeholder="Venue address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Instructions</Label>
                  <Textarea
                    id="notes"
                    value={customerDetails.notes}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any dietary requirements, allergies, or special requests..."
                    rows={3}
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === "confirm" && (
          <div className="max-w-lg mx-auto text-center">
            <Card className="border-border/50">
              <CardContent className="p-8">
                <div className="h-20 w-20 rounded-full bg-[hsl(var(--veg)/0.15)] flex items-center justify-center mx-auto mb-6">
                  <svg className="h-10 w-10 text-[hsl(var(--veg))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
                <p className="text-muted-foreground mb-6">
                  Thank you for your order. We'll contact you soon to confirm the details.
                </p>
                <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Event Date</span>
                    <span className="font-medium">{selectedDate && format(selectedDate, "PPP")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Items</span>
                    <span className="font-medium">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-bold text-primary">{formatCurrency(getTotalAmount())}</span>
                  </div>
                </div>
                <Button onClick={resetOrder} className="w-full">
                  Book Another Event
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Foodie Catering. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
