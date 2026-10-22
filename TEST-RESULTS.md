# Kiểm thử phiên bản 3.2.0 · 22/10/2026

Môi trường: Windows, Node.js 24.19.0. Dữ liệu kiểm thử tách khỏi data/ sử dụng thật.

## Kết quả tự động

`node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs`: **21/21 đạt**.

- Lập sửa chữa từ hạng mục đã đăng ký; đổi hạng mục mà giữ nội dung/hạn gốc; chặn liên kết sai hoặc thiếu hạng mục.
- Nhật ký có khối lượng và nhật ký chỉ cập nhật tiến độ. Không tạo khối lượng giả cho bản ghi chỉ có tiến độ; gửi lại cùng mã không nhân đôi nhật ký.
- Chặn phần trăm ngoài 0–100, phần trăm trống, ngày tương lai, ngày trước khởi công, nội dung trống và khối lượng thiếu/sai.
- Upload PNG, gắn ảnh đúng nhật ký, tải ảnh có xác thực; từ chối mã nhật ký sai và truy cập ảnh khi chưa đăng nhập. Đạt 100% không tự hoàn thành/nghiệm thu.
- Hồi quy: phân quyền, quy trình sửa chữa/đầu tư, nghiệm thu, khóa hồ sơ, xung đột phiên bản, gia hạn, cảnh báo 4 ngày/chống trùng, XLSX, sao lưu/phục hồi, tài khoản và mã khôi phục một lần.
- PWA: manifest/icon PNG, nhận diện thiết bị, hướng dẫn cài đặt, sự kiện cài đặt và ngoại tuyến; không cache hồ sơ/API/ảnh.
- Phục hồi đủ 14 tệp giao diện từ gói SHA-256, phát hiện gói thay đổi và xử lý HTTP khi thiếu tệp.

`node verify-build.mjs`: đạt. `node doctor.mjs`: đủ tệp, cú pháp đạt, SQLite quick_check = ok.

## Kiểm tra giao diện

Trình duyệt trong Codex, trên các cơ sở dữ liệu minh họa riêng:

1. Chọn khu vực Cầu cảng, chọn đúng hạng mục và thấy xác nhận dòng đã chọn.
2. Tạo hạng mục ngay trong biểu mẫu sửa chữa. Đóng/mở giữ bản nháp khu vực, hạng mục đang khai báo, nội dung và hạn; lưu thành công.
3. Mở hồ sơ đã lưu, đổi hạng mục, lưu và xác nhận đúng liên kết mới.
4. Phê duyệt, chờ bàn giao, nhập ngày và bắt đầu thi công.
5. Cập nhật 45%, nội dung, việc tiếp theo và vướng mắc, không bắt buộc khối lượng. Đóng/mở khôi phục bản nháp và checkbox ghi khối lượng; lưu nhật ký thành công.
6. Trên cơ sở dữ liệu hoàn toàn trống, chọn khu vực kho, khai báo hạng mục đầu tiên và lập công việc thành công. Biểu mẫu tự mở phần khai báo mới khi không có hạng mục.
7. Tải ảnh PNG kiểm thử bằng API vào đúng nhật ký tạo từ giao diện; ảnh thu nhỏ và ảnh trong nhật ký hiển thị sau tải lại. Tệp là biểu tượng minh họa, không phải ảnh công trường thật. Chưa kiểm tra thao tác chọn tệp qua hộp thoại hệ điều hành trong lần này.
8. Không ghi nhận lỗi hoặc warning console trong các bước trên. Quan sát giao diện ở hai kích thước cửa sổ khoảng 653 và 1265 px.

## Phạm vi chưa xác nhận

Chưa deploy bản này lên GitHub/Render thực tế; chưa chạy Docker tại máy, kiểm thử tải lớn hoặc cài trực tiếp trên Android/iPhone vật lý. Workflow GitHub có sẵn kiểm tra build, tests và Docker/cổng 10000. Tài khoản sử dụng thật không được đặt lại trong lần cập nhật giao diện này.