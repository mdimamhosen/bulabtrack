import { supabase } from "@/integrations/supabase/client";

const FAKE_CUSTOMERS = [
  {
    name: "John Doe",
    email: "john.doe@gmail.com",
    phone: "+1 (555) 019-2834",
    address: "123 Academic Way",
    city: "Boston",
    postal_code: "02115",
  },
  {
    name: "Jane Smith",
    email: "jane.smith@mit.edu",
    phone: "+1 (555) 043-9821",
    address: "45 Innovation Blvd",
    city: "Cambridge",
    postal_code: "02139",
  },
  {
    name: "Alice Johnson",
    email: "alice.j@stanford.edu",
    phone: "+1 (555) 087-4321",
    address: "789 Campus Dr",
    city: "Stanford",
    postal_code: "94305",
  },
  {
    name: "Bob Brown",
    email: "bob.brown@berkeley.edu",
    phone: "+1 (555) 098-1122",
    address: "101 Euclid Ave",
    city: "Berkeley",
    postal_code: "94720",
  },
  {
    name: "Charlie Green",
    email: "c.green@cmu.edu",
    phone: "+1 (555) 022-8877",
    address: "5000 Forbes Ave",
    city: "Pittsburgh",
    postal_code: "15213",
  },
  {
    name: "Diana Prince",
    email: "diana.prince@harvard.edu",
    phone: "+1 (555) 055-6677",
    address: "86 Brattle St",
    city: "Cambridge",
    postal_code: "02138",
  },
  {
    name: "Evan Wright",
    email: "evan.wright@yale.edu",
    phone: "+1 (555) 077-4433",
    address: "246 Church St",
    city: "New Haven",
    postal_code: "06510",
  },
  {
    name: "Fiona Gallagher",
    email: "fiona.g@columbia.edu",
    phone: "+1 (555) 011-2233",
    address: "116th St & Broadway",
    city: "New York",
    postal_code: "10027",
  },
  {
    name: "George Costanza",
    email: "george@vandelay.com",
    phone: "+1 (555) 044-5566",
    address: "84th St & West End Ave",
    city: "New York",
    postal_code: "10024",
  },
  {
    name: "Hannah Abbott",
    email: "hannah@hogwarts.edu",
    phone: "+1 (555) 033-6699",
    address: "Hufflepuff Basement",
    city: "Hogsmeade",
    postal_code: "00777",
  },
];

export async function generateFakeOrdersAndCustomers() {
  // 1. Fetch devices to use in orders
  let { data: devices, error: devError } = await supabase.from("devices").select("id, name, price");
  if (devError) throw devError;

  if (!devices || devices.length === 0) {
    const mockDevices = [
      {
        name: "Mechanical Keyboard G-Pro",
        brand: "Logitech",
        model: "G-Pro X",
        category: "Input Device",
        price: 129.99,
        quantity: 15,
        serial_number: "SN-LOGI-KBD-001",
        status: "Available",
        interface: "USB-C",
      },
      {
        name: "Wireless Ergonomic Mouse",
        brand: "MX Master",
        model: "MX Master 3S",
        category: "Input Device",
        price: 99.99,
        quantity: 20,
        serial_number: "SN-MX-MSE-002",
        status: "Available",
        interface: "Bluetooth",
      },
      {
        name: 'UltraSharp 27" 4K Monitor',
        brand: "Dell",
        model: "U2723QE",
        category: "Output Device",
        price: 499.99,
        quantity: 8,
        serial_number: "SN-DELL-MON-003",
        status: "Available",
        interface: "HDMI / DisplayPort",
      },
      {
        name: "HD Stereo Webcam 1080p",
        brand: "Anker",
        model: "PowerConf C200",
        category: "Input Device",
        price: 59.99,
        quantity: 12,
        serial_number: "SN-ANK-CAM-004",
        status: "Available",
        interface: "USB-A",
      },
      {
        name: "LaserJet Pro Printer",
        brand: "HP",
        model: "M404dn",
        category: "Output Device",
        price: 249.99,
        quantity: 4,
        serial_number: "SN-HP-PRN-005",
        status: "Available",
        interface: "Ethernet / Wi-Fi",
      },
    ];

    const { error: insertDevError } = await supabase.from("devices").insert(mockDevices);
    if (insertDevError) throw insertDevError;

    const { data: refetched } = await supabase.from("devices").select("id, name, price");
    devices = refetched || [];
  }

  // 2. Generate orders
  const ordersToInsert = [];
  const itemsToInsert = [];

  const now = new Date();

  // Create 15 orders spread over the last 6 months
  for (let i = 0; i < 15; i++) {
    const customer = FAKE_CUSTOMERS[i % FAKE_CUSTOMERS.length];

    const createdDate = new Date();
    createdDate.setDate(now.getDate() - Math.floor(Math.random() * 180));
    createdDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

    // Pick a random status
    let status = "Delivered";
    const rand = Math.random();
    if (rand < 0.1) status = "Pending";
    else if (rand < 0.25) status = "Confirmed";
    else if (rand < 0.4) status = "Processing";
    else if (rand < 0.55) status = "Shipped";
    else if (rand < 0.9) status = "Delivered";
    else status = "Cancelled";

    const orderId = crypto.randomUUID();
    const datePrefix = `${createdDate.getFullYear()}${(createdDate.getMonth() + 1).toString().padStart(2, "0")}${createdDate.getDate().toString().padStart(2, "0")}`;
    const orderNumber = `ORD-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Select 1 to 4 random devices
    const numItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
    const selectedDevices = [];
    const usedDeviceIds = new Set<string>();

    while (selectedDevices.length < numItems) {
      const dev = devices[Math.floor(Math.random() * devices.length)];
      if (!usedDeviceIds.has(dev.id)) {
        usedDeviceIds.add(dev.id);
        selectedDevices.push(dev);
      }
    }

    let orderTotal = 0;
    const orderItems = selectedDevices.map((dev) => {
      const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 units
      const price = Number(dev.price);
      orderTotal += price * quantity;
      return {
        id: crypto.randomUUID(),
        order_id: orderId,
        device_id: dev.id,
        device_name: dev.name,
        unit_price: price,
        quantity,
        created_at: createdDate.toISOString(),
      };
    });

    const order = {
      id: orderId,
      order_number: orderNumber,
      customer_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postal_code: customer.postal_code,
      notes: Math.random() > 0.6 ? `Please ship to ${customer.city} academic lab office.` : null,
      total: orderTotal,
      status: status as any,
      created_at: createdDate.toISOString(),
      updated_at: createdDate.toISOString(),
    };

    ordersToInsert.push(order);
    itemsToInsert.push(...orderItems);
  }

  // Sort orders by created_at ascending so they insert chronologically
  ordersToInsert.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  // Insert into orders
  const { error: ordError } = await supabase.from("orders").insert(ordersToInsert as any);
  if (ordError) throw ordError;

  // Insert into order_items
  const { error: itemError } = await supabase.from("order_items").insert(itemsToInsert as any);
  if (itemError) throw itemError;

  return { orderCount: ordersToInsert.length, itemCount: itemsToInsert.length };
}

export async function clearAllOrders() {
  // Deleting all orders. RLS policy will allow authenticated admins to do so.
  const { error } = await supabase
    .from("orders")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes everything
  if (error) throw error;
}
