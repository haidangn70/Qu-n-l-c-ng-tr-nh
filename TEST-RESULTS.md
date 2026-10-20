# Kết quả kiểm thử — 20/10/2026

Lệnh: `node --test tests.mjs` trên Node.js 24.19.0, Windows. Kết quả gần nhất: **3 nhóm đạt, 0 nhóm lỗi**.

| Trường hợp | Kết quả |
|---|---|
| Chưa khởi công, có bàn giao mặt bằng | Không tự tính ngày thi công — đạt |
| Thiếu hạn hoàn thành | Hiển thị Chưa có thời hạn — đạt |
| Tạm dừng đồng thời quá hạn | Vẫn cảnh báo quá hạn — đạt |
| Hoàn thành chậm | Tính chậm theo ngày thực tế; dừng ngày thi công — đạt |
| Đến hạn hôm nay | Còn 0 ngày, thuộc sắp đến hạn — đạt |
| Công trình hủy | Không cảnh báo quá hạn — đạt |
| Nhiều đơn vị tính | Tiến độ bằng trọng số, không cộng đơn vị — đạt |
| Lưu hồ sơ SQLite qua HTTP | Tạo và đọc lại dữ liệu — đạt |
| Chưa đăng nhập | HTTP 401 — đạt |
| Người xem ghi dữ liệu | HTTP 403 — đạt |
| Quản lý ngoài phạm vi | HTTP 404 — đạt |
| Phân công người xem | Xem được nhưng không sửa được — đạt |
| Hai cập nhật cùng phiên bản | Bản cũ nhận HTTP 409 — đạt |
| Gia hạn bởi người không đủ quyền | HTTP 403 — đạt |
| Gia hạn hợp lệ | Giữ hạn ban đầu, lưu hạn cũ/mới — đạt |
| Khối lượng không hợp lệ | HTTP 400 — đạt |
| Quy trình đề xuất | Nháp → gửi → khảo sát → chờ duyệt → duyệt — đạt |
| Chuyển đề xuất hai lần | Chỉ tạo một công trình, giữ liên kết gốc — đạt |
| Tệp giả loại PDF | Chặn chữ ký nội dung không đúng — đạt |
| Tải và lấy lại tệp | Đúng byte nguồn — đạt |
| Nhật ký | Có bản ghi thao tác — đạt |

Kiểm tra cú pháp `node --check server.mjs` và `node --check public/app.js` đạt.

Giới hạn kiểm chứng: công cụ trình duyệt phản hồi quá chậm, chưa kiểm chứng trực quan các màn hình sau đăng nhập. Chưa kiểm thử trên điện thoại thật, cài PWA, thao tác mất mạng thực, khôi phục nháp qua UI, mở XLSX bằng Excel, in PDF hoặc khôi phục backup toàn bộ. Cần nghiệm thu thủ công các phần này trước sử dụng chính thức. Kiểm thử tự động xung đột xác minh phía máy chủ; chưa có kiểm thử hai trình duyệt chạy đồng thời.
