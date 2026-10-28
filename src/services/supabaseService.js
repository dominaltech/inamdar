import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { isKitchenItem } from '../data/menuService';

// 1. Fetch all restaurant dining tables and their active dishes
export async function fetchLiveTables() {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: tablesData, error: tablesErr } = await supabase
      .from('tables')
      .select('*')
      .order('id');

    if (tablesErr) {
      console.warn('Supabase fetchLiveTables error:', tablesErr);
      return null;
    }

    // Fetch active order items
    const { data: itemsData, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (itemsErr) {
      console.warn('Supabase fetch order_items error:', itemsErr);
      return null;
    }

    // Map items to their respective tables
    const itemsByTable = {};
    (itemsData || []).forEach(it => {
      const tblId = it.table_id;
      if (!itemsByTable[tblId]) itemsByTable[tblId] = [];
      itemsByTable[tblId].push({
        id: it.id,
        code: it.item_code,
        name: it.item_name,
        qty: Number(it.qty),
        rate: Number(it.rate),
        amount: Number(it.amount),
        category: it.category,
        categoryOrder: it.category_order,
        customization: it.customization || '',
        isStaged: it.is_staged,
        isCancelled: it.is_cancelled,
        kotNo: it.kot_number,
        status: it.status,
      });
    });

    const tablesMap = {};
    (tablesData || []).forEach(tbl => {
      const activeItems = itemsByTable[tbl.id] || [];
      tablesMap[tbl.id] = {
        id: tbl.id,
        section: tbl.section,
        waiter: tbl.active_waiter || '1 COUNTER',
        status: tbl.status || 'AVAILABLE',
        pax: tbl.pax || 2,
        kotNos: tbl.kot_nos || [],
        items: activeItems,
      };
    });

    return tablesMap;
  } catch (err) {
    console.warn('fetchLiveTables exception:', err);
    return null;
  }
}

// 1B. Fetch active items for a single specific table (Delta fetch, zero full DB re-fetch)
export async function fetchOrderItemsForTable(tableId) {
  if (!isSupabaseConfigured() || !tableId) return [];

  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('table_id', String(tableId))
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(it => ({
      id: it.id,
      code: it.item_code,
      name: it.item_name,
      qty: Number(it.qty),
      rate: Number(it.rate),
      amount: Number(it.amount),
      category: it.category,
      categoryOrder: it.category_order,
      customization: it.customization || '',
      isStaged: it.is_staged,
      isCancelled: it.is_cancelled,
      kotNo: it.kot_number,
      status: it.status,
    }));
  } catch (err) {
    console.warn(`fetchOrderItemsForTable(${tableId}) error:`, err);
    return [];
  }
}

// 1C. Fetch items for a specific KOT (Delta fetch from Captain PWA)
export async function fetchOrderItemsForKot(kotId) {
  if (!isSupabaseConfigured() || !kotId) return [];

  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('kot_id', kotId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn(`fetchOrderItemsForKot(${kotId}) error:`, err);
    return [];
  }
}

// 2. Fetch Unsettled Bills
export async function fetchLiveUnsettledBills() {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('status', 'UNSETTLED')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchLiveUnsettledBills error:', error);
      return null;
    }

    return (data || []).map(b => ({
      table: b.table_id,
      billNo: String(b.bill_no),
      amount: Number(b.total_amount),
      id: b.id,
      time: b.bill_time,
    }));
  } catch (err) {
    console.warn('fetchLiveUnsettledBills exception:', err);
    return null;
  }
}

// 3. Fetch Daily Transactions for Today's Sales
export async function fetchLiveDailyTransactions() {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('daily_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchLiveDailyTransactions error:', error);
      return null;
    }

    return (data || []).map(t => ({
      id: t.id,
      billNo: t.bill_no,
      tableId: t.table_id,
      amount: Number(t.amount),
      paymentMode: t.payment_mode,
      time: t.settled_time,
      timestamp: new Date(t.created_at).getTime(),
    }));
  } catch (err) {
    console.warn('fetchLiveDailyTransactions exception:', err);
    return null;
  }
}

// 4. Fetch Daily Sequential Counters (KOT and Bill)
export async function fetchLiveCounters() {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('pos_counters')
      .select('*');

    if (error) {
      console.warn('fetchLiveCounters error:', error);
      return null;
    }

    const result = { kotCounter: 1, billCounter: 1 };
    (data || []).forEach(row => {
      if (row.counter_key === 'daily_kot_counter') result.kotCounter = Number(row.counter_val);
      if (row.counter_key === 'daily_bill_counter') result.billCounter = Number(row.counter_val);
    });

    return result;
  } catch (err) {
    console.warn('fetchLiveCounters exception:', err);
    return null;
  }
}

// 5. Fire KOT and Save Items into Supabase
export async function fireKotInSupabase({ tableId, section, waiterName, kotNumber, items, source = 'POS_COUNTER' }) {
  if (!isSupabaseConfigured()) return null;

  try {
    // A. Insert KOT Header
    const { data: kotRecord, error: kotErr } = await supabase
      .from('kots')
      .insert([{
        kot_number: kotNumber,
        table_id: tableId,
        section: section,
        waiter_name: waiterName,
        department: 'ALL',
        source: source,
        status: 'PENDING'
      }])
      .select()
      .single();

    if (kotErr) throw kotErr;

    // B. Insert Order Items (with kitchen vs pantry flag)
    const itemsPayload = items.map(it => ({
      kot_id: kotRecord.id,
      kot_number: kotNumber,
      table_id: tableId,
      item_code: String(it.code),
      item_name: it.name,
      qty: Number(it.qty),
      rate: Number(it.rate),
      amount: Number(it.amount),
      category: it.category || 'UNCATEGORIZED',
      category_order: it.categoryOrder ?? 99,
      customization: it.customization || '',
      department: isKitchenItem(it) ? 'KITCHEN' : 'PANTRY',
      is_staged: false,
      is_cancelled: false,
      status: 'PENDING'
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsPayload);

    if (itemsErr) throw itemsErr;

    // C. Update Table status to OCCUPIED and append KOT number
    const { data: tableData } = await supabase
      .from('tables')
      .select('kot_nos')
      .eq('id', tableId)
      .single();

    const existingKots = tableData?.kot_nos || [];
    const updatedKots = Array.from(new Set([...existingKots, kotNumber]));

    await supabase
      .from('tables')
      .update({
        status: 'OCCUPIED',
        active_waiter: waiterName,
        kot_nos: updatedKots,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId);

    // D. Increment daily KOT counter
    await supabase
      .from('pos_counters')
      .update({ counter_val: kotNumber + 1 })
      .eq('counter_key', 'daily_kot_counter');

    return kotRecord;
  } catch (err) {
    console.error('fireKotInSupabase error:', err);
    return null;
  }
}

// 6. Generate Cash Memo (Billing) in Supabase
export async function saveBillInSupabase(billData) {
  if (!isSupabaseConfigured()) return null;

  try {
    const payload = {
      bill_no: billData.billNo,
      table_id: billData.tableNo,
      section: billData.section,
      employee_no: billData.employeeNo || '1',
      subtotal: billData.totalAmount,
      discount: 0,
      tax: 0,
      total_amount: billData.totalAmount,
      total_items: billData.totalItems,
      total_qty: billData.totalQty,
      status: 'UNSETTLED',
      bill_date: billData.date,
      bill_time: billData.time,
      items_json: billData.items,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bills')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    // Increment bill counter
    await supabase
      .from('pos_counters')
      .update({ counter_val: billData.billNo + 1 })
      .eq('counter_key', 'daily_bill_counter');

    return data;
  } catch (err) {
    console.error('saveBillInSupabase error:', err);
    return null;
  }
}

// 7. Settle Bill in Supabase (Direct Amount Settlement)
export async function settleBillInSupabase({ tableId, billNo, amount, paymentMode, cashierName = '1. Operator' }) {
  if (!isSupabaseConfigured()) return null;

  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // A. Update Bill status to SETTLED
    if (billNo) {
      await supabase
        .from('bills')
        .update({
          status: 'SETTLED',
          payment_mode: paymentMode,
          cashier_name: cashierName,
          settled_at: now.toISOString()
        })
        .eq('bill_no', Number(billNo));
    }

    // B. Insert into Daily Transactions
    await supabase
      .from('daily_transactions')
      .insert([{
        bill_no: String(billNo || '0'),
        table_id: tableId,
        amount: Number(amount),
        payment_mode: paymentMode,
        cashier_name: cashierName,
        settled_time: timeStr
      }]);

    // C. Free the Table (status = AVAILABLE) and clear active order items
    await supabase
      .from('tables')
      .update({
        status: 'AVAILABLE',
        kot_nos: [],
        updated_at: now.toISOString()
      })
      .eq('id', tableId);

    // Delete table items to keep order_items clean for future sessions
    await supabase
      .from('order_items')
      .delete()
      .eq('table_id', tableId);

    return true;
  } catch (err) {
    console.error('settleBillInSupabase error:', err);
    return false;
  }
}

// 8. Order Item Cancellation with Audit Log in Supabase
export async function cancelItemInSupabase({ tableId, itemCode, itemName, qty, rate, reason, authorizedBy, kotNumber }) {
  if (!isSupabaseConfigured()) return null;

  try {
    const cancelQty = -Math.abs(Number(qty) || 1);
    const cancelAmount = cancelQty * rate;

    // A. Insert negative row in order_items
    await supabase
      .from('order_items')
      .insert([{
        table_id: tableId,
        kot_number: kotNumber || 0,
        item_code: String(itemCode),
        item_name: itemName,
        qty: cancelQty,
        rate: rate,
        amount: cancelAmount,
        category: 'CANCELLED',
        category_order: 99,
        is_staged: false,
        is_cancelled: true,
        cancel_reason: reason,
        authorized_by: authorizedBy,
        status: 'CANCELLED'
      }]);

    // B. Insert into cancellations_audit
    await supabase
      .from('cancellations_audit')
      .insert([{
        table_id: tableId,
        kot_number: kotNumber || 0,
        item_code: String(itemCode),
        item_name: itemName,
        qty: Math.abs(Number(qty)),
        rate: rate,
        reason: reason,
        authorized_by: authorizedBy
      }]);

    return true;
  } catch (err) {
    console.error('cancelItemInSupabase error:', err);
    return false;
  }
}

// 9. Table Shift in Supabase (Transfer all items to destination)
export async function transferTableInSupabase(fromTableId, toTableId) {
  if (!isSupabaseConfigured()) return null;

  try {
    // Move all items from source table to target table
    await supabase
      .from('order_items')
      .update({ table_id: toTableId })
      .eq('table_id', fromTableId);

    // Free source table
    await supabase
      .from('tables')
      .update({ status: 'AVAILABLE', kot_nos: [], updated_at: new Date().toISOString() })
      .eq('id', fromTableId);

    // Occupy target table
    await supabase
      .from('tables')
      .update({ status: 'OCCUPIED', updated_at: new Date().toISOString() })
      .eq('id', toTableId);

    return true;
  } catch (err) {
    console.error('transferTableInSupabase error:', err);
    return false;
  }
}

// 10. End of Day Close in Supabase (Reset Daily Counters)
export async function closeDayInSupabase() {
  if (!isSupabaseConfigured()) return null;

  try {
    await supabase
      .from('pos_counters')
      .update({ counter_val: 1, last_reset_date: new Date().toISOString().split('T')[0] })
      .in('counter_key', ['daily_kot_counter', 'daily_bill_counter']);

    return true;
  } catch (err) {
    console.error('closeDayInSupabase error:', err);
    return false;
  }
}

// 11. Realtime Sync Listener (Subscribes to Captain orders, Table updates, and KDS changes)
export function subscribeToSupabaseRealtime({ onTableUpdate, onIncomingKot, onBillUpdate }) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel('pos_realtime_hub')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
      if (onTableUpdate) onTableUpdate(payload);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kots' }, payload => {
      if (onIncomingKot) onIncomingKot(payload.new);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, payload => {
      if (onBillUpdate) onBillUpdate(payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, payload => {
      // Menu changes propagate live
      console.log('Realtime Menu update:', payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// 12. Fetch Dynamic Menu Items from Supabase
export async function fetchLiveMenuItems() {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category_order', { ascending: true });

    if (error) {
      console.warn('fetchLiveMenuItems error:', error);
      return null;
    }

    return (data || []).map(row => ({
      code: String(row.code),
      name: (row.name || '').toUpperCase(),
      category: row.category || 'UNCATEGORIZED',
      categoryOrder: Number(row.category_order) || 99,
      acRate: Number(row.ac_rate) || 0,
      hallRate: Number(row.hall_rate) || Number(row.ac_rate) || 0,
      isKitchen: row.is_kitchen ?? true,
      isAvailable: row.is_available ?? true,
    }));
  } catch (err) {
    console.warn('fetchLiveMenuItems exception:', err);
    return null;
  }
}

// 13. Save / Upsert Menu Item in Supabase
export async function saveMenuItemInSupabase(item) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .upsert({
        code: String(item.code),
        name: (item.name || '').toUpperCase(),
        category: item.category || 'UNCATEGORIZED',
        category_order: Number(item.categoryOrder) || 99,
        ac_rate: Number(item.acRate) || 0,
        hall_rate: Number(item.hallRate) || Number(item.acRate) || 0,
        is_kitchen: item.isKitchen ?? true,
        is_available: item.isAvailable ?? true,
      }, { onConflict: 'code' })
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('saveMenuItemInSupabase error:', err);
    return null;
  }
}

// 14. Fetch Credit Accounts
export async function fetchLiveCreditAccounts() {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('credit_accounts')
      .select('*')
      .order('customer_name', { ascending: true });

    if (error) {
      console.warn('fetchLiveCreditAccounts error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('fetchLiveCreditAccounts exception:', err);
    return null;
  }
}

// 15. Record Audit Action in Supabase
export async function logAuditActionInSupabase({ actionType, details, tableId, billNo, operatorName = '1. Operator' }) {
  if (!isSupabaseConfigured()) return null;

  try {
    await supabase.from('audit_logs').insert([{
      action_type: actionType,
      details: details,
      table_id: tableId ? String(tableId) : null,
      bill_no: billNo ? String(billNo) : null,
      operator_name: operatorName,
    }]);
  } catch (err) {
    console.warn('logAuditActionInSupabase exception:', err);
  }
}

