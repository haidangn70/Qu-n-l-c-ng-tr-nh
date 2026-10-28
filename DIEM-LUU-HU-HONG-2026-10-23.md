# Điểm lưu Hư hỏng & đề xuất · 23/10/2026

Người dùng đã xem, chấp nhận các chỉnh sửa và yêu cầu lưu lại để tiếp tục sửa những phần tiếp theo. Giữ các chức năng hiện tại; chờ người dùng chỉ định phần tiếp theo.

## Nội dung đã chấp nhận

- Thay Hạng mục hạ tầng bằng ô nhập trực tiếp **Vị trí, địa điểm hư hỏng**. Lưu được hồ sơ mới không liên kết hạng mục; giữ liên kết và quyền truy cập của hồ sơ cũ.
- **Người phụ trách chính** và **Người phối hợp** là ô nhập tên trực tiếp, mặc định trống, có thể bổ sung hoặc xóa khi cập nhật.
- Chọn nhiều ảnh hiện trường lúc tạo/cập nhật, xem trước ảnh mới, xem ảnh đã lưu và bổ sung ảnh sau trong chi tiết. Hỗ trợ JPEG/PNG/WebP/PDF tối đa 10 MB mỗi tệp.
- Khi tải ảnh lỗi, hồ sơ đã lưu được giữ; cho thay tệp và thử lại mà không tạo trùng hồ sơ hoặc tải lại ảnh đã thành công.
- Danh sách, chi tiết, bộ lọc và Excel hiển thị vị trí và tên nhập trực tiếp cho hồ sơ không có hạng mục.
- Giữ nguyên phần **Thông tin công trình sửa chữa và tiến độ** đã được chấp nhận: khu vực hạ tầng, nhà thầu, ngày dự kiến/thực tế, tiến độ 0–100%, phân công, vướng mắc và cảnh báo trước hạn 4 ngày. Chi tiết mốc cũ trong `DIEM-LUU-2026-10-23.md`.

## Kiểm tra và tiếp tục

- Bộ kiểm thử: `node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs` — **26/26 đạt**. Build đạt; `node verify-build.mjs` đã kiểm tra lại khi lưu mốc này.
- Đã thử trên dữ liệu tạm: tạo với tên phân công trống; chọn nhầm tệp rồi thay bằng hai ảnh và lưu lại; mở sửa, nhập tên và thêm ảnh thứ ba. Xác nhận chỉ có một hồ sơ, ba ảnh, vị trí/tên lưu đúng. Không nhập dữ liệu thử vào hồ sơ thật.
- Phần mềm đang dùng: http://127.0.0.1:3130/. Phiên sau kiểm tra máy chủ còn chạy trước khi dùng.
- Giao diện: `public/app.js`; nghiệp vụ: `operations.mjs`; kiểm thử: `infrastructure-tests.mjs`. Ghi nhớ tổng thể: `GHI-NHO-DU-AN.md`; hướng dẫn: `GUIDE.md`; bằng chứng: `TEST-RESULTS.md`.
- Sau sửa giao diện chạy `node bundle-public.mjs`, `node verify-build.mjs` và các kiểm tra phù hợp.
- Bản lưu mã nguồn: `releases/Ha-tang-Cang-2026-10-23-Hu-hong-de-xuat.zip`; thư mục cùng nội dung: `releases/ha-tang-cang-2026-10-23-hu-hong-de-xuat/`. Có danh sách SHA-256 để kiểm tra từng tệp.
- Bản lưu gồm mã nguồn, hướng dẫn và ghi chú; không chứa cơ sở dữ liệu, ảnh thực tế, mật khẩu hoặc tệp môi trường riêng. Dữ liệu thật vẫn ở thư mục sử dụng hiện tại.
- Giữ nguyên ZIP mốc sửa chữa trước đó. Chưa triển khai các thay đổi mới lên GitHub/Render.
