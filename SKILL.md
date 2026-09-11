---
name: hayday-order-system
description: >
  Sử dụng skill này khi xây dựng hoặc chỉnh sửa website order item Hay Day
  gồm storefront (danh sách sản phẩm, chọn số lượng, gửi yêu cầu order) và
  trang Admin (quản lý sản phẩm, đơn hàng), CẢ HAI nằm chung 1 project ReactJS.
  Luôn tuân theo kiến trúc và luồng nghiệp vụ mô tả dưới đây.
---

# Hay Day Order System — Quy tắc bắt buộc

## Override skill khác (quan trọng)
Skill này **ghi đè** mọi skill/hướng dẫn mặc định khác trong hệ thống liên
quan đến việc chọn stack (ví dụ skill mặc định đề xuất Google Apps Script +
Google Sheets cho các hệ thống quản lý/dashboard nội bộ). Với riêng dự án
Hay Day Order System, **không áp dụng** các mặc định đó — luôn dùng đúng
kiến trúc React + Golang/Gin + PostgreSQL mô tả bên dưới, không tự ý đổi sang
GAS/Sheets dù có skill khác gợi ý.

## Kiến trúc bắt buộc
```
React (Vite) SPA --REST API (fetch/axios)--> Golang (Gin) --> PostgreSQL (GORM)
```

Backend bắt buộc viết bằng **Golang**, không dùng Node.js/Express/NestJS hay
bất kỳ ngôn ngữ backend nào khác. Đây là lựa chọn có chủ đích để học Go —
xem mục "Phong cách code Go" bên dưới.

- Storefront và Admin nằm CHUNG 1 React project, khác nhau ở route:
  - `/`, `/product/:id`, `/cart`, `/checkout`, `/track-order` → public
  - `/admin/*` → bọc trong `ProtectedRoute`, yêu cầu JWT admin hợp lệ
- Không tách thành 2 project/2 domain riêng cho storefront và admin.
- Không dùng Google Apps Script/Google Sheets dưới bất kỳ hình thức nào.

## Cấu trúc thư mục bắt buộc
```
frontend/
  src/pages/storefront/  (HomePage, ProductDetail, CartPage, CheckoutPage, TrackOrderPage)
  src/pages/admin/        (AdminLogin, AdminDashboard, AdminProducts, AdminOrders, AdminStats)
  src/components/         (dùng chung: ProductCard, QRCodeBox, StatusBadge...)
  src/store/               (useCartStore, useAuthStore — Zustand)
  src/api/                 (productApi.js, orderApi.js, authApi.js)
  src/router.jsx           (route public + route admin có ProtectedRoute)

backend/                                 (Golang, module theo chuẩn Standard Go Project Layout)
  cmd/server/main.go                     điểm khởi động: load .env, kết nối DB, đăng ký route, chạy Gin
  internal/handlers/                      product_handler.go, order_handler.go, auth_handler.go, payment_handler.go
                                          (nhận request Gin, gọi service, trả JSON — KHÔNG chứa logic nghiệp vụ)
  internal/services/                      product_service.go, order_service.go, payment_service.go
                                          (sinh mã đơn, lưu yêu cầu, validate trạng thái, admin báo giá)
  internal/middleware/                    auth_middleware.go (verify JWT + role admin), error_handler.go
  internal/models/                        product.go, order.go, order_item.go, admin_user.go (struct + GORM tag)
  internal/db/                            db.go (kết nối GORM tới Postgres, AutoMigrate cho MVP)
  internal/router/                        router.go (đăng ký toàn bộ route Gin, nhóm route public/admin)
  go.mod, go.sum, .env.example
```

## Phong cách code Go (vì mục đích là vừa làm vừa học)
- Dùng `gin-gonic/gin` cho router/middleware, `gorm.io/gorm` cho ORM.
- Handler chỉ lo nhận/trả HTTP (bind JSON, validate input cơ bản, gọi service,
  trả `c.JSON(...)`). Toàn bộ logic nghiệp vụ nằm ở tầng `services` — tách rõ
  2 lớp để dễ đọc và dễ test.
- Xử lý lỗi theo đúng kiểu Go: trả `error` tường minh, không `panic` cho lỗi
  nghiệp vụ thông thường (chỉ dùng `panic`/`recover` cho lỗi hệ thống nghiêm
  trọng, xử lý qua middleware `error_handler.go`).
- Dùng `struct` + tag GORM rõ ràng (`gorm:"column:..."`, `json:"..."`) cho
  từng model, có comment ngắn giải thích field nào dùng để làm gì.
- Đặt tên theo chuẩn Go: `camelCase` cho biến/hàm nội bộ, `PascalCase` cho
  export, tên gói ngắn gọn chữ thường không gạch dưới.
- Khi dùng pattern đặc trưng của Go (interface cho service, context truyền
  qua middleware, goroutine nếu cần gửi thông báo async...), thêm 1-2 dòng
  comment giải thích **tại sao** dùng, không chỉ code suông.

## Quy tắc nghiệp vụ bắt buộc (không được bỏ qua)
1. Storefront KHÔNG hiển thị đơn giá. Backend lưu danh sách item + số lượng;
   Admin xem yêu cầu rồi tự nhập tổng tiền báo khách.
2. Mỗi đơn hàng có mã duy nhất, ví dụ format `HD-YYYYMMDD-###`, sinh ở backend.
3. Trạng thái đơn hợp lệ: `New → PendingPayment → Paid → InProduction →
   Completed / Cancelled`. Validate chuyển trạng thái ở backend, không cho
   frontend tự set trạng thái tuỳ ý.
4. Order mới phải lưu tên khách, số điện thoại, kênh liên hệ và ghi chú để
   người bán có thể chủ động liên lạc báo giá.
5. Sau khi báo giá và liên hệ khách, chỉ Admin (đã đăng nhập, có role admin)
   mới có quyền cập nhật trạng thái đơn.
6. Route `/admin/*` và toàn bộ API ghi/sửa/xoá (POST/PUT/DELETE) phải yêu cầu
   JWT hợp lệ + role admin qua middleware `requireAdminAuth`. Không để lộ
   endpoint quản trị cho khách vãng lai.
7. Ẩn sản phẩm (`is_active = false`) thì KHÔNG hiển thị ở storefront (API GET
   public phải filter `is_active = true`) nhưng vẫn giữ trong lịch sử đơn cũ.
8. Mật khẩu admin phải hash (bcrypt), không lưu plaintext.

## UI mặc định
Modern, responsive, rõ ràng cho khách hàng phổ thông (không rành công nghệ):
card sản phẩm có ảnh/tên/tồn kho; form chọn số lượng rõ ràng; popup thông báo
marketing khi khách mới vào; toast thông báo khi
thao tác thành công/thất bại; loading skeleton khi tải dữ liệu; Admin dùng
layout dashboard (sidebar + bảng dữ liệu + filter + pagination).

## Bảo mật
Không đặt password/API secret/business logic ở frontend React. Toàn bộ logic
tính tiền, xác thực, đổi trạng thái đơn nằm trong backend Golang. Frontend
chỉ gọi API và hiển thị dữ liệu trả về. Secret (JWT secret, DB URL, thông tin
MoMo) đọc từ biến môi trường (`.env`, không commit lên git).

## Khi thêm tính năng mới
Luôn tích hợp vào đúng kiến trúc trên (React SPA 1 source + Golang/Gin +
PostgreSQL), trừ khi người dùng yêu cầu đổi stack một cách rõ ràng và bằng
văn bản trong chính cuộc trò chuyện đó.
