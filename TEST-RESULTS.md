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
# Kiểm tra bổ sung ngày 23/10/2026 · Thông tin công trình sửa chữa và tiến độ

- `node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs`: **23/23 đạt**.
- `node verify-build.mjs`: đạt; gói phục hồi giao diện đã cập nhật bằng `node bundle-public.mjs`.
- Hai kiểm thử mới xác nhận nhập/sửa tên phân công trực tiếp, kiểm tra độ dài/kiểu dữ liệu, cập nhật ngày và tiến độ có lịch sử; cảnh báo tại 4, 3, 1, 0 ngày và quá hạn, chưa cảnh báo khi còn 5 ngày, độc lập với mốc chung đã đổi.
- Kiểm tra trình duyệt trên cơ sở dữ liệu tạm riêng: tạo công trình bằng biểu mẫu gọn; khi chưa chọn hạng mục, tự mở phần chọn và giữ dữ liệu đã nhập; chọn hạng mục rồi lưu thành công. Cập nhật một công trình đang thi công từ 0% lên 45%, sửa hai tên phân công, lưu và mở lại xác nhận. Thẻ và chi tiết hiển thị đúng dữ liệu, lịch sử ghi 0% → 45%.
- Máy chủ sử dụng tại cổng 3130 đã khởi động lại, `/healthz` trả `ok: true`. Không thêm hồ sơ kiểm thử vào dữ liệu sử dụng thật.


## Bỏ khai báo hạng mục mới khỏi sửa chữa · 23/10/2026

- Đã bỏ nút, các ô nhập, nhánh tạo hạng mục mới và trạng thái nháp liên quan khỏi biểu mẫu sửa chữa; chỉ chọn hạng mục đã có.
- `node bundle-public.mjs` và `node verify-build.mjs`: đạt.
- Đã mở lại biểu mẫu trong trình duyệt với bản nháp cũ: giữ thông tin công trình, ngày và tên phân công; phần Hạng mục hạ tầng liên quan chỉ hiển thị khu vực, tìm kiếm và danh sách. Không còn ô bắt buộc của hạng mục mới. Chưa có hạng mục thì hướng dẫn quản lý tại Hạng mục & khu vực. Không tạo dữ liệu thật trong lúc kiểm tra.

## Biểu mẫu sửa chữa theo khu vực và sửa lỗi lưu/tiến độ · 23/10/2026

- Bộ kiểm thử tự động: **25/25 đạt**. Hai kiểm thử mới kiểm tra công trình không có hạng mục, tiến độ ban đầu 45,5%, sửa trước phê duyệt, ngày thực tế, cảnh báo 4 ngày và phạm vi đơn vị. Chặn khu vực trống/sai và tiến độ ngoài 0–100%, rỗng/null/không phải số.
- Trình duyệt trên DB tạm hoàn toàn trống: nhập tên, chọn Nhà văn phòng, hạn, tiến độ 45%, tên phụ trách/phối hợp; lưu thành công và thẻ xuất hiện. Mở lại sửa lên 65%, lưu thành công, thẻ hiển thị đúng. Không có hạng mục nào trong DB này.
- Phần mềm sử dụng tại 127.0.0.1:3130 đã nạp lại máy chủ; bản nháp của người dùng được mở lại với dữ liệu đã nhập. Không tạo hồ sơ sử dụng thật trong lúc kiểm tra.
- Kiểm tra bổ sung trên trình duyệt: tải lại trang vẫn thấy công trình ở 65%; biểu mẫu nghiệm thu riêng nhập ngày/kết luận và chuyển thành Đã nghiệm thu thành công, không cần mở lại Thông tin bổ sung.

## Nhà thầu thực hiện và Vướng mắc phát sinh · 23/10/2026

- Build đạt; bộ kiểm thử hiện có **25/25 đạt**.
- Trên DB tạm riêng: tạo hồ sơ có nhà thầu A và vướng mắc ban đầu, mở bằng trình duyệt, đổi sang nhà thầu B và bổ sung vướng mắc vật tư, lưu thành công; thẻ hiển thị đúng hai nội dung mới.
- Đọc lại API xác nhận hai giá trị đã lưu; tiến độ 45%, kinh phí và ghi chú bổ sung của hồ sơ kiểm thử được giữ.
- Đã tải lại phần mềm sử dụng thật và mở biểu mẫu cập nhật có hai ô mới. Không thay đổi hồ sơ thật trong lúc kiểm tra.
- Ảnh minh họa dữ liệu kiểm thử: releases/sua-chua-nha-thau-vuong-mac.png.

## Hư hỏng: vị trí trực tiếp, nhập tên và thêm ảnh · 23/10/2026

- `node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs`: **26/26 đạt**. Build và gói phục hồi giao diện đã cập nhật, đạt.
- Kiểm thử API mới: tạo báo cáo chỉ có vị trí, không hạng mục, không tài khoản phụ trách; hai tên để trống. Cập nhật/xóa tên và đổi vị trí, lưu/đọc ảnh có xác thực; chặn vị trí rỗng/sai kiểu/quá dài và tên sai kiểu/quá dài. Các kiểm thử liên kết cũ vẫn đạt.
- Thử trình duyệt với DB tạm trống: tạo báo cáo với hai tên trống; chọn tệp TXT không hỗ trợ, hồ sơ được lưu và thông báo ảnh lỗi. Chọn lại 2 PNG qua hộp chọn tệp và bấm Lưu lần nữa: thành công, chỉ có 1 báo cáo.
- Mở lại báo cáo: ảnh cũ hiển thị; gõ hai tên và chọn thêm PNG thứ 3; lưu thành công. API xác nhận đúng 1 hồ sơ/3 ảnh, hai tên lưu đúng, không có assetId giả hoặc dữ liệu File trong hồ sơ JSON.
- Đã khởi động lại máy chủ sử dụng thật tại 3130 và khôi phục bản nháp cũ vào biểu mẫu mới; hai ô tên trống, ô vị trí nhập tự do và phần ảnh hiển thị. Không tự lưu hồ sơ thật.
## Bỏ mục Nhật ký hiện trường riêng ngày 28 tháng 10 năm 2026

- Build đạt; gói phục hồi giao diện gồm 14 tệp đã cập nhật SHA-256.
- Bộ kiểm thử hiện có: **26/26 đạt**, không có kiểm thử thất bại. Các ca kiểm tra nhật ký, cập nhật tiến độ, ảnh gắn đúng nhật ký và chống xóa lịch sử qua cập nhật hồ sơ vẫn đạt trên dữ liệu tạm.
- Trình duyệt thật tại cổng 3130: tải lại giao diện, mở menu, xác nhận mục Kiểm tra hiện trạng vẫn hiển thị và nút Nhật ký hiện trường không còn.
- Chỉ sửa giao diện và tài liệu; API và dữ liệu sử dụng thật được giữ.

## Kiểm tra hiện trạng nhập trực tiếp và ảnh · 28/10/2026

- Build đạt; gói phục hồi giao diện 14 tệp đã cập nhật. Bộ kiểm thử: **28/28 đạt**.
- Kiểm thử API mới: nhập hạng mục tự do, nhiều người kiểm tra, tên/chức danh phụ trách và phối hợp; lưu/đọc hai ảnh có xác thực, thay đổi/xóa thông tin, giữ ảnh cũ, thử lại sau lỗi ảnh không tạo trùng phiếu. Chặn kiểu/độ dài sai, hạng mục trống, người kiểm tra/kết luận trống, liên kết sai và chuyển đơn vị ngoài phạm vi. Tên tự do không cấp quyền cho tài khoản trùng tên.
- Phiếu định dạng cũ vẫn liên kết hạng mục và cập nhật đánh giá kỹ thuật; nhập mô tả hạng mục trên phiếu không đổi tên danh mục.
- Trình duyệt trên DB tạm tại localhost:3127: tạo phiếu với ba người kiểm tra, hai người phối hợp, hai chức danh và hai PNG; mở lại đổi hạng mục/chức danh, bổ sung PNG thứ ba, lưu thành công. Danh sách còn đúng một phiếu; chi tiết hiển thị đủ ba ảnh. Không lưu File hoặc assetId giả trong JSON.
- Máy chủ thật tại cổng 3130 đã khởi động lại, `/healthz` trả `ok: true`. Biểu mẫu mới đã mở với bản nháp Ray cầu tàu và tên cũ; không tự lưu hồ sơ thật. Ảnh xác nhận: `.artifacts/inspection-form-20261028/inspection-direct-entry.png`, `inspection-form.png`, `inspection-attachments.png`.


## Cập nhật 29/10/2026 · Tổng hợp Hạng mục & khu vực

- Build và gói 14 tệp public đạt; bộ kiểm thử 30/30 đạt.
- Hai kiểm tra mới xác nhận tổng hợp hư hỏng/sửa chữa theo khu vực, hồ sơ chưa phân khu, liên kết nhiều khu vực không trùng tổng số, tên khu vực chứa dấu phẩy, mốc nhắc sửa chữa 4 ngày và loại hồ sơ đã kết thúc/lưu trữ. API kiểm tra danh mục khu vực hư hỏng, hỗ trợ đổi tên và giữ khu vực cũ đã ẩn.
- Trình duyệt trên DB tạm: 4 hư hỏng và 3 công trình đang theo dõi; chọn kho hiện 2 hồ sơ, lọc quá hạn còn 1. Bổ sung khu vực cho hồ sơ chưa phân khu từ biểu mẫu giữ tổng 7 hồ sơ, nhóm chưa phân khu biến mất. Màn hình không còn nút khai báo hạng mục.
- Bản thật cổng 3130 đã nạp mã mới, hiển thị 2 hư hỏng chưa chọn khu vực và 1 công trình Nhà văn phòng (60%). Không sửa hồ sơ thật. Kiểm tra giao diện cửa sổ hẹp không tràn nội dung; không ghi nhận lỗi JavaScript.
- Chứng cứ và kết quả: `.artifacts/area-watch-20261029/`; máy chủ thử 3127 đã dừng.

## Cập nhật 29/10/2026 · Đầu tư nhập trực tiếp và rà soát tổng thể

- Bộ kiểm thử hiện tại: 41/41 đạt, build đạt. Chi tiết các vấn đề và phạm vi kiểm tra trong RA-SOAT-2026-10-29.md.
- Đầu tư: tạo tên phân công trống, sửa hạng mục/tên trực tiếp, thêm bốn ảnh; lỗi ảnh thử lại không trùng hồ sơ, Excel đọc lại đúng.
- Rà soát: kiểm tra–hư hỏng–nhiều công trình, chặn đóng sớm, khóa ảnh sau kết thúc, phạm vi đơn vị với hồ sơ liên kết, ngày thực tế, ID liên kết, tiến độ theo mốc không vượt quy trình và cảnh báo theo mốc cập nhật thực tế.
- Trình duyệt mở đủ 9 màn hình không ghi nhận lỗi JavaScript; thử đầu tư qua bàn giao, báo cáo 45% kèm ảnh, hoàn thành và nghiệm thu; cập nhật mốc lên 65%; khu vực ẩn vẫn chọn và giữ được; nội dung nguồn chuyển đúng giữa kiểm tra, hư hỏng và sửa chữa.
- Dữ liệu thử tách khỏi data/ thật. Chứng cứ: .artifacts/investment-direct-entry-20261029/ và .artifacts/full-review-20261029/.
