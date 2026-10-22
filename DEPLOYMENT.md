
# Vận hành và bàn giao phiên bản 3

Xem RENDER.md cho hướng dẫn từng bước. Mã nguồn tại máy chưa được đẩy lên GitHub hoặc triển khai Render. Không tạo hoặc mua tài nguyên từ phiên làm việc này.

SQLite WAL và ảnh/PDF lưu trong DATA_DIR. Chỉ chạy một instance. Trên Render dùng Persistent Disk tại /var/data với DATA_DIR=/var/data; Blueprint gợi ý máy 0.5c-512mb và disk 1 GB, đều cần chủ tài khoản xem/xác nhận chi phí. Không dùng filesystem tạm của Free cho dữ liệu thật.

## Sao lưu

Dừng ứng dụng khi sao lưu để DB và ảnh đồng nhất. Chạy `node backup.mjs` với DATA_DIR trỏ đúng dữ liệu. Bản sao nằm ở backups/<thời điểm>/ gồm app.sqlite và files/. Chuyển bản sao định kỳ sang nơi lưu riêng do đơn vị quản lý; chưa cấu hình lịch tự sao lưu hay lưu đám mây bên ngoài.

## Khôi phục

Dừng ứng dụng. Lưu riêng bản dữ liệu hiện tại trước khi thay. Chép app.sqlite và files/ của cùng một bản sao vào thư mục dữ liệu sạch, đặt DATA_DIR đến thư mục đó rồi khởi động. Không chép xen tệp WAL/SHM của DB khác. Kiểm tra /healthz, số hồ sơ và mở ảnh/PDF đã biết. Có thể chạy `node doctor.mjs` để kiểm tra DB. Kiểm thử tự động đã kiểm tra khôi phục từ bản sao sang thư mục sạch.

## Tài khoản

Không có mật khẩu mặc định công khai. Cài mới chọn mật khẩu trên trang khởi tạo hoặc dùng ADMIN_PASSWORD trong Environment. Reset quản trị cũ bằng RECOVERY_TOKEN dùng một lần hoặc `node reset-admin.mjs` tại máy chủ đang lưu DB. Tài khoản local không tự đồng bộ lên Render. Tệp .private-login.txt chỉ dùng tại máy và bị loại khỏi gói triển khai. Đổi mật khẩu trong ứng dụng thu hồi các phiên cũ.

## Khắc phục lỗi xác định

Build tự khôi phục public/ thiếu từ gói SHA-256. Migration 3 bổ sung đầu tư mới và mặc định cảnh báo 4/1/0 nếu cấu hình cũ còn là 7/3/1. Migration 4 cập nhật các tên khu vực cũ tương đương, ẩn tên cũ khỏi khai báo mới. Không xóa tài sản hoặc hồ sơ thiết bị. Lỗi nội bộ được ghi mã vào log, API trả thông báo và không làm tiến trình dừng vì gửi header hai lần. Healthcheck có truy vấn DB. Không tự sửa DB hỏng hoặc viết lại mã nguồn.

## Giới hạn kiểm chứng

Đã chạy build và kiểm thử tại Windows/Node 24.19.0; kiểm tra trình duyệt trong ứng dụng trên viewport hẹp. Chưa có URL công khai, chưa kiểm chứng mạng Internet ngoài máy, HTTPS Render thực tế, tải đồng thời quy mô lớn hoặc gửi email/SMS. Không tuyên bố đạt nghiệm thu vận hành khi chưa kiểm tra trên hạ tầng triển khai thực tế.

