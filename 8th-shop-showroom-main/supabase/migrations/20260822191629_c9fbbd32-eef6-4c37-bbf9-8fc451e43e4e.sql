-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profile auto-creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  details TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  compare_at INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  featured BOOLEAN NOT NULL DEFAULT false,
  best_seller BOOLEAN NOT NULL DEFAULT false,
  is_gift_set BOOLEAN NOT NULL DEFAULT false,
  includes TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Admins read all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Collections
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  chapter TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  line TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections are public" ON public.collections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage collections" ON public.collections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);
GRANT SELECT ON public.collection_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_products TO authenticated;
GRANT ALL ON public.collection_products TO service_role;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collection products are public" ON public.collection_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage collection products" ON public.collection_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  town TEXT,
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed catalogue
INSERT INTO public.products (name, slug, description, details, category, price, compare_at, stock, sku, images, status, featured, best_seller, is_gift_set, includes, sort_order) VALUES
('Luna Pendant','luna-pendant','A whisper-thin chain carrying a single curved bar of polished gold. Designed to sit exactly where the collarbone meets the light.',ARRAY['18k gold plated brass','42cm chain, 4cm extender','Water resistant finish','Handled and boxed in Nairobi'],'necklaces',2400,2900,14,'T8-NL-001',ARRAY['p-necklace-1.jpg','hero-necklace.jpg'],'active',true,true,false,'{}',1),
('Aurum Cuff','aurum-cuff','Three fine bands that move independently around the wrist. Quiet, weightless, and impossible to stop touching.',ARRAY['Sterling silver finish','Adjustable 16–19cm','Tarnish resistant','Gift boxed'],'bracelets',1800,NULL,22,'T8-BR-002',ARRAY['p-bracelet-1.jpg','p-couples-1.jpg'],'active',true,true,false,'{}',2),
('Halo Hoops','halo-hoops','Small gold hoops with a soft, rounded profile. The pair you reach for without thinking.',ARRAY['18k gold plated','16mm diameter','Hypoallergenic posts','Sold as a pair'],'earrings',1500,NULL,30,'T8-ER-003',ARRAY['p-earrings-1.jpg','p-necklace-1.jpg'],'active',true,false,false,'{}',3),
('Solene Frames','solene-frames','Thin metal frames with warm amber lenses. Light on the face, heavy on presence.',ARRAY['Stainless steel frame','UV400 protection','Includes hard case & cloth','Unisex fit'],'glasses',3200,NULL,9,'T8-GL-004',ARRAY['p-glasses-1.jpg','hero-necklace.jpg'],'active',false,true,false,'{}',4),
('Duo Bracelets','duo-bracelets','Two bracelets, one idea. A polished bangle and a charm chain, made to be split between two people.',ARRAY['Set of two','Gold plated','Adjustable fit','Arrives in a two-piece box'],'bracelets',2900,NULL,12,'T8-BR-005',ARRAY['p-couples-1.jpg','p-bracelet-1.jpg'],'active',true,false,false,'{}',5),
('The 8th Gift Box','the-8th-gift-box','Our signature box. A pendant, a pair of hoops and a cuff, curated to work together and finished with a handwritten note.',ARRAY['3 pieces, one box','Handwritten note included','Ribbon-tied presentation box','Ships ready to give'],'gift-sets',4800,5700,18,'T8-GS-006',ARRAY['gift-box.jpg','p-necklace-1.jpg'],'active',true,true,true,ARRAY['Luna Pendant','Halo Hoops','Aurum Cuff'],6),
('The Evening Set','evening-gift-set','A smaller edit for the last-minute occasion. Hoops and a pendant, boxed and ready in one lift.',ARRAY['2 pieces, one box','Gold plated','Note card included','Same-day Nairobi delivery'],'gift-sets',3400,NULL,20,'T8-GS-007',ARRAY['gift-box.jpg','p-earrings-1.jpg'],'active',false,false,true,ARRAY['Halo Hoops','Luna Pendant'],7),
('Petite Gift Box','petite-gift-box','The entry into the 8th. One piece, beautifully presented — the easiest yes in the shop.',ARRAY['1 piece, one box','Choice of pendant or hoops','Ribbon tied','Note card included'],'gift-sets',1200,NULL,40,'T8-GS-008',ARRAY['gift-box.jpg','p-bracelet-1.jpg'],'active',false,false,true,ARRAY['One signature piece'],8);

INSERT INTO public.collections (slug, chapter, title, line, body, image, sort_order) VALUES
('everyday','Chapter One','The Everyday Collection','Elegant everyday pieces.','Pieces light enough to forget you''re wearing them, and good enough that you never take them off.','p-necklace-1.jpg',1),
('gift','Chapter Two','The Gift Collection','Something they''ll actually remember.','Chosen for the moment you want to get right. Wrapped, boxed and finished by hand.','gift-box.jpg',2),
('couples','Chapter Three','The Couples Collection','Made for two.','Matching pieces that read as one idea, split between two people.','p-couples-1.jpg',3);

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, x.ord FROM (VALUES
 ('everyday','luna-pendant',1),('everyday','aurum-cuff',2),('everyday','halo-hoops',3),
 ('gift','the-8th-gift-box',1),('gift','evening-gift-set',2),('gift','luna-pendant',3),
 ('couples','duo-bracelets',1),('couples','the-8th-gift-box',2),('couples','aurum-cuff',3)
) AS x(cslug, pslug, ord)
JOIN public.collections c ON c.slug = x.cslug
JOIN public.products p ON p.slug = x.pslug;