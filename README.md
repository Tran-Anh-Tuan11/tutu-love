# Của riêng hai đứa

Web app riêng tư cho 2 người, đăng nhập bằng khuôn mặt. Xây theo `spec-cua-rieng-hai-dua.md`.

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000 — lần đầu vào `/login`, chọn tab **Cài đặt lần đầu** để đăng ký khuôn mặt cho Nam và Nữ (cần đúng `SETUP_KEY` trong `.env`), sau đó chuyển tab **Xác thực** để đăng nhập bằng camera.

## Biến môi trường (`.env`)

- `DATABASE_URL` — mặc định SQLite (`file:./dev.db`) để chạy local không cần cài Postgres.
- `SETUP_KEY` — khóa bảo vệ enroll khuôn mặt lần đầu. **Đổi trước khi dùng thật.**
- `SESSION_SECRET` — bí mật ký cookie session theo ngày. **Đổi thành chuỗi ngẫu nhiên dài khi deploy.**

## Deploy production (Postgres)

Máy dev này không có Postgres/Docker nên schema dùng `provider = "sqlite"`. Khi deploy lên Neon/Vercel Postgres như spec yêu cầu (mục 7 — Prisma 6, không dùng Prisma 7):

1. Đổi `prisma/schema.prisma`: `datasource db { provider = "postgresql" ... }`.
2. Đặt `DATABASE_URL` là connection string Postgres.
3. `npx prisma migrate dev --name init` để tạo lại migration cho Postgres.

## Model nhận diện khuôn mặt

`public/models/` chứa model weights của `face-api.js` (tiny face detector, face landmark 68, face recognition) — tải từ repo cộng đồng `justadudewhohacks/face-api.js-models` vì package npm không kèm sẵn file model. Toàn bộ xử lý khuôn mặt chạy phía trình duyệt; server chỉ nhận descriptor (mảng 128 số) để so khớp, không lưu ảnh — đúng note kỹ thuật trong spec.

## Site map

Theo mục 3 của spec, cộng thêm 2 route độc lập hoá phần "mọi thứ còn lại" của mockup gốc:

- `/login` — xác thực / cài đặt lần đầu
- `/` — Dashboard: chào hỏi, đếm ngày yêu nhau, check-in lời yêu thương, streak, top ngày đặc biệt, banner nhắc nhở
- `/viec` — to-do 3 danh sách (Chung / Của Nam / Của Nữ)
- `/chu-ky` — theo dõi chu kỳ + gợi ý ăn uống
- `/lich` — 3 lịch check-in (Nam / Nữ / Chung) theo tháng
- `/ky-niem` — danh sách ngày đặc biệt đầy đủ + thêm ngày mới

## Ghi chú kỹ thuật

- Nhận diện giọng nói (khôi phục streak) dùng Web Speech API — chỉ chạy tốt trên Chrome; các trình duyệt khác sẽ thấy thông báo lỗi + có ô nhập tay thay thế.
- Streak được tính **riêng cho từng người** (đúng field `Streak.userId` trong spec) — mỗi người có streak hoàn thành đủ 2 lượt/ngày của chính mình.
- Session cookie hết hạn lúc 23:59:59 giờ local mỗi ngày, không phải TTL cố định.
