# Quản lý công tác sửa chữa cơ sở hạ tầng

Ứng dụng tiếng Việt chạy thực tế bằng Node.js 24 và SQLite, không phụ thuộc gói npm. Không cài dữ liệu minh họa. Hồ sơ được lưu tại `data/app.sqlite`, tệp tại `data/files/`, không phải trong bộ nhớ trình duyệt. Chỉ bản nháp và dấu đã đọc thông báo nằm trên thiết bị.

## Chạy ngay

1. Cài Node.js phiên bản 24 hoặc mới hơn có `node:sqlite`.
2. Mở PowerShell trong thư mục dự án và chạy `node server.mjs`.
3. Truy cập http://127.0.0.1:3000. Lần đầu tạo tài khoản quản trị với mật khẩu ít nhất 12 ký tự. Không có mật khẩu mặc định.
4. Tạo tài khoản lãnh đạo, quản lý/giám sát và người xem trong **Quản trị**.
5. Tạo công trình hoặc đề xuất, sau đó phân công tài khoản tại trang cập nhật hồ sơ.

Có thể dùng `npm start`, `npm test`, `npm run backup` nếu đã có npm. Máy hiện tại có Node.js nhưng không có npm trên PATH; các lệnh `node` tương đương đều hoạt động.

## Kiến trúc và mô hình dữ liệu

- Giao diện HTML/CSS/JavaScript thuần, bố cục bảng trên máy tính và thẻ trên điện thoại; manifest và service worker hỗ trợ PWA.
- Máy chủ HTTP cùng origin với giao diện; API kiểm tra phiên, vai trò và phạm vi hồ sơ. Cookie HttpOnly, SameSite Strict; mật khẩu scrypt với salt ngẫu nhiên; giới hạn thử đăng nhập theo IP trong bộ nhớ.
- SQLite bật WAL; users, sessions, records, files, audit, settings. Xem `schema.sql`. Các trường nghiệp vụ nằm trong JSON của records; mỗi công trình có nhiều hạng mục, bất cập và đợt tạm dừng. Phiên bản records tăng mỗi lần ghi.
- Bốn vai trò: admin và approver xem toàn bộ; manager, viewer chỉ xem hồ sơ mình tạo hoặc được gán. Manager cập nhật hồ sơ thuộc phạm vi; viewer không được ghi. Chỉ admin tạo người dùng; admin/approver duyệt đề xuất và hạn mới.
- Chuyển đề xuất đã duyệt thành công trình là một giao dịch SQLite; cập nhật liên kết gốc cùng lúc và kiểm tra version để ngăn chuyển lặp.
- Không dùng dịch vụ bên ngoài để lưu dữ liệu. Chưa có triển khai public hoặc tên miền.

## Quy ước nghiệp vụ

- Ngày dương lịch, múi giờ `Asia/Ho_Chi_Minh`. Chênh lệch ngày, không tính bao gồm hai đầu: khởi công hôm nay = 0 ngày. Ngày đến hạn còn 0 ngày; ngày hôm sau mới quá hạn 1 ngày.
- Không có khởi công thực tế thì chưa tính thời gian thi công, dù đã bàn giao mặt bằng. Hoàn thành thì dừng tính tại ngày hoàn thành thực tế.
- Thiếu hạn hiển thị **Chưa có thời hạn**. Mặc định cảnh báo trước 7 ngày, có thể cấu hình. Tạm dừng và tình trạng thời hạn độc lập; không tự trừ số ngày tạm dừng.
- Hạn ban đầu không sửa qua biểu mẫu thông thường. Chức năng phê duyệt hạn lưu hạn cũ/mới, lý do, tên người duyệt và thời điểm. Bản đầu dùng thao tác phê duyệt trực tiếp, chưa có hàng đợi yêu cầu gia hạn riêng.
- Hạng mục có tên, đơn vị, khối lượng duyệt, khối lượng thực hiện và trọng số. Thực hiện phải trong 0..khối lượng duyệt. Muốn vượt dự toán cần quản lý cập nhật khối lượng duyệt trước. Tiến độ = tổng(tỷ lệ hoàn thành từng hạng mục × trọng số) / tổng trọng số. Không cộng mét với bộ hoặc đơn vị khác.
- Nguyên nhân dự kiến và kết luận khảo sát lưu riêng; bất cập có trạng thái xác minh riêng. Không tự kết luận trách nhiệm hoặc cộng tổng ngày ảnh hưởng của bất cập trùng nhau.

## Hướng dẫn sử dụng

### Công trình

Vào **Công trình → Thêm công trình**. Nhập thông tin, ngày dự kiến, hạng mục và trọng số. Sau khi lưu, mở chi tiết để cập nhật khối lượng, khởi công thực tế, trạng thái và ngày hoàn thành/nghiệm thu. Quản trị/lãnh đạo có thể phân công nhiều tài khoản bằng hộp chọn. Tải ảnh hoặc PDF tại phần Hồ sơ; trên điện thoại có lựa chọn chụp ảnh. Tệp chỉ tải được sau khi máy chủ kiểm tra quyền hồ sơ.

**Ghi nhận bất cập** có nhóm nguyên nhân, mức ảnh hưởng, vị trí/hạng mục, ngày ước tính, đơn vị phối hợp, người phụ trách, giải pháp, hạn xử lý, kết quả và ngày kết thúc. Ảnh minh chứng gắn ở cấp hồ sơ công trình; bản đầu chưa gắn từng tệp vào riêng từng bất cập. Chỉ người phê duyệt xác nhận nguyên nhân.

### Đề xuất

Tạo bản nháp → Gửi đề xuất → người có quyền chuyển sang Khảo sát/thẩm định → điền ý kiến, kết luận khảo sát → Chờ phê duyệt → Duyệt, Yêu cầu bổ sung hoặc Từ chối. Trả lại/từ chối phải có lý do. Đã duyệt thì bấm **Chuyển thành công trình**; hồ sơ gốc giữ nguyên và có liên kết đến công trình mới. Chỉ chuyển một lần.

### Báo cáo, tổng quan

Các thẻ chỉ số mở danh sách tương ứng. Bộ lọc chung gồm đơn vị, khu vực, loại, người phụ trách và khoảng **hạn hoàn thành**. Chọn khoảng ngày tuần/tháng mong muốn bằng bộ lọc này; đây chưa phải báo cáo biến động khối lượng theo kỳ. Bảng hỗ trợ tìm tên, mã, địa chỉ, đơn vị; lọc tình trạng và sắp xếp.

**Xuất Excel** tạo tệp `.xlsx` thực sự từ danh sách đã lọc, mỗi hạng mục một dòng; nội dung chuỗi không trở thành công thức Excel. **In / PDF** dùng hộp thoại in của trình duyệt, chọn Save as PDF. Gantt hiển thị kế hoạch xanh nhạt và thực tế xanh đậm, cần ngày bắt đầu và hạn. Thông báo trong ứng dụng có đánh dấu đã đọc theo tài khoản/thiết bị, không gửi email/push.

### Ngoại tuyến và xung đột

Sau khi đã mở ứng dụng online, service worker giữ giao diện. Biểu mẫu công trình/đề xuất tự lưu nháp khi nhập và có nút lưu nháp chủ động. Khi mạng trở lại, mở lại biểu mẫu, khôi phục nháp và bấm **Lưu dữ liệu**. Đồng bộ có chủ đích, chưa có hàng đợi tự động nền. Phiên bản cũ không được ghi đè lên phiên bản mới: máy chủ trả 409, giữ nháp và cho mở bản mới để đối chiếu. Người dùng tự hợp nhất nội dung. Không hỗ trợ đăng nhập ngoại tuyến, tải tệp ngoại tuyến hoặc tải toàn bộ danh sách đã lưu khi khởi động lại không có mạng. Không lưu ảnh vào localStorage.

Bản nháp chứa nội dung hồ sơ trên thiết bị; nên dùng thiết bị cá nhân được bảo vệ. Bản đầu chưa có chức năng quản lý/xóa nháp tập trung; nháp tự xóa khi lưu thành công, có thể xóa bằng dữ liệu website trong trình duyệt.

## Sao lưu và khôi phục

1. Dừng máy chủ để dữ liệu và tệp cùng một thời điểm.
2. Chạy `node backup.mjs`. Chương trình dùng `VACUUM INTO` để tạo bản SQLite nhất quán và sao chép `files/` vào `backups/<thời điểm>/`.
3. Sao chép thư mục sao lưu ra thiết bị/kho lưu trữ khác; thiết lập lịch hằng ngày bằng Windows Task Scheduler hoặc dịch vụ backup của máy chủ. Mã nguồn không tự đặt lịch hay mã hóa backup.
4. Để khôi phục: dừng máy chủ; giữ nguyên một bản sao của thư mục data hiện tại; đổi tên thư mục data hiện tại; tạo data mới và sao chép `app.sqlite` cùng `files/` từ cùng một bản backup vào đó. Không trộn tệp `-wal`/`-shm` của bản cũ với bản mới. Chạy lại máy chủ, đăng nhập và kiểm tra hồ sơ/tệp.

Các biến môi trường: `DATA_DIR` (thư mục lưu bền vững), `PORT` (mặc định 3000), `HOST` (mặc định 127.0.0.1), `COOKIE_SECURE=1` (bắt buộc khi online HTTPS), `PUBLIC_ORIGIN` (origin HTTPS khi đứng sau reverse proxy).

## Đưa lên online

Cần máy chủ Node 24 có ổ lưu bền vững, tên miền, HTTPS và reverse proxy (Caddy/Nginx/IIS), firewall, cơ chế vận hành và sao lưu định kỳ. Khởi tạo tài khoản quản trị qua loopback trước khi mở truy cập ngoài. Chạy tiến trình bằng Windows Service hoặc systemd, không phụ thuộc cửa sổ terminal. Gán HOST=0.0.0.0 chỉ trên mạng nội bộ/reverse proxy được kiểm soát; chỉ mở cổng HTTPS ra ngoài. Đặt PUBLIC_ORIGIN theo tên miền và COOKIE_SECURE=1. Reverse proxy cần giới hạn body 15 MB; ứng dụng giới hạn tệp 10 MB và kiểm tra chữ ký JPEG/PNG/WebP/PDF. Trước triển khai diện rộng cần kiểm thử tải, kiểm tra an ninh và cơ chế quét tệp độc hại; chưa có trình quét virus.

SQLite phù hợp bản đầu một máy chủ. Nếu nhiều máy chủ hoặc tải ghi lớn, cần chuyển PostgreSQL và kho tệp dùng chung; không đặt file SQLite trên thư mục mạng hoặc hệ thống đĩa tạm thời. PWA cài trên điện thoại cần HTTPS; localhost chỉ là ngoại lệ khi dùng ngay trên cùng máy. Chưa kiểm chứng việc cài PWA trên thiết bị iOS/Android thực; manifest hiện dùng biểu tượng SVG, có thể cần bổ sung PNG 192/512 và apple-touch-icon theo thiết bị mục tiêu.

## Phạm vi đã làm và còn thiếu

Đã có đăng nhập, bốn vai trò và giới hạn phạm vi phía máy chủ; tổng quan; danh sách/chi tiết; lưu thật; khối lượng nhiều đơn vị và trọng số; bàn giao, thời hạn và lịch sử gia hạn; bất cập; đề xuất và duyệt; chuyển một lần; tải hồ sơ; tìm/lọc/sắp xếp; xuất XLSX; bố cục điện thoại; manifest/service worker; Gantt cơ bản; in PDF qua trình duyệt; nháp trên thiết bị; phát hiện xung đột; thông báo trong ứng dụng; audit và script backup.

Chưa có: PDF tạo ở máy chủ với mẫu báo cáo chuẩn; thống kê biến động theo tuần/tháng; đồng bộ nền tự động và hợp nhất từng trường; bản đồ ghim tương tác (hiện nhập tọa độ); push/email và cấu hình người nhận riêng; quản lý danh mục; sửa/khóa/đặt lại mật khẩu người dùng; tự đổi mật khẩu/MFA/SSO; xóa/khôi phục hồ sơ trong UI; xác minh tệp bằng antivirus; kiểm thử tải và kiểm thử thiết bị thật. Không có dữ liệu mẫu nên không cần xóa mẫu. Nhật ký lưu ảnh chụp trạng thái mỗi lần ghi nhưng UI hiện chỉ xem danh sách thao tác, chưa có giao diện diff toàn bộ lịch sử.

## Giai đoạn ứng dụng di động

Sau khi nghiệm thu PWA và API online, có thể đóng gói bằng Capacitor cho Android/iOS để dùng camera, lưu ngoại tuyến và push phù hợp từng nền tảng. Cần tài khoản Apple Developer/Google Play Console, chứng chỉ ký, chính sách quyền riêng tư, kiểm thử thiết bị, quy trình xét duyệt và phát hành riêng. Không có bản App Store/Google Play trong gói này.

## Kiểm thử

Chạy `node --test tests.mjs`; kiểm thử dùng thư mục tạm, máy chủ cổng 3107, không thay đổi data đang dùng. Chi tiết tại `TEST-RESULTS.md`.
