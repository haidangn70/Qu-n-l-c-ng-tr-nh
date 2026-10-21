# Triển khai và vận hành

## Lựa chọn và ngân sách dự phòng

Một VPS 2 vCPU/4 GB RAM, SSD bền vững từ 40 GB, Linux, Docker Compose. Ưu tiên hạ tầng sẵn có của đơn vị; chọn Việt Nam/Singapore nếu cần độ trễ thấp. Một instance app dùng SQLite, không đặt DB trên NFS hoặc ổ tạm. Tăng dung lượng ảnh theo sử dụng thực tế; quy mô lớn/nhiều instance cần chuyển PostgreSQL/kho tệp chung sau đánh giá tải.

| Hạng mục | Ngân sách dự phòng |
|---|---:|
| VPS | 300.000–700.000 VNĐ/tháng |
| Tên miền | 300.000–1.000.000 VNĐ/năm |
| DB/ảnh | Trong dung lượng SSD VPS, mở rộng khi cần |
| Bản sao ngoài máy chủ | 100.000–300.000 VNĐ/tháng |
| HTTPS qua Caddy | Không thu phí chứng chỉ |
| Email | 0 khi chưa bật, chưa tích hợp gửi |
| Staging thuê riêng | Thêm 300.000–700.000 VNĐ/tháng hoặc máy sẵn có |

Đây là khoản dự phòng riêng, chưa phải báo giá hoặc cam kết mua. Nguồn giá đối chiếu ngày 21/10/2026: [Hetzner Cloud](https://www.hetzner.com/cloud/cost-optimized/), [bảng điều chỉnh giá](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [Cloudflare Registrar](https://domains.cloudflare.com/), [giá đuôi tên miền](https://pricing.registrar.cloudflare.com/). Khoảng VNĐ không phải quy đổi trực tiếp từ nguồn. Chủ đầu tư chọn nhà cung cấp, nơi lưu dữ liệu, hóa đơn và tổng chi phí trước khi đặt dịch vụ.

## Thông tin cần cung cấp trước khi online

1. Máy chủ/tài khoản triển khai, SSH/Docker và chính sách nơi lưu dữ liệu.
2. Tên miền và quyền DNS, người quản lý gia hạn.
3. Danh sách đơn vị, người dùng, vai trò/phạm vi và quản trị viên nhận bàn giao.
4. Kho sao lưu độc lập, chính sách lưu giữ/mã hóa và kênh cấp quyền.
5. Thời gian bảo trì, mục tiêu RPO/RTO. Gợi ý ban đầu RPO 24 giờ, RTO 4 giờ, cần diễn tập xác minh.
6. Người thử trên điện thoại/mạng di động và mạng Internet thứ hai.
7. Nếu muốn email: dịch vụ SMTP/API, miền gửi, người nhận, ngân sách; cần bổ sung tích hợp trước khi bật.

Không commit bí mật; bàn giao bằng trình quản lý mật khẩu/kênh an toàn của đơn vị.

## Đưa lên máy chủ

1. Sao chép mã nguồn vào `/opt/hatang`, cài Docker/Compose theo quy trình máy chủ.
2. Sao chép `.env.example` thành `.env`, cấu hình DOMAIN, PUBLIC_ORIGIN và SETUP_TOKEN ngẫu nhiên. Không dùng giá trị mẫu. `.env` đã được gitignore.
3. Trỏ DNS A/AAAA về IP thật; chỉ để AAAA nếu IPv6 hoạt động. Mở 80/443, không mở app 3000 hoặc DB ra ngoài.
4. Chạy `docker compose config`, sau đó `docker compose up -d --build`. Caddy cấp HTTPS khi DNS/cổng đúng. App lưu ở volume app-data.
5. Vào HTTPS, tạo quản trị bằng SETUP_TOKEN; chỉ cài mới mới cho khởi tạo. Không dùng tài khoản demo. Giao mật khẩu qua kênh an toàn và đổi sau nhận bàn giao.
6. Kiểm tra health, hồ sơ, tệp, quyền, cảnh báo và khởi động lại. Chạy nghiệm thu staging trước production.

Cấu hình Docker/Caddy chưa được chạy trên máy này vì chưa có Docker. Node.js 24 được kiểm chứng trực tiếp trên Windows. Không tuyên bố đã triển khai HTTPS.

## Sao lưu tự động

`node backup.mjs` tạo SQLite nhất quán bằng VACUUM INTO và sao chép files vào backups/timestamp. Dừng app trong lúc sao lưu để DB/tệp đồng nhất.

Docker: tạo thư mục backups cho UID node trong container có quyền ghi. Chạy `APP_DIR=/opt/hatang /bin/sh deploy/backup.sh`; script dừng app, chạy backup container và khởi động app lại qua trap kể cả lỗi. Đưa deploy/hatang-backup.service và .timer vào /etc/systemd/system, đặt đúng đường dẫn, chạy daemon-reload và enable --now timer. Lịch 02:00 giờ Việt Nam, cần kiểm chứng ở staging.

Chính sách đề nghị: 14 bản ngày, 8 bản tuần, 12 bản tháng. Chưa tự xóa bản cũ: chỉ bật sau khi chọn kho độc lập và xác nhận sao chép thành công. Sao chép ra kho có mã hóa khác máy chủ, theo dõi dung lượng, tuổi backup và mã thoát. Bản sao cùng SSD chưa bảo vệ khỏi mất VPS.

## Phục hồi

1. Dừng app, bảo toàn một bản DB/tệp hiện tại.
2. Khôi phục app.sqlite và files từ cùng backup vào thư mục sạch, đặt đúng chủ sở hữu. Không trộn WAL/SHM cũ.
3. Chạy staging với DATA_DIR/hostname/volume tách biệt, không dùng chung volume production.
4. Chạy PRAGMA integrity_check, đối chiếu số hồ sơ, đăng nhập, mở tệp, kiểm tra audit/cảnh báo.
5. Ghi thời gian/kết quả rồi mới chuyển production. Diễn tập toàn bộ DB+tệp từ kho ngoài máy chủ còn chờ.

## Cập nhật, rollback và giám sát

Giữ release/image cũ, backup trước nâng cấp. Thử migration trên bản sao staging trước. Khi lỗi, dừng bản mới, giữ dữ liệu lỗi điều tra; quay image cũ và backup trước migration nếu DB không tương thích. Đối chiếu dữ liệu phát sinh sau backup trước quyết định phục hồi; không chỉ đổi image khi DB không tương thích.

Health `/healthz` kiểm tra DB, không lộ nghiệp vụ. Compose có restart policy, healthcheck và xoay log. Cần cấu hình monitor ngoài máy chủ cho HTTPS/health, miền, SSD, tuổi backup và lỗi tác vụ. Audit nghiệp vụ tách log lỗi vận hành.

Nghiệm thu staging: quyền URL/API/tệp, người xem không ghi, khóa thu hồi phiên, xung đột 409, 100% chưa nghiệm thu, gia hạn giữ gốc, cảnh báo khi đóng trình duyệt, dữ liệu sau restart, nhập lỗi không ghi một phần, báo cáo khớp lọc, chụp ảnh thật, truy cập 4G/5G và Internet thứ hai. Các kiểm tra mạng ngoài còn chờ tên miền/HTTPS.
