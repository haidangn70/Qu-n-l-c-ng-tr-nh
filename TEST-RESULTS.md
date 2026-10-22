
# Kiểm thử phiên bản 3 · 22/10/2026

Môi trường: Windows, Node.js 24.19.0. Dữ liệu kiểm thử và minh họa tách khỏi data/ thật.

`node --test tests.mjs infrastructure-tests.mjs` chạy tests.mjs và infrastructure-tests.mjs. Bộ cũ gồm 9 kiểm thử: ngày lịch, trọng số, đăng nhập/phân quyền, quy trình sửa chữa, xung đột phiên bản, gia hạn, XLSX, cảnh báo nền, dữ liệu sau khởi động lại, sao lưu/khôi phục, HTTP khi thiếu tệp và khôi phục đủ public/ từ gói kiểm tra SHA-256.

5 kiểm thử V3 bổ sung:

- 9 khu vực mặc định; bootstrap quản trị từ biến môi trường; cảnh báo đúng 4 ngày, không cảnh báo ở 5 ngày và chống trùng.
- Sửa chữa trực tiếp từ hạng mục; bắt buộc bàn giao/khởi công; khối lượng theo ngày, tiến độ, chống trùng khi gửi lại; cấm ngày tương lai/khối lượng âm; upload PNG gắn đúng nhật ký, phục vụ ảnh inline có xác thực, chặn log ID sai và bảo toàn lịch sử.
- Đầu tư mới đầy đủ quy trình; phân công người phối hợp được xem nhưng không sửa; gia hạn giữ hạn gốc; 100% không tự hoàn thành; nhập ngày hoàn thành/nghiệm thu rồi đóng hồ sơ, khóa sửa sau đóng.
- Đổi tên khu vực cập nhật hồ sơ; ẩn khu vực không xóa hạng mục; thêm khu vực tùy ý.
- Khôi phục quản trị bằng mã dùng một lần; từ chối mã sai/đã dùng; thu hồi phiên cũ; giữ nguyên số hồ sơ.

Kiểm tra trình duyệt: đăng nhập bản minh họa, tổng quan, chi tiết sửa chữa, biểu mẫu nhật ký, luồng đầu tư mới, danh mục, báo cáo. Hình minh họa cảng tạo bằng SVG trong mã nguồn, không phụ thuộc tải ảnh ngoài. Kiểm tra nguồn console để phát hiện lỗi tải và JavaScript.

Chưa xác nhận Docker chạy tại máy hoặc deploy trên GitHub/Render thực tế, HTTPS, trình duyệt ngoài Codex, kiểm thử tải lớn. Workflow GitHub có sẵn để chạy build, toàn bộ tests và Docker/cổng 10000 khi upload. Chi tiết các lần chạy cuối được báo trong bàn giao.

Kết quả chạy cuối tại máy: 14/14 kiểm thử đạt, build đạt, doctor đạt; kiểm tra đăng nhập admin sau đặt lại đạt và /healthz HTTP 200. Tệp mật khẩu, DB và dữ liệu minh họa đã được git check-ignore xác nhận loại khỏi Git.
