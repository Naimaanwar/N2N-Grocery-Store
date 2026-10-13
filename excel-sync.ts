
import 'dotenv/config';
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';

const API_URL = process.env.RENDER_API_URL;
const SYNC_KEY = process.env.EXCEL_SYNC_KEY;
const EXCEL_FILE = 'D:\\excel\\N2N-Grocery-Products-Template (1).xlsx';
const INTERVAL_MS = 5000;

if (!API_URL || !SYNC_KEY) {
  throw new Error('RENDER_API_URL ya EXCEL_SYNC_KEY missing hai.');
}

async function syncExcel() {
  try {
    const response = await fetch(`${API_URL}/api/excel-sync`, {
      headers: { 'x-excel-sync-key': SYNC_KEY! }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as {
      products: Record<string, unknown>[];
      orders: Record<string, unknown>[];
    };

    if (!fs.existsSync(EXCEL_FILE)) {
      throw new Error(`Excel file nahi mili: ${EXCEL_FILE}`);
    }

    const workbook = XLSX.readFile(EXCEL_FILE);

    const productRows = data.products.map((p) => ({
      name: p.name ?? '',
      price: p.price ?? '',
      category: p.category ?? '',
      unit: p.unit ?? '',
      stock: p.stock ?? '',
      image: p.image ?? ''
    }));

    const orderRows = data.orders.map((o) => ({
      orderNumber: o.orderNumber ?? o.order_number ?? '',
      date: o.createdAt ?? o.created_at ?? '',
      customerName: o.customerName ?? o.customer_name ?? '',
      phone: o.phone ?? o.customerPhone ?? o.customer_phone ?? '',
      address: o.address ?? o.customerAddress ?? o.customer_address ?? '',
      city: o.city ?? '',
      paymentMethod: o.paymentMethod ?? o.payment_method ?? '',
      items: typeof o.items === 'string' ? o.items : JSON.stringify(o.items ?? []),
      total: o.total ?? '',
      status: o.status ?? '',
      locked: o.locked ?? false
    }));

    workbook.Sheets['Products'] = XLSX.utils.json_to_sheet(productRows, {
      header: ['name', 'price', 'category', 'unit', 'stock', 'image']
    });

    workbook.Sheets['Orders'] = XLSX.utils.json_to_sheet(orderRows, {
      header: [
        'orderNumber', 'date', 'customerName', 'phone', 'address',
        'city', 'paymentMethod', 'items', 'total', 'status', 'locked'
      ]
    });

    if (!workbook.SheetNames.includes('Orders')) {
      workbook.SheetNames.push('Orders');
    }

    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log(
      `${new Date().toLocaleTimeString()} — Products: ${productRows.length}, Orders: ${orderRows.length}`
    );
  } catch (error) {
    console.error(
      `${new Date().toLocaleTimeString()} — Sync failed:`,
      error instanceof Error ? error.message : error
    );
  }
}

console.log('N2N Excel sync start ho raha hai...');
console.log(`Excel: ${path.resolve(EXCEL_FILE)}`);
await syncExcel();
setInterval(syncExcel, INTERVAL_MS);