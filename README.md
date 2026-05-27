# CRM Next.js + Strapi v5 🚀

Đây là hệ thống quản lý quan hệ khách hàng (CRM) Full-stack hiện đại, được xây dựng với kiến trúc Frontend/Backend tách biệt.

## 🏗 Cấu trúc hệ thống
Dự án được triển khai theo mô hình Monorepo:
- **`/frontend`**: Ứng dụng Next.js 16 (App Router), React 19, Tailwind CSS v4, Shadcn UI.
- **`/backend`**: Hệ thống Headless CMS sử dụng Strapi v5 + PostgreSQL Database.

## ✨ Tính năng nổi bật
- **Quản lý khách hàng**: Thêm, sửa, xóa, tìm kiếm, phân trang, lưu notes, theo dõi lịch sử.
- **Quản lý bán hàng (Deals)**: Kanban Board trực quan (Kéo thả) + Table View.
- **Tự động hóa**: Chuông thông báo Real-time, Auto đối soát thanh toán (Sepay webhook).
- **Phân quyền (RBAC)**: Admin, Manager, Sales.
- **Báo cáo & Export**: Trích xuất dữ liệu ra PDF (jsPDF) và CSV, biểu đồ tương tác.

## ⚙️ Yêu cầu hệ thống
- **Node.js**: Phiên bản 18+ (Khuyến nghị dùng v20 LTS).
- **Trình quản lý package**: `npm` hoặc `yarn`.
- **Database**: PostgreSQL (cho backend).

## 🚀 Khởi chạy toàn bộ dự án
Để khởi chạy song song cả 2 phần (Frontend và Backend), hãy làm theo các bước sau:

**Bước 1: Cài đặt Dependencies**
Mở 2 cửa sổ Terminal (cmd/powershell):
```bash
# Terminal 1 - Cài đặt Backend
cd backend
npm install

# Terminal 2 - Cài đặt Frontend
cd frontend
npm install --legacy-peer-deps
```

**Bước 2: Cấu hình biến môi trường (`.env`)**
Bạn cần copy các file `.env.example` thành `.env` trong cả 2 thư mục `frontend` và `backend`. Xem hướng dẫn chi tiết bên trong mỗi thư mục.

**Bước 3: Chạy Development Server**
```bash
# Terminal 1 - Chạy Backend (Chạy ở cổng 1337)
cd backend
npm run develop

# Terminal 2 - Chạy Frontend (Chạy ở cổng 3000)
cd frontend
npm run dev
```
Truy cập vào ứng dụng tại `http://localhost:3000`.

---
> 📝 Chi tiết cài đặt và cấu hình cụ thể, vui lòng xem tại [README của Frontend](./frontend/README.md) và [README của Backend](./backend/README.md).
