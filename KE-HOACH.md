# KẾ HOẠCH XÂY DỰNG WEBSITE ORDER ITEM HAY DAY

> Kiến trúc CHỐT: **React.js — 1 source code duy nhất cho cả Storefront (khách hàng) và Admin**,
> backend **Golang (Gin + GORM)** riêng, database **PostgreSQL**.
> **KHÔNG dùng Google Apps Script / Google Sheets** dưới bất kỳ hình thức nào cho dự án này.
> Backend chọn Golang có chủ đích để bạn vừa làm vừa học Go — AI cần code rõ
> ràng, có chú thích, theo chuẩn Go idiomatic, không viết tắt/rối để "cho nhanh".

---

## 1. Mục tiêu dự án

Xây dựng một website cho phép:
- Liệt kê toàn bộ **danh sách item trong game Hay Day** (nông sản, sản phẩm chế biến, nguyên liệu...) kèm giá tiền do bạn quy định.
- Khách hàng chọn item + số lượng → hệ thống **tự tính tổng tiền đơn hàng**.
- Khách xác nhận đặt hàng → hệ thống sinh **mã đơn hàng** + **QR thanh toán MoMo cá nhân** với đúng số tiền.
- Bạn (chủ shop) có **trang Admin** (nằm chung 1 dự án React, không phải web riêng) để xem đơn, xác nhận đã thanh toán, cập nhật trạng thái sản xuất/giao hàng, quản lý sản phẩm & giá.

## 2. Luồng hoạt động

### 2.1 Khách hàng (Storefront)
1. Vào trang chủ → xem danh sách item Hay Day theo danh mục (Nông sản, Sản phẩm chế biến, Vật nuôi, Đồ trang trí...).
2. Tìm kiếm / lọc theo tên, danh mục.
3. Chọn item → nhập số lượng → **Thêm vào giỏ hàng**.
4. Xem giỏ hàng → hệ thống hiển thị **bảng chi tiết + tổng tiền tự động**.
5. Nhập thông tin liên hệ (tên, SĐT/Zalo/Facebook, tên nông trại trong game, thời gian nhận hàng mong muốn).
6. Bấm **Đặt hàng** → hệ thống tạo **mã đơn hàng (Order ID)**.
7. Hiển thị **QR MoMo** kèm đúng số tiền + nội dung chuyển khoản (bắt buộc chứa mã đơn để đối soát).
8. Khách chuyển khoản → bấm **"Tôi đã thanh toán"** (tuỳ chọn) → đơn chuyển trạng thái "Chờ xác nhận".
9. Khách tra cứu trạng thái đơn bằng Order ID + SĐT.

### 2.2 Admin (bạn)
1. Đăng nhập vào **cùng website** ở route riêng (`/admin`), có xác thực, không public.
2. Quản lý **danh sách sản phẩm**: thêm/sửa/xoá item, giá, ảnh, danh mục, ẩn/hiện.
3. Xem **danh sách đơn hàng** theo trạng thái: Mới → Chờ xác nhận thanh toán → Đã thanh toán → Đang sản xuất → Hoàn thành/Đã giao → Huỷ.
4. Đối chiếu thanh toán thủ công (MoMo cá nhân không có webhook chính thức) → bấm **Xác nhận đã thanh toán**.
5. Cập nhật tiến độ sản xuất, ghi chú nội bộ.
6. Xem thống kê: doanh thu, item bán chạy, đơn theo ngày.

## 3. Kiến trúc kỹ thuật (chốt)

```
1 REPO DUY NHẤT

frontend/ (React + Vite)
  src/pages/storefront/  HomePage, ProductDetail, CartPage, CheckoutPage, TrackOrderPage
  src/pages/admin/        AdminLogin, AdminDashboard, AdminProducts, AdminOrders, AdminStats
  src/components/         dùng chung: ProductCard, CartItem, QRCodeBox, StatusBadge...
  src/context (hoặc Zustand store)/  CartStore, AuthStore
  src/api/                 gọi backend qua axios/fetch
  src/router.jsx           React Router: route public + /admin/* có ProtectedRoute

        │  REST API (JWT cho admin)
        ▼

backend/ (Golang — Gin framework + GORM)
  cmd/server/main.go        điểm khởi động, load config, khởi tạo router
  internal/handlers/         product_handler.go, order_handler.go, auth_handler.go, payment_handler.go
  internal/services/         product_service.go, order_service.go, payment_service.go (logic nghiệp vụ)
  internal/middleware/       auth_middleware.go (verify JWT + role admin), error_handler.go
  internal/models/           product.go, order.go, order_item.go, admin_user.go (struct GORM)
  internal/db/               db.go (kết nối Postgres), migrations (goose hoặc golang-migrate)
  go.mod, go.sum

        │
        ▼

Database: PostgreSQL (qua GORM)
  Bảng: products, orders, order_items, admin_users, settings, logs
```

**Vì sao chọn kiến trúc này:**
- Storefront + Admin dùng **chung 1 React project**, chỉ khác route và quyền truy cập (ProtectedRoute kiểm tra JWT admin trước khi vào `/admin/*`).
- Backend Golang tách riêng, chịu toàn bộ logic tính tiền, xác thực, sinh QR — không lộ logic nhạy cảm ở frontend. Dùng Gin vì router nhanh, middleware đơn giản, tài liệu/cộng đồng lớn — dễ học.
- Deploy dễ: Frontend lên Vercel/Netlify; Backend Go build ra 1 binary, deploy lên Render/Railway/Fly.io/VPS (Docker); Database Postgres (Railway/Supabase/Neon đều có gói free).

**Thư viện Go chính sẽ dùng:**
- `gin-gonic/gin` — HTTP router & middleware
- `gorm.io/gorm` + `gorm.io/driver/postgres` — ORM, migration tự động cho MVP
- `golang-jwt/jwt/v5` — tạo & verify JWT cho admin
- `golang.org/x/crypto/bcrypt` — hash mật khẩu admin
- `godotenv` — đọc file `.env` (config: DB URL, JWT secret, MoMo info)

## 4. Cấu trúc dữ liệu

**`products`**: id, name, category, description, image_url, price, unit, is_active, created_at
**`orders`**: id, order_code, customer_name, contact, note, total_amount, status, payment_confirmed_at, admin_note, created_at
**`order_items`**: id, order_id (FK), product_id (FK), product_name, quantity, unit_price, line_total
**`admin_users`**: id, username, password_hash, role, created_at
**`settings`**: key, value (momo_phone, momo_account_name, shop_name...)
**`logs`**: id, timestamp, actor, action, detail

## 5. Xử lý thanh toán QR MoMo

MoMo **cá nhân** (không phải Business/merchant) **không có webhook chính thức**. Thiết kế theo hướng:

1. **QR động theo số tiền + nội dung**: dùng chuẩn **VietQR** (kiểm tra tại thời điểm triển khai xem MoMo có nằm trong danh sách provider VietQR không) qua URL dạng:
   `https://img.vietqr.io/image/<BANK_ID>-<SO_TAI_KHOAN>-<TEMPLATE>.png?amount=<SO_TIEN>&addInfo=<NOI_DUNG>&accountName=<TEN_CHU_TK>`
   Backend build URL này, frontend hiển thị `<img>`. Nội dung chuyển khoản **luôn chứa mã đơn hàng**.
2. Nếu MoMo không hỗ trợ qua VietQR: dùng ảnh QR nhận tiền tĩnh từ app MoMo, hiển thị kèm số tiền + nội dung để khách tự nhập tay.
3. Vì không có xác nhận tự động, **bắt buộc có bước Admin xác nhận thủ công** sau khi kiểm tra sao kê MoMo.
4. Về sau muốn tự động hoá → nâng cấp MoMo Business (cần đăng ký kinh doanh).
5. Luôn xác minh trên sao kê MoMo trước khi sản xuất/giao hàng — tránh khách bấm "đã thanh toán" nhưng chưa chuyển tiền thật.

## 6. Việc cần chuẩn bị trước khi giao AI code

- [ ] Danh sách đầy đủ item Hay Day muốn bán (tên, danh mục, ảnh, giá).
- [ ] Số điện thoại MoMo cá nhân + tên chủ tài khoản nhận thanh toán.
- [ ] Chọn nơi lưu database (PostgreSQL trên Railway/Neon/Supabase, hoặc MongoDB Atlas).
- [ ] Chọn nơi deploy frontend (Vercel/Netlify) và backend (Render/Railway/VPS).
- [ ] Tên miền (nếu có) hoặc dùng domain miễn phí.
- [ ] Tài khoản/mật khẩu đăng nhập Admin.
- [ ] Quy tắc đặt mã đơn hàng (ví dụ `HD-YYYYMMDD-001`).
- [ ] Ngưỡng số lượng tối thiểu/tối đa cho mỗi đơn (nếu có).

## 7. Roadmap

**Giai đoạn 1 – MVP**
- Setup React (Vite) + React Router, chia route storefront và `/admin`.
- Setup Go module (`go mod init`) + Gin + kết nối Postgres qua GORM, model Products/Orders.
- Danh sách sản phẩm (đọc từ database qua API).
- Giỏ hàng + tính tổng tiền (client hiển thị, server tính lại để chốt).
- Tạo đơn, sinh mã đơn, hiển thị QR (tĩnh trước).
- Admin: đăng nhập (JWT), xem đơn, xác nhận thanh toán thủ công, đổi trạng thái.

**Giai đoạn 2 – Hoàn thiện**
- QR động theo số tiền (VietQR) sinh từ backend.
- Tra cứu đơn hàng cho khách (mã đơn + SĐT).
- CRUD sản phẩm đầy đủ trên Admin (thêm/sửa/xoá/ẩn hiện, upload ảnh).
- Thống kê doanh thu, item bán chạy (recharts/chart.js).

**Giai đoạn 3 – Mở rộng (tuỳ chọn)**
- Đăng nhập khách hàng, lưu lịch sử đơn.
- Thông báo Zalo/Telegram khi có đơn mới.
- Nâng cấp MoMo Business để tự động xác nhận thanh toán.
- Phân quyền nhiều admin.

## 8. Bước tiếp theo

1. Điền các mục còn thiếu ở mục 6 (đặc biệt là chọn database + host).
2. Chuẩn bị sẵn danh sách item Hay Day + giá (Excel/CSV để seed database).
3. Đưa `README.md` + `SKILL.md` (kèm file này) vào folder AI, sau đó yêu cầu AI: *"Hãy đọc README.md và SKILL.md, sau đó dựng MVP giai đoạn 1"*.
4. Test kỹ phần tính tiền, luồng trạng thái đơn, và việc `/admin` có thực sự bị chặn nếu chưa đăng nhập, trước khi đưa link cho khách thật dùng.
