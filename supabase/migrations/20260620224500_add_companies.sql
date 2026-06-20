-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and setup policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to companies" ON public.companies 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage companies" ON public.companies 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grant permissions
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT ALL ON public.companies TO service_role;

-- Seed companies from existing brands in the devices table
INSERT INTO public.companies (name)
SELECT DISTINCT brand FROM public.devices
ON CONFLICT (name) DO NOTHING;

-- Add company_id column to devices table
ALTER TABLE public.devices ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Link existing devices to companies based on brand matching name
UPDATE public.devices d
SET company_id = c.id
FROM public.companies c
WHERE d.brand = c.name;

-- Create trigger function to automatically link or create companies when device brand is set
CREATE OR REPLACE FUNCTION public.handle_device_company_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comp_id uuid;
BEGIN
  -- Find or insert the company based on the device's brand
  INSERT INTO public.companies (name)
  VALUES (TRIM(NEW.brand))
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO comp_id;
  
  -- Set company_id on the device
  NEW.company_id := comp_id;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_device_company_link
  BEFORE INSERT OR UPDATE OF brand ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_device_company_link();

-- Enforce the constraint at database level: company_id must not be null
ALTER TABLE public.devices ALTER COLUMN company_id SET NOT NULL;
