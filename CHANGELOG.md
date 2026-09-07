# Nhật ký thay đổi

File này ghi lại toàn bộ những gì đã làm cho project này, để mở ở session Claude Code khác vẫn hiểu ngay bối cảnh mà không cần đọc lại toàn bộ lịch sử chat. Xem `CLAUDE.md` để biết kiến trúc/lệnh chạy hiện tại — file này chỉ kể lại **quá trình** và **lý do**.

## 1. Đổi thương hiệu + deploy production

- Đổi tên từ "Của riêng hai đứa" sang **TuTu & Love** — đổi title, header, các chỗ hiển thị tên app.
- Thêm `.env` (`DATABASE_URL`, `SETUP_KEY`, `SESSION_SECRET`), chạy thử local.
- Chuyển từ SQLite (dev cũ) sang **Postgres (Neon)** — dùng chung 1 database cho cả local và production, không cần Docker.
- Deploy lên **Vercel**, auto-deploy nhánh `main`.
- **Bug 500 trên production**: schema dùng generator preview mới của Prisma (`prisma-client` + `output` tùy chỉnh) — Next.js không tự loại nó khỏi bundle serverless function như cách nó làm với `@prisma/client` chuẩn, thiếu file engine native khi deploy. Fix: đổi về generator cổ điển `prisma-client-js` (output mặc định `@prisma/client`), nằm trong danh sách `serverExternalPackages` tự động của Next.js.

## 2. Đổi chữ hiển thị: Nam/Nữ → Anh/Em → tên thật

- Ban đầu đổi toàn bộ chữ hiển thị "Nam"/"Nữ"/"Chung" thành "Anh"/"Em"/"Chúng ta" (giữ nguyên id nội bộ `"nam"`/`"nu"` trong DB, không đổi vì là schema đang chạy thật).
- Sau đó nâng cấp tiếp: thay **toàn bộ** "Anh"/"Em" bằng **tên hiển thị thật** của từng người (lấy từ `User.name`), có fallback về "Anh"/"Em" nếu người đó chưa đăng ký/đặt tên. Xem `lib/names.ts` (`nameOf()`).
- Thêm nút đổi tên (✏️ cạnh avatar trên header, `components/NameEditor.tsx`) — `/api/auth/me` có thêm PATCH để tự đổi tên của chính mình.

## 3. Đăng nhập bằng mặt + giọng nói

- Đăng nhập gộp thành **1 bước**: camera theo dõi khuôn mặt liên tục ở nền (không cần bấm chụp), nói/gõ đúng lời yêu thương của mình (`"anh yêu em"` / `"em yêu anh"`) mới được cấp session.
- Đăng nhập thành công **tự động tính là 1 lượt check-in** cho streak (`lib/checkin.ts`).
- Trang `/login` tự khóa tab "Xác thực" cho tới khi cả 2 người đã đăng ký khuôn mặt xong, mặc định hiện tab "Cài đặt lần đầu".
- **Bug đã sửa**: session cookie hợp lệ nhưng user đã bị xóa khỏi DB (VD reset DB) vẫn báo `loggedIn: true` → giờ `/api/auth/me` kiểm tra user còn tồn tại thật không, không thì tự dọn cookie và trả về chưa đăng nhập.
- **Bug đã sửa**: nhận diện giọng nói trên di động (đặc biệt Android) hay trả về câu viết hoa chữ đầu + có dấu câu cuối câu (VD `"Anh yêu em."`) hoặc Unicode ở dạng tổ hợp khác — so sánh chuỗi trực tiếp bị sai dù nghe/nhìn giống hệt. Fix trong `normalizePhrase()` (lib/streak.ts): chuẩn hóa Unicode NFC + bỏ dấu câu cuối câu.
- Tạm thời **mở lại ô gõ tay** song song với giọng nói (ở đăng nhập, check-in, khôi phục streak) vì độ tin cậy giọng nói trên di động vẫn đang theo dõi thêm.
- Thêm trang **`/kiem-tra-thiet-bi`** (không cần đăng nhập) — kiểm tra HTTPS, hỗ trợ camera/mic, hỗ trợ giọng nói, test camera + mic trực tiếp, hiện rõ mã lỗi khi mic không hoạt động.
- Check-in (không chỉ đăng nhập) giờ cũng **bắt buộc soi mặt khớp** với người đang đăng nhập, không chỉ gõ/nói câu.

## 4. Giờ giấc: cố định theo giờ Việt Nam

- **Bug nghiêm trọng đã sửa**: `lib/date.ts` cũ dùng giờ hệ thống của server (`new Date().getHours()`). Vercel chạy theo UTC, không phải giờ VN → "check-in cuối ngày chỉ mở sau 18h" thực chất đang gate theo 18h UTC = 1h sáng hôm sau ở VN. Giờ mọi tính toán ngày/giờ nghiệp vụ (streak, check-in, ngày đặc biệt, chu kỳ, lịch) đều cố định theo UTC+7, không phụ thuộc timezone máy chạy.
- Thêm đồng hồ **giờ Việt Nam + Thượng Hải** trên header (`components/HeaderClock.tsx`).

## 5. Streak — chuỗi bug dài nhất, đã sửa tận gốc

Thứ tự các lần sửa (mỗi lần lộ ra thêm 1 lớp bug):
1. Khôi phục streak chỉ sửa số đếm ở bảng `Streak`, không cập nhật bảng `CheckIn` → lịch check-in vẫn hiện ngày bị đứt là trống/một phần dù streak nói đã liền mạch. Fix: backfill `CheckIn` cho các ngày trong khoảng bị đứt khi khôi phục thành công.
2. Con số khôi phục chỉ trả về đúng số **trước khi đứt**, không cộng thêm những ngày trong khoảng bị đứt (dù đã backfill). Fix: cộng thêm số ngày trong khoảng đó vào streak.
3. **Bug gốc**: `brokenAt` (cờ "đang đứt") không bao giờ được xóa khi người dùng tự check-in lại bình thường sau khi lỡ 1 ngày — chỉ bấm "Khôi phục" mới xóa. Nên dù đã check-in đều đặn nhiều ngày sau đó, app vẫn cứ hiện "chuỗi bị đứt" mãi, khiến người dùng bấm khôi phục dựa trên số liệu cũ đã lỗi thời, ra kết quả sai.
4. **Fix tận gốc**: bỏ hẳn cách cộng dồn từng bước, streak giờ được **tính lại từ toàn bộ lịch sử `CheckIn` thật** mỗi lần đọc (`lib/streak.ts`'s `recompute()`) — không thể lệch vì luôn bám sát dữ liệu gốc. Việc này tự sửa luôn dữ liệu thật đang sai của cả 2 người ngay khi deploy (không cần script fix riêng).

## 6. Tính năng mới

- **Chu kỳ** (`/chu-ky`): cả Anh và Em đều ghi/sửa được ngày đến kỳ (trước đây chỉ Em), thêm nhập hàng loạt từ file (`YYYY-MM-DD,độDàiChuKỳ,sốNgàyHànhKinh` mỗi dòng).
- **Ngày yêu nhau**: sửa được nhiều lần (trước chỉ đặt được 1 lần), có ở cả trang chủ và trang Kỷ niệm (`components/RelationshipStartEditor.tsx`).
- **Ý tưởng** (`/y-tuong`): board kiểu Padlet — tạo chủ đề, mỗi chủ đề chứa nhiều ý tưởng, mỗi ý tưởng gắn tên người đưa ra (chọn tay lúc tạo, không suy từ session).
- **Ai là người chủ động** (`/chu-dong`): quay ngẫu nhiên có trọng số (Anh 2/3, Em 1/3), có hiệu ứng đảo tên trước khi dừng, **lưu lịch sử** kết quả (tên + ngày quay) hiển thị bên dưới.
- **Việc chưa làm** trên trang chủ: liệt kê dọc việc chưa xong của từng người riêng (chỉ xem, không sửa được ở đây — phải sang `/viec` mới chỉnh sửa).

## 7. Hiệu năng + UX vặt

- **Bug hiệu năng đã sửa**: `useMe()` trước đây bị gọi độc lập ở 6+ nơi (Header, layout, từng page, CheckInCard...), mỗi lần chuyển trang bắn lại cả loạt request `/api/auth/me` giống nhau. Giờ gộp thành 1 React context (`MeProvider` ở root layout) — chỉ fetch đúng 1 lần, share dùng chung.
- Nút bấm giờ có `cursor: pointer` (Tailwind mặc định đặt `cursor: default` cho `<button>`, trông như không bấm được).

## Ghi chú vận hành

- **1 database Neon dùng chung** cho cả local dev và production — dữ liệu là thật (2 người dùng thật: "Tuấn" và tên hiện tại của người còn lại), không phải dữ liệu test. Bất kỳ session nào làm việc tiếp cũng phải cẩn thận không xóa/ghi đè dữ liệu thật khi test.
- Có 1 memory riêng (`powershell_utf8_bug.md`) ghi lại việc Windows PowerShell's `Invoke-RestMethod` làm hỏng encoding UTF-8 khi round-trip tiếng Việt — dùng `curl`/Node cho mọi test có chữ tiếng Việt, không dùng PowerShell.
