
-- Order status enum
CREATE TYPE public.order_status AS ENUM ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled');

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  notes text,
  total numeric NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  device_name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can add order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Contact messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT INSERT ON public.contact_messages TO anon;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete contact" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Allow public to read devices (for storefront)
CREATE POLICY "Public can view devices" ON public.devices FOR SELECT TO anon USING (true);
GRANT SELECT ON public.devices TO anon;

-- Seed additional devices
INSERT INTO public.devices (name, brand, model, category, price, quantity, interface, status, supplier, location, serial_number, description, image_url) VALUES
('MX Master 3S Wireless Mouse','Logitech','MX Master 3S','Input Device',119.99,10,'Bluetooth','Available','Logitech Store','Lab A','LG-MX3S-001','Ergonomic wireless mouse with silent clicks and 8K DPI.','https://images.unsplash.com/photo-1527814050087-3793815479db?w=600'),
('G102 Lightsync Gaming Mouse','Logitech','G102','Input Device',29.99,25,'USB','Available','Logitech Store','Lab B','LG-G102-002','Gaming mouse with 8000 DPI sensor and RGB lighting.','https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600'),
('USB Wired Keyboard KB216','Dell','KB216','Input Device',19.99,30,'USB','Available','Dell Inc','Lab A','DL-KB216-003','Standard full-size USB keyboard.','https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600'),
('Wired Keyboard K120','HP','K120','Input Device',17.50,28,'USB','Available','HP Inc','Lab C','HP-K120-004','Spill-resistant wired keyboard.','https://images.unsplash.com/photo-1561112078-7d24e04c3407?w=600'),
('K552 Mechanical Keyboard','Redragon','K552','Input Device',39.99,15,'USB','Available','Redragon','Lab B','RD-K552-005','Compact TKL mechanical keyboard with red switches.','https://images.unsplash.com/photo-1595225476474-87563907a212?w=600'),
('BlackWidow V4 Mechanical Keyboard','Razer','BWV4','Input Device',169.99,8,'USB','Available','Razer','Lab D','RZ-BWV4-006','Premium gaming mechanical keyboard.','https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600'),
('L3210 EcoTank Printer','Epson','L3210','Output Device',229.00,5,'USB','Available','Epson','Lab A','EP-L3210-007','All-in-one ink tank printer.','https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600'),
('PIXMA G3010 Printer','Canon','G3010','Output Device',249.00,6,'Wireless','Available','Canon','Lab C','CN-G3010-008','Wireless MegaTank inkjet printer.','https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600'),
('LaserJet Pro MFP M428','HP','M428','Output Device',499.00,3,'Ethernet','Available','HP Inc','Lab D','HP-M428-009','Monochrome laser multifunction printer.','https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600'),
('HL-L2321D Mono Laser','Brother','HL-L2321D','Output Device',189.00,4,'USB','Available','Brother','Lab B','BR-2321D-010','Compact mono laser printer with duplex.','https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600'),
('24-inch FHD Monitor S24R350','Samsung','S24R350','Output Device',179.00,12,'HDMI','Available','Samsung','Lab A','SM-S24R-011','24" IPS FHD monitor 75Hz.','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'),
('P2422H Professional Monitor','Dell','P2422H','Output Device',289.00,10,'HDMI','Available','Dell Inc','Lab B','DL-P2422-012','24" Full HD IPS USB-C hub monitor.','https://images.unsplash.com/photo-1547119957-637f8679db1e?w=600'),
('34WN80C UltraWide Monitor','LG','34WN80C','Output Device',549.00,4,'HDMI','Available','LG','Lab D','LG-34WN-013','34" UltraWide QHD USB-C monitor.','https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600'),
('Nitro VG240Y Gaming Monitor','Acer','VG240Y','Output Device',169.00,6,'HDMI','Available','Acer','Lab C','AC-VG240-014','24" FHD 165Hz IPS gaming monitor.','https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600'),
('C920 HD Pro Webcam','Logitech','C920','Input Device',79.99,15,'USB','Available','Logitech','Lab A','LG-C920-015','1080p Full HD webcam with stereo audio.','https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600'),
('PK-940H FHD Webcam','A4Tech','PK-940H','Input Device',32.00,18,'USB','Available','A4Tech','Lab B','A4-PK940-016','1080p webcam with auto-focus.','https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600'),
('Pebble V2 Computer Speakers','Creative','Pebble V2','Output Device',29.99,20,'USB','Available','Creative','Lab C','CR-PBV2-017','USB-C powered desktop speakers 8W RMS.','https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600'),
('Wave 200 Speakers','JBL','Wave 200','Output Device',59.00,12,'Bluetooth','Available','JBL','Lab A','JBL-W200-018','Compact wireless speaker.','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'),
('Cloud Stinger Headset','HyperX','Cloud Stinger','Output Device',49.99,14,'Audio Jack','Available','HyperX','Lab B','HX-CLDS-019','Lightweight gaming headset with 50mm drivers.','https://images.unsplash.com/photo-1591105575633-922c8897af9e?w=600'),
('H390 USB Headset','Logitech','H390','Output Device',39.99,16,'USB','Available','Logitech','Lab D','LG-H390-020','USB headset with noise-canceling mic.','https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'),
('Archer T2U USB WiFi Adapter','TP-Link','T2U','Input Device',15.99,30,'USB','Available','TP-Link','Lab A','TP-T2U-021','AC600 dual-band wireless USB adapter.','https://images.unsplash.com/photo-1518770660439-4636190af475?w=600'),
('USB Bluetooth 5.0 Dongle','TP-Link','UB500','Input Device',12.99,40,'USB','Available','TP-Link','Lab C','TP-UB500-022','Nano Bluetooth USB adapter.','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'),
('External DVD Writer','LG','GP65NB60','Input Device',32.00,10,'USB','Available','LG','Lab B','LG-GP65-023','Slim external USB DVD-RW drive.','https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600'),
('7-Port USB 3.0 Hub','Anker','A7516','Input Device',29.99,18,'USB','Available','Anker','Lab A','AN-7516-024','USB 3.0 powered hub with 7 ports.','https://images.unsplash.com/photo-1625948515291-69613efd103f?w=600'),
('4K HDMI 3-in-1 Switch','UGREEN','CM217','Input Device',19.99,15,'HDMI','Available','UGREEN','Lab D','UG-CM217-025','3-in-1-out 4K HDMI switch.','https://images.unsplash.com/photo-1601524909162-ae8725290836?w=600'),
('Barcode Scanner CT10','Honeywell','CT10','Input Device',89.00,8,'USB','Available','Honeywell','Lab B','HW-CT10-026','1D/2D handheld barcode scanner.','https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600'),
('Fingerprint Scanner U.are.U 4500','DigitalPersona','U4500','Input Device',129.00,6,'USB','Available','DigitalPersona','Lab A','DP-U4500-027','Optical USB fingerprint reader.','https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600'),
('Smart-UPS 1500VA','APC','SMT1500','Output Device',579.00,4,'USB','Available','APC','Lab D','APC-1500-028','Line-interactive 1500VA UPS.','https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600'),
('T7 Portable SSD 1TB','Samsung','MU-PC1T0T','Output Device',119.00,10,'USB','Available','Samsung','Lab C','SM-T7-029','1TB USB 3.2 portable SSD up to 1050MB/s.','https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600'),
('DataTraveler 128GB USB','Kingston','DT100G3','Output Device',14.50,50,'USB','Available','Kingston','Lab A','KG-DT128-030','128GB USB 3.0 flash drive.','https://images.unsplash.com/photo-1618410320928-25228d811631?w=600');
