import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const getApiUrl = (path: string) => {
  const cleanPath = path.replace(/^\/+/, "/");
  return cleanPath;
};

// Initial state for travel-erp database fallback
const getInitialState = () => ({
  trips: [
    {
      id: 1,
      code: "PKG-2026-CZWH",
      destination: "عمرة الصيف",
      capacity: 50,
      default_price: 14500,
      start_date: "2026-06-03",
      end_date: "2026-06-17",
      image: "https://res.cloudinary.com/dl7hgexkl/image/upload/v1716200000/umrah.jpg",
      package_id: "example-pkg-1",
      deleted: false
    }
  ],
  clients: [
    {
      id: 1,
      full_name: "أحمد بن علي",
      ref: "CLI-2026-ABCD",
      deleted: false
    }
  ],
  reservations: [
    {
      id: 1,
      trip_id: 1,
      client_id: 1,
      seats: 2,
      agreed_price: 29000,
      status: "Confirmée",
      reservation_code: "RES-2026-WXYZ",
      room_type: "ثنائي",
      pnr: "PNR-A12",
      notes: "قريب من الحرم",
      deleted: false
    }
  ],
  expenses: [
    {
      id: 1,
      trip_id: 1,
      amount: 4500,
      description: "حجز غرف الفندق الإضافية",
      type: "فندق",
      date: "2026-06-04",
      deleted: false
    }
  ],
  cash_journal: [
    {
      id: 1,
      date: "2026-06-04T12:00:00Z",
      receipt_ref: "MANUAL-2026-XY12",
      entity: "أحمد بن علي - دفعة العمرة",
      type: "Encaissement",
      amount: 29000,
      payment_method: "Cash",
      currency: "MAD",
      entity_type: "Reservation",
      entity_id: 1
    },
    {
      id: 2,
      date: "2026-06-04T14:00:00Z",
      receipt_ref: "EXP-2026-OP99",
      entity: "حجز غرف الفندق الإضافية",
      type: "Décaissement",
      amount: 4500,
      payment_method: "Cash",
      currency: "MAD",
      entity_type: "Expense",
      entity_id: 1
    }
  ],
  audit_logs: []
});

// Load DB from localStorage
function loadLocalDb(): any {
  const data = localStorage.getItem("travel_erp_supabase_fallback_v2");
  if (!data) {
    const fresh = getInitialState();
    localStorage.setItem("travel_erp_supabase_fallback_v2", JSON.stringify(fresh));
    return fresh;
  }
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Error parsing local database:", err);
    return getInitialState();
  }
}

// Save DB to localStorage
function saveLocalDb(db: any) {
  localStorage.setItem("travel_erp_supabase_fallback_v2", JSON.stringify(db));
}

// Push to Supabase with schema grace
async function pushToSupabase(table: string, record: any) {
  try {
    const { error } = await supabase.from(table).upsert(record);
    if (error) {
      console.warn(`Supabase table [${table}] upsert warning (might not exist):`, error.message);
    }
  } catch (err) {
    console.warn(`Supabase sync exception for table ${table}:`, err);
  }
}

// Delete from Supabase
async function pushDeleteToSupabase(table: string, id: any) {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
       console.warn(`Supabase table [${table}] delete warning:`, error.message);
    }
  } catch (err) {
    console.warn(`Supabase delete sync exception for table ${table}:`, err);
  }
}

// Load and dual-sync collections from Supabase if tables exist
async function syncCollection(table: string, localList: any[]): Promise<any[]> {
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (!error && Array.isArray(data)) {
      // If table exists, let's merge or use Supabase as the source of truth if populated
      if (data.length > 0) {
        return data;
      } else {
        // If Supabase table is empty, seed it with our local default list
        for (const item of localList) {
          await pushToSupabase(table, item);
        }
        return localList;
      }
    }
  } catch (err) {
    console.warn(`Supabase query failing for table ${table}, using local offline database fallback.`, err);
  }
  return localList;
}

// Shared Helpers for interceptor simulation
function getNextId(collection: any[]) {
  if (!collection || collection.length === 0) return 1;
  return Math.max(...collection.map((item: any) => parseInt(item.id) || 0)) + 1;
}

function generateRef(prefix: string) {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${randomStr}`;
}

// Sync all database state sequentially
async function fetchCompleteSyncState() {
  const db = loadLocalDb();
  db.trips = await syncCollection("trips", db.trips || []);
  db.clients = await syncCollection("clients", db.clients || []);
  db.reservations = await syncCollection("reservations", db.reservations || []);
  db.expenses = await syncCollection("expenses", db.expenses || []);
  db.cash_journal = await syncCollection("cash_journal", db.cash_journal || []);
  saveLocalDb(db);
  return db;
}

// Register fetch interceptor immediately on site load
const originalFetch = window.fetch;

export const apiFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
  
  if (urlStr.includes("/api/")) {
    const parsedUrl = new URL(urlStr, window.location.origin);
    const path = parsedUrl.pathname;
    const method = init?.method?.toUpperCase() || "GET";
    const bodyObj = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : null;

    console.log(`[API Interceptor] Intercepting ${method} ${path}`);
    
    // Auto sync from supabase on get endpoints, write-through to supabase or fallback
    const db = await fetchCompleteSyncState();

    try {
      // 1. GET /api/dashboard
      if (path === "/api/dashboard" && method === "GET") {
        const chiffre_d_affaires = (db.reservations || [])
          .filter((r: any) => r.status === 'Confirmée' && !r.deleted)
          .reduce((sum: number, r: any) => sum + (parseFloat(r.agreed_price) || 0), 0);

        const total_paiement = (db.cash_journal || [])
          .filter((j: any) => j.type === 'Encaissement')
          .reduce((sum: number, j: any) => sum + (parseFloat(j.amount) || 0), 0);
          
        const total_charges = (db.cash_journal || [])
          .filter((j: any) => j.type === 'Décaissement')
          .reduce((sum: number, j: any) => sum + (parseFloat(j.amount) || 0), 0);
          
        const rentabilite = total_paiement - total_charges;

        return new Response(JSON.stringify({ chiffre_d_affaires, total_paiement, total_charges, rentabilite }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 2. GET /api/trips
      if (path === "/api/trips" && method === "GET") {
        const trips = (db.trips || []).filter((t: any) => !t.deleted).map((trip: any) => {
          const resvs = (db.reservations || []).filter((r: any) => r.trip_id == trip.id && !r.deleted && r.status !== 'Annulée-Restituée');
          const booked_seats = resvs.reduce((sum: number, r: any) => sum + (parseInt(r.seats) || 1), 0);
          const capacity = parseInt(trip.capacity) || 0;
          const remaining_seats = capacity - booked_seats;
          const reservations_revenue = resvs.reduce((sum: number, r: any) => sum + (parseFloat(r.agreed_price) || 0), 0);
          
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

        return new Response(JSON.stringify(trips), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 3. POST /api/trips
      if (path === "/api/trips" && method === "POST") {
        const trip = {
          ...bodyObj,
          id: getNextId(db.trips),
          deleted: false
        };
        db.trips.push(trip);
        saveLocalDb(db);
        await pushToSupabase("trips", trip);

        return new Response(JSON.stringify(trip), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 4. POST /api/trips/sync
      if (path === "/api/trips/sync" && method === "POST") {
        const pkg = bodyObj;
        let trip = (db.trips || []).find((t: any) => !t.deleted && (t.package_id === pkg.id || t.destination === pkg.name));

        if (trip) {
          trip.destination = pkg.name;
          trip.capacity = parseInt(pkg.capacity) || trip.capacity || 50;
          trip.default_price = parseFloat(pkg.minPrice) || trip.default_price || 0;
          trip.image = pkg.image || trip.image;
          trip.package_id = pkg.id;
        } else {
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
        }

        saveLocalDb(db);
        await pushToSupabase("trips", trip);

        return new Response(JSON.stringify(trip), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 5. DELETE /api/trips/sync/:packageId
      if (path.startsWith("/api/trips/sync/") && method === "DELETE") {
        const packageId = path.split("/").pop();
        const trip = (db.trips || []).find((t: any) => t.package_id === packageId && !t.deleted);
        if (trip) {
          trip.deleted = true;
          saveLocalDb(db);
          await pushToSupabase("trips", trip);
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 6. GET /api/trips/:id
      if (path.startsWith("/api/trips/") && !path.endsWith("/sync") && !path.endsWith("/calculate") && method === "GET") {
        const tripId = path.split("/").pop();
        const trip = (db.trips || []).find((t: any) => t.id == tripId && !t.deleted);
        
        if (!trip) {
          return new Response(JSON.stringify({ error: "Trip not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

        const reservations = (db.reservations || []).filter((r: any) => r.trip_id == trip.id && !r.deleted).map((r: any) => {
          const client = (db.clients || []).find((c: any) => c.id == r.client_id) || {};
          return { ...r, client_name: client.full_name || r.client_name };
        });

        const expenses = (db.expenses || []).filter((e: any) => e.trip_id == trip.id && !e.deleted);

        return new Response(JSON.stringify({ ...trip, reservations, expenses }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 7. POST /api/trips/calculate
      if (path === "/api/trips/calculate" && method === "POST") {
        const { expected_expenses, profit_margin } = bodyObj;
        const exp = parseFloat(expected_expenses) || 0;
        const margin = parseFloat(profit_margin) || 0;
        const tva_sur_marge = margin * 0.20;
        const suggested_price = exp + margin + tva_sur_marge;

        return new Response(JSON.stringify({
          expected_expenses: exp,
          profit_margin: margin,
          tva_sur_marge,
          suggested_price
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 8. GET /api/reservations
      if (path === "/api/reservations" && method === "GET") {
        const resList = (db.reservations || [])
          .filter((r: any) => !r.deleted)
          .map((r: any) => {
            const client = (db.clients || []).find((c: any) => c.id == r.client_id) || {};
            const trip = (db.trips || []).find((t: any) => t.id == r.trip_id) || {};
            
            const pms = (db.cash_journal || []).filter((j: any) => j.type === 'Encaissement' && j.entity_type === 'Reservation' && j.entity_id == r.id);
            const paid = pms.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
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
          .reverse();

        return new Response(JSON.stringify(resList), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 9. POST /api/reservations
      if (path === "/api/reservations" && method === "POST") {
        const trip_id = bodyObj.trip_id;
        const trip = (db.trips || []).find((t: any) => t.id == trip_id && !t.deleted);
        if (!trip) {
          return new Response(JSON.stringify({ error: "Trip not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

        const seats = parseInt(bodyObj.seats) || 1;
        const resvs = (db.reservations || []).filter((r: any) => r.trip_id == trip_id && !r.deleted && r.status !== 'Annulée-Restituée');
        const booked = resvs.reduce((sum: number, r: any) => sum + (parseInt(r.seats) || 1), 0);

        if (booked + seats > parseInt(trip.capacity)) {
          return new Response(JSON.stringify({ error: "لا يوجد سعة كافية في هذه الرحلة" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        let client_id = bodyObj.client_id;
        if (!client_id && bodyObj.client_name) {
          client_id = getNextId(db.clients);
          const newClient = {
            id: client_id,
            full_name: bodyObj.client_name,
            phone: bodyObj.client_phone || '',
            ref: generateRef('CLI'),
            deleted: false
          };
          db.clients.push(newClient);
          await pushToSupabase("clients", newClient);
        }

        const reservation = {
          ...bodyObj,
          client_id,
          id: getNextId(db.reservations),
          reservation_code: generateRef('RES'),
          deleted: false
        };

        db.reservations.push(reservation);
        saveLocalDb(db);
        await pushToSupabase("reservations", reservation);

        // Register initial payment if paid_amount > 0
        const initialPayment = parseFloat(bodyObj.paid_amount) || 0;
        if (initialPayment > 0) {
          const paymentEntry = {
            id: getNextId(db.cash_journal),
            date: new Date().toISOString(),
            receipt_ref: generateRef('PAY'),
            entity: `${bodyObj.client_name || 'عميل'} - دفعة العمرة`,
            type: 'Encaissement',
            amount: initialPayment,
            payment_method: 'Cash',
            currency: 'MAD',
            entity_type: 'Reservation',
            entity_id: reservation.id
          };
          db.cash_journal.push(paymentEntry);
          saveLocalDb(db);
          await pushToSupabase("cash_journal", paymentEntry);
        }

        return new Response(JSON.stringify(reservation), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 10. PUT /api/reservations/:id/status
      if (path.startsWith("/api/reservations/") && path.endsWith("/status") && method === "PUT") {
        const idParts = path.split("/");
        const resId = idParts[idParts.length - 2];
        const rIdx = (db.reservations || []).findIndex((r: any) => r.id == resId);
        
        if (rIdx === -1) {
          return new Response(JSON.stringify({ error: "Reservation not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

        const oldStatus = db.reservations[rIdx].status;
        const newStatus = bodyObj.status;
        db.reservations[rIdx].status = newStatus;

        if (newStatus === 'Annulée-Restituée' && oldStatus !== 'Annulée-Restituée') {
          // Refund cash journal logic
          const pms = (db.cash_journal || []).filter((j: any) => j.type === 'Encaissement' && j.entity_type === 'Reservation' && j.entity_id == resId);
          const paid = pms.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

          if (paid > 0) {
            const ref = generateRef('REFUND');
            const refundEntry = {
              id: getNextId(db.cash_journal),
              date: new Date().toISOString(),
              receipt_ref: ref,
              entity: 'Client Refund ' + resId,
              type: 'Décaissement',
              amount: paid,
              payment_method: 'Cash',
              currency: 'MAD',
              entity_type: 'Reservation',
              entity_id: resId
            };
            db.cash_journal.push(refundEntry);
            await pushToSupabase("cash_journal", refundEntry);
          }
        }

        saveLocalDb(db);
        await pushToSupabase("reservations", db.reservations[rIdx]);

        return new Response(JSON.stringify(db.reservations[rIdx]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 11. GET /api/expenses
      if (path === "/api/expenses" && method === "GET") {
        const expenses = (db.expenses || []).filter((e: any) => !e.deleted).map((e: any) => {
          let trip = null;
          if (e.trip_id) {
            trip = (db.trips || []).find((t: any) => t.id == e.trip_id) || null;
          }
          return { ...e, trip_code: trip ? trip.code : '-' };
        });

        return new Response(JSON.stringify(expenses), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 12. POST /api/expenses
      if (path === "/api/expenses" && method === "POST") {
        const expense = {
          ...bodyObj,
          id: getNextId(db.expenses),
          date: bodyObj.date || new Date().toISOString(),
          amount: parseFloat(bodyObj.amount) || 0,
          deleted: false
        };
        db.expenses.push(expense);

        if (bodyObj.pay_now) {
          const expensePayment = {
            id: getNextId(db.cash_journal),
            date: new Date().toISOString(),
            receipt_ref: generateRef('EXP'),
            entity: bodyObj.description || 'Expense',
            type: 'Décaissement',
            amount: expense.amount,
            payment_method: bodyObj.payment_method || 'Cash',
            currency: 'MAD',
            entity_type: 'Expense',
            entity_id: expense.id
          };
          db.cash_journal.push(expensePayment);
          await pushToSupabase("cash_journal", expensePayment);
        }

        saveLocalDb(db);
        await pushToSupabase("expenses", expense);

        return new Response(JSON.stringify(expense), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 13. GET /api/cash-journal
      if (path === "/api/cash-journal" && method === "GET") {
        const sorted = [...(db.cash_journal || [])].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let running = 0;
        const full = sorted.map((j: any) => {
          const amt = parseFloat(j.amount) || 0;
          running += (j.type === 'Encaissement' ? amt : -amt);
          return { ...j, solde_cumule: running };
        }).reverse();

        return new Response(JSON.stringify(full), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 14. POST /api/cash-journal
      if (path === "/api/cash-journal" && method === "POST") {
        const entry = {
          ...bodyObj,
          id: getNextId(db.cash_journal),
          date: bodyObj.date || new Date().toISOString(),
          receipt_ref: bodyObj.receipt_ref || generateRef('MANUAL')
        };
        
        db.cash_journal.push(entry);
        saveLocalDb(db);
        await pushToSupabase("cash_journal", entry);

        return new Response(JSON.stringify(entry), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // DELETE endpoints
      if (path.startsWith("/api/reservations/") && !path.endsWith("/status") && !path.endsWith("/pay") && method === "DELETE") {
        const id = path.split("/").pop();
        const resv = (db.reservations || []).find((r: any) => r.id == id);
        if (resv) {
          resv.deleted = true;
          saveLocalDb(db);
          await pushToSupabase("reservations", resv);
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (path.startsWith("/api/reservations/") && path.endsWith("/pay") && method === "POST") {
        const idParts = path.split("/");
        const resId = idParts[idParts.length - 2];
        const resv = (db.reservations || []).find((r: any) => r.id == resId);
        
        if (!resv) {
          return new Response(JSON.stringify({ error: "Reservation not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

        const client = (db.clients || []).find((c: any) => c.id == resv.client_id);
        const clientName = client ? client.full_name : 'عميل';

        const paymentEntry = {
          id: getNextId(db.cash_journal),
          date: new Date().toISOString(),
          receipt_ref: generateRef('PAY'),
          entity: `${clientName} - دفعة المتبقي`,
          type: 'Encaissement',
          amount: parseFloat(bodyObj.amount) || 0,
          payment_method: 'Cash',
          currency: 'MAD',
          entity_type: 'Reservation',
          entity_id: resv.id
        };
        db.cash_journal.push(paymentEntry);
        saveLocalDb(db);
        await pushToSupabase("cash_journal", paymentEntry);

        return new Response(JSON.stringify(paymentEntry), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (path.startsWith("/api/expenses/") && method === "DELETE") {
        const id = path.split("/").pop();
        const exp = (db.expenses || []).find((e: any) => e.id == id);
        if (exp) {
          exp.deleted = true;
          saveLocalDb(db);
          await pushToSupabase("expenses", exp);
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (path.startsWith("/api/cash-journal/") && method === "DELETE") {
        const id = path.split("/").pop();
        // For cash journal, we just remove it entirely or filter deleted
        const idx = (db.cash_journal || []).findIndex((e: any) => e.id == id);
        if (idx !== -1) {
          db.cash_journal.splice(idx, 1);
          saveLocalDb(db);
          await pushDeleteToSupabase("cash_journal", id);
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

    } catch (err: any) {
      console.error("[Interceptor Route Processing Failed]", err);
      return new Response(JSON.stringify({ error: err.message || "Execution Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Default API fallback handler
    console.warn(`[API Interceptor] Unhandled URL intercepted: ${path}`);
    return new Response(JSON.stringify({ error: "Endpoint simulated successfully", requestedUrl: path }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return originalFetch.apply(this, arguments as any);
};

// Apply safest interceptor binding strategy
try {
  Object.defineProperty(window, "fetch", {
    value: apiFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
  console.log("[API Interceptor] Registered successfully via Object.defineProperty");
} catch (e) {
  console.warn("[API Interceptor] Failed to define window.fetch via Object.defineProperty, executing direct fallback:", e);
  try {
    (window as any).fetch = apiFetch;
  } catch (e2) {
    console.error("[API Interceptor] Critical: Failed to bind interceptor fetch totally:", e2);
  }
}

