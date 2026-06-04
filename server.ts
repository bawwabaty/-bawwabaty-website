import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
const PORT = 3000;

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

const isProd = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "preview";
const DB_PATH = isProd ? path.join("/tmp", "travel-erp-v2.json") : path.join(process.cwd(), "travel-erp-v2.json");

// Initialize Firebase for Cloud Backup
let firestoreDb: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp(config);
    firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    console.log("Firebase initialized for persistent cloud storage backup.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase in server:", error);
}

// Helper to load DB
function loadDb() {
  const initialDb = {
    trips: [],
    clients: [],
    reservations: [],
    expenses: [],
    payments: [],
    cash_journal: [],
    audit_logs: []
  };

  if (!fs.existsSync(DB_PATH)) {
    saveDb(initialDb);
    return initialDb;
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return { ...initialDb, ...parsed };
  } catch (err) {
    console.error("Error reading DB:", err);
    return initialDb;
  }
}

// Helper to save DB with automated Cloud Backup
function saveDb(data: any) {
  const stringified = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(DB_PATH, stringified);
  } catch (error) {
    console.error(`Failed to write local database to ${DB_PATH}:`, error);
  }
  if (firestoreDb) {
    const docRef = doc(firestoreDb, "backups", "current");
    setDoc(docRef, { dbContent: stringified, updatedAt: new Date().toISOString() })
      .catch((error) => {
        console.error("Failed to sync database to cloud Firestore:", error);
      });
  }
}

// Helper for generic IDs
function getNextId(collection: any[]) {
  if (!collection || collection.length === 0) return 1;
  return Math.max(...collection.map((item: any) => parseInt(item.id) || 0)) + 1;
}

// Helper for generating refs
function generateRef(prefix: string) {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${randomStr}`;
}

// Helper for Audit logging
function logAudit(db: any, action: string, entity: string, entity_id: any, details: string = "") {
  db.audit_logs.push({
    id: getNextId(db.audit_logs),
    date: new Date().toISOString(),
    action,
    entity,
    entity_id,
    details
  });
}

// API Routes

app.get("/api/dashboard", (req, res) => {
  const db = loadDb();
  
  // Calculate chiffre d'affaires (confirmed reservations)
  const chiffre_d_affaires = db.reservations
    .filter((r: any) => r.status === 'Confirmée' && !r.deleted)
    .reduce((sum: number, r: any) => sum + (parseFloat(r.agreed_price) || 0), 0);

  const total_paiement = db.cash_journal
    .filter((j: any) => j.type === 'Encaissement')
    .reduce((sum: number, j: any) => sum + (parseFloat(j.amount) || 0), 0);
    
  const total_charges = db.cash_journal
    .filter((j: any) => j.type === 'Décaissement')
    .reduce((sum: number, j: any) => sum + (parseFloat(j.amount) || 0), 0);
    
  const rentabilite = total_paiement - total_charges;
  
  res.json({
    chiffre_d_affaires,
    total_paiement,
    total_charges,
    rentabilite
  });
});

app.get("/api/trips", (req, res) => {
  try {
    const db = loadDb();
    if (!db.trips) db.trips = [];
    const trips = db.trips.filter((t: any) => !t.deleted).map((trip: any) => {
      // Dynamic calculations
      const resvs = (db.reservations || []).filter((r: any) => r.trip_id == trip.id && !r.deleted && r.status !== 'Annulée-Restituée');
      const booked_seats = resvs.reduce((sum: number, r: any) => sum + (parseInt(r.seats) || 1), 0);
      const capacity = parseInt(trip.capacity) || 0;
      const remaining_seats = capacity - booked_seats;
      
      // Revenue from reservations
      const reservations_revenue = resvs.reduce((sum: number, r: any) => sum + (parseFloat(r.agreed_price) || 0), 0);
      
      // Expenses
      const trip_expenses = (db.expenses || []).filter((e: any) => e.trip_id == trip.id && !e.deleted)
        .reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
        
      const net_profit = reservations_revenue - trip_expenses;
      
      return {
        ...trip,
        booked_seats,
        remaining_seats,
        reservations_revenue,
        trip_expenses,
        net_profit
      };
    });
    res.json(trips);
  } catch (error: any) {
    console.error("GET TRIPS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch trips", details: error.message });
  }
});

app.post("/api/trips", (req, res) => {
  const db = loadDb();
  const trip = {
    ...req.body,
    id: getNextId(db.trips),
    deleted: false
  };
  db.trips.push(trip);
  logAudit(db, "CREATE", "TRIP", trip.id);
  saveDb(db);
  res.json(trip);
});

app.post("/api/trips/sync", (req, res) => {
  try {
    const db = loadDb();
    const pkg = req.body;
    if (!db.trips) db.trips = [];
    
    // Find trip referencing this package_id OR matching destination name
    let trip = db.trips.find((t: any) => !t.deleted && (t.package_id === pkg.id || t.destination === pkg.name));
    
    if (trip) {
      // Update existing trip in-place without changing its ID, preventing PNR references from breaking
      trip.destination = pkg.name;
      trip.capacity = parseInt(pkg.capacity) || trip.capacity || 50;
      trip.default_price = parseFloat(pkg.minPrice) || trip.default_price || 0;
      trip.image = pkg.image || trip.image;
      trip.package_id = pkg.id;
      logAudit(db, "UPDATE", "TRIP", trip.id, `Synced from package ${pkg.id}`);
    } else {
      // Create new trip linked to the package
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 14);
      
      trip = {
        id: getNextId(db.trips),
        code: `PKG-${today.getFullYear()}-${randomStr}`,
        destination: pkg.name,
        capacity: parseInt(pkg.capacity) || 50,
        default_price: parseFloat(pkg.minPrice) || 0,
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        image: pkg.image || '',
        package_id: pkg.id,
        deleted: false
      };
      db.trips.push(trip);
      logAudit(db, "CREATE", "TRIP", trip.id, `Created from package sync ${pkg.id}`);
    }
    
    saveDb(db);
    res.json(trip);
  } catch (error: any) {
    console.error("SYNC_ERROR_DETAILS:", error);
    res.status(500).json({ message: "Sync failed", details: error.message || String(error) });
  }
});

app.delete("/api/trips/sync/:packageId", (req, res) => {
  const db = loadDb();
  const packageId = req.params.packageId;
  const trip = db.trips.find((t: any) => t.package_id === packageId && !t.deleted);
  if (trip) {
    trip.deleted = true;
    logAudit(db, "DELETE", "TRIP", trip.id, `Deleted due to package deletion ${packageId}`);
    saveDb(db);
  }
  res.json({ success: true });
});

app.get("/api/trips/:id", (req, res) => {
  const db = loadDb();
  const trip = db.trips.find((t: any) => t.id == req.params.id && !t.deleted);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  
  const reservations = db.reservations.filter((r: any) => r.trip_id == trip.id && !r.deleted).map((r: any) => {
    const client = db.clients.find((c: any) => c.id == r.client_id) || {};
    return { ...r, client_name: client.full_name || r.client_name };
  });
  
  const expenses = db.expenses.filter((e: any) => e.trip_id == trip.id && !e.deleted);
  
  res.json({ ...trip, reservations, expenses });
});

app.post("/api/trips/calculate", (req, res) => {
  const { expected_expenses, profit_margin } = req.body;
  const exp = parseFloat(expected_expenses) || 0;
  const margin = parseFloat(profit_margin) || 0;
  
  const tva_sur_marge = margin * 0.20; // 20%
  const suggested_price = exp + margin + tva_sur_marge;
  
  res.json({
    expected_expenses: exp,
    profit_margin: margin,
    tva_sur_marge,
    suggested_price
  });
});

// Reservations
app.get("/api/reservations", (req, res) => {
  const db = loadDb();
  const reservations = db.reservations
    .filter((r: any) => !r.deleted)
    .map((r: any) => {
      const client = db.clients.find((c: any) => c.id == r.client_id) || {};
      const trip = db.trips.find((t: any) => t.id == r.trip_id) || {};
      const payments = db.payments.filter((p: any) => p.reservation_id == r.id && !p.deleted);
      const paid = payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
      const remain = (parseFloat(r.agreed_price) || 0) - paid;
      return {
        ...r,
        client,
        trip_code: trip.code || '-',
        trip_name: trip.destination || '',
        paid,
        remain
      };
    })
    .reverse(); // Latest first
  res.json(reservations);
});

app.post("/api/reservations", (req, res) => {
  const db = loadDb();
  const trip_id = req.body.trip_id;
  const trip = db.trips.find((t: any) => t.id == trip_id && !t.deleted);
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const seats = parseInt(req.body.seats) || 1;
  const resvs = db.reservations.filter((r: any) => r.trip_id == trip_id && !r.deleted && r.status !== 'Annulée-Restituée');
  const booked = resvs.reduce((sum: number, r: any) => sum + (parseInt(r.seats) || 1), 0);
  
  if (booked + seats > parseInt(trip.capacity)) {
    return res.status(400).json({ error: "لا يوجد سعة كافية في هذه الرحلة" });
  }
  
  // Handle client creation or selection
  let client_id = req.body.client_id;
  if (!client_id && req.body.client_name) { // Quick add
    client_id = getNextId(db.clients);
    db.clients.push({
      id: client_id,
      full_name: req.body.client_name,
      ref: generateRef('CLI'),
      deleted: false
    });
  }

  const reservation = {
    ...req.body,
    client_id,
    id: getNextId(db.reservations),
    reservation_code: generateRef('RES'),
    deleted: false
  };
  
  db.reservations.push(reservation);
  logAudit(db, "CREATE", "RESERVATION", reservation.id);
  saveDb(db);
  res.json(reservation);
});

app.put("/api/reservations/:id/status", (req, res) => {
  const db = loadDb();
  const rIdx = db.reservations.findIndex((r: any) => r.id == req.params.id);
  if (rIdx === -1) return res.status(404).json({ error: "Res not found" });
  
  const oldStatus = db.reservations[rIdx].status;
  const newStatus = req.body.status;
  db.reservations[rIdx].status = newStatus;
  
  if (newStatus === 'Annulée-Restituée' && oldStatus !== 'Annulée-Restituée') {
    // Check if client paid anything
    const payments = db.payments.filter((p: any) => p.reservation_id == req.params.id && !p.deleted);
    const paid = payments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
    
    if (paid > 0) {
      // Refund via cash journal
      const ref = generateRef('REFUND');
      db.cash_journal.push({
        id: getNextId(db.cash_journal),
        date: new Date().toISOString(),
        receipt_ref: ref,
        entity: 'Client Refund ' + req.params.id,
        type: 'Décaissement',
        amount: paid,
        payment_method: 'Cash',
        currency: 'MAD',
        entity_type: 'Reservation',
        entity_id: req.params.id
      });
      logAudit(db, "REFUND", "RESERVATION", req.params.id, `Refund amount: ${paid}`);
    }
  }
  
  logAudit(db, "UPDATE_STATUS", "RESERVATION", req.params.id, newStatus);
  saveDb(db);
  res.json(db.reservations[rIdx]);
});

// Expenses
app.get("/api/expenses", (req, res) => {
  const db = loadDb();
  const expenses = db.expenses.filter((e: any) => !e.deleted).map(e => {
    let trip = null;
    if (e.trip_id) {
       trip = db.trips.find((t: any) => t.id == e.trip_id) || null;
    }
    return { ...e, trip_code: trip ? trip.code : '-' };
  });
  res.json(expenses);
});

app.post("/api/expenses", (req, res) => {
  const db = loadDb();
  const expense = {
    ...req.body,
    id: getNextId(db.expenses),
    date: req.body.date || new Date().toISOString(),
    amount: parseFloat(req.body.amount) || 0,
    deleted: false
  };
  db.expenses.push(expense);
  
  if (req.body.pay_now) {
    db.cash_journal.push({
      id: getNextId(db.cash_journal),
      date: new Date().toISOString(),
      receipt_ref: generateRef('EXP'),
      entity: req.body.description || 'Expense',
      type: 'Décaissement',
      amount: expense.amount,
      payment_method: req.body.payment_method || 'Cash',
      currency: 'MAD',
      entity_type: 'Expense',
      entity_id: expense.id
    });
  }
  
  logAudit(db, "CREATE", "EXPENSE", expense.id);
  saveDb(db);
  res.json(expense);
});

// Cash Journal
app.post("/api/cash-journal", (req, res) => {
  const db = loadDb();
  const entry = {
    ...req.body,
    id: getNextId(db.cash_journal),
    date: req.body.date || new Date().toISOString(),
    receipt_ref: req.body.receipt_ref || generateRef('MANUAL')
  };
  db.cash_journal.push(entry);
  saveDb(db);
  res.json(entry);
});

app.get("/api/cash-journal", (req, res) => {
  const db = loadDb();
  let cumulative = 0;
  const journal = db.cash_journal.map((j: any) => {
    const amount = parseFloat(j.amount) || 0;
    if (j.type === 'Encaissement') {
      cumulative += amount;
    } else {
      cumulative -= amount;
    }
    return {
      ...j,
      solde_cumule: cumulative
    };
  }).reverse(); // Latest first, but cumulative calculated chronologically! Wait, if I use reverse, I need to order chronologically first.
  
  // So: sort by date asc, calc cumulative, then reverse
  const sorted = [...db.cash_journal].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let running = 0;
  const full = sorted.map((j: any) => {
    const amt = parseFloat(j.amount) || 0;
    running += (j.type === 'Encaissement' ? amt : -amt);
    return { ...j, solde_cumule: running };
  }).reverse();
  
  res.json(full);
});


// Vite / Frontend
async function startServer() {
  // Restore database from cloud backup first
  if (firestoreDb) {
    try {
      console.log("Checking Firestore for database backup...");
      const docRef = doc(firestoreDb, "backups", "current");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (cloudData && cloudData.dbContent) {
          fs.writeFileSync(DB_PATH, cloudData.dbContent, "utf-8");
          console.log("Successfully restored database from cloud Firestore backup.");
        }
      } else {
        console.log("No cloud database backup found. Starting fresh.");
      }
    } catch (error) {
      console.error("Error restoring database from cloud backup:", error);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
