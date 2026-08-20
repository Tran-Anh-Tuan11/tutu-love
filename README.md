# TuTu & Love

Web app riêng tư cho 2 người, đăng nhập bằng khuôn mặt. Xây theo `spec-cua-rieng-hai-dua.md`.

## Chạy local

```bash
npm install
npm run dev
```

Cần Postgres — dùng chung 1 database Neon cho cả local và production (xem biến môi trường bên dưới), không cần cài Postgres/Docker trên máy.

Mở http://localhost:3000 — lần đầu vào `/login`, chọn tab **Cài đặt lần đầu** để đăng ký khuôn mặt cho Anh và Em (cần đúng `SETUP_KEY` trong `.env`), sau đó chuyển tab **Xác thực**: nhìn camera rồi nói/gõ đúng lời yêu thương của mình để đăng nhập — lượt đăng nhập này cũng tính là 1 lượt check-in cho streak.

## Biến môi trường (`.env`)

- `DATABASE_URL` — connection string Postgres (Neon). Prisma tự sinh lại client đúng hệ điều hành qua `postinstall` (`prisma generate`) mỗi lần `npm install`.
- `SETUP_KEY` — khóa bảo vệ enroll khuôn mặt lần đầu. **Dùng giá trị khác giữa local và production.**
- `SESSION_SECRET` — bí mật ký cookie session theo ngày. **Dùng giá trị khác giữa local và production.**

## Deploy production (Vercel)

1. Push code lên GitHub (repo đã gắn remote sẵn).
2. Trên [vercel.com](https://vercel.com), import repo, thêm 3 biến môi trường trên (bản production nên dùng `SETUP_KEY`/`SESSION_SECRET` khác local).
3. Deploy — Vercel tự build (`postinstall` sinh Prisma Client cho Linux) và cấp HTTPS (bắt buộc để camera hoạt động).
4. Sau khi deploy, vào `/login` → enroll lại khuôn mặt cho Anh và Em trên domain production.

## Model nhận diện khuôn mặt

`public/models/` chứa model weights của `face-api.js` (tiny face detector, face landmark 68, face recognition) — tải từ repo cộng đồng `justadudewhohacks/face-api.js-models` vì package npm không kèm sẵn file model. Toàn bộ xử lý khuôn mặt chạy phía trình duyệt; server chỉ nhận descriptor (mảng 128 số) để so khớp, không lưu ảnh — đúng note kỹ thuật trong spec.

## Site map

Theo mục 3 của spec, cộng thêm 2 route độc lập hoá phần "mọi thứ còn lại" của mockup gốc:

- `/login` — xác thực / cài đặt lần đầu
- `/` — Dashboard: chào hỏi, đếm ngày yêu nhau, check-in lời yêu thương, streak, top ngày đặc biệt, banner nhắc nhở
- `/viec` — to-do 3 danh sách (Chúng ta / Của Anh / Của Em)
- `/chu-ky` — theo dõi chu kỳ + gợi ý ăn uống
- `/lich` — 3 lịch check-in (Anh / Em / Chúng ta) theo tháng
- `/ky-niem` — danh sách ngày đặc biệt đầy đủ + thêm ngày mới

## Ghi chú kỹ thuật

- Nhận diện giọng nói (khôi phục streak) dùng Web Speech API — chỉ chạy tốt trên Chrome; các trình duyệt khác sẽ thấy thông báo lỗi + có ô nhập tay thay thế.
- Streak được tính **riêng cho từng người** (đúng field `Streak.userId` trong spec) — mỗi người có streak hoàn thành đủ 2 lượt/ngày của chính mình.
- Session cookie hết hạn lúc 23:59:59 giờ local mỗi ngày, không phải TTL cố định.
