# Điểm lưu Kiểm tra hiện trạng · 28/10/2026

Người dùng yêu cầu lưu lại phần mềm sau các chỉnh sửa Kiểm tra hiện trạng. Đây là mốc nguồn mới nhất để tiếp tục chỉnh từng phần trong những lần làm việc sau.

## Nội dung đã lưu

- Hạng mục hạ tầng nhập trực tiếp, không cần khai báo danh mục trước.
- Người kiểm tra nhập nhiều họ tên, phân cách bằng dấu phẩy hoặc xuống dòng.
- Người phụ trách chính và Người phối hợp nhập tên trực tiếp; mỗi bên có ô Chức danh riêng.
- Chọn nhiều ảnh khi tạo hoặc cập nhật phiếu; xem ảnh đã lưu và bổ sung ảnh mới. Khi ảnh lỗi, thử lại trên cùng phiếu, không tạo trùng hồ sơ. JPEG/PNG/WebP/PDF tối đa 10 MB/tệp.
- Danh sách, chi tiết, tìm kiếm, lọc người phụ trách và Excel hỗ trợ các trường mới. Phiếu cũ giữ liên kết hạng mục, tài khoản và quyền truy cập; tên nhập tự do không tự cấp quyền tài khoản.
- Đã bỏ mục Nhật ký hiện trường riêng khỏi menu; giữ nhật ký tiến độ, khối lượng và ảnh trong chi tiết từng công trình.
- Giữ toàn bộ các thay đổi sửa chữa và Hư hỏng & đề xuất từ mốc ngày 23/10. Chi tiết các mốc trước nằm trong các tệp DIEM-LUU và GHI-NHO-DU-AN.md.

## Kiểm tra

- Bộ kiểm thử sau chỉnh sửa: **28/28 đạt**. `node verify-build.mjs` được kiểm tra lại khi lưu và đạt.
- Trình duyệt trên dữ liệu tạm: tạo một phiếu với hai ảnh; mở lại sửa hạng mục/chức danh và thêm ảnh thứ ba. Đối chiếu SQLite xác nhận một phiếu, ba ảnh và các nội dung đã nhập.
- Máy chủ sử dụng tại http://127.0.0.1:3130/ đã nạp mã mới. Không tự lưu phiếu kiểm tra thật; bản nháp Ray cầu tàu vẫn trong phiên trình duyệt. Bản nháp trình duyệt không nằm trong ZIP mã nguồn.

## Bản lưu và cách tiếp tục

- ZIP mã nguồn: `releases/Ha-tang-Cang-2026-10-28-Kiem-tra-hien-trang.zip`.
- Thư mục cùng nội dung: `releases/Ha-tang-Cang-2026-10-28-Kiem-tra-hien-trang/`.
- `SHA256SUMS.txt` trong gói liệt kê mã kiểm tra từng tệp; tệp `.zip.sha256` bên cạnh ZIP kiểm tra toàn bộ gói.
- Gói chứa mã nguồn, giao diện, hướng dẫn, kiểm thử và các điểm lưu. Cơ sở dữ liệu, ảnh thực tế, mật khẩu và tệp môi trường riêng tiếp tục ở thư mục sử dụng hiện tại; không đóng vào gói nguồn.
- Lần sau dùng mã đang có trong thư mục làm việc này; đọc điểm lưu này và GHI-NHO-DU-AN.md trước khi sửa. Kiểm tra máy chủ cổng 3130 còn chạy. Không phục hồi gói ngày 23/10 lên mã mới nếu người dùng không yêu cầu.
- Nếu lấy mã từ ZIP, giải nén vào thư mục mới và làm theo CAI-DAT.md. Dữ liệu dùng thật được quản lý riêng, không thay bằng dữ liệu kiểm thử.
- Sau chỉnh giao diện: chạy `node bundle-public.mjs`, `node verify-build.mjs` và các kiểm thử phù hợp. Chưa triển khai bản mới lên GitHub/Render.
