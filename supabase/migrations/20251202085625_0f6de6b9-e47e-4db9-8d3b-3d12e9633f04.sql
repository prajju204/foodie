-- Add food_type column to menu_items for veg/non-veg/platter categorization
ALTER TABLE public.menu_items 
ADD COLUMN food_type text DEFAULT 'veg' CHECK (food_type IN ('veg', 'non_veg', 'platter'));