-- Migration: Update RLS policies to filter orders by outlet_id for manager/kitchen users
-- Admin can see all orders, manager/kitchen can only see their assigned outlet's orders

-- Helper function to get user's role (checks user_profiles first, then user_metadata)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
      auth.jwt()->'user_metadata'->>'role'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's outlet_id from user_profiles
CREATE OR REPLACE FUNCTION public.get_user_outlet_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT outlet_id 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing orders policies
DROP POLICY IF EXISTS "orders read" ON orders;
DROP POLICY IF EXISTS "orders insert" ON orders;
DROP POLICY IF EXISTS "orders update admin" ON orders;
DROP POLICY IF EXISTS "orders update kitchen" ON orders;
DROP POLICY IF EXISTS "orders delete admin" ON orders;

-- READ: Admin sees all, manager/kitchen see only their outlet
CREATE POLICY "orders read"
ON orders
FOR SELECT
TO authenticated
USING (
  -- Admin can see all orders
  (public.get_user_role() = 'admin')
  OR
  -- Manager/Kitchen can only see orders from their assigned outlet
  (
    public.get_user_role() IN ('manager', 'kitchen')
    AND outlet_id = public.get_user_outlet_id()
  )
);

-- INSERT: Admin and manager can insert orders (filtered by outlet_id in application)
CREATE POLICY "orders insert"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role() IN ('admin', 'manager')
);

-- UPDATE FULL: Admin can update anything
CREATE POLICY "orders update admin"
ON orders
FOR UPDATE
TO authenticated
USING (
  public.get_user_role() = 'admin'
);

-- UPDATE STATUS ONLY: Kitchen can update status for their outlet's orders
CREATE POLICY "orders update kitchen"
ON orders
FOR UPDATE
TO authenticated
USING (
  public.get_user_role() = 'kitchen'
  AND outlet_id = public.get_user_outlet_id()
)
WITH CHECK (
  status IN ('pending', 'created', 'delivered', 'cancelled')
);

-- DELETE: Admin only
CREATE POLICY "orders delete admin"
ON orders
FOR DELETE
TO authenticated
USING (
  public.get_user_role() = 'admin'
);
