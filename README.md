
# Quản lý hạ tầng Cảng Hải Phòng · Phiên bản 3

Phòng Kỹ thuật – Công ty cổ phần Cảng Hải Phòng. Thiết kế: Mr Đăng · 0914931888.

Giao diện vàng cam với minh họa cầu cảng, cần trục, tàu hàng và kho bãi. Chỉ hiển thị phân hệ hạ tầng. Dữ liệu phương tiện thiết bị cũ vẫn nằm trong cơ sở dữ liệu để tránh mất hồ sơ, không hiển thị hoặc cộng vào thống kê mới.

## Chạy tại máy

Yêu cầu Node.js 24.x; không cần cài gói npm.

```powershell
node verify-build.mjs
node server.mjs
```

Mở http://127.0.0.1:3000. Cài mới sẽ hiện màn hình tạo quản trị, mật khẩu ít nhất 12 ký tự. Tài khoản hiện có được giữ, trừ khi chạy lệnh đặt lại.

```powershell
node reset-admin.mjs
```

Đặt lại duy nhất tài khoản `admin`, thu hồi các phiên của tài khoản đó, không xóa hồ sơ/ảnh. Trước khi thay đổi, tạo bản sao DB trong thư mục dữ liệu. Tên đăng nhập và mật khẩu mới nằm trong `.private-login.txt` tại máy; tệp này bị loại khỏi Git, Docker và gói upload. Đừng chạy lại nếu không cần vì mỗi lần chạy sẽ đổi mật khẩu.

## Nội dung chính

- Tổng quan: thống kê hiện trạng, công trình cần quan tâm và 9 khu vực theo yêu cầu; thêm, đổi tên hoặc ẩn khu vực trong Danh mục & thiết lập. Đổi tên khu vực cập nhật các hồ sơ liên quan trong một giao dịch, tăng phiên bản để phát hiện xung đột.
- Hạng mục: vị trí, quy mô, kết cấu, đơn vị quản lý, hiện trạng, người phụ trách chính và phối hợp.
- Sửa chữa: lập công việc độc lập cho hạng mục hoặc liên kết hư hỏng đã duyệt; kế hoạch, bàn giao mặt bằng, thi công, ngày hoàn thành, kinh phí, nghiệm thu.
- Đầu tư mới: đề xuất → khảo sát → lập và duyệt dự án → chọn nhà thầu → bàn giao → thi công → hoàn thành xây dựng → chờ nghiệm thu → nghiệm thu → đóng.
- Nhật ký: ngày thi công, nội dung khối lượng, số lượng và đơn vị tính, tiến độ tổng thể, việc đã làm, việc tiếp theo, vướng mắc, ảnh/tài liệu gắn đúng nhật ký. Tổng khối lượng được nhóm theo nội dung và đơn vị, không cộng các đơn vị khác nhau. Khối lượng nhập là số phát sinh trong ngày; tiến độ là đánh giá tổng thể, không tự suy ra từ các khối lượng khác đơn vị.
- Hư hỏng: nhập trực tiếp vị trí/địa điểm, hiện trạng, nguyên nhân sơ bộ, ưu tiên, hạn, phương án và kinh phí; hai ô tên phụ trách/phối hợp để trống và nhập bổ sung. Có tải nhiều ảnh hiện trường khi tạo hoặc cập nhật, theo dõi phê duyệt và tạo công việc sửa chữa.
- Kiểm tra hiện trạng: phiếu riêng từng lần, đánh giá kỹ thuật cập nhật về hạng mục.
- Báo cáo: lọc khu vực, loại hồ sơ, phụ trách, khoảng ngày; Excel và In/Lưu PDF cho toàn bộ kết quả lọc. Khoảng ngày lọc hạn công trình; với kiểm tra dùng ngày kiểm tra, hư hỏng dùng hạn xử lý. Nhật ký có bộ lọc ngày thi công riêng.

## Cảnh báo và thời gian

Máy chủ kiểm tra mỗi phút và lưu thông báo trong DB dù trình duyệt đã đóng. Sửa chữa luôn nhắc trước **4, 1, 0 ngày**, sau đó cảnh báo quá hạn. Đầu tư và hồ sơ khác mặc định dùng các mốc này; lãnh đạo có thể điều chỉnh các mốc chung. Nhắc chưa cập nhật sau 7 ngày theo mặc định. Thông báo hiển thị trong ứng dụng; chưa tích hợp email/SMS/thông báo đẩy khi trình duyệt đóng.

Ngày lịch theo Asia/Ho_Chi_Minh. Hôm nay là ngày đến hạn thì còn 0 ngày. Tiến độ 100% không tự nghiệm thu: phải khai báo ngày hoàn thành và đi qua các bước nghiệm thu. Gia hạn giữ hạn gốc và lịch sử người đề xuất, người duyệt, lý do. Thời gian thi công hiển thị số ngày lịch tính cả ngày đầu, không tự trừ tạm dừng.

## Đăng nhập trên Render

Mỗi máy chủ có cơ sở dữ liệu riêng. Tài khoản ở máy Windows không tự chuyển lên Render.

- Cài mới: đặt `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD` trong Environment của Render để khởi tạo quản trị tự động. Có thể dùng mật khẩu trong tệp riêng tại máy; không đưa tệp này lên GitHub. Biến môi trường chỉ tạo tài khoản khi DB chưa có người dùng, không tự đặt lại khi restart.
- Không đặt `ADMIN_PASSWORD`: dùng trang Khởi tạo hệ thống và nhập `SETUP_TOKEN` trên Render.
- Quên mật khẩu: cấu hình `RECOVERY_TOKEN` ngẫu nhiên ít nhất 24 ký tự, mở **Quên mật khẩu quản trị?** và nhập tài khoản, mật khẩu mới cùng mã. Mã dùng một lần; muốn khôi phục lần khác cần đổi biến này trên Render. Các phiên cũ bị thu hồi.
- Sau lần đăng nhập đầu, đổi mật khẩu tại mục Tài khoản. Chỉ quản trị tạo/khóa/đặt lại mật khẩu người dùng; lãnh đạo duyệt, gia hạn và nghiệm thu.

## Kiểm tra và tự khắc phục lỗi đã biết

```powershell
node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs
node doctor.mjs
node package-release.mjs
```

`doctor` kiểm tra Node, cú pháp, thư mục dữ liệu, tính toàn vẹn DB và tự phục hồi tệp giao diện còn thiếu từ gói SHA-256. `build` cũng phục hồi giao diện thiếu. Dữ liệu thay đổi so với gói hoặc gói hỏng sẽ dừng với thông báo, không âm thầm ghi đè. Sau mỗi lần sửa public/, chạy `node bundle-public.mjs` trước khi build/commit. Migration tự cập nhật cấu trúc DB khi khởi động. Lỗi mạng giữ nháp trong sessionStorage, xung đột phiên bản 409 giữ biểu mẫu để đối chiếu; không tự ghi đè cập nhật người khác.

Đây là cơ chế khắc phục lỗi xác định, không tự viết lại mã để sửa mọi lỗi. Không tự xóa hoặc dựng lại DB khi DB hỏng. Không tự tải ảnh ở bản nháp khi mất kết nối; cần chọn lại tệp sau khi mở lại biểu mẫu. Nhật ký được lưu trước ảnh: nếu tải ảnh lỗi, thông báo rõ và cho thử lại các tệp còn lại hoặc thêm ảnh sau.

Gói upload nằm trong `releases/ha-tang-cang-v3.2.0/`, chỉ có mã nguồn, không chứa DB, ảnh thực, mật khẩu hoặc dữ liệu minh họa. Xem **RENDER.md** để triển khai.

## Minh họa

`node demo.mjs` chạy tại http://127.0.0.1:3109, dữ liệu giả lập riêng trong preview-data/. Mật khẩu ngẫu nhiên in ra terminal khi khởi tạo lần đầu. Có nhãn BẢN MINH HỌA trên giao diện. Không dùng bản này để nhập dữ liệu thật.

## Kỹ thuật

Node.js 24, SQLite WAL, JavaScript cùng origin, không phụ thuộc thư viện bên ngoài. DB và tệp nằm trong DATA_DIR; cookie HttpOnly/SameSite Strict, scrypt + salt, kiểm tra Origin, giới hạn thử đăng nhập/khôi phục, phân quyền trên máy chủ. JPEG/PNG/WebP/PDF tối đa 10 MB mỗi tệp, kiểm tra chữ ký; ảnh được phục vụ có xác thực. Nhật ký hằng ngày không bị sửa/xóa qua API cập nhật hồ sơ thông thường. Audit lưu người/giờ/thao tác; không lưu mật khẩu. Chỉ chạy một instance dùng một ổ DB.

API cũ vẫn được giữ để bảo toàn hồ sơ và tương thích; giao diện mới dùng API /api/v2. Nhập Excel cũ vẫn có API nhưng giao diện mới ưu tiên khai báo trực tiếp để đơn giản thao tác. Nguồn tệp: server.mjs, operations.mjs, public/app.js, public/style.css. Xem GUIDE.md, DEPLOYMENT.md, TEST-RESULTS.md.

Trên Windows có thể nhấp đúp CHAY-PHAN-MEM.cmd nếu Node.js 24 đã được cài vào PATH. Các lệnh node ở trên chạy trực tiếp, không cần npm.


## Cài lên máy tính và điện thoại (v3.1)

Bấm Cài ứng dụng tại màn hình đăng nhập hoặc thanh công cụ. Windows/Mac: Chrome hoặc Edge; Android: Chrome; iPhone/iPad: Safari → Chia sẻ → Thêm vào Màn hình chính. Các thiết bị dùng cùng URL HTTPS của Render; cần mạng để sử dụng hồ sơ. Xem CAI-DAT.md cho hướng dẫn và giới hạn đầy đủ.



## Bản sửa biểu mẫu 3.1.1

Đã sửa ô chọn khu vực và hạng mục liên quan bằng danh sách có gõ tìm kiếm, thêm khu vực/hạng mục ngay tại biểu mẫu và giữ nội dung đang nhập. Đầu tư mới cho phép đổi hạng mục liên quan khi chỉnh sửa. Xem SUA-LOI-3.1.1.md. Sau cập nhật, tải lại trang hoặc đóng/mở lại ứng dụng PWA.


## Công tác sửa chữa 3.2.0

Biểu mẫu sửa chữa chọn khu vực hạ tầng trực tiếp, không bắt buộc hạng mục liên quan. Nhập và lưu tiến độ 0–100% ngay khi tạo hoặc sửa; mã được sinh tự động. Đã bỏ hai phần Thông tin bổ sung và Hạng mục hạ tầng liên quan. Thẻ công việc có tiến độ, ngày thi công, phân công và ảnh. Nút Cập nhật tiến độ & ảnh lưu nhật ký theo ngày, khối lượng là tùy chọn. Xem SUA-CHUA-3.2.md.

