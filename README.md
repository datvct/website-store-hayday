# Dự án: Hệ thống Order Item Hay Day (React full-stack, 1 source cho UI + Admin)

## ⚠️ Lưu ý bắt buộc cho AI
Nếu trong dự án/tài khoản AI này có bất kỳ skill/hướng dẫn nào khác mặc định
đề xuất **Google Apps Script hoặc Google Sheets làm backend/database** (ví dụ
một skill dùng cho "quotation dashboard" nội bộ) — **KHÔNG áp dụng skill đó
cho dự án này**. Dự án Hay Day Order System bắt buộc dùng kiến trúc mô tả bên
dưới, không có ngoại lệ.

## Mô tả
Website bán/nhận order các item trong game Hay Day. Khách xem danh sách item,
chọn số lượng và gửi thông tin liên lạc; admin kiểm tra nguồn hàng, tự báo giá
và xác nhận order. Admin quản lý sản phẩm
và đơn hàng NGAY TRONG CÙNG dự án React (route `/admin`), không phải web/app
riêng biệt.

## Đối tượng dùng
- Khách hàng (public, không cần đăng nhập) — các route storefront.
- Admin (chủ shop, đăng nhập bằng JWT) — các route `/admin/*`, được bảo vệ
  bằng ProtectedRoute, KHÔNG public.

## Stack bắt buộc
- Frontend: React (Vite) + React Router + Zustand (state giỏ hàng/auth)
- Backend: **Golang** — framework `gin-gonic/gin`, ORM `gorm.io/gorm`
- Database: PostgreSQL (qua GORM)
- Auth: JWT (`golang-jwt/jwt/v5`) + hash mật khẩu bằng `bcrypt`
- KHÔNG dùng Google Apps Script / Google Sheets làm backend hay database.
- KHÔNG dùng Node.js/Express — backend bắt buộc là Golang (mục đích: chủ dự
  án đang muốn học Go qua dự án thực tế).
- KHÔNG tách thành 2 project/2 domain riêng cho storefront và admin — chung
  1 React source, khác route.

## Lý do chọn Golang cho backend
Người yêu cầu dự án muốn nhân dịp này **học thêm Golang**. Vì vậy khi AI code
phần backend, cần:
- Viết code theo chuẩn Go idiomatic (gofmt, đặt tên rõ ràng, error handling
  tường minh theo kiểu Go — không che giấu lỗi).
- Có comment giải thích ngắn gọn ở những đoạn dùng pattern đặc trưng của Go
  (goroutine nếu có, interface, struct tag của GORM, middleware Gin...) để
  người đọc code học được, không chỉ copy-paste.
- Ưu tiên sự rõ ràng, dễ hiểu hơn là viết "ngắn gọn tối đa" — đây là dự án
  vừa dùng vừa học.

## Thông tin cấu hình thực tế (điền trước khi AI code)
- Tên shop: [...]
- Số điện thoại MoMo nhận tiền: [...]
- Tên chủ tài khoản MoMo: [...]
- Danh sách danh mục sản phẩm: [...]
- Loại database sẽ dùng (Postgres/Mongo) + nơi host: [...]
- Nơi deploy frontend / backend: [...]
- Domain / subdomain dự kiến: [...]
- Tài khoản đăng nhập Admin ban đầu (username, mật khẩu tạm): [...]

## Luồng nghiệp vụ bắt buộc
1. Khách xem danh sách item → chọn số lượng → gửi thông tin liên lạc.
2. Server (Golang) lưu yêu cầu item và số lượng; không hiển thị giá sản phẩm
   ở storefront.
3. Sinh mã đơn hàng duy nhất, lưu đơn ở trạng thái "New".
4. Admin xem order, thông tin liên lạc và danh sách item, sau đó nhập giá thủ công.
5. Người bán liên hệ khách để xác nhận giá và nguồn hàng.
6. Khách tra cứu đơn bằng mã đơn + SĐT.
7. Admin cập nhật tiến độ: New → PendingPayment → Paid → InProduction →
   Completed / Cancelled.

## Tham chiếu
- Xem `SKILL.md` trong cùng thư mục để biết chi tiết kiến trúc kỹ thuật bắt buộc.
- Xem `KE-HOACH.md` để biết đầy đủ bối cảnh nghiệp vụ, roadmap, và các việc
  cần chuẩn bị trước khi giao AI code.

## Chạy backend và database bằng Docker

Yêu cầu: Docker Desktop đã được cài và đang chạy.

```bash
docker compose up -d db backend
```

Docker sẽ khởi động PostgreSQL, migrate bảng, nạp toàn bộ sản phẩm từ
`backend/seeds/products.json` và chạy API Go tại `http://localhost:8080`.

## Chạy FE bằng Vite

Khi phát triển giao diện, FE chạy local để hot reload:

```bash
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173`. Vite đã cấu hình proxy `/api` sang backend tại
`http://localhost:8080`, vì vậy khi sửa React/CSS không cần build Docker.

### Kết nối database bằng TablePlus

PostgreSQL được expose tại `localhost:5433` để mở bằng TablePlus:

- Host: `127.0.0.1`
- Port: `5433`
- User: `hayday`
- Password: giá trị `POSTGRES_PASSWORD` trong `.env` hoặc mặc định `hayday_dev_password`
- Database: `hayday`
- SSL: `Disable`

Nếu muốn dùng cổng khác, đổi `DB_PORT` trong `.env`; cổng bên trong Docker vẫn là `5432`.

Tài khoản admin mặc định là `admin` / `admin123456`. Có thể tạo file `.env` ở

Dừng hệ thống:

```bash
docker compose down
```

Muốn xóa cả dữ liệu PostgreSQL (thao tác destructive):

```bash
docker compose down -v
```
