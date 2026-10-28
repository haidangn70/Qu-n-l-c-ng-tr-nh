# Ghi nhớ dự án · Phần mềm quản lý hạ tầng Cảng

Cập nhật ngày 23/10/2026. Phiên bản đang có: **3.2.0**, đã chỉnh biểu mẫu công trình sửa chữa và Hư hỏng & đề xuất theo các mốc được người dùng chấp nhận.

## Cập nhật ngày 23/10/2026 · trạng thái mới nhất

- Người dùng đã xem, chấp nhận phần **Hư hỏng & đề xuất** và yêu cầu lưu để tiếp tục chỉnh sửa các phần tiếp theo. Điểm tiếp tục mới: `DIEM-LUU-HU-HONG-2026-10-23.md`; bản lưu mã nguồn: `releases/Ha-tang-Cang-2026-10-23-Hu-hong-de-xuat.zip`. Chờ người dùng chỉ định phần tiếp theo.
- Phần **Hư hỏng & đề xuất** đã bỏ chọn Hạng mục hạ tầng trong biểu mẫu, thay bằng ô gõ trực tiếp **Vị trí, địa điểm hư hỏng** (`location`). Hồ sơ mới có thể lưu khi không có hạng mục; liên kết hạng mục/phiếu kiểm tra cũ được giữ và vẫn kiểm tra quyền.
- Hai ô **Người phụ trách chính**, **Người phối hợp** đổi thành nhập tên trực tiếp, mặc định trống cho hồ sơ mới, không bắt buộc. Dùng `responsibleName`/`collaboratorNames`; không tự gán tên quản trị để hiển thị. Tài khoản người tạo/quyền truy cập và phân công cũ được giữ riêng; người dùng có thể bổ sung hoặc xóa tên.
- Có chọn nhiều ảnh hiện trường ngay khi tạo/cập nhật; xem trước ảnh mới, xem ảnh đã lưu khi sửa, thêm sau bằng Đính kèm trong chi tiết. Dùng bộ tải tệp hiện có (JPEG/PNG/WebP/PDF tối đa 10 MB/tệp). Lưu hồ sơ trước ảnh, thông báo rõ lỗi ảnh và cho thử lại mà không tạo trùng hồ sơ.
- Cập nhật bộ lọc dữ liệu, danh sách/chi tiết, tên hiển thị và cột vị trí trong Excel để hồ sơ không có hạng mục không biến mất sau lưu.
- Kiểm tra mới nhất **26/26 đạt**, build đạt. Trình duyệt trên dữ liệu tạm: lưu báo cáo với tên phân công trống, chọn nhầm tệp rồi thay bằng 2 PNG và thử lại (chỉ 1 hồ sơ); mở lại nhập tên và bổ sung PNG thứ 3. API xác nhận 1 hồ sơ/3 ảnh, tên/vị trí lưu đúng. Không nhập dữ liệu thử vào hồ sơ thật. Máy chủ thật cổng 3130 đã được khởi động lại; bản nháp báo cáo của người dùng đã mở trong biểu mẫu mới.
- Bản lưu mới gồm cả phần sửa chữa và hư hỏng đã được chấp nhận. ZIP điểm lưu phần sửa chữa trước đó được giữ nguyên. Các ZIP chỉ chứa mã nguồn/tài liệu, không chứa cơ sở dữ liệu, ảnh thực tế, mật khẩu hoặc tệp môi trường riêng.

- Mốc lưu phần sửa chữa trước đó nằm trong `DIEM-LUU-2026-10-23.md`; bản lưu mã nguồn riêng: `releases/Ha-tang-Cang-2026-10-23-Luu-tiep-tuc.zip`. Giữ phần sửa chữa hiện tại khi tiếp tục các phần khác.

- Bổ sung **Nhà thầu thực hiện** (`contractor`, dùng lại trường hiện có) và **Vướng mắc phát sinh** (`issues` ở hồ sơ công trình) vào biểu mẫu sửa chữa. Hai ô tùy chọn, nhập được khi tạo và sửa bằng Cập nhật thông tin & tiến độ. Hiển thị trên thẻ và chi tiết; tìm kiếm theo nhà thầu/vướng mắc. `dailyLogs[].issues` vẫn là vướng mắc của từng lần ghi nhật ký, tách khỏi nội dung hiện tại trên hồ sơ.
- Đã kiểm tra lưu hai trường qua API và cập nhật bằng trình duyệt trên dữ liệu tạm; xác nhận nhà thầu/vướng mắc mới lưu đúng, tiến độ, kinh phí và ghi chú cũ giữ đúng. Build đạt, bộ kiểm thử hiện có 25/25 đạt. Đã mở biểu mẫu thật của người dùng với hai ô mới; không tự nhập/lưu thông tin nhà thầu hoặc vướng mắc thật.

- Đã bỏ hoàn toàn hai phần **Thông tin bổ sung** và **Hạng mục hạ tầng liên quan** khỏi biểu mẫu sửa chữa; thay bằng ô **Khu vực hạ tầng** chọn danh mục trực tiếp. Công trình mới không cần có hạng mục hoặc hư hỏng liên kết.
- Đã sửa cả giao diện và API để nhập/lưu tiến độ **0–100% ngay khi tạo hoặc sửa** công trình thông thường, kể cả trước phê duyệt. Hồ sơ cũ tính tiến độ theo mốc vẫn giữ cách tính đó. Không tự phê duyệt/nghiệm thu theo %. Có thể nhập ngày bắt đầu và hoàn thành thực tế khi khai báo.
- Biểu mẫu tự sinh mã công trình; các dữ liệu bổ sung/liên kết của hồ sơ cũ được giữ khi chỉnh sửa. Nghiệm thu sửa chữa thu thập ngày, kết luận, kết quả hư hỏng tại bước xác nhận nghiệm thu.
- Sửa bộ lọc dữ liệu giao diện để công trình chỉ có khu vực vẫn xuất hiện trên thẻ, tổng quan, báo cáo và cảnh báo. Lưu xong quay về danh sách sửa chữa.
- Kiểm tra mới nhất: **25/25 đạt**, build đạt. Trình duyệt với DB trống không có hạng mục: chọn Nhà văn phòng, tạo ở 45%, mở lại và cập nhật lên 65%, hiển thị đúng trên thẻ. Môi trường kiểm thử dùng localhost để không ghi đè cookie đăng nhập tại 127.0.0.1. Bản nháp thực tế đã được khôi phục vào biểu mẫu mới; không tự lưu dữ liệu thật.

### Các lần chỉnh trước trong ngày

- Đổi tên mục sửa chữa thành **Thông tin công trình sửa chữa và tiến độ**. Nút tạo mới: **Thêm công trình sửa chữa**; mỗi thẻ có **Cập nhật thông tin & tiến độ**.
- Biểu mẫu chính gồm tên công trình, ngày bắt đầu dự kiến, hạn hoàn thành, tiến độ %, tên người phụ trách chính, tên người phối hợp và ghi chú ngắn. Khi sửa có ngày bắt đầu/hoàn thành thực tế; gia hạn dùng chức năng có lưu lý do và hạn gốc.
- Theo yêu cầu tiếp theo ngày 23/10: đã bỏ hoàn toàn khai báo hạng mục mới khỏi biểu mẫu sửa chữa; chỉ chọn hạng mục đã có. Hạng mục mới được khai báo ở Hạng mục & khu vực. Thu gọn phần chọn hạng mục và thông tin bổ sung (mã, nhà thầu, kinh phí, tài khoản, ảnh). Tự mở phần liên quan khi thiếu dữ liệu bắt buộc.
- Tên hiển thị được nhập trực tiếp qua `responsibleName`, `collaboratorNames`, không bắt buộc tạo tài khoản mới; hiển thị trong thẻ, chi tiết, tổng quan, báo cáo và Excel. Tài khoản phân công vẫn được giữ riêng để kiểm soát quyền truy cập như trước.
- Sửa chữa luôn dùng mốc cảnh báo **4, 1, 0 ngày và quá hạn**, kể cả khi thay đổi mốc chung cho đầu tư/hồ sơ khác. Đổi tiến độ trong biểu mẫu ghi lịch sử người và thời điểm cập nhật. Giữ quy trình phê duyệt, bàn giao và nghiệm thu; công trình mới có tiến độ 0%.
- Kiểm thử: **23/23 đạt**, build đạt. Đã thử trên cơ sở dữ liệu tạm riêng: tạo công trình, tự mở phần chọn hạng mục khi thiếu, lưu tiến độ 45%, thay tên phụ trách/phối hợp và mở lại xác nhận. Không nhập dữ liệu kiểm thử vào data/.
- Máy chủ sử dụng hiện tại: `http://127.0.0.1:3130/`. Đã khởi động lại để nạp thay đổi máy chủ. Chưa đóng gói ZIP hoặc triển khai bản cập nhật này lên GitHub/Render; gói release 3.2.0 cũ chưa chứa các thay đổi ngày 23/10.

## Cách tiếp tục làm việc

Người dùng muốn giữ phần mềm hiện có và tiếp tục rà soát, chỉnh sửa **từng phần**. Người dùng xác nhận còn nhiều vấn đề cần chỉnh sửa; chưa liệt kê đầy đủ. Không coi việc hoàn thành bản 3.2.0 là toàn bộ phần mềm đã hoàn thiện. Chờ nội dung cụ thể của từng lượt để sửa và kiểm tra trên nền hiện tại.

## Mục tiêu và yêu cầu đã thống nhất

- Quản lý riêng hạ tầng cảng; giao diện vàng cam, có hình minh họa cảng, trực quan và dễ sử dụng.
- Sửa chữa: theo dõi bàn giao mặt bằng, thời gian thi công, hạn/ngày hoàn thành; cảnh báo mặc định trước hạn 4 ngày; nhật ký tiến độ, khối lượng theo ngày và ảnh hiện trường; người phụ trách chính và phối hợp.
- Đầu tư mới: theo dõi từng bước, phân công, tiến độ và cảnh báo.
- Khu vực: cầu cảng; đường bãi xếp hàng; nhà văn phòng; cổng cảng; kho; nhà xưởng sửa chữa; bãi roro; nạo vét khu nước trước bến, luồng hàng hải; khu vực khác. Có thể bổ sung danh mục.
- Theo dõi hiện trạng, kiểm tra, báo cáo hư hỏng, đề xuất sửa chữa và báo cáo thống kê.
- Có khả năng cài dạng ứng dụng PWA trên máy tính/điện thoại. Mục tiêu triển khai do người dùng upload mã nguồn lên GitHub và Render.

## Trạng thái sau lượt sửa gần nhất

- Bản 3.1.1 đã sửa ô chọn khu vực/hạng mục, nhập bổ sung hư hỏng và đổi hạng mục liên quan trong đầu tư.
- Bản 3.2.0 sửa riêng công tác sửa chữa: chọn khu vực bằng các ô, chọn hạng mục bằng các dòng hiển thị trực tiếp, tìm mã/tên/vị trí và khai báo hạng mục mới ngay trong cùng biểu mẫu. Cho phép chọn lại hạng mục khi sửa hồ sơ chưa khóa, vẫn kiểm tra liên kết hư hỏng.
- Nguyên nhân quan sát tại data/ khi sửa: có danh mục khu vực nhưng **chưa có hồ sơ hạng mục hạ tầng**, nên danh sách cũ trống. Ô hạng mục trong hồ sơ sửa chữa đã có cũng bị khóa. Không tự tạo dữ liệu hạng mục thật để lấp danh sách.
- Màn hình sửa chữa chuyển sang các thẻ tiến độ, ngày bàn giao/thi công/hạn, phân công và ảnh thu nhỏ.
- Có biểu mẫu Bàn giao & bắt đầu thi công và Cập nhật tiến độ & ảnh. Nhật ký chỉ ghi tiến độ không bắt buộc khối lượng; khối lượng là lựa chọn bổ sung. Ảnh gắn đúng nhật ký, có thể thêm sau. Tỷ lệ 100% vẫn cần khai báo hoàn thành và qua quy trình nghiệm thu.
- Tài khoản sử dụng thật không được đặt lại trong lượt 3.2.0. Không ghi mật khẩu vào tài liệu hoặc gói nguồn.

## Vị trí và kỹ thuật

- Thư mục làm việc: `C:\Users\CHUAVE\Documents\ChatGPT\Phần mềm quản lý hạ tầng`.
- Node.js 24, SQLite, không có thư viện npm bên ngoài bắt buộc để chạy. Lần kiểm tra trước có Node v24.19.0; npm không nằm trên PATH, dùng các lệnh node trực tiếp.
- Máy chủ: `server.mjs`; nghiệp vụ: `operations.mjs`; quy tắc chung: `domain.mjs`.
- Giao diện: `public/app.js`, `public/style.css`, `public/form-controls.js`; PWA: `public/pwa.js`, manifest và service worker.
- Dữ liệu sử dụng thật: `data/`. Dữ liệu minh họa: `preview-data/`. Không trộn dữ liệu kiểm thử vào dữ liệu thật.
- URL đã chạy ở cuối lượt 3.2.0: bản sử dụng `http://127.0.0.1:3130/`, bản minh họa `http://127.0.0.1:3120/`. Cần kiểm tra máy chủ còn chạy trước khi dùng lại; đây là URL cục bộ trên máy tính này.
- Trong data/ đã quan sát 2 hồ sơ loại project cũ và 0 hạng mục hạ tầng. Đây là ảnh chụp trạng thái tại thời điểm kiểm tra, cần đọc lại trước khi dựa vào; không tự xóa hoặc chuyển đổi các hồ sơ cũ.

## Kiểm tra và đóng gói

- Bộ kiểm thử gần nhất: `node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs` — **26/26 đạt** (kiểm tra lại ngày 23/10/2026, gồm biểu mẫu hư hỏng và ảnh đính kèm).
- `node verify-build.mjs` đạt; `node doctor.mjs` đạt, SQLite quick_check = ok.
- Đã thử giao diện với dữ liệu minh họa: chọn hạng mục, tạo hạng mục trong sửa chữa, giữ bản nháp, đổi hạng mục hồ sơ đã lưu, duyệt/bàn giao/khởi công, lưu tiến độ 45% không nhập khối lượng. Đã thử cả cơ sở dữ liệu hoàn toàn trống và lập được hồ sơ đầu tiên.
- Đã kiểm tra chọn nhiều ảnh PNG qua hộp chọn tệp trên trình duyệt, lưu, mở lại và thêm ảnh; chọn nhầm loại tệp rồi thử lại không tạo trùng hồ sơ. Chưa xác nhận cài thực tế trên điện thoại vật lý, Docker tại máy hoặc deploy GitHub/Render thực tế. Chi tiết trong `TEST-RESULTS.md`.
- Sau sửa giao diện chạy `node bundle-public.mjs` để cập nhật gói SHA-256, rồi kiểm tra build. Gói phục hồi hiện gồm 14 tệp public.
- Đóng gói bằng `node package-release.mjs`. Script dùng danh sách tệp nguồn cho phép, không đưa data/, preview-data/, .env, tệp mật khẩu hoặc releases/ vào bản giao.
- Bản nguồn sạch 3.2.0: `releases/ha-tang-cang-v3.2.0/`.
- ZIP đã bàn giao: `releases/Ha-tang-Cang-v3.2.0-Sua-chua-tien-do-hinh-anh.zip` — 51 tệp, 276066 byte tại thời điểm tạo.
- Hướng dẫn: `GUIDE.md`, `SUA-CHUA-3.2.md`, `RENDER.md`, `CAI-DAT.md`.
- Hình giao diện kiểm thử: `releases/sua-chua-tien-do-v3.2.png`.

Giữ dữ liệu và những chức năng đang dùng khi chỉnh sửa từng phần; kiểm tra đúng vấn đề người dùng báo và cập nhật ghi chú này khi có thay đổi đáng kể.
