import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

// Parse .env manually
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes if any
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  }
} catch (err) {
  console.warn('Failed to parse .env file:', err);
}

import {
  connectDB,
  UserModel,
  DeviceModel,
  OrderModel,
  OrderItemModel,
  ContactMessageModel,
  AuditLogModel,
} from "../src/lib/db.server";

// Native Password Hashing Helpers
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function runSeed() {
  console.log("Connecting to Database...");
  await connectDB();
  console.log("Database connected. Starting seeding process...");

  try {
    // Clear collections
    console.log("Clearing collections...");
    await DeviceModel.deleteMany({});
    await OrderModel.deleteMany({});
    await OrderItemModel.deleteMany({});
    await AuditLogModel.deleteMany({});
    await ContactMessageModel.deleteMany({});
    
    // Delete all users except admin 'mdimam.cse9.bu@gmail.com'
    await UserModel.deleteMany({ email: { $ne: 'mdimam.cse9.bu@gmail.com' } });
    
    // Hash a default password
    const hashedPwd = hashPassword('password123');

    // Make sure admin exists
    const adminEmail = 'mdimam.cse9.bu@gmail.com';
    const adminExists = await UserModel.findOne({ email: adminEmail });
    if (!adminExists) {
      console.log(`Admin user ${adminEmail} not found. Creating it...`);
      await UserModel.create({
        _id: crypto.randomUUID(),
        name: "Admin User",
        email: adminEmail,
        password: hashedPwd,
        role: "admin",
        status: "active",
        needs_password_change: false,
        has_changed_password: true,
        phone: "+1 (555) 000-0000"
      });
      console.log("Admin user created with default password 'password123'");
    } else {
      console.log(`Admin user ${adminEmail} already exists, preserved.`);
    }

    // Seed staff
    console.log("Seeding staff accounts...");
    const staffList = [
      {
        _id: crypto.randomUUID(),
        name: "Sarah Jenkins",
        email: "sarah.j@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "active",
        needs_password_change: false,
        has_changed_password: true,
        phone: "+1 (555) 123-4567"
      },
      {
        _id: crypto.randomUUID(),
        name: "Michael Chen",
        email: "m.chen@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "active",
        needs_password_change: true,
        has_changed_password: false,
        phone: "+1 (555) 234-5678"
      },
      {
        _id: crypto.randomUUID(),
        name: "Emily Rodriguez",
        email: "emily.r@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "active",
        needs_password_change: false,
        has_changed_password: true,
        phone: "+1 (555) 345-6789"
      },
      {
        _id: crypto.randomUUID(),
        name: "David Kim",
        email: "d.kim@lab.edu",
        password: hashedPwd,
        role: "staff",
        status: "inactive",
        needs_password_change: false,
        has_changed_password: true,
        phone: "+1 (555) 456-7890"
      }
    ];
    await UserModel.insertMany(staffList);
    console.log(`Seeded ${staffList.length} staff members.`);

    // Seed customers
    console.log("Seeding customer accounts...");
    const customers = [
      { name: "Alice Johnson", email: "alice.j@stanford.edu", phone: "+1 (555) 087-4321", city: "Stanford", address: "789 Campus Dr", postal_code: "94305" },
      { name: "Bob Brown", email: "bob.brown@berkeley.edu", phone: "+1 (555) 098-1122", city: "Berkeley", address: "101 Euclid Ave", postal_code: "94720" },
      { name: "Charlie Green", email: "c.green@cmu.edu", phone: "+1 (555) 022-8877", city: "Pittsburgh", address: "5000 Forbes Ave", postal_code: "15213" },
      { name: "Diana Prince", email: "diana.prince@harvard.edu", phone: "+1 (555) 055-6677", city: "Cambridge", address: "86 Brattle St", postal_code: "02138" },
      { name: "Evan Wright", email: "evan.wright@yale.edu", phone: "+1 (555) 077-4433", city: "New Haven", address: "246 Church St", postal_code: "06510" },
      { name: "Fiona Gallagher", email: "fiona.g@columbia.edu", phone: "+1 (555) 011-2233", city: "New York", address: "116th St & Broadway", postal_code: "10027" },
      { name: "John Doe", email: "john.doe@gmail.com", phone: "+1 (555) 019-2834", city: "Boston", address: "123 Academic Way", postal_code: "02115" },
      { name: "Jane Smith", email: "jane.smith@mit.edu", phone: "+1 (555) 043-9821", city: "Cambridge", address: "45 Innovation Blvd", postal_code: "02139" },
      { name: "George Costanza", email: "george@vandelay.com", phone: "+1 (555) 044-5566", city: "New York", address: "84th St & West End Ave", postal_code: "10024" },
      { name: "Hannah Abbott", email: "hannah@hogwarts.edu", phone: "+1 (555) 033-6699", city: "Hogsmeade", address: "Hufflepuff Basement", postal_code: "00777" },
      { name: "Peter Parker", email: "peter.parker@columbia.edu", phone: "+1 (555) 777-8888", city: "New York", address: "Ingram St, Forest Hills", postal_code: "11375" },
      { name: "Bruce Wayne", email: "bruce.wayne@gotham.edu", phone: "+1 (555) 999-0000", city: "Gotham", address: "1007 Mountain Drive", postal_code: "53540" },
      { name: "Clark Kent", email: "clark.kent@metropolis.edu", phone: "+1 (555) 111-2222", city: "Metropolis", address: "344 Clinton St, Apt 3B", postal_code: "62960" },
      { name: "Tony Stark", email: "tony.stark@mit.edu", phone: "+1 (555) 330-0880", city: "Malibu", address: "10880 El Medio St", postal_code: "90265" },
      { name: "Steve Rogers", email: "steve.rogers@nyu.edu", phone: "+1 (555) 191-8045", city: "Brooklyn", address: "569 Corona Avenue", postal_code: "11201" }
    ];

    const customerUsers = customers.map(c => ({
      _id: crypto.randomUUID(),
      name: c.name,
      email: c.email,
      password: hashedPwd,
      role: "customer",
      status: "active",
      needs_password_change: false,
      has_changed_password: true,
      phone: c.phone
    }));
    await UserModel.insertMany(customerUsers);
    console.log(`Seeded ${customerUsers.length} customer accounts.`);

    // Seed devices
    console.log("Seeding devices...");
    const SEED_DEVICES = [
      {
        name: "Logitech G Pro Mechanical Keyboard",
        brand: "Logitech",
        model: "G Pro X",
        category: "Input Device",
        price: 129.99,
        quantity: 25,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Logitech Direct",
        serial_number: "SN-KBD-GPX-001",
        warranty_expiry: new Date("2028-12-31"),
        purchase_date: new Date("2025-06-15"),
        description: "Compact tenkeyless gaming keyboard with hot-swappable pro-grade switches.",
        image_url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Keychron K2 Wireless Keyboard",
        brand: "Keychron",
        model: "K2 V2",
        category: "Input Device",
        price: 99.99,
        quantity: 15,
        status: "Available",
        location: "Lab Room 102",
        supplier: "Keychron Corp",
        serial_number: "SN-KBD-KK2-002",
        warranty_expiry: new Date("2027-10-01"),
        purchase_date: new Date("2025-08-20"),
        description: "75% layout tactile mechanical keyboard with wireless and wired connections.",
        image_url: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "SteelSeries Apex Pro Keyboard",
        brand: "SteelSeries",
        model: "Apex Pro",
        category: "Input Device",
        price: 199.99,
        quantity: 10,
        status: "Available",
        location: "Lab Room 101",
        supplier: "SteelSeries Inc",
        serial_number: "SN-KBD-ASP-003",
        warranty_expiry: new Date("2029-01-15"),
        purchase_date: new Date("2025-09-10"),
        description: "Full-sized mechanical keyboard featuring OmniPoint adjustable mechanical switches.",
        image_url: "https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "MX Master 3S Wireless Mouse",
        brand: "Logitech",
        model: "MX Master 3S",
        category: "Input Device",
        price: 99.99,
        quantity: 30,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Logitech Direct",
        serial_number: "SN-MSE-MXM-004",
        warranty_expiry: new Date("2028-06-30"),
        purchase_date: new Date("2025-07-01"),
        description: "Ergonomic workspace mouse with 8K DPI tracking and quiet clicks.",
        image_url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Logitech G502 Hero Gaming Mouse",
        brand: "Logitech",
        model: "G502 Hero",
        category: "Input Device",
        price: 59.99,
        quantity: 40,
        status: "Available",
        location: "Lab Room 103",
        supplier: "Logitech Direct",
        serial_number: "SN-MSE-G50-005",
        warranty_expiry: new Date("2027-05-15"),
        purchase_date: new Date("2025-05-10"),
        description: "High performance gaming mouse with HERO 25K optical sensor and adjustable weights.",
        image_url: "https://images.unsplash.com/photo-1625842268584-8f3290455655?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Razer DeathAdder V3 Mouse",
        brand: "Razer",
        model: "DeathAdder V3",
        category: "Input Device",
        price: 69.99,
        quantity: 20,
        status: "Available",
        location: "Lab Room 102",
        supplier: "Razer Store",
        serial_number: "SN-MSE-RDV-006",
        warranty_expiry: new Date("2028-02-28"),
        purchase_date: new Date("2025-08-15"),
        description: "Ultra-lightweight ergonomic wired mouse for competitive gameplay.",
        image_url: "https://images.unsplash.com/photo-1613141411244-0e4ac259d217?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Dell UltraSharp 27\" 4K Monitor",
        brand: "Dell",
        model: "U2723QE",
        category: "Output Device",
        price: 499.99,
        quantity: 12,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Dell Business",
        serial_number: "SN-MON-DU4-007",
        warranty_expiry: new Date("2030-06-15"),
        purchase_date: new Date("2025-06-10"),
        description: "27-inch 4K USB-C hub monitor with IPS Black technology and 98% DCI-P3 color gamut.",
        image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "LG UltraFine 5K 27\" Display",
        brand: "LG",
        model: "27MD5KL-B",
        category: "Output Device",
        price: 1299.99,
        quantity: 5,
        status: "Available",
        location: "Lab Room 104",
        supplier: "LG Electronics",
        serial_number: "SN-MON-LGU-008",
        warranty_expiry: new Date("2029-09-01"),
        purchase_date: new Date("2025-09-01"),
        description: "27-inch 5K IPS monitor optimized for macOS with Thunderbolt 3 compatibility.",
        image_url: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "ASUS ROG Swift 360Hz Monitor",
        brand: "ASUS",
        model: "PG259QN",
        category: "Output Device",
        price: 379.99,
        quantity: 8,
        status: "Available",
        location: "Lab Room 103",
        supplier: "ASUS Direct",
        serial_number: "SN-MON-ARG-009",
        warranty_expiry: new Date("2028-11-20"),
        purchase_date: new Date("2025-11-15"),
        description: "24.5-inch FHD Fast IPS gaming monitor with 360Hz refresh rate and G-SYNC.",
        image_url: "https://images.unsplash.com/photo-1585790050230-5ad28404ccb9?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Sony WH-1000XM4 Noise Canceling Headset",
        brand: "Sony",
        model: "WH-1000XM4",
        category: "Accessories",
        price: 348.00,
        quantity: 15,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Sony Store",
        serial_number: "SN-AUD-SXM-010",
        warranty_expiry: new Date("2027-12-31"),
        purchase_date: new Date("2025-06-20"),
        description: "Premium over-ear noise-canceling wireless headphones with built-in mic.",
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Bose QuietComfort Headphones",
        brand: "Bose",
        model: "QC45",
        category: "Accessories",
        price: 329.00,
        quantity: 10,
        status: "Available",
        location: "Lab Room 102",
        supplier: "Bose Corp",
        serial_number: "SN-AUD-BQC-011",
        warranty_expiry: new Date("2028-08-01"),
        purchase_date: new Date("2025-08-05"),
        description: "Wireless noise-canceling headphones with legendary acoustic performance.",
        image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Shure SM7B Vocal Microphone",
        brand: "Shure",
        model: "SM7B",
        category: "Input Device",
        price: 399.00,
        quantity: 8,
        status: "Available",
        location: "Lab Room 105",
        supplier: "Shure Music",
        serial_number: "SN-AUD-SSM-012",
        warranty_expiry: new Date("2029-04-15"),
        purchase_date: new Date("2025-04-10"),
        description: "Dynamic cardioid studio microphone for broadcast, podcast, and recording.",
        image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Elgato Facecam 1080p Webcam",
        brand: "Elgato",
        model: "Facecam",
        category: "Input Device",
        price: 149.99,
        quantity: 18,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Elgato Direct",
        serial_number: "SN-VID-EFC-013",
        warranty_expiry: new Date("2027-12-01"),
        purchase_date: new Date("2025-11-20"),
        description: "Pro-grade webcam with studio-quality glass lens and high-speed CMOS sensor.",
        image_url: "https://images.unsplash.com/photo-1603184017968-9ee23a4f89d9?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Anker PowerExpand 8-in-1 USB Hub",
        brand: "Anker",
        model: "A8383",
        category: "Accessories",
        price: 79.99,
        quantity: 25,
        status: "Available",
        location: "Lab Room 101",
        supplier: "Anker Store",
        serial_number: "SN-ACC-APH-014",
        warranty_expiry: new Date("2027-06-30"),
        purchase_date: new Date("2025-06-25"),
        description: "USB-C data hub with Power Delivery, HDMI, Ethernet, and SD card readers.",
        image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "SanDisk Extreme Portable SSD 1TB",
        brand: "SanDisk",
        model: "Extreme 1TB",
        category: "Storage",
        price: 109.99,
        quantity: 35,
        status: "Available",
        location: "Lab Room 102",
        supplier: "SanDisk Dist",
        serial_number: "SN-STG-SDE-015",
        warranty_expiry: new Date("2028-09-01"),
        purchase_date: new Date("2025-09-05"),
        description: "Rugged high-speed external solid state drive with up to 1050MB/s read speeds.",
        image_url: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=500&q=80",
      },
      {
        name: "Google Nest Audio Smart Speaker",
        brand: "Google",
        model: "Nest Audio",
        category: "Output Device",
        price: 99.00,
        quantity: 15,
        status: "Available",
        location: "Lab Room 106",
        supplier: "Google Store",
        serial_number: "SN-AUD-GNA-016",
        warranty_expiry: new Date("2027-07-15"),
        purchase_date: new Date("2025-07-10"),
        description: "Smart speaker with room-filling sound and Google Assistant integration.",
        image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=500&q=80",
      }
    ];

    const devices = SEED_DEVICES.map(d => ({
      ...d,
      _id: crypto.randomUUID(),
    }));
    const createdDevices = await DeviceModel.insertMany(devices);
    console.log(`Seeded ${createdDevices.length} devices.`);

    // Seed orders & order items spread over the last 6 months
    const now = new Date();
    const ordersToInsert = [];
    const orderItemsToInsert = [];

    // Create 60 orders
    console.log("Generating 60 mock orders...");
    for (let i = 0; i < 60; i++) {
      const customer = customers[i % customers.length];
      
      // Distribute dates over the last 6 months
      let monthOffset = 0;
      if (i < 5) monthOffset = 5;
      else if (i < 12) monthOffset = 4;
      else if (i < 21) monthOffset = 3;
      else if (i < 32) monthOffset = 2;
      else if (i < 46) monthOffset = 1;
      else monthOffset = 0;

      const orderDate = new Date();
      orderDate.setMonth(now.getMonth() - monthOffset);
      orderDate.setDate(Math.floor(Math.random() * 28) + 1);
      orderDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      let status = "Delivered";
      const rand = Math.random();
      if (rand < 0.08) status = "Pending";
      else if (rand < 0.15) status = "Confirmed";
      else if (rand < 0.25) status = "Processing";
      else if (rand < 0.35) status = "Shipped";
      else if (rand < 0.9) status = "Delivered";
      else status = "Cancelled";

      const orderId = crypto.randomUUID();
      const datePrefix = `${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, "0")}${orderDate.getDate().toString().padStart(2, "0")}`;
      const orderNumber = `ORD-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Select 1 to 3 random devices
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const selectedDevs = [];
      const usedIds = new Set();

      while (selectedDevs.length < itemsCount) {
        const dev = createdDevices[Math.floor(Math.random() * createdDevices.length)];
        if (!usedIds.has(dev._id)) {
          usedIds.add(dev._id);
          selectedDevs.push(dev);
        }
      }

      let orderTotal = 0;
      for (const dev of selectedDevs) {
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = Number(dev.price);
        orderTotal += price * qty;

        orderItemsToInsert.push({
          _id: crypto.randomUUID(),
          order_id: orderId,
          device_id: dev._id,
          device_name: dev.name,
          unit_price: price,
          quantity: qty,
          created_at: orderDate
        });
      }

      ordersToInsert.push({
        _id: orderId,
        order_number: orderNumber,
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postal_code: customer.postal_code,
        notes: Math.random() > 0.75 ? "Please drop at Lab 202 main office." : null,
        total: orderTotal,
        status,
        created_at: orderDate,
        updated_at: orderDate
      });
    }

    await OrderModel.insertMany(ordersToInsert);
    await OrderItemModel.insertMany(orderItemsToInsert);
    console.log(`Seeded ${ordersToInsert.length} orders and ${orderItemsToInsert.length} order items.`);

    // Seed audit logs
    console.log("Seeding audit logs...");
    const auditLogs = [
      { action: "Database Seeded", details: "Cleared inventory database and populated clean mock dataset", created_at: new Date() },
      { action: "Staff Created", details: "Created staff account for Michael Chen", created_at: new Date(Date.now() - 3600000) },
      { action: "Staff Created", details: "Created staff account for Sarah Jenkins", created_at: new Date(Date.now() - 7200000) },
      { action: "Device Added", details: "Added Elgato Facecam 1080p Webcam to Lab Room 101", created_at: new Date(Date.now() - 10800000) },
      { action: "Device Added", details: "Added Shure SM7B Vocal Microphone to Lab Room 105", created_at: new Date(Date.now() - 14400000) }
    ];
    await AuditLogModel.insertMany(auditLogs.map(l => ({ ...l, _id: crypto.randomUUID() })));
    console.log("Seeded audit logs.");

    console.log("Database Seeding Completed Successfully!");
  } catch (err) {
    console.error("Database seeding failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

runSeed();
