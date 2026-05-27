# CRM Backend (Strapi v5) 💾

Hệ thống cung cấp API và quản lý dữ liệu CMS cho ứng dụng CRM, sử dụng Strapi phiên bản 5.

## 🛠 Công nghệ sử dụng
- **Core**: Strapi v5 (Headless CMS).
- **Ngôn ngữ**: Node.js, TypeScript.
- **Cơ sở dữ liệu**: PostgreSQL.

## 📁 Cấu trúc thư mục cốt lõi
- `/src/api`: Nơi định nghĩa các Content-Types (`customer`, `deal`, `note`, `reminder`, `audit-log`, `invoice`, `contract`). Chứa cả các Controllers và Routes custom (Ví dụ: Webhook Sepay).
- `/config`: File cấu hình chung của hệ thống Strapi (database, plugins, middlewares).
- `/database`: Migrations và seeds.

## 🚀 Hướng dẫn cài đặt
**1. Chuẩn bị Database**
Đảm bảo bạn đã cài đặt PostgreSQL và tạo một database trống cho dự án (ví dụ: `crm_db`).

**2. Cài đặt các gói thư viện**
```bash
npm install
```

**3. Cấu hình biến môi trường**
Tạo file `.env` tại thư mục `backend`:
```env
HOST=0.0.0.0
PORT=1337
APP_KEYS="key1,key2,key3,key4"
API_TOKEN_SALT="salt_string"
ADMIN_JWT_SECRET="admin_secret"
TRANSFER_TOKEN_SALT="transfer_salt"
JWT_SECRET="jwt_secret"

# Database Configuration (Thay đổi cho đúng với DB của bạn)
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=crm_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourpassword
DATABASE_SSL=false
```

**4. Khởi chạy**
```bash
npm run develop
```
- API sẽ khả dụng ở: `http://localhost:1337/api`
- Trang quản trị Admin: `http://localhost:1337/admin`
*(Trong lần đầu chạy, Strapi sẽ yêu cầu bạn tạo tài khoản Admin).*
