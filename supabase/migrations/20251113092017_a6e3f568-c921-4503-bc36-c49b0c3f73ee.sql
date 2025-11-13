-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE staff_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE staff_status AS ENUM ('active', 'inactive');

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role staff_role DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create menu categories table
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view menu categories" ON public.menu_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage menu categories" ON public.menu_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view menu items" ON public.menu_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage menu items" ON public.menu_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role staff_role DEFAULT 'staff',
  email TEXT NOT NULL,
  phone TEXT,
  status staff_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff" ON public.staff
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage staff" ON public.staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory" ON public.inventory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_location TEXT,
  guest_count INTEGER NOT NULL,
  status order_status DEFAULT 'pending',
  assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create order items table (many-to-many relationship between orders and menu items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();