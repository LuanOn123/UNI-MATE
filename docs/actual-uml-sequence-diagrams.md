# Sơ đồ tuần tự UML — Luồng thực tế UNI-MATE

Tài liệu này được dựng từ frontend, route, controller, service, Socket.IO handler và Mongoose model hiện tại.

Quy ước lifeline theo UML robustness:

- `«boundary»`: màn hình/giao diện mà actor tương tác.
- `«control»`: controller hoặc service điều phối nghiệp vụ.
- `«entity»`: model/domain object được đọc hoặc thay đổi.
- Mũi tên liền: lời gọi; mũi tên đứt: dữ liệu/kết quả trả về.
- Khung `alt`, `opt`, `loop`, `par`: các combined fragment của UML.

## SD-01 — Đăng ký tài khoản

Luồng thật: đăng ký không xác thực OTP; backend tạo `User` với `emailVerified=true` và cấp token ngay.

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant UI as AuthPage «boundary»
    participant AC as AuthController «control»
    participant AS as AuthService «control»
    participant UE as User «entity»
    participant TS as TokenService «control»

    U->>UI: Nhập email, mật khẩu, xác nhận mật khẩu
    UI->>UI: Kiểm tra dữ liệu biểu mẫu
    UI->>AC: register(email, password)
    AC->>AS: registerWithPassword(email, password)
    AS->>UE: findOne(email)
    alt Email đã tồn tại
        UE-->>AS: Existing user
        AS-->>AC: Conflict
        AC-->>UI: 409 Email already exists
        UI-->>U: Hiển thị lỗi
    else Email chưa tồn tại
        AS->>AS: Hash password bằng bcrypt
        AS->>UE: create(email, passwordHash, emailVerified=true)
        UE-->>AS: User mới
        AS->>TS: issueTokens(user)
        TS->>UE: Lưu refreshTokenHash
        TS-->>AS: accessToken, refreshToken
        AS-->>AC: user và tokens
        AC-->>UI: 201 User và tokens
        UI->>UI: Lưu phiên đăng nhập
        UI-->>U: Điều hướng tới Onboarding
    end
```

## SD-02 — Đăng nhập thống nhất cho mọi vai trò

```mermaid
sequenceDiagram
    autonumber
    actor U as User / Partner / Admin
    participant UI as AuthPage «boundary»
    participant AC as AuthController «control»
    participant AS as AuthService «control»
    participant UE as User «entity»
    participant TS as TokenService «control»

    U->>UI: Nhập email và mật khẩu
    UI->>AC: login(email, password)
    AC->>AS: loginWithPassword(email, password)
    AS->>UE: findOne(email)
    alt Không có user hoặc không có passwordHash
        AS-->>UI: 401 Invalid email or password
    else User tồn tại
        AS->>AS: Khôi phục suspension nếu đã hết hạn
        alt User bị suspended, banned hoặc inactive
            AS-->>UI: 403 Account is locked
        else Tài khoản active
            AS->>AS: bcrypt.compare(password, passwordHash)
            alt Mật khẩu sai
                AS-->>UI: 401 Invalid email or password
            else Mật khẩu đúng
                AS->>UE: Cập nhật lastLoginAt, lastSeenAt
                AS->>TS: Phát hành accessToken và refreshToken
                TS->>UE: Lưu refreshTokenHash
                TS-->>AS: accessToken, refreshToken
                AS-->>AC: User và tokens
                AC-->>UI: 200 và HTTP-only refresh cookie
                UI->>UI: Lưu phiên đăng nhập
                UI-->>U: Điều hướng theo role/onboardingCompleted
            end
        end
    end

    Note over UI,AS: Admin, partner và user đều dùng cùng một luồng, không xác nhận OTP khi đăng nhập.
```

## SD-03 — Quên và đặt lại mật khẩu

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant UI as ForgotPasswordPage «boundary»
    participant AC as AuthController «control»
    participant AS as AuthService «control»
    participant UE as User «entity»
    participant OE as EmailOtp «entity»
    participant MAIL as MailService «control»

    U->>UI: Nhập email
    UI->>AC: forgotPasswordSendOtp(email)
    AC->>AS: sendPasswordResetOtp(email)
    AS->>UE: findOne(email)
    alt Email không tồn tại hoặc không dùng mật khẩu
        AS-->>UI: 404
    else Tài khoản hợp lệ
        AS->>OE: Tạo OTP có thời hạn
        AS->>MAIL: Gửi OTP
        MAIL-->>U: Email OTP
    end
    U->>UI: Nhập OTP
    UI->>AC: forgotPasswordVerifyOtp(email, otp)
    AC->>AS: verifyPasswordResetOtp(email, otp)
    AS->>OE: Kiểm tra OTP
    alt OTP không hợp lệ
        AS-->>UI: 400/429
    else OTP hợp lệ
        AS->>OE: consumed=true
        AS-->>UI: resetToken
        U->>UI: Nhập mật khẩu mới
        UI->>AC: resetPassword(resetToken, newPassword)
        AC->>AS: resetPasswordWithToken(...)
        AS->>AS: Xác minh resetToken và hash mật khẩu
        AS->>UE: Cập nhật passwordHash, xóa refreshTokenHash
        AS-->>UI: Reset thành công
        UI-->>U: Điều hướng đăng nhập
    end
```

## SD-04 — Hoàn thành onboarding và thiết lập vị trí

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant UI as OnboardingPage «boundary»
    participant UC as UserController «control»
    participant GEO as Nominatim «external»
    participant UE as User «entity»

    opt Người dùng nhập khu vực thủ công
        U->>UI: Chọn thành phố và quận
        UI->>UC: geocodeLocation(city, district)
        UC->>GEO: Search location
        GEO-->>UC: Danh sách kết quả
        UC->>UC: Lọc kết quả thuộc Việt Nam và đúng thành phố
        UC-->>UI: lat, lng, addressLabel
    end
    opt Người dùng tải avatar
        U->>UI: Chọn ảnh
        UI->>UC: uploadAvatar(file)
        UC-->>UI: avatarUrl
    end
    U->>UI: Hoàn thành thông tin và khảo sát
    UI->>UC: completeOnboarding(profile, survey, location)
    UC->>UC: Tính tuổi và cung hoàng đạo
    alt Tuổi nhỏ hơn 18 hoặc từ 30 trở lên
        UC-->>UI: 422 User must be from 18 to under 30
    else Tuổi hợp lệ
        UC->>UE: Cập nhật profile, onboarding, preferences, location
        UC->>UE: onboardingCompleted=true
        UE-->>UC: User đã cập nhật
        UC-->>UI: User
        UI-->>U: Điều hướng tới Discovery
    end
```

## SD-05 — Lấy Discovery Feed và like/pass

```mermaid
sequenceDiagram
    autonumber
    actor A as User A
    actor B as User B
    participant UI as DiscoveryPage «boundary»
    participant DC as DiscoveryController «control»
    participant MS as MatchingService «control»
    participant UE as User «entity»
    participant SE as Swipe «entity»
    participant OSRM as OSRM «external»
    participant ME as Match «entity»
    participant CE as ChatRoom «entity»
    participant NE as Notification «entity»
    participant WS as Socket.IO «control»

    A->>UI: Mở Discovery
    UI->>DC: getDiscoveryFeed()
    DC->>MS: getDiscoveryFeed(A)
    MS->>UE: Lấy A và kiểm tra vị trí
    MS->>SE: Lấy danh sách A đã swipe
    MS->>UE: Lọc blocked, role, status, tuổi, purpose, giới tính và bán kính
    MS->>OSRM: computeOsrmTable(A, candidates)
    OSRM-->>MS: Khoảng cách và thời gian di chuyển
    MS->>MS: Tính score, sắp xếp, lấy tối đa 10 user
    MS-->>UI: Candidate[]

    A->>UI: Chọn Like hoặc Pass B
    UI->>DC: swipe(B, action)
    DC->>MS: swipe(A, B, action)
    MS->>UE: Kiểm tra A, B và vị trí
    MS->>SE: upsert Swipe(A, B, action)
    alt action=pass
        MS-->>UI: matched=false
    else action=like
        MS->>SE: Tìm Swipe(B, A, like)
        alt B chưa like A
            MS->>NE: Tạo incoming_like cho B
            DC->>WS: emit notification:new tới B
            WS-->>B: Thông báo lượt thích
            MS-->>UI: liked=true, matched=false
        else Hai bên cùng like
            MS->>ME: Tìm Match hiện có
            alt Chưa có Match
                MS->>OSRM: Tính compatibility score A-B
                MS->>ME: create(status=chat_opened, expiresAt=72h)
                MS->>CE: create(status=active, users=[A,B])
                MS->>ME: Gắn chatRoom
            else Đã có Match
                MS->>CE: upsert ChatRoom active
                MS->>ME: status=chat_opened và gắn chatRoom
            end
            MS-->>UI: matched=true, Match
        end
    end
```

## SD-06 — Đề xuất và xác nhận quán

Luồng này vẫn tồn tại, nhưng mutual like đã mở chat trước. Khi A chọn quán, hệ thống thực tế đổi `Match` từ `chat_opened` về `cafe_proposed`; sau khi B xác nhận mới đổi lại `chat_opened`.

```mermaid
sequenceDiagram
    autonumber
    actor A as Người đề xuất
    actor B as Người nhận đề xuất
    participant UI as PlaceSuggestionsPage «boundary»
    participant MC as MatchController «control»
    participant PS as PlacesService «control»
    participant ME as Match «entity»
    participant PE as PlaceCache «entity»
    participant CPE as CafeProposal «entity»
    participant CE as ChatRoom «entity»
    participant NS as NotificationService «control»
    participant WS as Socket.IO «control»

    A->>UI: Mở danh sách quán gợi ý
    UI->>MC: placeSuggestions(matchId)
    MC->>ME: Tìm Match chứa A
    MC->>MC: Kiểm tra expiresAt
    alt Match đã hết hạn
        MC-->>UI: 410 Match expired
    else Match còn hiệu lực
        MC->>PS: suggestCafePlaces(users)
        PS->>PE: Tìm quán phù hợp/đang active
        PE-->>PS: Place[]
        PS-->>UI: Place[]
    end

    A->>UI: Chọn quán P
    UI->>MC: selectPlace(matchId, P)
    MC->>PE: Kiểm tra P có status=active
    MC->>ME: Kiểm tra A thuộc Match
    MC->>CPE: Đổi proposal active cũ thành replaced
    MC->>CPE: Tạo proposal(match, A, P, active)
    MC->>ME: selectedPlace=P, selectedBy=A
    MC->>ME: confirmedBy=[A], status=cafe_proposed
    MC->>NS: Tạo và emit thông báo cho B
    MC->>WS: emit match:updated cho A và B
    WS-->>B: Hiển thị đề xuất quán

    alt B đồng ý
        B->>UI: Xác nhận quán
        UI->>MC: confirmPlace(matchId)
        MC->>ME: addToSet B vào confirmedBy
        MC->>CPE: status=accepted
        MC->>CE: upsert(match, users, place, status=active)
        MC->>ME: chatRoom=room, status=chat_opened
        MC->>WS: emit match:updated
        WS-->>A: Match và chat đã cập nhật
        WS-->>B: Match và chat đã cập nhật
    else B từ chối
        B->>UI: Từ chối quán
        UI->>MC: rejectPlace(matchId)
        MC->>CPE: status=rejected
        MC->>ME: Xóa selectedPlace, selectedBy, confirmedBy
        MC->>ME: status=matched
        MC->>NS: Thông báo cafe_rejected cho A
        MC->>WS: emit match:updated
    end
```

## SD-07 — Chat cá nhân realtime

```mermaid
sequenceDiagram
    autonumber
    actor A as User A
    actor B as User B
    participant UIA as ChatRoomPage A «boundary»
    participant UIB as ChatRoomPage B «boundary»
    participant CC as ChatController «control»
    participant SK as SocketHandler «control»
    participant CE as ChatRoom «entity»
    participant ME as Match «entity»
    participant MSG as Message «entity»
    participant NS as NotificationService «control»

    A->>UIA: Mở phòng chat
    UIA->>CC: getRoom(roomId)
    CC->>CE: Tìm room có A
    CC->>ME: Lấy Match của room
    CC->>CC: Xác định blockedByMe/blockedByOther
    alt Match không chat_opened/blocked hoặc room không active/blocked
        CC-->>UIA: 403 Chat locked/inactive
    else Có quyền xem
        CC->>MSG: Lấy tối đa 100 tin theo createdAt
        CC-->>UIA: room, messages, blockState
        UIA->>SK: join_room(roomId)
        SK->>CE: Xác minh A thuộc room và room active
        SK->>SK: socket.join(roomId)
    end

    A->>UIA: Nhập tin nhắn
    UIA->>SK: typing_start(roomId)
    SK-->>UIB: user_typing(A, true)
    UIA->>SK: send_message(roomId, text/file)
    SK->>CE: Kiểm tra room active và A là thành viên
    SK->>ME: Kiểm tra status=chat_opened
    alt Không hợp lệ hoặc nội dung rỗng
        SK-->>UIA: message_error
    else Hợp lệ
        SK->>MSG: create(sender=A, readBy=[A])
        SK->>CE: Cập nhật lastMessage, lastMessageAt, hiddenBy=[]
        SK-->>UIA: new_message
        SK-->>UIB: new_message
        SK->>NS: Tạo Notification message cho B
        NS-->>UIB: notification:new
    end
    UIB->>SK: mark_read(roomId)
    SK->>MSG: addToSet B vào readBy
    SK-->>UIA: message_read(B)
```

## SD-08 — Quản lý nhóm và chat nhóm

```mermaid
sequenceDiagram
    autonumber
    actor O as Trưởng nhóm
    actor M as Thành viên
    participant GP as GroupPage «boundary»
    participant GCP as GroupChatPage «boundary»
    participant GC as GroupController «control»
    participant SK as SocketHandler «control»
    participant GE as Group «entity»
    participant UE as User «entity»
    participant GM as GroupMessage «entity»
    participant NS as NotificationService «control»

    O->>GP: Tạo nhóm
    GP->>GC: createGroup(name, description, purpose)
    GC->>GE: create(creator=O, members=[O])
    GE-->>GP: Group mới
    O->>GP: Thêm thành viên bằng email
    GP->>GC: addMember(groupId, email)
    GC->>GE: Kiểm tra creator, active, maxMembers
    GC->>UE: Tìm user active theo email
    alt Không có quyền, nhóm đầy hoặc user không hợp lệ
        GC-->>GP: 400/403/404
    else Hợp lệ
        GC->>GE: Thêm M vào members
        GC-->>GP: Group đã cập nhật
    end

    M->>GCP: Mở chat nhóm
    GCP->>GC: getGroupMessages(groupId)
    GC->>GE: Kiểm tra membership và status
    GC->>GM: Lấy lịch sử tin nhắn
    GC-->>GCP: GroupMessage[]
    GCP->>SK: join_group(groupId)
    SK->>GE: Xác minh membership và active
    SK->>SK: join(group:groupId)
    M->>GCP: Gửi tin nhắn
    GCP->>SK: send_group_message(data)
    SK->>GE: Kiểm tra group, membership
    alt Group dissolved, không phải member hoặc tin rỗng
        SK-->>GCP: group_message_error
    else Hợp lệ
        SK->>GM: create(sender=M, readBy=[M])
        SK-->>GCP: new_group_message
        SK->>NS: Tạo notification cho các member khác
    end

    opt Trưởng nhóm giải tán
        O->>GP: Giải tán nhóm
        GP->>GC: dissolveGroup(groupId)
        GC->>GE: status=dissolved
        GC-->>GP: Thành công
    end
```

## SD-09 — Báo cáo và block người dùng

```mermaid
sequenceDiagram
    autonumber
    actor U as Người báo cáo
    participant UI as ChatRoomPage/SafetyPage «boundary»
    participant UP as UploadController «control»
    participant SC as SafetyController «control»
    participant CE as ChatRoom «entity»
    participant RE as Report «entity»
    participant UE as User «entity»
    participant ME as Match «entity»

    opt Có ảnh bằng chứng
        U->>UI: Chọn ảnh
        UI->>UP: uploadReportEvidence(file)
        UP-->>UI: evidenceUrl
    end
    U->>UI: Nhập lý do và gửi report
    UI->>SC: reportUser(reportedUser, room, message, evidenceUrls)
    opt Report có room
        SC->>CE: Xác minh room chứa U và reportedUser
        alt Room không hợp lệ
            SC-->>UI: 400 Invalid chat room
        end
    end
    SC->>RE: create(report data)
    SC->>RE: distinct reporter theo reportedUser
    opt Có ít nhất 3 reporter khác nhau
        SC->>RE: priority=true cho report new/reviewing
    end
    SC-->>UI: 201 Report

    opt U block người kia
        UI->>SC: blockUser(targetUserId)
        SC->>UE: addToSet target vào blockedUsers của U
        SC->>ME: Tìm các Match giữa hai user
        SC->>ME: status=blocked
        SC->>CE: status=blocked
        SC-->>UI: User blocked
    end

    opt U bỏ block
        UI->>SC: unblockUser(targetUserId)
        SC->>UE: pull target khỏi blockedUsers của U
        SC->>UE: Kiểm tra target còn block U không
        alt Target không còn block U
            SC->>ME: blocked thành chat_opened
            SC->>CE: blocked thành active
        else Target vẫn block U
            SC-->>UI: Đã bỏ chặn nhưng người kia vẫn chặn bạn
        end
    end
```

## SD-10 — Admin xử lý báo cáo

```mermaid
sequenceDiagram
    autonumber
    actor AD as Admin
    actor T as Người bị báo cáo
    participant UI as AdminReportsPage «boundary»
    participant ADC as AdminController «control»
    participant RE as Report «entity»
    participant UE as User «entity»
    participant MSG as Message «entity»
    participant AA as AdminAction «entity»
    participant NS as NotificationService «control»
    participant WS as Socket.IO «control»

    AD->>UI: Mở chi tiết report
    UI->>ADC: getReportDetail(reportId)
    ADC->>RE: Lấy reporter, reportedUser, match, message, room
    opt Report có room
        ADC->>MSG: Lấy tối đa 200 message của room
    end
    ADC-->>UI: Report và lịch sử chat
    AD->>UI: Chọn dismiss, warn, suspend hoặc ban
    UI->>ADC: updateReport(reportId, action, options)
    ADC->>RE: Kiểm tra report chưa được xử lý
    ADC->>UE: Lấy reportedUser
    alt action=dismiss
        ADC->>RE: status=dismissed
    else action=warn
        ADC->>UE: warningCount++
        alt warningCount=1
            ADC->>NS: Gửi cảnh cáo
        else warningCount=2
            ADC->>UE: suspended 3 ngày
            ADC->>NS: Gửi thông báo suspension
        else warningCount=3
            ADC->>UE: suspended 10 ngày
            ADC->>NS: Gửi thông báo suspension
        else warningCount từ 4 trở lên
            ADC->>UE: status=banned
            ADC->>NS: Gửi thông báo ban
        end
        ADC->>RE: status=resolved_valid
    else action=suspend
        ADC->>UE: status=suspended, suspendedUntil
        ADC->>RE: status=resolved_valid
        ADC->>NS: Gửi thông báo suspension
    else action=ban
        ADC->>UE: status=banned, isActive=false
        ADC->>RE: status=resolved_valid
        ADC->>NS: Gửi thông báo ban
    end
    ADC->>RE: Lưu resolutionAction và adminNote
    ADC->>AA: Tạo audit log
    opt User bị suspended hoặc banned
        ADC->>WS: disconnectSockets(user:T)
        WS-->>T: Ngắt phiên realtime
    end
    ADC-->>UI: Report và kết quả moderation
```

## SD-11 — Partner đăng ký quán và admin duyệt

```mermaid
sequenceDiagram
    autonumber
    actor P as Chủ quán
    actor AD as Admin
    participant PUI as PartnerRegisterPage «boundary»
    participant AUI as AdminPlacesPage «boundary»
    participant PC as PlacesController «control»
    participant ADC as AdminController «control»
    participant PE as PlaceCache «entity»
    participant UE as User «entity»
    participant AA as AdminAction «entity»
    participant NS as NotificationService «control»

    P->>PUI: Nhập hồ sơ quán
    PUI->>PC: registerPartnerPlace(placeData)
    PC->>PC: Kiểm tra tên, vibe, chủ quán, giờ mở cửa
    PC->>PE: Tìm hồ sơ của P có status pending/active
    alt Đã có hồ sơ
        PC-->>PUI: 409 Hồ sơ đã tồn tại
    else Chưa có hồ sơ
        PC->>PE: create(isPartnerPlace=true, status=pending)
        PC-->>PUI: 201 Đang chờ admin duyệt
    end
    AD->>AUI: Chọn duyệt hoặc từ chối
    AUI->>ADC: setPlaceStatus(placeId, status)
    ADC->>PE: Cập nhật status
    alt status=active
        ADC->>UE: Cập nhật role=partner cho P
        ADC->>NS: Thông báo quán được duyệt
    else status=hidden hoặc rejected
        ADC->>NS: Thông báo quán chưa được duyệt
    end
    ADC->>AA: Tạo AdminAction
    ADC-->>AUI: Place đã cập nhật
```

## SD-12 — Partner tạo voucher và người dùng lưu voucher

```mermaid
sequenceDiagram
    autonumber
    actor P as Partner
    actor U as Người dùng
    participant PUI as PartnerDashboardPage «boundary»
    participant UUI as PlaceDetailPage «boundary»
    participant PC as PartnerController «control»
    participant PLC as PlacesController «control»
    participant PE as PlaceCache «entity»
    participant VE as Voucher «entity»

    P->>PUI: Nhập voucher
    PUI->>PC: createVoucher(placeId, voucherData)
    PC->>PE: Tìm quán thuộc P
    alt Không sở hữu quán
        PC-->>PUI: 403
    else Quán chưa active
        PC-->>PUI: 400 Chờ admin duyệt
    else Quán active
        PC->>VE: Kiểm tra code không trùng trong quán
        alt Code đã tồn tại
            PC-->>PUI: 400 Duplicate code
        else Hợp lệ
            PC->>VE: create(voucherData)
            PC-->>PUI: 201 Voucher
        end
    end

    U->>UUI: Mở chi tiết quán
    par Lấy thông tin quán
        UUI->>PLC: getPlace(placeId)
        PLC->>PE: Tìm Place active
        PLC-->>UUI: Place
    and Lấy voucher khả dụng
        UUI->>PLC: getPlaceVouchers(placeId)
        PLC->>VE: Lọc active, chưa hết hạn, còn lượt
        PLC-->>UUI: Voucher[] và savedByMe
    end
    U->>UUI: Lưu voucher
    UUI->>PLC: saveVoucher(placeId, voucherId)
    PLC->>VE: Kiểm tra U đã có trong savedBy
    alt Đã lưu trước đó
        PLC-->>UUI: saved=true, alreadySaved=true
    else Voucher hợp lệ và còn lượt
        PLC->>VE: addToSet U vào savedBy
        PLC->>VE: currentUsageCount++
        PLC-->>UUI: saved=true
    else Voucher hết hạn, hết lượt hoặc inactive
        PLC-->>UUI: 400 Voucher không khả dụng
    end
```

## Kết luận về luồng thật

Luồng hiện tại **không còn tuân thủ Cafe-Gated Chat**. `MatchingService.swipe()` mở `ChatRoom` ngay khi mutual like. Chức năng chọn quán vẫn tồn tại và thậm chí đổi một match đang `chat_opened` thành `cafe_proposed`, làm chat bị khóa trở lại cho đến khi người còn lại xác nhận. Đây là mâu thuẫn nghiệp vụ trong implementation, không phải cách diễn giải của sơ đồ.
