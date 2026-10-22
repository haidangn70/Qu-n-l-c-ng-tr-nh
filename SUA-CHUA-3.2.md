# Công tác sửa chữa · phiên bản 3.2.0

Ô chọn cũ có thể trống khi chỉ có danh mục khu vực nhưng chưa có hồ sơ hạng mục cụ thể. Hồ sơ sửa chữa có sẵn còn bị khóa ô chọn hạng mục. Bản này thay ô chọn bằng danh sách khu vực và các dòng hạng mục hiển thị ngay trong biểu mẫu.

## Khai báo

1. Vào **Công tác sửa chữa → Khai báo công tác sửa chữa**.
2. Bấm khu vực. Bấm **Chọn hạng mục này**; dòng đã chọn được tô vàng và có xác nhận tên, mã, vị trí. Có thể gõ tìm tên hoặc mã không dấu.
3. Nếu chưa có hạng mục, nhập ngay **Khai báo hạng mục hạ tầng mới** ở bước 1. Khi toàn bộ danh sách chưa có hạng mục, phần này tự mở. Chỉ có danh mục khu vực chưa đủ để lập liên kết đến một công trình cụ thể.
4. Nhập nội dung, phạm vi, ngày dự kiến thi công, hạn hoàn thành, đơn vị thi công, giám sát, kinh phí và phân công. Có thể đính kèm ảnh ban đầu.
5. Bấm **Lưu công việc sửa chữa**. Hạng mục mới được giữ để chọn lại ở những lần khai báo sau. Nếu hồ sơ sửa chữa có lỗi, hạng mục đã lưu vẫn được giữ và chọn sẵn để tiếp tục.

**Cập nhật hồ sơ** cho phép chọn lại hạng mục trong công việc đã lưu. Hồ sơ liên kết hư hỏng phải giữ hạng mục khớp với hồ sơ hư hỏng đó. Hồ sơ đã khóa theo quy trình không được chỉnh sửa.

## Theo dõi thi công và ảnh

- Các thẻ sửa chữa hiển thị tiến độ, trạng thái, khu vực/hạng mục, ngày bàn giao, ngày thi công, hạn hoàn thành, người phụ trách, phối hợp và ảnh thu nhỏ.
- Sau phê duyệt và chuyển **Chờ bàn giao**, bấm **Bàn giao & bắt đầu thi công** để khai báo ngày và bắt đầu theo dõi.
- Bấm **Cập nhật tiến độ & ảnh** khi đang thi công. Nhập ngày, tỷ lệ %, nội dung đã làm, việc tiếp theo và vướng mắc. Chọn ảnh JPEG/PNG/WebP hoặc tài liệu PDF, tối đa 10 MB mỗi tệp.
- Khối lượng thi công là tùy chọn. Đánh dấu **Ghi thêm khối lượng thi công trong ngày** rồi nhập nội dung, khối lượng phát sinh và đơn vị. Bản ghi chỉ có tiến độ không làm tăng tổng khối lượng.
- Ảnh gắn với đúng lần cập nhật và ngày nhật ký. Có thể thêm ảnh sau bằng **Thêm ảnh / tài liệu cho ngày này**. Nếu lỗi gửi ảnh, tiến độ đã lưu vẫn được giữ và có thể thử lại tệp chưa gửi.
- Cảnh báo mặc định trước hạn 4 ngày, 1 ngày, đến hạn và quá hạn. Cập nhật tiến độ khi đã quá hạn cần nguyên nhân, biện pháp và ngày dự kiến hoàn thành điều chỉnh.
- Đạt 100% chưa tự hoàn thành hoặc nghiệm thu: vẫn cần ngày hoàn thành thực tế và chuyển các bước nghiệm thu.

Bản nháp giữ nội dung và lựa chọn ghi khối lượng trong phiên làm việc. Ảnh cần chọn lại nếu đóng biểu mẫu trước khi lưu. Sau nâng cấp mã nguồn, khởi động lại máy chủ và tải lại trang bằng Ctrl+F5; ứng dụng cài sẵn có thể đóng rồi mở lại.

Xem RENDER.md để cập nhật GitHub/Render. Giữ DATA_DIR và ổ đĩa dữ liệu hiện có; gói nguồn không kèm tài khoản hoặc dữ liệu sử dụng thật.
