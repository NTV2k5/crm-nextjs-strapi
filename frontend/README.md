# CRM React & Firebase 🚀

Hệ thống quản lý quan hệ khách hàng (CRM) tinh gọn và hiện đại, được tối ưu hóa cho doanh nghiệp vừa và nhỏ (SMEs). Hệ thống tích hợp toàn diện từ quản lý thông tin khách hàng, quy trình cơ hội (Deals Kanban), quản lý hợp đồng pháp lý (Contracts) đến thanh toán tự động (VietQR/SePay/PayOS) và hóa đơn (Billing).

Kiến trúc ứng dụng được thiết kế theo mô hình **Serverless** thuần trên Frontend (Client-side), tận dụng tối đa sức mạnh của **Firebase Client SDK** kết hợp với cơ chế bảo mật nghiêm ngặt từ **Firestore & Storage Security Rules**, giúp hệ thống vận hành ổn định trên Firebase Spark Plan (Free Tier) mà không cần duy trì máy chủ backend.

---

## 📌 Các Tính Năng Cốt Lõi

### 1. Quản Lý Khách Hàng (Customer Relationship Management)
- **Hồ sơ chi tiết (Client Profile):** Lưu trữ toàn bộ lịch sử tương tác, ghi chú (`notes`), thương vụ liên quan, hợp đồng và hóa đơn của từng khách hàng.
- **Lịch sử tương tác:** Nhật ký ghi lại các cuộc gọi, tin nhắn SMS và email giao dịch.
- **Import/Export linh hoạt:** Hỗ trợ nhập và xuất dữ liệu khách hàng hàng loạt qua file CSV bằng thư viện `PapaParse`.

### 2. Quy Trình Cơ Hội (Deal & Sales Pipeline)
- **Bảng Kanban trực quan:** Kéo thả cơ hội qua các giai đoạn bán hàng (Mới, Liên hệ, Đàm phán, Chốt hợp đồng, Thành công/Thất bại) sử dụng `@hello-pangea/dnd`.
- **Thống kê doanh số:** Tính toán tự động tổng giá trị các deal trong pipeline và tỷ lệ chuyển đổi thắng/thua trực quan.

### 3. Quản Lý Hợp Đồng Pháp Lý (Contract Lifecycle)
- **Theo dõi vòng đời:** Trạng thái hợp đồng rõ ràng: `Draft` (Nháp), `Pending Signature` (Chờ ký), `Active` (Hiệu lực), `Expired` (Hết hạn), `Terminated` (Chấm dứt).
- **Tự động sinh hợp đồng (Auto-generator):** Tự động điền thông tin khách hàng, số tiền (tự động đọc số tiền thành chữ tiếng Việt), điều khoản và thời hạn để xuất bản mẫu hợp đồng chuẩn pháp lý.
- **Bản xem trước & In ấn:** Tích hợp bộ xem trước bản in khổ A4 chuyên nghiệp, hỗ trợ in hoặc xuất file PDF trực tiếp từ trình duyệt.
- **Tải lên bản scan:** Lưu trữ bản hợp đồng có chữ ký/dấu đỏ lên **Firebase Storage** phân mục theo ID khách hàng.
- **Gửi Email tự động:** Tự động gửi hợp đồng/hóa đơn cho khách hàng qua cổng **Resend API**.

### 4. Tích Hợp Thanh Toán Tự Động & Hóa Đơn (Billing & QR Payment)
- **Tạo hóa đơn tự động:** Xuất hóa đơn PDF chuyên nghiệp bằng `@react-pdf/renderer`.
- **Tạo mã VietQR động:** Hiển thị mã QR ngân hàng chứa sẵn số tài khoản, ngân hàng, số tiền và nội dung chuyển khoản khớp với hóa đơn.
- **Cơ chế Polling giao dịch (Serverless):** Kiểm tra trạng thái thanh toán theo thời gian thực trực tiếp từ client-side bằng cách gọi API SePay qua proxy chống lỗi CORS (`corsproxy.io`). Khi phát hiện tiền vào tài khoản khớp nội dung, Firestore tự động cập nhật trạng thái hóa đơn thành `paid` và kích hoạt hợp đồng.
- **PayOS Checkout:** Tích hợp thêm cổng thanh toán PayOS làm giải pháp thay thế linh hoạt.

### 5. Lịch Biểu & Nhắc Nhở (Calendar & Tasks)
- Giao diện lịch tương tác trực quan cho phép lên lịch cuộc họp, cuộc gọi và nhắc nhở khách hàng.
- Nhắc nhở theo thời gian thực (Real-time notifications) thông qua **Firebase Cloud Messaging (FCM)**.

### 6. Báo Cáo & Phân Tích (Analytics & Dashboard)
- Dashboard tổng quan trực quan hóa doanh thu theo tháng, thống kê khách hàng mới và hiệu suất làm việc của đội ngũ sales.
- Các biểu đồ đường, cột, tròn sinh động được xây dựng bằng thư viện `Recharts`.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ tích hợp |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4 (Sử dụng `@tailwindcss/postcss` & `@tailwindcss/vite`), Custom CSS |
| **Routing** | React Router DOM v7 |
| **Quản lý Form** | React Hook Form & Zod (Validation) |
| **Hiệu ứng & UI** | Framer Motion (Micro-animations), Lucide React (Icons), Sonner (Toasts) |
| **Database & Auth** | Firebase (Firestore DB, Firebase Auth, Firebase Storage) |
| **Push Notification** | Firebase Cloud Messaging (FCM) |
| **Xuất tài liệu** | @react-pdf/renderer (Invoices PDF), Custom HTML Printable (Contracts) |
| **Thanh toán** | SePay Rest API (VietQR), @payos/payos-checkout |
| **Email Service** | Resend API, EmailJS |

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
crm-react-firebase/
├── .agents/               # Hướng dẫn và patterns của AI Agents
├── docs/                  # Tài liệu phân tích nghiệp vụ & thiết kế tính năng
│   └── contract_implementation_plan.md  # Kế hoạch chi tiết của module Hợp đồng
├── public/                # Thư mục chứa tài nguyên tĩnh & Firebase Service Worker
│   └── firebase-messaging-sw.js  # Service worker nhận tin nhắn đẩy FCM
├── src/
│   ├── components/        # Thư mục chứa component tái sử dụng
│   │   ├── ui/            # UI Components nền tảng (Button, Input, Dialog, v.v.)
│   │   ├── invoices/      # Các component xử lý PDF hóa đơn
│   │   ├── ContractModal.tsx   # Modal tạo/sửa & upload hợp đồng
│   │   ├── DealModal.tsx       # Modal cập nhật trạng thái cơ hội bán hàng
│   │   └── BillingAction.tsx   # Panel thanh toán hóa đơn & QR Code
│   ├── contexts/          # Context API của React (AuthContext, ThemeContext)
│   ├── hooks/             # Custom hooks xử lý logic dữ liệu (useContracts, v.v.)
│   ├── lib/               # Thư viện dùng chung & cấu hình dịch vụ
│   │   ├── services/      # Các dịch vụ bên thứ ba (sepay.ts, email.ts, sms.ts)
│   │   ├── firebase.ts    # Khởi tạo Firebase App & Services
│   │   ├── contracts.ts   # Hàm tiện ích xử lý in ấn và sinh nội dung hợp đồng
│   │   └── audit.ts       # Log lịch sử thao tác của người dùng (Audit Trail)
│   ├── pages/             # Các trang chính trong hệ thống (Dashboard, Customer, Deals, Analytics...)
│   ├── App.tsx            # Cấu hình routing cho toàn ứng dụng
│   ├── main.tsx           # Entry point của ứng dụng React
│   └── index.css          # Cấu hình CSS nền tảng và variables Tailwind v4
├── firestore.rules        # Luật bảo mật và phân quyền truy cập Firestore (RBAC)
├── storage.rules          # Luật bảo mật truy cập tệp tin Firebase Storage
├── firebase.json          # Cấu hình các dịch vụ Firebase local
├── vite.config.ts         # Cấu hình bundler Vite & Tailwind plugin
└── package.json           # Danh sách thư viện và scripts chạy dự án
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Môi Trường Phát Triển

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản LTS mới nhất (Khuyên dùng từ `v20.x` trở lên)
- **NPM** hoặc **Yarn**

### 2. Cài đặt Dependencies
Clone dự án về máy và cài đặt các package cần thiết:
```bash
npm install
```

### 3. Cấu hình biến môi trường (Environment Variables)
Sao chép file `.env.example` thành `.env.local` ở thư mục gốc dự án:
```bash
cp .env.example .env.local
```
Điền đầy đủ các thông tin cấu hình vào file `.env.local`:
- **Firebase Config:** Tạo một web app trên Firebase Console và lấy các khoá API key điền vào `VITE_FIREBASE_*`.
- **SePay Config:** Lấy thông tin tài khoản ngân hàng thụ hưởng và API token tại [my.sepay.vn](https://my.sepay.vn).
- **Resend Config:** Tạo tài khoản [resend.com](https://resend.com), lấy API Key và định nghĩa email gửi đi (`VITE_EMAIL_FROM`).

### 4. Khởi động Development Server
Khởi động dự án trên local dev server (Vite):
```bash
npm run dev
```
Mặc định ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`.

---

## 🔒 Phân Quyền & Luật Bảo Mật (RBAC & Security Rules)

Để bảo vệ các tài liệu pháp lý và thông tin tài chính nhạy cảm mà không cần backend riêng, dự án sử dụng phân quyền theo vai trò (**Role-Based Access Control**) được thực thi ở cả UI và tầng cơ sở dữ liệu:

### 1. Vai trò người dùng (Roles)
- **Admin**: Quyền hạn tối cao. Xem/sửa tất cả dữ liệu, cấu hình thành viên hệ thống và được quyền xoá vĩnh viễn dữ liệu (Customers, Deals, Contracts, Invoices).
- **Manager**: Xem và cập nhật trạng thái mọi dữ liệu của doanh nghiệp (bao gồm chuyển trạng thái hợp đồng thành `Active`). Không có quyền xoá vĩnh viễn.
- **Sales (Nhân viên)**: Chỉ có quyền xem và thao tác trên khách hàng/thương vụ/hợp đồng **do chính mình phụ trách** (được gán thông qua trường `assignedTo`). Chỉ được chỉnh sửa hợp đồng khi hợp đồng ở trạng thái `draft`.

### 2. Triển khai Firebase Rules
Trước khi đưa hệ thống vào vận hành, bạn cần deploy các tệp tin cấu hình bảo mật lên Firebase để ngăn chặn truy cập trái phép trực tiếp vào DB:
- **Deploy Firestore Rules:**
  ```bash
  firebase deploy --only firestore:rules
  ```
- **Deploy Storage Rules:**
  ```bash
  firebase deploy --only storage:rules
  ```

---

## 📐 Quyết Định Thiết Kế Nổi Bật (ADRs)

### 📌 Kiến trúc Client-side Polling cho Cổng Thanh Toán SePay
* **Thách thức:** Hầu hết các cổng thanh toán (SePay, PayOS) yêu cầu cấu hình một URL Webhook nhận thông tin khi có giao dịch. Tuy nhiên, việc dựng server webhook đòi hỏi hạ tầng backend và tốn chi phí duy trì.
* **Giải pháp:** 
  1. Khi xuất hóa đơn, hệ thống tạo mã VietQR tĩnh theo đặc tả NAPAS chứa sẵn thông tin hóa đơn (nhanh chóng, không tốn tài nguyên gọi API).
  2. Ở màn hình thanh toán, client sẽ khởi chạy một luồng **polling** định kỳ mỗi 5 giây gọi đến API SePay (sử dụng token có quyền chỉ đọc giao dịch).
  3. Để tránh vấn đề CORS trên trình duyệt do SePay API không bật CORS header cho client, request được gửi qua `corsproxy.io`.
  4. Cơ chế này được tối ưu bảo mật thông qua **Firestore Rules**: Chỉ khi dữ liệu giao dịch khớp và do chủ sở hữu hợp lệ thực hiện, Firestore mới chấp nhận cập nhật trạng thái `paid`. Điều này đảm bảo an toàn tuyệt đối mà vẫn chạy mượt mà trên Spark Plan.

### 📌 Sinh Hợp Đồng Chuẩn Pháp Lý
* Bộ sinh hợp đồng tự động hóa quy trình pháp lý bằng cách ánh xạ dữ liệu trực tiếp từ các trường của Firestore (Tên, Đại diện, Giá trị Deal...) vào một tiêu chuẩn văn bản hành chính Việt Nam.
* Tích hợp thuật toán chuyển đổi số tiền số thành chữ tiếng Việt (`15000000` -> `Mười lăm triệu đồng chẵn`) chính xác theo ngữ pháp tiếng Việt để đảm bảo tính pháp lý cao nhất cho hợp đồng.

---

## 📜 Giấy Phép & Bản Quyền
Dự án được phân phối dưới giấy phép nội bộ của công ty. Mọi hành vi sao chép hay tái cấu trúc thương mại cần có sự đồng ý của đội ngũ quản trị.

---
*Phát triển bởi đội ngũ Kỹ sư CRM Tech. Chúc bạn có những trải nghiệm tuyệt vời với hệ thống!*
