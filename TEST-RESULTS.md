## Bản kiểm tra tự động và đóng gói mới

Chạy trên Node.js 24.19.0: **9 nhóm đạt, 0 lỗi**. Ca mới dựng mã nguồn chỉ có tệp gốc, không có public: build tự khôi phục 7 tài nguyên, trang chủ/JS/CSS/manifest/service worker đều trả 200. Gói bị sửa nội dung bị chặn bởi SHA-256 trước khi ghi tệp. Bổ sung ca chặn chuyển trạng thái thiếu dữ liệu/khôi phục hồ sơ đã kết thúc và ca lưu trữ công việc sau khi các hư hỏng đã đóng.

Kiểm tra trình duyệt: đăng nhập minh họa; mở 11 màn hình chính/quản trị, không ghi nhận console error. Kiểm tra bố cục viewport 390 × 844: không tràn ngang toàn trang, bảng có vùng cuộn riêng. Đây là giả lập kích thước trên máy tính, chưa thay thế điện thoại thật.

Docker/CI/Render thực tế chưa chạy: máy chưa có Docker; trình duyệt GitHub và Render chưa đăng nhập. Đã chuẩn bị workflow build/test/Docker và gói cập nhật, chưa tuyên bố deployment thành công.

## Bản sửa Render trước đó

Đã kiểm tra build và 8 nhóm kiểm thử đạt. Ca mới mô phỏng thiếu toàn bộ thư mục public: GET/HEAD trả 500, máy chủ vẫn trả health 200 và bind 0.0.0.0 khi RENDER=true. Chưa triển khai lại trên Render thực tế.

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
# Kết quả mở rộng phiên bản 2 — 21/10/2026

Chạy `node --test tests.mjs` trên Node.js 24.19.0 / Windows: **8 nhóm kiểm thử đạt, 0 lỗi**. Kiểm thử dùng DB tạm, không dùng data thật.

| Nhóm | Nội dung đã chạy |
|---|---|
| Thời hạn | Thiếu ngày bắt đầu/hạn, đến hạn 0 ngày, quá hạn, hoàn thành sớm/trễ, hủy |
| Tiến độ | Trọng số nhiều đơn vị, không suy từ thời gian |
| Phân hệ cũ | Đăng nhập, đọc/ghi theo quyền, lưu, version/409, gia hạn giữ hạn đầu, duyệt/chuyển đề xuất một lần, chữ ký tệp |
| Luồng mới | 10 nhóm hạ tầng/6 loại thiết bị, mã trùng, nhiều phiếu và hư hỏng, duyệt, bàn giao bắt buộc, tiến độ 101% bị chặn, 100% chưa nghiệm thu, kết quả riêng từng hư hỏng, đóng, lịch sử kỹ thuật, khoảng dừng không trùng, tạo việc bảo dưỡng một lần, chặn API cũ vượt quy trình, tệp ngoài quyền |
| XLSX | Xuất và đọc lại tiếng Việt, preview theo dòng, nhập thật, mã trùng không nhập lại, dữ liệu thiếu trả lỗi, tệp sai định dạng bị chặn |
| Sao lưu/phục hồi | Dừng máy chủ, chạy backup.mjs, phục hồi DB+tệp vào thư mục sạch, integrity_check=ok, đăng nhập và tải tệp sau phục hồi |
| Vận hành | Scheduler tự ghi cảnh báo khi không có HTTP/browser, không tạo trùng, cấu hình mốc, đơn vị, khóa thu hồi phiên, không khóa quản trị cuối, khởi động lại giữ DB và cảnh báo |

Kiểm tra thủ công trên trình duyệt trong ứng dụng: trang đăng nhập có thông tin nhận diện; đăng nhập môi trường minh họa; tổng quan đếm đúng 2 tài sản; mở danh sách/chi tiết; tạo và lưu phiếu kiểm tra bằng biểu mẫu, máy chủ xác nhận và mở chi tiết. Dữ liệu thử chỉ ở demo-data/. Chưa kiểm tra toàn bộ thao tác UI như các ca API.

## Giới hạn và các bước nghiệm thu còn chờ

- Chưa có tên miền/HTTPS công khai; chưa kiểm tra 4G/5G, mạng Internet khác, điện thoại/tablet thật, camera thật hoặc bản in/PDF thực tế. CSS responsive có trong mã, chưa thay thế kiểm tra thiết bị thực.
- Chưa có Docker tại máy này, chưa chạy image/Compose/Caddy/systemd timer, chưa kiểm tra chứng chỉ và reverse proxy thực.
- Đã diễn tập phục hồi DB+tệp cục bộ; chưa kiểm tra phục hồi từ kho ngoài máy chủ.
- Chưa benchmark tải, kiểm thử xâm nhập độc lập, quét virus tệp hoặc kiểm tra độ bền đĩa/đầy ổ.
- Phạm vi đơn vị và phân công đã có; chưa cấu hình ma trận từng chức năng riêng cho từng người. Lãnh đạo/quản trị hiện có quyền toàn hệ thống. Người phối hợp chỉ đọc.
- Cơ sở dữ liệu SQLite lưu phần nghiệp vụ trong JSON; chưa chuẩn hóa thành các bảng nghiệp vụ/PostgreSQL. Chỉ hỗ trợ một instance trên đĩa local.
- Chu kỳ ngày/giờ/km có kế hoạch, mốc và cảnh báo; lần bảo dưỡng tiếp theo cần tạo kế hoạch mới, chưa tự sinh chuỗi kế hoạch lặp. Checklist là nội dung văn bản, chưa có kết quả đánh dấu riêng từng ô/checklist và danh mục vật tư độc lập.
- Mốc sửa chữa có tên, lịch kế hoạch/thực tế, người phụ trách, khối lượng và trọng số. Lịch/Gantt hiện hiển thị công việc tổng thể.
- Báo cáo có lọc khu vực/nhóm, loại, người phụ trách, đơn vị, trạng thái, thời gian và sắp/quá hạn/hoàn thành trễ. Tổng quan chưa có bộ lọc toàn cục; một số chỉ số tổng hợp chưa có drill-down riêng.
- PDF xuất qua hộp thoại in trình duyệt, chưa có API tạo PDF nền. XLSX đã kiểm tra cấu trúc bằng đọc lại, chưa mở bằng Excel desktop. Nhập Excel hiện chỉ áp dụng tài sản từ mẫu quy định.
- Hồ sơ/tệp mới chủ yếu ảnh và PDF; chưa nhận bản vẽ CAD/Word/tệp khác. Chưa gắn từng ảnh riêng từng dòng nhật ký. Tài sản theo cây công trình/bộ phận; đơn vị/khu vực là trường văn bản, chưa có danh mục tổ chức nhiều cấp độc lập.
- Màn hình gia hạn duyệt trực tiếp có người đề xuất, chưa có hàng đợi đề nghị gia hạn/tách hai người đề xuất và duyệt bắt buộc.
- Chưa gửi email; không ghi nhận giả là đã gửi. Không có khôi phục mật khẩu tự phục vụ bằng email, quản trị đặt lại và thu hồi phiên.
- Nháp mới dùng sessionStorage; ảnh chưa được khôi phục, chưa tự đồng bộ nền. Có UI lưu trữ/khôi phục hồ sơ và xem JSON audit; chưa có so sánh từng trường trực quan.

Vì các mục này, **chưa đánh dấu nghiệm thu đầy đủ toàn bộ đặc tả**. Mã nguồn hiện chạy được và có luồng nghiệp vụ chính được kiểm chứng; cần hoàn thiện các giới hạn liên quan và nghiệm thu staging trước khi đưa vào vận hành chính thức.

---


