import { Customer } from '@/hooks/useCustomers';

const STATUS_MAP: Record<string, string> = {
  lead: 'Tiềm năng',
  consulting: 'Đang tư vấn',
  closed: 'Đã chốt hợp đồng',
  former: 'Khách hàng cũ',
};

const SOURCE_MAP: Record<string, string> = {
  facebook: 'Facebook',
  google: 'Google',
  referral: 'Giới thiệu',
  other: 'Khác',
};

/**
 * Converts the customer list to a UTF-8 CSV string and triggers a download.
 * Includes a BOM so that Excel opens the file with correct Vietnamese encoding.
 */
export function exportCustomersCsv(customers: Customer[], filename = 'khach-hang') {
  const headers = ['Tên', 'Email', 'Số điện thoại', 'Công ty', 'Trạng thái', 'Nguồn', 'Ngày tạo'];

  const rows = customers.map(c => {
    const created = c.createdAt
      ? new Date(c.createdAt).toLocaleDateString('vi-VN')
      : '';
    return [
      c.name,
      c.email,
      c.phone || '',
      c.company || '',
      STATUS_MAP[c.status] || c.status,
      SOURCE_MAP[c.source || 'other'] || c.source || '',
      created,
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // UTF-8 BOM for proper Vietnamese character support in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
