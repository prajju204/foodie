import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { 
  CalendarIcon, Leaf, Drumstick, UtensilsCrossed, Plus, Minus, ShoppingCart, 
  ArrowRight, ArrowLeft, Users, MapPin, FileText, Clock, Check, AlertCircle,
  Truck, ChefHat, Package, Percent, User, Phone, Mail
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import foodieLogo from "@/assets/foodie-logo.png";

type FoodType = "veg" | "non_veg" | "platter";
type Step = "date" | "menu" | "details" | "confirm";

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

interface ValidationErrors {
  [key: string]: string;
}

interface AdminCharges {
  delivery_charge: number;
  vessel_charge: number;
  staff_charge_per_person: number;
  guests_per_staff: number;
  service_charge_percent: number;
}

// Default charges (used as fallback)
const DEFAULT_CHARGES: AdminCharges = {
  delivery_charge: 3000,
  vessel_charge: 5000,
  staff_charge_per_person: 800,
  guests_per_staff: 50,
  service_charge_percent: 5,
};

const MIN_GUEST_COUNT = 50;

// Time slots
const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM",
  "07:00 PM", "08:00 PM", "09:00 PM"
];

export default function BookCatering() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("date");
  
  // Date & Time
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  // Menu & Cart
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<FoodType>("veg");
  const [guestCount, setGuestCount] = useState<string>("");
  
  // Customer details
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  
  // Admin charges (fetched from database)
  const [adminCharges, setAdminCharges] = useState<AdminCharges>(DEFAULT_CHARGES);
  const [chargesLoading, setChargesLoading] = useState(true);
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/book");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMenuItems();
      fetchAdminCharges();
    }
  }, [user]);

  const fetchAdminCharges = async () => {
    setChargesLoading(true);
    const { data, error } = await supabase
      .from("admin_charges")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching charges:", error);
      // Use default charges on error
    } else if (data) {
      setAdminCharges({
        delivery_charge: Number(data.delivery_charge),
        vessel_charge: Number(data.vessel_charge),
        staff_charge_per_person: Number(data.staff_charge_per_person),
        guests_per_staff: Number(data.guests_per_staff),
        service_charge_percent: Number(data.service_charge_percent),
      });
    }
    setChargesLoading(false);
  };

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

  // Calculations
  const getFoodCost = () => {
    const guests = parseInt(guestCount) || 0;
    return cart.reduce((sum, item) => sum + (item.price * item.quantity * guests), 0);
  };

  const getStaffCount = () => {
    const guests = parseInt(guestCount) || 0;
    return Math.ceil(guests / adminCharges.guests_per_staff);
  };

  const getStaffCharges = () => getStaffCount() * adminCharges.staff_charge_per_person;
  const getServiceCharges = () => Math.round(getFoodCost() * adminCharges.service_charge_percent / 100);
  
  const getTotalAmount = () => {
    const foodCost = getFoodCost();
    if (foodCost === 0) return 0;
    return foodCost + adminCharges.vessel_charge + adminCharges.delivery_charge + getStaffCharges() + getServiceCharges();
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cart functions
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

  const getCartItemQuantity = (itemId: string) => cart.find(i => i.id === itemId)?.quantity || 0;

  // Validation
  const validateStep = (step: Step): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (step === "date") {
      if (!selectedDate) newErrors.date = "Please select event date";
      if (!selectedTime) newErrors.time = "Please select event time";
    }
    
    if (step === "menu") {
      if (cart.length === 0) newErrors.cart = "Please select at least one menu item";
      if (!guestCount) newErrors.guestCount = "Guest count is required";
      else if (!/^\d+$/.test(guestCount)) newErrors.guestCount = "Guest count must be numeric only";
      else if (parseInt(guestCount) < MIN_GUEST_COUNT) newErrors.guestCount = `Minimum ${MIN_GUEST_COUNT} guests required`;
    }
    
    if (step === "details") {
      if (!customerDetails.name) newErrors.name = "Name is required";
      else if (customerDetails.name.length < 3) newErrors.name = "Name must be at least 3 characters";
      if (!customerDetails.phone) newErrors.phone = "Phone number is required";
      else if (!/^\d{10}$/.test(customerDetails.phone)) newErrors.phone = "Please enter a valid 10-digit phone number";
      if (!customerDetails.email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(customerDetails.email)) newErrors.email = "Please enter a valid email address";
      if (!customerDetails.address) newErrors.address = "Event address is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fix the errors before continuing");
      return;
    }
    
    const stepOrder: Step[] = ["date", "menu", "details", "confirm"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const stepOrder: Step[] = ["date", "menu", "details", "confirm"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateStep("details")) return;
    
    setIsSubmitting(true);

    try {
      // Create customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert([{
          name: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone,
          address: customerDetails.address,
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Create order with combined date and time
      const eventDateTime = new Date(selectedDate!);
      const [time, period] = selectedTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      eventDateTime.setHours(hours, minutes);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_id: customerData.id,
          event_date: eventDateTime.toISOString(),
          event_name: `Catering for ${customerDetails.name}`,
          event_location: customerDetails.address,
          guest_count: parseInt(guestCount),
          notes: `Time: ${selectedTime}`,
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
        quantity: item.quantity * parseInt(guestCount),
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      toast.success("Order placed successfully!");
      setCurrentStep("confirm");
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setCart([]);
    setGuestCount("");
    setCustomerDetails({ name: "", email: "", phone: "", address: "" });
    setErrors({});
    setCurrentStep("date");
  };

  // Helper components
  const filterItemsByType = (type: FoodType) => menuItems.filter(item => item.food_type === type);
  
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

  // Step indicator
  const steps = [
    { id: "date", label: "Select Date & Time", icon: CalendarIcon, number: 1 },
    { id: "menu", label: "Choose Food", icon: UtensilsCrossed, number: 2 },
    { id: "details", label: "Your Details", icon: Users, number: 3 },
    { id: "confirm", label: "Confirmation", icon: Check, number: 4 },
  ];

  const ErrorText = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {message}
      </p>
    );
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => {
    const quantity = getCartItemQuantity(item.id);
    const guests = parseInt(guestCount) || 0;
    
    return (
      <Card className="bg-card hover:shadow-md transition-all duration-300 border border-border/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
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
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div>
              <p className="text-lg font-bold text-primary">{formatCurrency(item.price)}</p>
              <p className="text-xs text-muted-foreground">per plate</p>
            </div>
            
            {quantity > 0 ? (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-foreground w-6 text-center">{quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToCart(item)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => addToCart(item)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>
          
          {quantity > 0 && guests > 0 && (
            <div className="mt-3 p-2 bg-primary/5 rounded-md">
              <p className="text-sm text-primary font-medium">
                {quantity} × {guests} guests = {formatCurrency(item.price * quantity * guests)}
              </p>
            </div>
          )}
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
        {items.map(item => <MenuItemCard key={item.id} item={item} />)}
      </div>
    );
  };

  const CostBreakdown = ({ showFull = false }: { showFull?: boolean }) => {
    const foodCost = getFoodCost();
    const guests = parseInt(guestCount) || 0;
    
    if (cart.length === 0 || guests < MIN_GUEST_COUNT) return null;
    
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Food items */}
          {showFull && cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.name} ({item.quantity} × {guests} guests × {formatCurrency(item.price)})
              </span>
              <span className="font-medium">{formatCurrency(item.price * item.quantity * guests)}</span>
            </div>
          ))}
          
          <div className="flex justify-between text-sm font-medium">
            <span>🍽️ Food Cost</span>
            <span>{formatCurrency(foodCost)}</span>
          </div>
          
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Admin Charges (Read Only)</p>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" /> Vessel Charges
              </span>
              <span>{formatCurrency(adminCharges.vessel_charge)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4" /> Delivery Charges
              </span>
              <span>{formatCurrency(adminCharges.delivery_charge)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ChefHat className="h-4 w-4" /> Staff Charges ({getStaffCount()} staff × ₹{adminCharges.staff_charge_per_person})
              </span>
              <span>{formatCurrency(getStaffCharges())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Percent className="h-4 w-4" /> Service Charges ({adminCharges.service_charge_percent}%)
              </span>
              <span>{formatCurrency(getServiceCharges())}</span>
            </div>
          </div>
          
          <div className="border-t-2 border-primary pt-3">
            <div className="flex justify-between">
              <span className="font-bold text-lg">Total Amount</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(getTotalAmount())}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={foodieLogo} alt="Foodie Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-foreground">Foodie Catering</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = steps.findIndex(s => s.id === currentStep) > index;
              const isCompleted = currentStep === "confirm" && index < 3;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    (isPast || isCompleted) && "bg-primary/20 text-primary",
                    !isActive && !isPast && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                      isActive && "bg-primary-foreground text-primary",
                      (isPast || isCompleted) && "bg-primary text-primary-foreground",
                      !isActive && !isPast && !isCompleted && "bg-muted-foreground/30 text-muted-foreground"
                    )}>
                      {(isPast || isCompleted) ? <Check className="h-3 w-3" /> : step.number}
                    </div>
                    <span className="hidden md:inline text-sm font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-4 sm:w-8 md:w-12 h-0.5 mx-1",
                      (isPast || isCompleted) ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Date & Time Selection */}
        {currentStep === "date" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Select Date & Time</CardTitle>
                <CardDescription>When do you need catering?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Event Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-14 text-lg",
                          !selectedDate && "text-muted-foreground",
                          errors.date && "border-destructive"
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
                  <ErrorText message={errors.date} />
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Event Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className={cn("h-14 text-lg", errors.time && "border-destructive")}>
                      <Clock className="mr-3 h-5 w-5 text-muted-foreground" />
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ErrorText message={errors.time} />
                </div>

                {/* Selected Summary */}
                {selectedDate && selectedTime && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Selected Date & Time</p>
                    <p className="text-xl font-semibold text-foreground">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                    </p>
                  </div>
                )}

                <Button size="lg" className="w-full gap-2" onClick={goToNextStep}>
                  Continue to Menu
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Menu Selection */}
        {currentStep === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Choose Your Menu</h1>
                  <p className="text-muted-foreground">
                    {format(selectedDate!, "PPP")} at {selectedTime}
                  </p>
                </div>
                <Button variant="ghost" onClick={goToPrevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Change Date
                </Button>
              </div>

              {/* Guest Count */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <Label className="text-base font-medium">Number of Guests *</Label>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <Input
                        type="number"
                        min={MIN_GUEST_COUNT}
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        placeholder={`Minimum ${MIN_GUEST_COUNT} guests`}
                        className={cn("h-12 text-lg", errors.guestCount && "border-destructive")}
                      />
                      <ErrorText message={errors.guestCount} />
                    </div>
                    {parseInt(guestCount) >= MIN_GUEST_COUNT && (
                      <p className="text-sm text-primary font-medium">
                        Staff required: {getStaffCount()} persons
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {errors.cart && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.cart}
                  </p>
                </div>
              )}

              {/* Menu Tabs */}
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
                    
                    <TabsContent value="veg" className="mt-0"><CategorySection type="veg" /></TabsContent>
                    <TabsContent value="non_veg" className="mt-0"><CategorySection type="non_veg" /></TabsContent>
                    <TabsContent value="platter" className="mt-0"><CategorySection type="platter" /></TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Cost Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <CostBreakdown />
                
                {cart.length > 0 && parseInt(guestCount) >= MIN_GUEST_COUNT && (
                  <Button size="lg" className="w-full gap-2" onClick={goToNextStep}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Your Details</h1>
                  <p className="text-muted-foreground">Tell us how to contact you</p>
                </div>
                <Button variant="ghost" onClick={goToPrevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Menu
                </Button>
              </div>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={customerDetails.name}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        className={cn("pl-10 h-12", errors.name && "border-destructive")}
                      />
                    </div>
                    <ErrorText message={errors.name} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={customerDetails.phone}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        placeholder="9876543210"
                        className={cn("pl-10 h-12", errors.phone && "border-destructive")}
                      />
                    </div>
                    <ErrorText message={errors.phone} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className={cn("pl-10 h-12", errors.email && "border-destructive")}
                      />
                    </div>
                    <ErrorText message={errors.email} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Event Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={customerDetails.address}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Full venue address with landmarks"
                        className={cn("pl-10 min-h-[80px]", errors.address && "border-destructive")}
                      />
                    </div>
                    <ErrorText message={errors.address} />
                  </div>

                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CostBreakdown showFull />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === "confirm" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="h-20 w-20 rounded-full bg-[hsl(var(--success)/0.15)] flex items-center justify-center mx-auto mb-4">
                    <Check className="h-10 w-10 text-[hsl(var(--success))]" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
                  <p className="text-muted-foreground">
                    Thank you for your order. We'll contact you soon to confirm the details.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Event Details */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h3 className="font-semibold text-foreground">Event Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Date & Time</span>
                      <span className="font-medium">{format(selectedDate!, "PPP")} at {selectedTime}</span>
                      <span className="text-muted-foreground">Guest Count</span>
                      <span className="font-medium">{guestCount} guests</span>
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{customerDetails.address}</span>
                    </div>
                  </div>

                  {/* Selected Items */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h3 className="font-semibold text-foreground">Selected Items</h3>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.name} ({item.quantity} × {guestCount} guests)
                        </span>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity * parseInt(guestCount))}</span>
                      </div>
                    ))}
                  </div>

                  {/* Charges */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h3 className="font-semibold text-foreground">Charges Breakdown</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Cost</span>
                        <span>{formatCurrency(getFoodCost())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vessel Charges</span>
                        <span>{formatCurrency(adminCharges.vessel_charge)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery Charges</span>
                        <span>{formatCurrency(adminCharges.delivery_charge)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Staff Charges ({getStaffCount()} staff)</span>
                        <span>{formatCurrency(getStaffCharges())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service Charges ({adminCharges.service_charge_percent}%)</span>
                        <span>{formatCurrency(getServiceCharges())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total Amount</span>
                      <span className="font-bold text-2xl text-primary">{formatCurrency(getTotalAmount())}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Order Status: Pending Confirmation</p>
                  </div>

                  <Button onClick={resetOrder} className="w-full" size="lg">
                    Book Another Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar for Mobile - Menu Step */}
      {currentStep === "menu" && cart.length > 0 && parseInt(guestCount) >= MIN_GUEST_COUNT && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{getTotalItems()} items selected</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(getTotalAmount())}</p>
            </div>
            <Button size="lg" onClick={goToNextStep} className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Foodie Catering. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
