# CRM Frontend (Next.js) 🌐

Frontend của hệ thống CRM được xây dựng với các công nghệ hiện đại nhất nhằm mang lại hiệu năng cao và UI/UX tốt nhất.

## 🛠 Công nghệ sử dụng
- **Framework**: Next.js 16 (App Router), React 19.
- **UI/Styling**: Tailwind CSS v4 (qua `@tailwindcss/postcss`), Shadcn UI, Radix UI.
- **State Management**: React Hooks, Context API.
- **Data Fetching**: `fetch` API kết hợp Strapi BFF Proxy.
- **Biểu đồ & Drag/Drop**: Recharts, `@hello-pangea/dnd`.
- **Tính năng mở rộng**: Export PDF (`html2canvas`, `jspdf`), Gửi email (`react-email`, `resend`).

## 📁 Cấu trúc thư mục
- `/src/app`: Định tuyến (App Router) các trang (Dashboard, Deals, Calendar, Analytics).
- `/src/components`: Chứa các Component tái sử dụng (chia theo module như `ui`, `layout`, `deals`).
- `/src/contexts`: Global state quản lý Auth (User session) và Theme (Dark/Light).
- `/src/lib`: Hàm Utils (tiện ích), API fetchers giao tiếp với Strapi.

## 🚀 Hướng dẫn cài đặt
**1. Cài đặt các gói thư viện**
```bash
npm install --legacy-peer-deps
```

**2. Cấu hình biến môi trường**
Tạo file `.env` ở thư mục `frontend` với các khóa sau:
```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# API Resend để gửi mail
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxx
```

**3. Khởi chạy**
```bash
npm run dev
```
Trang web sẽ chạy tại `http://localhost:3000`.

## 📌 Các quy ước chuẩn
- Các call API nội bộ nên gọi thông qua Proxy BFF: `/api/strapi/[...path]` thay vì gọi thẳng đến backend để bảo mật Token.
- Components UI luôn ưu tiên sử dụng thư viện Shadcn UI có sẵn trong `/components/ui`.
