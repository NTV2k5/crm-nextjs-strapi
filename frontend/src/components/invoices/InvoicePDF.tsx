/**
 * InvoicePDF — Professional enterprise invoice
 * ─────────────────────────────────────────────
 * Font: Noto Sans (Google Fonts CDN) — hỗ trợ đầy đủ tiếng Việt & ký hiệu ₫
 * Design: Modern two-tone header với accent bar, clean table, stamp-style status
 */
import React from 'react';
import {
  Page, Text, View, Document,
  StyleSheet, Font,
} from '@react-pdf/renderer';

// ── Font registration ───────────────────────────────────────────────────────
// Noto Sans TTF local — hỗ trợ tiếng Việt, ký hiệu ₫
// File nằm tại /public/fonts/ (đã tải về bằng script)
const isServer = typeof window === 'undefined';
const origin = isServer 
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') 
  : window.location.origin;
const FONT_BASE = `${origin}/fonts`;

Font.register({
  family: 'NotoSans',
  fonts: [
    { src: `${FONT_BASE}/NotoSans-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/NotoSans-Bold.ttf`, fontWeight: 700 },
  ],
});

// ── Colour palette ──────────────────────────────────────────────────────────
const C = {
  navy: '#0f2b5b',
  blue: '#1a56db',
  blueLight: '#dbeafe',
  slate: '#334155',
  muted: '#64748b',
  hairline: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff',
  green: '#16a34a',
  greenBg: '#f0fdf4',
};

// ── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 9,
    color: C.slate,
    backgroundColor: C.white,
  },

  // ── Accent bar ──
  accentBar: {
    height: 6,
    backgroundColor: C.blue,
  },

  // ── Navy header band ──
  headerBand: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingVertical: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  companyName: {
    fontWeight: 700,
    fontSize: 18,
    color: C.white,
    letterSpacing: 1,
  },
  companyTagline: {
    fontSize: 8,
    color: '#93c5fd',
    marginTop: 3,
  },
  invoiceLabelWrap: {
    alignItems: 'flex-end',
  },
  invoiceLabel: {
    fontSize: 26,
    fontWeight: 700,
    color: C.white,
    letterSpacing: 3,
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#93c5fd',
    marginTop: 4,
  },

  // ── Body ──
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 80, // leave room for footer
    flexGrow: 1,
  },

  // ── Meta row (Bill To / Payment Info) ──
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  metaBox: {
    width: '48%',
  },
  metaBoxRight: {
    width: '40%',
    alignItems: 'flex-end',
  },
  labelCap: {
    fontSize: 7,
    fontWeight: 700,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 700,
    color: C.navy,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 8.5,
    color: C.muted,
  },
  metaLine: {
    fontSize: 8.5,
    color: C.slate,
    marginBottom: 3,
    textAlign: 'right',
  },
  metaValue: {
    fontWeight: 700,
    color: C.navy,
  },

  // ── Status badge ──
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: C.greenBg,
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 700,
    color: C.green,
    letterSpacing: 1,
  },

  // ── Table ──
  table: {
    marginBottom: 24,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableHeadText: {
    fontSize: 8,
    fontWeight: 700,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  colDesc: { width: '55%' },
  colQty: { width: '15%', textAlign: 'center' },
  colUnit: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  cellText: {
    fontSize: 9,
    color: C.slate,
  },

  // ── Totals ──
  totalsWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  totalsBox: {
    width: '42%',
    borderWidth: 1,
    borderColor: C.hairline,
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  totalsLabel: {
    fontSize: 9,
    color: C.muted,
  },
  totalsValue: {
    fontSize: 9,
    color: C.slate,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.navy,
  },
  grandLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: C.white,
  },
  grandValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#93c5fd',
  },

  // ── Notes ──
  notesBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: C.blueLight,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
  },
  notesText: {
    fontSize: 8,
    color: '#1e40af',
    lineHeight: 1.6,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 8,
    color: '#93c5fd',
  },
  footerRight: {
    fontSize: 7,
    color: '#475569',
    textAlign: 'right',
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtVND(n: number): string {
  // Intl format cho PDF: dùng "VND" text để tránh lỗi ký tự ₫
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    // react-pdf render ₫ bị lỗi với Helvetica → dùng NotoSans nên OK
  }).format(n);
}

// ── Props ────────────────────────────────────────────────────────────────────
export interface InvoicePDFProps {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  dealTitle?: string;
  salespersonName?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  tax?: number; // VAT amount in VND
  vatPct?: number; // display percentage e.g. 10
  notes?: string;
  status?: 'PAID' | 'PENDING' | 'OVERDUE';
}

// ── Component ────────────────────────────────────────────────────────────────
export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoiceNumber,
  date,
  dueDate,
  customerName,
  customerEmail,
  dealTitle,
  salespersonName,
  companyName = 'CRM NEXT',
  companyAddress = '123 Cong Nghe St, District 1, Ho Chi Minh City',
  companyEmail = 'contact@crm.next',
  items,
  tax = 0,
  vatPct = 0,
  notes,
  status = 'PAID',
}) => {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = subtotal + tax;

  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    PAID: { bg: C.greenBg, border: '#86efac', text: C.green },
    PENDING: { bg: '#fefce8', border: '#fde047', text: '#854d0e' },
    OVERDUE: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
  };
  const sc = statusColors[status] ?? statusColors.PAID;

  return (
    <Document
      title={`Invoice ${invoiceNumber}`}
      author={companyName}
      creator="CRM Next"
    >
      <Page size="A4" style={S.page}>

        {/* ── Blue accent top bar ── */}
        <View style={S.accentBar} />

        {/* ── Navy header ── */}
        <View style={S.headerBand}>
          <View>
            <Text style={S.companyName}>{companyName}</Text>
            <Text style={S.companyTagline}>{companyAddress}</Text>
            <Text style={S.companyTagline}>{companyEmail}</Text>
          </View>
          <View style={S.invoiceLabelWrap}>
            <Text style={S.invoiceLabel}>HOA DON</Text>
            <Text style={S.invoiceNumber}>#{invoiceNumber}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={S.body}>

          {/* Meta row */}
          <View style={S.metaRow}>
            <View style={S.metaBox}>
              <Text style={S.labelCap}>Khach hang / Bill To</Text>
              <Text style={S.clientName}>{customerName}</Text>
              <Text style={S.clientEmail}>{customerEmail}</Text>
              {dealTitle && (
                <Text style={[S.clientEmail, { marginTop: 4, color: C.blue }]}>
                  Du an: {dealTitle}
                </Text>
              )}
              {salespersonName && (
                <Text style={[S.clientEmail, { marginTop: 4 }]}>
                  Nhan vien phu trach: {salespersonName}
                </Text>
              )}
            </View>

            <View style={S.metaBoxRight}>
              <Text style={S.labelCap}>Thong tin thanh toan</Text>
              <Text style={S.metaLine}>
                Ngay lap: <Text style={S.metaValue}>{date}</Text>
              </Text>
              <Text style={S.metaLine}>
                Han thanh toan: <Text style={S.metaValue}>{dueDate}</Text>
              </Text>
              <Text style={S.metaLine}>
                Ma hoa don: <Text style={S.metaValue}>{invoiceNumber}</Text>
              </Text>

              {/* Status badge */}
              <View style={[
                S.statusBadge,
                { backgroundColor: sc.bg, borderColor: sc.border },
              ]}>
                <Text style={[S.statusText, { color: sc.text }]}>
                  ● {status}
                </Text>
              </View>
            </View>
          </View>

          {/* Table */}
          <View style={S.table}>
            {/* Header */}
            <View style={S.tableHead}>
              <Text style={[S.tableHeadText, S.colDesc]}>Mo ta dich vu</Text>
              <Text style={[S.tableHeadText, S.colQty]}>SL</Text>
              <Text style={[S.tableHeadText, S.colUnit]}>Don gia</Text>
              <Text style={[S.tableHeadText, S.colTotal]}>Thanh tien</Text>
            </View>

            {/* Rows */}
            {items.map((item, i) => (
              <View
                key={i}
                style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}
              >
                <Text style={[S.cellText, S.colDesc]}>{item.description}</Text>
                <Text style={[S.cellText, S.colQty]}>{item.quantity}</Text>
                <Text style={[S.cellText, S.colUnit]}>{fmtVND(item.price)}</Text>
                <Text style={[S.cellText, S.colTotal]}>
                  {fmtVND(item.quantity * item.price)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={S.totalsWrap}>
            <View style={S.totalsBox}>
              <View style={S.totalsRow}>
                <Text style={S.totalsLabel}>Cong no (Subtotal)</Text>
                <Text style={S.totalsValue}>{fmtVND(subtotal)}</Text>
              </View>
              <View style={S.totalsRow}>
                <Text style={S.totalsLabel}>VAT ({vatPct}%)</Text>
                <Text style={S.totalsValue}>{fmtVND(tax)}</Text>
              </View>
              <View style={S.grandRow}>
                <Text style={S.grandLabel}>TONG CONG</Text>
                <Text style={S.grandValue}>{fmtVND(total)}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {notes && (
            <View style={S.notesBox}>
              <Text style={S.notesText}>{notes}</Text>
            </View>
          )}

          {/* Default note */}
          {!notes && (
            <View style={S.notesBox}>
              <Text style={S.notesText}>
                Cam on quy khach da tin tuong su dung dich vu cua chung toi.{'\n'}
                Hoa don nay duoc tao tu dong boi he thong CRM va co gia tri phap ly.{'\n'}
                Ho tro: {companyEmail}
              </Text>
            </View>
          )}

        </View>

        {/* ── Footer band ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerLeft}>
            {companyName} — {companyEmail}
          </Text>
          <Text style={S.footerRight}>
            Day la hoa don duoc tao tu dong.{'\n'}
            Vui long lien he neu co thac mac.
          </Text>
        </View>

      </Page>
    </Document>
  );
};
