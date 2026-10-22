
# Đưa phiên bản 3 lên GitHub và Render

## 1. Chuẩn bị gói upload

Chạy `node --test tests.mjs infrastructure-tests.mjs pwa-tests.mjs`, sau đó `node package-release.mjs`. Mở `releases/ha-tang-cang-v3.2.0/` và đưa **nội dung bên trong** lên gốc repository GitHub. Gói không có dữ liệu hay tài khoản thật. Có thể dùng GitHub Desktop để thêm cả các thư mục public/, .github/, migrations/; đảm bảo không bỏ sót tệp ẩn như .node-version và .gitignore.

Không upload data/, preview-data/, demo-data/, backups/, releases/, .env, .private-login.txt hoặc bất kỳ tệp .sqlite nào. Không dán mật khẩu vào mã nguồn hay README. Nếu dùng Git, .gitignore đã loại các tệp này. Mã nguồn chưa được push hay deploy tự động từ máy này.

## 2. Tạo dịch vụ mới bằng Blueprint

Render → New → Blueprint → kết nối repository → chọn render.yaml → xem cấu hình và chi phí trước khi tạo.

Blueprint đã khai báo Node.js 24.19.0, build `node verify-build.mjs`, start `node server.mjs`, health `/healthz`, vùng Singapore, một instance, Persistent Disk 1 GB tại /var/data, DATA_DIR=/var/data. Gói máy chủ `0.5c-512mb` và Persistent Disk là tài nguyên trả phí; chủ tài khoản tự xác nhận khi tạo, chưa phát sinh tài nguyên từ công việc tại máy này. Không dùng Free cho lưu hồ sơ và ảnh thật vì không có ổ bền vững.

Blueprint yêu cầu nhập **ADMIN_PASSWORD** ít nhất 12 ký tự. **ADMIN_USERNAME=admin**. Có thể mở tệp đăng nhập riêng ở máy, lấy đúng mật khẩu và nhập vào Environment của Render nếu muốn dùng cùng thông tin. Không upload tệp mật khẩu. SETUP_TOKEN và RECOVERY_TOKEN được Render tạo ngẫu nhiên. Sau deploy, mở URL của dịch vụ và đăng nhập admin/mật khẩu đã nhập.

Auto Deploy là `checksPass`: chờ GitHub Actions kiểm thử xong trước khi Render tự deploy. Nếu chưa bật Actions, có thể Manual Deploy sau khi đã chạy kiểm thử tại máy.

## 3. Cập nhật dịch vụ Render đang có

Giữ DATA_DIR và Persistent Disk hiện có để không mất dữ liệu. Sao lưu DB và thư mục files/ trước nâng cấp. Cập nhật đủ mã nguồn ở repository, kiểm tra Build Command/Start Command/Health Check và NODE_VERSION=24.19.0 trong Environment. Biến NODE_VERSION trên dashboard có thể ghi đè .node-version. Chọn Manual Deploy → Deploy latest commit. Nếu Node vẫn sai, kiểm tra biến môi trường rồi Clear build cache & deploy.

Đặt COOKIE_SECURE=1. Trên Render, ứng dụng nhận HTTPS phía proxy, đồng thời lắng nghe 0.0.0.0 với PORT do Render cấp. PUBLIC_ORIGIN có thể đặt bằng URL HTTPS chính xác của ứng dụng nếu dùng domain riêng. Không đặt lại PORT khi Render đang cấp cổng.

ADMIN_PASSWORD chỉ tạo tài khoản trên DB trống, không thay mật khẩu của DB cũ. Để đặt lại quản trị có sẵn:

1. Environment: đặt RECOVERY_TOKEN thành chuỗi ngẫu nhiên riêng ít nhất 24 ký tự rồi lưu/khởi động lại dịch vụ.
2. Trang đăng nhập → Quên mật khẩu quản trị? → nhập username quản trị đang có, mật khẩu mới và RECOVERY_TOKEN.
3. Đăng nhập bằng mật khẩu mới. Mã khôi phục vừa dùng bị vô hiệu trong DB; nếu cần lần khác, tạo RECOVERY_TOKEN mới trên Render.

Phương án Render Shell: đặt ADMIN_USERNAME và ADMIN_PASSWORD phù hợp trong Environment, chạy `node reset-admin.mjs`. Lệnh sao lưu DB trước, thu hồi phiên cũ, không xóa công trình và ảnh. Không tải .private-login.txt lên GitHub.

## 4. Xác nhận sau triển khai

- Log có dòng Ứng dụng: http://0.0.0.0:<PORT>; /healthz trả ok:true.
- Trang đăng nhập có nền vàng cam và hình cảng; không còn mục Phương tiện thiết bị.
- Đăng nhập, khai báo một hạng mục, tạo sửa chữa và đầu tư mới, gán người phối hợp.
- Đi qua phê duyệt, nhập ngày bàn giao và thi công, cập nhật khối lượng theo ngày và một ảnh hiện trường.
- Tạo công việc hạn sau 4 ngày để xem cảnh báo. Chọn Xuất Excel và In/Lưu PDF để kiểm tra báo cáo.
- Restart hoặc deploy lại; xác nhận hồ sơ và ảnh còn nguyên. Nếu mất, kiểm tra Persistent Disk và DATA_DIR ngay.

## 5. Tự khắc phục và chẩn đoán

`node doctor.mjs` kiểm tra môi trường, tệp và DB. Nếu public/ bị bỏ sót khi upload, build tự phục hồi đủ 14 tệp từ public-bundle.json. Nếu sửa nguồn nhưng chưa cập nhật gói, build báo khác SHA-256: chạy `node bundle-public.mjs` trên bản nguồn đúng rồi upload gói mới. Không sửa/xóa DB để chữa lỗi giao diện.

GitHub Actions đã có kiểm thử backend, dữ liệu bền vững, hai luồng nghiệp vụ và Docker tại PORT=10000. Docker chưa được xác nhận chạy trên tài khoản Render thực tế ở lần bàn giao này.

Tài liệu chính thức đã đối chiếu: [Render Blueprint](https://render.com/docs/blueprint-spec), [Persistent Disk](https://render.com/docs/disks), [Health Check](https://render.com/docs/health-checks), [Node Version](https://render.com/docs/node-version).



## Cài ứng dụng sau khi deploy v3.1

Mở URL HTTPS Render trên từng thiết bị, chọn Cài ứng dụng. Không dùng địa chỉ 127.0.0.1 của máy Windows trên điện thoại. Nếu dịch vụ đã chạy bản cũ, upload gói mới có 14 tệp public và public-bundle.json mới rồi deploy. Xem CAI-DAT.md.


