-- First, clear existing menu items to avoid duplicates
DELETE FROM public.menu_items;
DELETE FROM public.menu_categories;

-- Insert all menu categories
INSERT INTO public.menu_categories (id, name, description) VALUES
  (gen_random_uuid(), 'Fresh Juices & Drinks', 'Welcome drinks, fresh juices, and milkshakes'),
  (gen_random_uuid(), 'Salads & Accompaniments', 'Fresh salads, raitas, pickles, and chutneys'),
  (gen_random_uuid(), 'Veg Starters', 'Vegetarian appetizers and snacks'),
  (gen_random_uuid(), 'Non-Veg Starters - Chicken', 'Chicken tandoor and chinese style starters'),
  (gen_random_uuid(), 'Non-Veg Starters - Seafood', 'Prawns, fish, and crab starters'),
  (gen_random_uuid(), 'Non-Veg Starters - Mutton', 'Mutton appetizers'),
  (gen_random_uuid(), 'Breads & Rotis', 'Indian breads, rotis, and naans'),
  (gen_random_uuid(), 'Dosa Counter', 'South Indian dosas and appams'),
  (gen_random_uuid(), 'South Indian Specialties', 'Traditional South Indian items'),
  (gen_random_uuid(), 'Rice & Biryani', 'Rice varieties, pulav, and biryani'),
  (gen_random_uuid(), 'South Indian Gravies', 'Traditional South Indian curries'),
  (gen_random_uuid(), 'North Indian Gravies - Non Veg', 'North Indian non-vegetarian curries'),
  (gen_random_uuid(), 'North Indian Gravies - Mutton', 'Mutton curries'),
  (gen_random_uuid(), 'Vegetarian Gravies', 'Paneer, mushroom, and dal preparations'),
  (gen_random_uuid(), 'Vegetarian Dry', 'Dry vegetarian preparations'),
  (gen_random_uuid(), 'Chaat Counter', 'Indian street food and chaats'),
  (gen_random_uuid(), 'Chinese Counter', 'Chinese soups, rice, noodles, and dishes'),
  (gen_random_uuid(), 'Pasta Counter', 'Pasta varieties with different sauces'),
  (gen_random_uuid(), 'Desserts', 'Indian sweets and desserts'),
  (gen_random_uuid(), 'Ice Cream', 'Ice creams, kulfi, and sundaes'),
  (gen_random_uuid(), 'Fruits Counter', 'Fresh fruits and fruit-based items'),
  (gen_random_uuid(), 'Paan Counter', 'Various paan varieties'),
  (gen_random_uuid(), 'Continental', 'Continental soups, starters, and main course'),
  (gen_random_uuid(), 'Special Counters', 'Special live counters and unique items'),
  (gen_random_uuid(), 'Shawarma Counter', 'Live shawarma preparations'),
  (gen_random_uuid(), 'Kheema Pav Counter', 'Kheema pav varieties'),
  (gen_random_uuid(), 'Chai Counter', 'Tea varieties');