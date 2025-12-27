-- Create admin_charges table to store configurable charges
CREATE TABLE public.admin_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_charge numeric NOT NULL DEFAULT 3000,
  vessel_charge numeric NOT NULL DEFAULT 5000,
  staff_charge_per_person numeric NOT NULL DEFAULT 800,
  guests_per_staff integer NOT NULL DEFAULT 50,
  service_charge_percent numeric NOT NULL DEFAULT 5,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.admin_charges ENABLE ROW LEVEL SECURITY;

-- Everyone can read charges (needed for booking page)
CREATE POLICY "Anyone can view charges"
ON public.admin_charges
FOR SELECT
USING (true);

-- Only admins can update charges (using profiles role)
CREATE POLICY "Admins can update charges"
ON public.admin_charges
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Insert default charges row
INSERT INTO public.admin_charges (delivery_charge, vessel_charge, staff_charge_per_person, guests_per_staff, service_charge_percent)
VALUES (3000, 5000, 800, 50, 5);