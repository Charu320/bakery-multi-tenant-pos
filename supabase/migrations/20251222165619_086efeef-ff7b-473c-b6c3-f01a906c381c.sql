-- CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_no TEXT NOT NULL,
  name TEXT NOT NULL,
  gst_no TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT UNIQUE,

  cake_size TEXT,
  flavour TEXT,
  cake_description TEXT,
  message_on_cake TEXT,
  cake_color TEXT,
  cake_photo_url TEXT,

  occasion_type TEXT,
  occasion_date DATE,
  other_menu TEXT,

  delivery_date TIMESTAMPTZ,
  
  delivery_address TEXT,
  delivery_type TEXT,
  same_as_customer_address BOOLEAN DEFAULT false,
  delivery_city TEXT,
  delivery_charge DECIMAL(10,2) DEFAULT 0,

  total_amount DECIMAL(10,2) DEFAULT 0,
  coupon_code TEXT,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  after_discount DECIMAL(10,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 5,
  tax_value DECIMAL(10,2) DEFAULT 0,
  grand_total DECIMAL(10,2) DEFAULT 0,

  cash_payment DECIMAL(10,2) DEFAULT 0,
  credit_card_payment DECIMAL(10,2) DEFAULT 0,
 
  online_payment DECIMAL(10,2) DEFAULT 0,
  free_bill DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,

  status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS kitchen_acknowledged BOOLEAN DEFAULT false;


DO $$ 
BEGIN
  DROP POLICY IF EXISTS "customers read" ON customers;
  DROP POLICY IF EXISTS "customers insert" ON customers;
  DROP POLICY IF EXISTS "customers update" ON customers;
  DROP POLICY IF EXISTS "customers delete" ON customers;

  DROP POLICY IF EXISTS "orders read" ON orders;
  DROP POLICY IF EXISTS "orders insert" ON orders;
  DROP POLICY IF EXISTS "orders update admin" ON orders;
  DROP POLICY IF EXISTS "orders update kitchen" ON orders;
  DROP POLICY IF EXISTS "orders delete admin" ON orders;
END $$;

CREATE POLICY "customers read"
ON customers
FOR SELECT
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager')
);

CREATE POLICY "customers insert"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager')
);

CREATE POLICY "customers update"
ON customers
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager')
);

CREATE POLICY "customers delete"
ON customers
FOR DELETE
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

-- READ (admin, manager, kitchen)
CREATE POLICY "orders read"
ON orders
FOR SELECT
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager', 'kitchen')
);

-- INSERT (admin, manager)
CREATE POLICY "orders insert"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt()->'user_metadata'->>'role' IN ('admin', 'manager')
);

-- UPDATE FULL (admin)
CREATE POLICY "orders update admin"
ON orders
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

-- UPDATE STATUS ONLY (kitchen)
CREATE POLICY "orders update kitchen"
ON orders
FOR UPDATE
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'kitchen'
)
WITH CHECK (
  status IN ('pending', 'created', 'delivered', 'cancelled')
);

-- DELETE (admin only)
CREATE POLICY "orders delete admin"
ON orders
FOR DELETE
TO authenticated
USING (
  auth.jwt()->'user_metadata'->>'role' = 'admin'
);

CREATE POLICY "Kitchen can acknowledge orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'kitchen');
DROP POLICY IF EXISTS "Kitchen can acknowledge orders" ON public.orders;

DROP POLICY IF EXISTS "cake upload" ON storage.objects;
DROP POLICY IF EXISTS "cake read" ON storage.objects;

CREATE POLICY "cake upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cake-images'
);

CREATE POLICY "cake read"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cake-images'
);


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number :=
      'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;

CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();


-- 1️⃣ Create table safely
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gst_enabled BOOLEAN NOT NULL DEFAULT true,
  gst_percentage INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2️⃣ Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3️⃣ Drop policies if they already exist (PG14-safe)
DROP POLICY IF EXISTS "Allow authenticated read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow admin update app_settings" ON public.app_settings;

-- 4️⃣ Allow authenticated users to READ
CREATE POLICY "Allow authenticated read app_settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);



CREATE POLICY "Allow admin update app_settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);
-- 6️⃣ Insert exactly ONE row if empty
INSERT INTO public.app_settings (gst_enabled, gst_percentage)
SELECT true, 5
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);
