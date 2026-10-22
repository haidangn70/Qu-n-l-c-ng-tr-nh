# Bản sửa biểu mẫu 3.1.1 · 22/10/2026

## Đã sửa

1. Khu vực công trình và bộ lọc khu vực: thay menu chọn gốc của trình duyệt bằng danh sách hiện ngay trong giao diện. Có thể gõ có dấu/không dấu để tìm rồi bấm kết quả hoặc dùng phím mũi tên, Enter, Escape.
2. Hạng mục hạ tầng trong hư hỏng và hạng mục liên quan trong đầu tư: gõ mã/tên để chọn. Khi chưa có hạng mục phù hợp, chọn **Khai báo hạng mục mới** ngay trong danh sách. Nội dung hồ sơ ban đầu vẫn giữ nguyên trong khi mở cửa sổ bổ sung.
3. Trong cửa sổ khai báo hạng mục, quản trị có thể gõ tên khu vực mới → **Thêm khu vực** → **Thêm và chọn**. Mục mới lưu vào danh mục chung. Các vai trò khác tiếp tục dùng khu vực được quản trị cấp.
4. Đầu tư mới đang chỉnh sửa: mở khóa ô hạng mục liên quan. Chọn hạng mục sẽ điền khu vực/đơn vị theo hạng mục. Có thể chọn Không chọn/để trống với dự án chưa có hạng mục sẵn. Chi tiết công trình hiển thị tên hạng mục đã liên kết.
5. Các ô mô tả hư hỏng, bộ phận/kết cấu, nguyên nhân, phương án và ghi chú cho phép nhập thêm, lưu lại và đọc lại từ máy chủ khi hồ sơ chưa khóa.
6. Chuẩn hóa nút thao tác trong cửa sổ để không tự gửi biểu mẫu khi bấm nút phụ. Giữ bản nháp và trạng thái các cửa sổ khi bổ sung khu vực/hạng mục.

## Cập nhật

Bản tại máy dùng http://127.0.0.1:3130. Tải lại trang (Ctrl+F5) để nhận JavaScript mới. Nếu dùng ứng dụng PWA, đóng rồi mở lại khi có mạng.

Trên GitHub/Render: thay mã nguồn bằng gói v3.1.1, có public/form-controls.js và public-bundle.json mới, rồi deploy. Không thay DATA_DIR hay xóa cơ sở dữ liệu. Gói giao diện hiện gồm 14 tệp. Tài khoản/mật khẩu hiện có tiếp tục dùng.

## Kiểm tra

Đã thử trực tiếp trên bản minh họa riêng: gõ không dấu và chọn khu vực; lưu hạng mục; nhập mới và bổ sung báo cáo hư hỏng rồi lưu lại; đổi hạng mục liên quan của đầu tư có sẵn; tạo đầu tư mới, bổ sung khu vực và hạng mục từ các cửa sổ con rồi lưu công trình, giữ nguyên nội dung và thời hạn đã nhập.

Kiểm thử tự động thêm vòng ghi/đọc khu vực và hạng mục mới, nội dung hư hỏng, liên kết/bỏ liên kết đầu tư, giữ hạn gốc, chặn ID hạng mục sai mà không thay đổi phiên bản hồ sơ. Kiểm tra build/phục hồi đủ 14 tệp, PWA và các quy trình nghiệp vụ cũ.
