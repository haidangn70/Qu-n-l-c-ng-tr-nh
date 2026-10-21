# Phần mềm theo dõi cơ sở hạ tầng, phương tiện thiết bị

**Phòng Kỹ thuật - Công ty cổ phần Cảng Hải Phòng.**  
**Người thiết kế: Mr Đăng. · Điện thoại: 0914931888.**

## Chạy và kiểm thử

Yêu cầu Node.js 24 trở lên, không cần cài gói npm.

```powershell
node server.mjs
node --test tests.mjs
```

Mở http://127.0.0.1:3000. Nếu cổng bận, đặt `$env:PORT='3001'` trước khi chạy. Giữ nguyên tài khoản và dữ liệu hiện có. Cài mới: tạo quản trị với mật khẩu tối thiểu 12 ký tự, không có tài khoản mặc định. Chạy HTTPS cần SETUP_TOKEN do quản trị máy chủ cấp.

`node demo.mjs` chạy minh họa tại http://127.0.0.1:3109, lưu riêng `demo-data/`. Tài khoản `minhhoa` có mật khẩu ngẫu nhiên in ở terminal lần đầu. Tài sản ghi rõ [MINH HỌA]. Không dùng môi trường này cho dữ liệu thật.

## Hướng dẫn sử dụng

1. **Quản trị:** tạo tài khoản riêng với vai trò. Trong **Tài khoản / Thông tin**, khóa/mở, đặt lại mật khẩu và cấp phạm vi đơn vị. Người dùng tự đổi mật khẩu với mật khẩu hiện tại. Thay đổi tài khoản thu hồi các phiên cũ.
2. **Cơ sở hạ tầng / Phương tiện thiết bị:** nhập mã duy nhất, nhóm, đơn vị, khu vực, vị trí, người phụ trách và thông số. Tài sản có tài sản cấp trên; không cho cấu trúc vòng lặp. Vận hành và kỹ thuật tách riêng.
3. **Chi tiết tài sản → Tạo phiếu kiểm tra:** mỗi lần một hồ sơ riêng. Chọn tình trạng kỹ thuật để cập nhật đánh giá mới nhất và lịch sử. Từ phiếu ghi nhiều hư hỏng, đính kèm ảnh/PDF, mức ưu tiên, hạn và đề xuất.
4. **Hư hỏng:** Mới ghi nhận → Đánh giá → Đề xuất → Phê duyệt. Lãnh đạo duyệt, trả lại hoặc từ chối; trả lại/từ chối cần lý do.
5. **Công việc sửa chữa:** chọn nhiều hư hỏng đã duyệt, lập kế hoạch, kinh phí, phân công. Chờ phê duyệt → Đã phê duyệt → Chờ bàn giao → Đang thực hiện. Phải có ngày bàn giao và bắt đầu thực tế.
6. **Cập nhật tiến độ:** nhập 0–100% trực tiếp hoặc theo mốc có tổng trọng số 100%. Nhật ký nêu việc đã làm, tiếp theo, khó khăn và đề xuất. Quá hạn mà đổi tiến độ phải có nguyên nhân, biện pháp và dự kiến hoàn thành. Lãnh đạo gia hạn với hạn cũ/mới, lý do, người đề xuất và thời điểm duyệt; giữ nguyên hạn gốc.
7. **Nghiệm thu:** 100% không tự hoàn thành/nghiệm thu. Nhập ngày hoàn thành rồi chuyển Hoàn thành sửa chữa → Chờ nghiệm thu. Lãnh đạo nhập ngày/kết luận nghiệm thu và kết quả riêng từng hư hỏng, chuyển Đã nghiệm thu → Đã đóng. Sau đó đóng từng hư hỏng.
8. **Bảo dưỡng/kiểm định:** chu kỳ ngày/giờ/km, checklist, người thực hiện, hạn và mốc đồng hồ. Tạo công việc một lần từ kế hoạch; vẫn phải duyệt/nghiệm thu. Nghiệm thu cập nhật kết quả và chi phí về kế hoạch.
9. **Cảnh báo:** máy chủ kiểm tra mỗi phút, lưu DB, đánh dấu đọc/xử lý theo tài khoản; hạn công việc, kiểm tra, kiểm định, giờ/km, lâu chưa cập nhật. Mặc định 7/3/1 ngày; cấu hình trên màn hình Cảnh báo hoặc API `/api/v2/settings`. Chưa gửi email khi chưa có dịch vụ.
10. **Báo cáo:** tìm, lọc đơn vị, người phụ trách, trạng thái và khoảng ngày, sắp xếp/phân trang. Excel xuất toàn bộ dữ liệu lọc; In/PDF in toàn bộ dữ liệu lọc với kỳ, ngày, người lập và chỗ ký. Chọn **Lưu thành PDF** trong hộp thoại in. Lịch/Gantt nằm cuối danh sách công việc khi có ngày bắt đầu và hạn.

## Nhập Excel

Chọn **Nhập Excel → Tải tệp mẫu**, giữ nguyên 10 cột. `Loại` dùng infrastructure hoặc equipment. Nhóm/trạng thái khớp danh mục, người phụ trách dùng ID trên màn hình. Chọn tệp để xem trước và sửa lỗi từng dòng trước khi xác nhận. Ghi cả lô trong một giao dịch; mã trùng bị từ chối. Chỉ hỗ trợ sheet1 với giá trị văn bản/số, không nhận công thức/macro/mẫu đổi cột. Tối đa 1.000 dòng, tệp 10 MB, giải nén 20 MB. Xuất XLSX dùng ô chuỗi, không biến nội dung thành công thức.

## Kiến trúc, dữ liệu và phân quyền

- Node.js 24, giao diện JavaScript cùng origin, SQLite WAL trên ổ bền vững, tệp riêng ngoài public. Giữ nền tảng sẵn có để dễ vận hành, chưa chuyển React/PostgreSQL khi chưa có nhu cầu nhiều instance hoặc đo tải. Dữ liệu chính không lưu trong trình duyệt.
- `server.mjs`: HTTP, phiên, tệp, phân hệ cũ. `operations.mjs`: tài sản và quy trình mới. `xlsx.mjs`: đọc XLSX có giới hạn giải nén. `public/operations.js`: màn hình nghiệp vụ.
- DB: users, sessions, records, files, audit, settings, catalogs, alerts, alert_receipts, request_keys, operation_settings, migrations. Hồ sơ có kind, version, JSON nghiệp vụ. Quan hệ ID được máy chủ xác minh; chưa chuẩn hóa từng trường thành bảng riêng. `schema.sql` và `migrations/002-operations.sql` mô tả cấu trúc. Migration idempotent tự chạy khi khởi động, thêm users.unit nếu thiếu, không xóa dữ liệu cũ.
- Hồ sơ cũ nằm ở **Công trình / Đề xuất sửa chữa / Sửa chữa: tổng quan cũ**, không tự chuyển thành tài sản hoặc cộng vào tổng tài sản mới. Xem `README-LEGACY.md`.
- Quản trị/lãnh đạo có phạm vi toàn hệ thống. Cán bộ kỹ thuật/người phụ trách sửa chữa/manager ghi trong phạm vi. Người phối hợp/người xem chỉ đọc. Tài khoản thường xem hồ sơ tự tạo, được giao chính/phối hợp hoặc thuộc đơn vị được cấp. Hồ sơ con suy đơn vị theo tài sản; công việc theo các tài sản liên quan. Hồ sơ ngoài phạm vi trả 404, tệp trả 403; máy chủ chặn sửa qua API cũ để vượt quy trình mới.
- Mật khẩu scrypt + salt; cookie HttpOnly/SameSite Strict, Secure khi HTTPS; phiên 12 giờ; kiểm tra Origin; giới hạn thử đăng nhập; CSP; kiểm tra chữ ký JPEG/PNG/WebP/PDF.
- Cập nhật có version/409; tạo mới có Idempotency-Key và mã duy nhất; audit có người/giờ/trước/sau, không lưu mật khẩu. Có lưu trữ/khôi phục hồ sơ kèm lý do; không xóa hồ sơ trong UI.
- Nháp biểu mẫu mới nằm trong sessionStorage theo tài khoản, chỉ báo đã lưu sau xác nhận máy chủ. Ảnh chưa được khôi phục trong nháp. Không tự đồng bộ khi có mạng lại.

## Quy tắc thời hạn

Ngày lịch, Asia/Ho_Chi_Minh. Đến hạn hôm nay là 0 ngày, hôm sau trễ 1 ngày. Không tự trừ thời gian tạm dừng, không cấu hình ngày làm việc. Tiến độ không suy từ thời gian; tổng(progress × weight)/100 khi có mốc, trọng số phải tổng 100. Tỷ lệ đúng hạn = công việc hoàn thành không muộn hơn hạn gốc / công việc có ngày hoàn thành. Gia hạn không xóa trễ theo kế hoạch gốc. Dừng thiết bị chỉ có một khoảng mở tại mỗi thời điểm, thời điểm do máy chủ ghi, tránh cộng trùng.

## Bàn giao

Xem [DEPLOYMENT.md](DEPLOYMENT.md) cho triển khai, chi phí dự phòng, sao lưu/khôi phục và thông tin còn cần. Xem [TEST-RESULTS.md](TEST-RESULTS.md) cho kiểm thử và giới hạn nghiệm thu. Chưa có HTTPS công khai, chưa kiểm chứng trên mạng di động/mạng Internet khác và chưa phát sinh chi phí dịch vụ.
