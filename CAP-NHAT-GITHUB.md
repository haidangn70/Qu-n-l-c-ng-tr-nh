# Bản mã nguồn cập nhật GitHub · 29/10/2026

Đưa **các tệp và thư mục bên trong gói mã nguồn** lên thư mục gốc của repository. Sau khi cập nhật, `package.json`, `server.mjs`, `render.yaml` và thư mục `public/` phải nằm ngay ở gốc repository. Giữ cả `.github/`, `.node-version`, `.gitignore` và cấu trúc các thư mục đi kèm.

Gói gồm toàn bộ mã chạy, kiểm thử, cấu hình triển khai mẫu và hướng dẫn. Cơ sở dữ liệu/ảnh sử dụng thật tiếp tục được quản lý riêng; chúng không nằm trong gói GitHub. `SHA256SUMS.txt` liệt kê mã kiểm tra từng tệp.

## Kiểm tra mã nguồn

Yêu cầu Node.js 24.x. Chạy trong thư mục mã nguồn:

```powershell
node verify-build.mjs
node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs
```

Khởi động bằng `node server.mjs`. Mặc định mở `http://127.0.0.1:3000/`; tài khoản hiện có nằm trong dữ liệu sử dụng riêng.

## Nếu cập nhật dịch vụ đang có

Giữ `DATA_DIR`, ổ lưu trữ và cấu hình môi trường của dịch vụ. Thực hiện sao lưu dữ liệu trước khi nâng cấp. Các giá trị riêng như mật khẩu/mã khôi phục được cấu hình trong môi trường máy chủ. Hướng dẫn triển khai chi tiết ở `RENDER.md` và `DEPLOYMENT.md`.

Nội dung đã rà soát và kết quả 41 kiểm thử: `RA-SOAT-2026-10-29.md`. Cách thao tác phần mềm: `GUIDE.md`.
