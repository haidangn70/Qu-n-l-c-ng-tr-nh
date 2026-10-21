# Sửa triển khai Render

Lỗi ERR_HTTP_HEADERS_SENT trong log là lần ghi header thứ hai khi xử lý lỗi. Bản cũ gửi header 200 trước rồi mới đọc tệp giao diện; nếu tệp thiếu/không đọc được, catch lại gửi JSON và làm tiến trình dừng. Log chưa cho thấy lỗi gốc nên chưa thể kết luận tệp cụ thể nào thiếu.

Đã sửa: đọc tệp/serialize trước khi gửi header; không gửi lại khi response đã kết thúc; kiểm tra headersSent khi xử lý lỗi; lỗi nội bộ trả 500 và ghi mã lỗi vào log. Khi RENDER=true, mặc định bind 0.0.0.0. Dùng Node 24 đã kiểm chứng, không để khoảng phiên bản mở >=24.

## Cập nhật repository và cấu hình

1. Đưa đầy đủ mã nguồn mới, đặc biệt toàn bộ thư mục **public/** và các module server/operations/domain/xlsx vào GitHub nhánh main. Không đưa data/, demo-data/, .env hoặc mật khẩu lên GitHub. Máy làm việc hiện chưa cấu hình Git remote nên chưa push bản sửa tự động.
2. Render Settings: Build Command = `node verify-build.mjs`; Start Command = `node server.mjs`; Health Check Path = `/healthz`. Build sẽ báo chính xác tệp thiếu trước khi deploy.
3. Environment: `NODE_VERSION=24.19.0`, `HOST=0.0.0.0`, `COOKIE_SECURE=1`, `PUBLIC_ORIGIN=https://<tên-dịch-vụ>.onrender.com`, `SETUP_TOKEN=<chuỗi-ngẫu-nhiên-do-bạn-tạo>`.
4. Giữ PORT do Render cấp (log hiện 10000), không cần đặt lại. NODE_VERSION trên dashboard có ưu tiên cao hơn .node-version và package.json, phải sửa nếu hiện là 26.
5. Dữ liệu thật cần Persistent Disk đã được chủ đầu tư lựa chọn, mount `/var/data`; đặt `DATA_DIR=/var/data`. Không tự đặt mua dịch vụ. Nếu chưa có disk, chỉ thử nghiệm với dữ liệu dùng một lần vì ổ mặc định không giữ DB/tệp sau restart/redeploy.
6. Sau khi cập nhật GitHub và lưu cấu hình, chọn Manual Deploy → Deploy latest commit. Nếu vẫn dùng Node 26, kiểm tra NODE_VERSION rồi chọn Clear build cache & deploy.
7. Xác nhận log bind 0.0.0.0:10000, health thành công, trang đăng nhập tải được và tệp JS/CSS không bị 404/500. Cài DB mới cần tự tạo quản trị; tài khoản trên máy Windows không tự chuyển lên Render. Không upload DB thật lên repository để chuyển tài khoản.

Tài liệu nguồn: [Port binding](https://render.com/docs/web-services#port-binding), [Node version và độ ưu tiên](https://render.com/docs/node-version), [Persistent disks](https://render.com/docs/disks). Chưa kiểm chứng bản sửa trên tài khoản Render thực tế.
