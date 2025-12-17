import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings as SettingsIcon, Truck, Package, ChefHat, Percent, Save, Loader2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AdminCharges {
  id: string;
  delivery_charge: number;
  vessel_charge: number;
  staff_charge_per_person: number;
  guests_per_staff: number;
  service_charge_percent: number;
}

export default function Settings() {
  const { user } = useAuth();
  const [charges, setCharges] = useState<AdminCharges | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchCharges();
    fetchUserRole();
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    setUserRole(data?.role || null);
  };

  const fetchCharges = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("admin_charges")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching charges:", error);
      toast.error("Failed to load charges");
    } else if (data) {
      setCharges(data as AdminCharges);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!charges || !user) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from("admin_charges")
      .update({
        delivery_charge: charges.delivery_charge,
        vessel_charge: charges.vessel_charge,
        staff_charge_per_person: charges.staff_charge_per_person,
        guests_per_staff: charges.guests_per_staff,
        service_charge_percent: charges.service_charge_percent,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", charges.id);

    if (error) {
      console.error("Error saving charges:", error);
      toast.error("Failed to save charges. Make sure you have admin permissions.");
    } else {
      toast.success("Charges updated successfully!");
    }
    setIsSaving(false);
  };

  const handleChange = (field: keyof AdminCharges, value: string) => {
    if (!charges) return;
    const numValue = parseFloat(value) || 0;
    setCharges({ ...charges, [field]: numValue });
  };

  const isAdmin = userRole === "admin";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage catering charges applied to all customer orders
          </p>
        </div>

        {!isAdmin && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">
                ⚠️ You don't have admin permissions to edit these settings. Contact an administrator.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Delivery Charges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Delivery Charge
              </CardTitle>
              <CardDescription>
                Fixed delivery charge applied to all orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="delivery_charge">Amount (₹)</Label>
                <Input
                  id="delivery_charge"
                  type="number"
                  value={charges?.delivery_charge || 0}
                  onChange={(e) => handleChange("delivery_charge", e.target.value)}
                  disabled={!isAdmin}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Current: {formatCurrency(charges?.delivery_charge || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vessel Charges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Vessel Charge
              </CardTitle>
              <CardDescription>
                Fixed vessel/utensil charge per order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="vessel_charge">Amount (₹)</Label>
                <Input
                  id="vessel_charge"
                  type="number"
                  value={charges?.vessel_charge || 0}
                  onChange={(e) => handleChange("vessel_charge", e.target.value)}
                  disabled={!isAdmin}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Current: {formatCurrency(charges?.vessel_charge || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Staff Charges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                Staff Charges
              </CardTitle>
              <CardDescription>
                Per-staff charge based on guest count
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff_charge_per_person">Charge per Staff (₹)</Label>
                <Input
                  id="staff_charge_per_person"
                  type="number"
                  value={charges?.staff_charge_per_person || 0}
                  onChange={(e) => handleChange("staff_charge_per_person", e.target.value)}
                  disabled={!isAdmin}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Current: {formatCurrency(charges?.staff_charge_per_person || 0)} per staff
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests_per_staff" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Guests per Staff
                </Label>
                <Input
                  id="guests_per_staff"
                  type="number"
                  value={charges?.guests_per_staff || 50}
                  onChange={(e) => handleChange("guests_per_staff", e.target.value)}
                  disabled={!isAdmin}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  1 staff member assigned for every {charges?.guests_per_staff || 50} guests
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Charges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Service Charge
              </CardTitle>
              <CardDescription>
                Percentage-based service charge on food cost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="service_charge_percent">Percentage (%)</Label>
                <Input
                  id="service_charge_percent"
                  type="number"
                  step="0.1"
                  value={charges?.service_charge_percent || 0}
                  onChange={(e) => handleChange("service_charge_percent", e.target.value)}
                  disabled={!isAdmin}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Current: {charges?.service_charge_percent || 0}% of food cost
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Charges Preview</CardTitle>
            <CardDescription>
              Example calculation for 100 guests with ₹10,000 food cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Food Cost</span>
                <span className="font-medium">₹10,000</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-medium">{formatCurrency(charges?.delivery_charge || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vessel Charge</span>
                <span className="font-medium">{formatCurrency(charges?.vessel_charge || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Staff Charges ({Math.ceil(100 / (charges?.guests_per_staff || 50))} staff × {formatCurrency(charges?.staff_charge_per_person || 0)})</span>
                <span className="font-medium">
                  {formatCurrency(Math.ceil(100 / (charges?.guests_per_staff || 50)) * (charges?.staff_charge_per_person || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge ({charges?.service_charge_percent || 0}%)</span>
                <span className="font-medium">{formatCurrency(10000 * (charges?.service_charge_percent || 0) / 100)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-base">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(
                    10000 +
                    (charges?.delivery_charge || 0) +
                    (charges?.vessel_charge || 0) +
                    Math.ceil(100 / (charges?.guests_per_staff || 50)) * (charges?.staff_charge_per_person || 0) +
                    10000 * (charges?.service_charge_percent || 0) / 100
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
