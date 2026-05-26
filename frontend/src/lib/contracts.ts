import { strapiFetch, unwrap } from './strapi';

interface AutoContractParams {
  customerId: string;
  customerName: string;
  dealTitle: string;
  dealValue: number;
  dealId?: string;
  assignedTo: string;
  userId: string;
  userEmail: string;
}

export function spellVietnameseNumber(n: number): string {
  if (n === 0) return 'Không đồng';
  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function spellUnderThousand(num: number, isFirstGroup: boolean): string {
    let str = '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (h > 0 || !isFirstGroup) {
      str += digits[h] + ' trăm ';
    }

    if (t > 0) {
      if (t === 1) str += 'mười ';
      else str += digits[t] + ' mươi ';
    } else if (u > 0 && (h > 0 || !isFirstGroup)) {
      str += 'lẻ ';
    }

    if (u > 0) {
      if (u === 1 && t > 1) str += 'mốt';
      else if (u === 5 && t > 0) str += 'lăm';
      else str += digits[u];
    }

    return str.trim();
  }

  let result = '';
  let temp = n;
  let groupIdx = 0;
  let groups: number[] = [];

  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    const val = groups[i];
    if (val > 0) {
      const spelled = spellUnderThousand(val, i === groups.length - 1);
      result += ' ' + spelled + units[i];
    }
  }

  return result.trim().charAt(0).toUpperCase() + result.trim().slice(1) + ' đồng chẵn';
}

export function generateDefaultContractContent({
  contractNumber,
  customerName,
  dealTitle,
  dealValue,
  startDate,
  endDate,
}: {
  contractNumber: string;
  customerName: string;
  dealTitle: string;
  dealValue: number;
  startDate: string;
  endDate: string;
}) {
  const formattedValue = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dealValue);
  const valueInWords = spellVietnameseNumber(dealValue);

  return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---------------***---------------

HỢP ĐỒNG DỊCH VỤ THƯƠNG MẠI
(Số: ${contractNumber})

- Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam số 91/2015/QH13 ngày 24/11/2015;
- Căn cứ Luật Thương mại nước Cộng hòa Xã hội Chủ nghĩa Việt Nam số 36/2005/QH11 ngày 14/06/2005;
- Căn cứ nhu cầu và khả năng thực tế của hai Bên.

Hôm nay, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}, tại văn phòng chúng tôi gồm các bên:

BÊN A (Khách hàng): ${customerName}
- Người đại diện: Ông/Bà ___________________________
- Chức vụ: Giám đốc
- Địa chỉ trụ sở: _____________________________________
- Điện thoại: ________________________________________
- Mã số thuế: ________________________________________

BÊN B (Đơn vị cung cấp): CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ SỐ CRM
- Người đại diện: Ông Nguyễn Tấn Việt
- Chức vụ: Tổng Giám Đốc
- Địa chỉ: Tầng 3, Block A, 145, đường số 10 khu phức hợp La Astoria, Phường An Phú, Quận 2, TP. Thủ Đức, Thành phố Hồ Chí Minh
- Mã số thuế: 3703675679
- Số tài khoản: 0000000001 tại Ngân hàng TPBank - Chi nhánh Sài Gòn.

Hai Bên cùng thống nhất giao kết Hợp đồng dịch vụ thương mại với các điều khoản cụ thể sau đây:

ĐIỀU 1: NỘI DUNG CÔNG VIỆC VÀ PHẠM VI DỊCH VỤ
Bên B đồng ý cung cấp, triển khai gói sản phẩm/dịch vụ sau đây cho Bên A:
- Tên dịch vụ/sản phẩm: ${dealTitle}
- Chi tiết triển khai: Cấu hình hệ thống, đào tạo sử dụng, tối ưu hóa quy trình nghiệp vụ và cung cấp dịch vụ phần mềm hỗ trợ khách hàng liên tục.

ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN
1. Tổng giá trị Hợp đồng: ${formattedValue} (Bằng chữ: ${valueInWords}).
   (Giá trên đã bao gồm toàn bộ thuế GTGT và phí dịch vụ liên quan).
2. Phương thức thanh toán: Chuyển khoản qua ngân hàng vào tài khoản của Bên B được nêu ở phần thông tin đại diện.
3. Tiến độ thanh toán:
   - Đợt 1: Bên A thanh toán 50% giá trị Hợp đồng tương đương ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dealValue * 0.5)} ngay sau khi ký kết Hợp đồng.
   - Đợt 2: Bên A thanh toán 50% còn lại ngay sau khi nghiệm thu và bàn giao toàn bộ sản phẩm dịch vụ.

ĐIỀU 3: THỜI HẠN THỰC HIỆN
- Hợp đồng có hiệu lực từ ngày ${startDate} và kết thúc vào ngày ${endDate}.
- Tiến độ triển khai chi tiết sẽ do đại diện hai Bên thống nhất bằng văn bản phụ lục.

ĐIỀU 4: QUYỀN VÀ NGHĨA VỤ CỦA CÁC BÊN
1. Bên A có nghĩa vụ cung cấp thông tin kỹ thuật và thanh toán đầy đủ, đúng hạn cho Bên B.
2. Bên B có nghĩa vụ hoàn thành dịch vụ đúng chất lượng, bảo mật toàn bộ dữ liệu của Bên A và hỗ trợ vận hành bảo hành trong vòng 12 tháng kể từ ngày bàn giao.

ĐIỀU 5: ĐIỀU KHOẢN CHUNG & CHỮ KÝ XÁC NHẬN
1. Hai bên cam kết thực hiện đúng các điều khoản đã ghi trong Hợp đồng này. Mọi phát sinh thay đổi phải được lập thành phụ lục Hợp đồng bằng văn bản có chữ ký của đại diện hai bên.
2. Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để thực hiện.

             ĐẠI DIỆN BÊN A                                   ĐẠI DIỆN BÊN B
          (Ký tên và đóng dấu)                             (Ký tên và đóng dấu)
`;
}

export async function autoCreateContractFromDeal({
  customerId,
  customerName,
  dealTitle,
  dealValue,
  dealId,
  assignedTo,
  userId,
  userEmail,
}: AutoContractParams) {
  // Generate automatic contract number HĐ-YYYY-XXXX
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const contractNumber = `HĐ-${year}-${rand}`;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(startDate.getFullYear() + 1); // 1 year term by default

  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate.toISOString().split('T')[0];

  // Auto-generate rich contract legal content!
  const content = generateDefaultContractContent({
    contractNumber,
    customerName,
    dealTitle,
    dealValue,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
  });

  const contractData = {
    contractNumber,
    title: `HĐ tự động - ${dealTitle}`,
    value: dealValue,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    status: 'draft',
    notes: `Hợp đồng nháp được tự động khởi tạo từ Deal "${dealTitle}" đã chốt thành công.`,
    content,
    fileUrl: '',
    fileName: '',
    // Relational field bindings in Strapi
    customer: customerId,
    deal: dealId || undefined,
    assignedTo: assignedTo || userId,
  };

  const res = await strapiFetch('/contracts', {
    method: 'POST',
    body: JSON.stringify({ data: contractData }),
  });

  const savedContract = unwrap<any>(res);
  const contractDocId = savedContract.documentId || savedContract.id;

  // Log audit trail to Strapi
  await strapiFetch('/audit-logs', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        action: 'CREATE_CONTRACT',
        entityId: String(contractDocId),
        entityName: contractNumber,
        performedByEmail: userEmail || 'system',
        performedByUid: String(userId) || 'system',
        details: `Hệ thống tự động khởi tạo Hợp đồng nháp ${contractNumber} từ Deal chốt thành công: ${dealTitle}`,
        metadata: { dealTitle, dealValue, contractNumber }
      }
    }),
  }).catch(e => console.error('Audit Log Error:', e));

  return contractNumber;
}

export function printContract(contract: {
  contractNumber: string;
  title: string;
  value: number;
  startDate: any;
  endDate: any;
  customerName: string;
  content: string;
}) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Không thể mở cửa sổ in. Vui lòng cho phép popup trên trình duyệt.');
    return;
  }

  // Parse structure line by line to support centering and beautiful columns
  const rawContent = contract.content || 'Chưa có nội dung chi tiết.';
  const lines = rawContent.split('\n');
  const processedLines: string[] = [];
  let isInsideSignatures = false;
  let passedTitle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineClean = line.replace(/\s+/g, ' ');

    if (!lineClean) {
      if (!passedTitle) {
        continue;
      }
      processedLines.push('');
      continue;
    }

    if (lineClean === 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM') {
      processedLines.push(`<div class="text-center font-bold" style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">${line}</div>`);
    } else if (lineClean === 'Độc lập - Tự do - Hạnh phúc') {
      processedLines.push(`<div class="text-center font-bold" style="font-size: 13px; margin-top: 4px; line-height: 1.2;">${line}</div>`);
    } else if (lineClean.startsWith('---') && lineClean.endsWith('---')) {
      processedLines.push('<div style="width: 120px; border-top: 1.5px solid #000; margin: 8px auto 16px auto;"></div>');
    } else if (lineClean.toUpperCase().startsWith('HỢP ĐỒNG') && lineClean.length < 100) {
      passedTitle = true;
      processedLines.push(`<div class="text-center font-bold" style="font-size: 16px; text-transform: uppercase; margin-top: 20px; letter-spacing: 0.5px; line-height: 1.3;">${line}</div>`);
    } else if (lineClean.startsWith('(Số: ') && lineClean.endsWith(')')) {
      processedLines.push(`<div class="text-center" style="font-style: italic; font-size: 13px; margin-top: 4px; margin-bottom: 20px; line-height: 1.2;">${line}</div>`);
    } else if (lineClean.includes('ĐẠI DIỆN BÊN A') && lineClean.includes('ĐẠI DIỆN BÊN B')) {
      isInsideSignatures = true;
      processedLines.push(`
        <div class="signature-block">
          <div class="signature-col">
            <div class="font-bold">ĐẠI DIỆN BÊN A</div>
            <div class="signature-subtitle">(Ký tên và đóng dấu)</div>
            <div class="signature-space"></div>
          </div>
          <div class="signature-col">
            <div class="font-bold">ĐẠI DIỆN BÊN B</div>
            <div class="signature-subtitle">(Ký tên và đóng dấu)</div>
            <div class="signature-space"></div>
          </div>
        </div>
      `);
    } else {
      if (isInsideSignatures) {
        continue;
      }
      processedLines.push(line);
    }
  }

  let formattedContent = '';
  for (let i = 0; i < processedLines.length; i++) {
    const curr = processedLines[i];
    const prev = i > 0 ? processedLines[i - 1] : '';

    if (curr.startsWith('<div') || prev.startsWith('<div') || prev.endsWith('</div>')) {
      formattedContent += curr;
    } else {
      formattedContent += (i > 0 ? '<br />' : '') + curr;
    }
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>In Hợp Đồng - ${contract.contractNumber}</title>
      <meta charset="utf-8" />
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Times+New+Roman&display=swap');
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 14px;
          line-height: 1.6;
          color: #000;
          background: #f1f5f9;
          margin: 0;
          padding: 0;
        }

        .a4-page {
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 20mm 20mm 20mm;
          margin: 30px auto;
          box-sizing: border-box;
          background: #fff;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        
        .content-body {
          text-align: justify;
          font-size: 14px;
          line-height: 1.6;
        }

        .signature-block {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }

        .signature-col {
          width: 45%;
          text-align: center;
        }

        .signature-subtitle {
          font-style: italic;
          font-size: 13px;
          margin-top: 4px;
          color: #334155;
        }

        .signature-space {
          height: 120px;
        }

        @media print {
          body {
            background: none;
            margin: 0;
            padding: 0;
          }
          .a4-page {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: auto;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }

        .no-print-bar {
          background: #0f172a;
          color: #fff;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .btn-print {
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 10px 22px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }

        .btn-print:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar no-print">
        <div style="display: flex; align-items: center; gap: 10px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #60a5fa;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style="font-weight: bold; font-size: 14px;">Bản xem trước & In hợp đồng (${contract.contractNumber})</span>
        </div>
        <button class="btn-print" onclick="window.print()">In Hợp đồng / Xuất PDF</button>
      </div>
      <div class="a4-page">
        <div class="content-body">${formattedContent}</div>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
}
