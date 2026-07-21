from pathlib import Path
from urllib.request import Request, urlopen

OUT = Path(r"D:\SWD\UNI-MATE\.codex-tmp\sds-doc\diagrams")
OUT.mkdir(parents=True, exist_ok=True)

THEME = "%%{init: {'theme':'base','themeVariables': {'primaryColor':'#FCE4D6','primaryTextColor':'#222222','primaryBorderColor':'#A63A2B','lineColor':'#555555','secondaryColor':'#DDEBF7','tertiaryColor':'#FFFFFF','fontFamily':'Calibri','fontSize':'16px'}}}%%\n"

DIAGRAMS = {
"01_architecture": r"""flowchart TB
  subgraph Client[Frontend - React/Vite]
    Pages[Feature Pages]
    Store[Zustand Auth Store]
    HTTP[Axios API Client]
    SC[Socket.IO Client]
  end
  subgraph Server[Backend - Express/TypeScript]
    Routes[Routes and Middleware]
    Controllers[Controllers]
    Services[Domain Services]
    Socket[Socket.IO Handlers]
    Models[Mongoose Models]
  end
  DB[(MongoDB)]
  Places[Google Places / Cache]
  OSRM[OSRM Routing]
  Nominatim[Nominatim Geocoding]
  Mail[SMTP / Email]
  Uploads[(Local Uploads)]
  Pages --> Store
  Pages --> HTTP --> Routes --> Controllers --> Services --> Models --> DB
  Pages --> SC <--> Socket
  Socket --> Models
  Services --> Places
  Services --> OSRM
  Controllers --> Nominatim
  Services --> Mail
  Controllers --> Uploads
""",
"02_packages": r"""flowchart LR
  app[app/routes] --> mw[middlewares]
  app --> ctrl[controllers]
  ctrl --> svc[services]
  ctrl --> model[models]
  svc --> model
  svc --> util[utils/config]
  socket[sockets] --> model
  socket --> svc
  routeUI[frontend app/routes] --> features[frontend features]
  features --> api[services/lib api]
  features --> socketClient[lib socket]
  features --> store[stores]
  api -. REST .-> app
  socketClient -. WebSocket .-> socket
""",
"03_er_core": r"""erDiagram
  USER ||--o{ SWIPE : performs
  USER ||--o{ SWIPE : receives
  USER }o--o{ MATCH : participates
  MATCH ||--o{ CAFE_PROPOSAL : has
  USER ||--o{ CAFE_PROPOSAL : proposes
  PLACE_CACHE ||--o{ CAFE_PROPOSAL : proposed
  MATCH ||--o| CHAT_ROOM : opens
  CHAT_ROOM ||--o{ MESSAGE : contains
  USER ||--o{ MESSAGE : sends
  USER ||--o{ NOTIFICATION : receives
  PLACE_CACHE ||--o{ CHAT_ROOM : selected_for
  USER {
    ObjectId id
    string email
    string role
    string status
    object onboarding
    GeoJSON location
  }
  MATCH {
    ObjectId id
    ObjectId users
    string status
    ObjectId selectedPlace
    ObjectId chatRoom
  }
  CHAT_ROOM {
    ObjectId id
    ObjectId match
    ObjectId users
    string status
  }
  MESSAGE {
    ObjectId id
    ObjectId room
    ObjectId sender
    string type
    string text
  }
""",
"04_er_extended": r"""erDiagram
  USER ||--o{ GROUP : creates
  USER }o--o{ GROUP : joins
  GROUP ||--o{ GROUP_MESSAGE : contains
  USER ||--o{ GROUP_MESSAGE : sends
  USER ||--o{ REPORT : submits
  USER ||--o{ REPORT : reported
  MATCH ||--o{ REPORT : context
  CHAT_ROOM ||--o{ REPORT : context
  MESSAGE ||--o{ REPORT : evidence
  USER ||--o{ ADMIN_ACTION : performs
  USER ||--o{ PLACE_CACHE : owns
  PLACE_CACHE ||--o{ VOUCHER : offers
  USER ||--o{ VOUCHER : creates
  USER }o--o{ VOUCHER : saves
  TAG }o--o{ PLACE_CACHE : categorizes
  USER ||--o{ EMAIL_OTP : requests
""",
"05_class_auth": r"""classDiagram
  class AuthPage { +submit(email,password) }
  class OtpPage { +verify(code) +resend() }
  class AuthController { +registerController() +loginController() +verifyOtpController() +refreshController() }
  class AuthService { +registerWithPassword() +loginWithPassword() +sendEmailOtp() +verifyEmailOtp() +issueTokens() }
  class UserController { +completeOnboarding() +updateProfile() +updateLocation() }
  class User
  class EmailOtp
  AuthPage --> AuthController
  OtpPage --> AuthController
  AuthController --> AuthService
  AuthService --> User
  AuthService --> EmailOtp
  UserController --> User
""",
"06_class_matching_chat": r"""classDiagram
  class DiscoveryController { +feedController() +likeController() +passController() }
  class MatchingService { +getDiscoveryFeed() +scoreUsers() +swipe() }
  class MatchController { +selectPlace() +confirmPlace() +rejectPlace() +cancelMatch() }
  class ChatController { +listRooms() +getRoom() +sendMessage() }
  class SocketHandler { +join_room() +send_message() +mark_read() }
  class Swipe
  class Match
  class CafeProposal
  class ChatRoom
  class Message
  DiscoveryController --> MatchingService
  MatchingService --> Swipe
  MatchingService --> Match
  MatchingService --> ChatRoom
  MatchController --> Match
  MatchController --> CafeProposal
  MatchController --> ChatRoom
  ChatController --> ChatRoom
  ChatController --> Message
  SocketHandler --> ChatRoom
  SocketHandler --> Message
""",
"07_class_group_partner": r"""classDiagram
  class GroupController { +createGroup() +addMember() +removeMember() +dissolveGroup() }
  class GroupChatController { +getGroupMessages() +sendGroupMessage() }
  class PlacesController { +listPlaces() +registerPartnerPlace() +saveVoucher() }
  class PartnerController { +updateMyPlace() +createVoucher() +toggleVoucherStatus() }
  class Group
  class GroupMessage
  class PlaceCache
  class Voucher
  GroupController --> Group
  GroupChatController --> Group
  GroupChatController --> GroupMessage
  PlacesController --> PlaceCache
  PlacesController --> Voucher
  PartnerController --> PlaceCache
  PartnerController --> Voucher
""",
"08_class_safety_admin": r"""classDiagram
  class SafetyController { +reportUser() +blockUser() +unblockUser() }
  class AdminController { +dashboard() +updateUserStatus() +updateReport() +hidePlace() }
  class NotificationService { +createAndEmitNotification() }
  class Report
  class User
  class Match
  class ChatRoom
  class AdminAction
  class Notification
  SafetyController --> Report
  SafetyController --> User
  SafetyController --> Match
  SafetyController --> ChatRoom
  AdminController --> Report
  AdminController --> User
  AdminController --> AdminAction
  AdminController --> NotificationService
  NotificationService --> Notification
""",
"09_seq_login": r"""sequenceDiagram
  autonumber
  actor U as User/Admin
  participant UI as Auth/Otp UI boundary
  participant C as AuthController control
  participant S as AuthService control
  participant E as User and EmailOtp entity
  U->>UI: Submit email and password
  UI->>C: login(credentials)
  C->>S: loginWithPassword()
  S->>E: Find user and verify state/password
  alt invalid or locked
    S-->>UI: 401/403 error
  else admin or 2FA enabled
    S->>E: Create expiring EmailOtp
    S-->>U: Send OTP email
    S-->>UI: requiresTwoFactor
    U->>UI: Submit OTP
    UI->>C: verifyOtp()
    C->>S: verifyEmailOtp()
    S->>E: Consume OTP and issue tokens
    S-->>UI: User and tokens
  else no 2FA
    S->>E: Update login and issue tokens
    S-->>UI: User and tokens
  end
""",
"10_seq_matching": r"""sequenceDiagram
  autonumber
  actor A as User A
  actor B as User B
  participant UI as DiscoveryPage boundary
  participant C as DiscoveryController control
  participant S as MatchingService control
  participant E as User/Swipe entity
  participant M as Match/ChatRoom entity
  A->>UI: Open discovery feed
  UI->>C: getDiscoveryFeed()
  C->>S: Filter and score candidates
  S->>E: Query users, swipes and blocks
  S-->>UI: Ranked candidates
  A->>UI: Like B
  UI->>C: like(B)
  C->>S: swipe(A,B,like)
  S->>E: Upsert Swipe
  alt B has not liked A
    S-->>B: incoming_like notification
    S-->>UI: matched=false
  else mutual like
    S->>M: Create/upsert Match and ChatRoom active
    S-->>UI: matched=true and Match
  end
""",
"11_seq_cafe": r"""sequenceDiagram
  autonumber
  actor A as Proposer
  actor B as Other user
  participant UI as PlaceSuggestionsPage boundary
  participant C as MatchController control
  participant P as Place/CafeProposal entity
  participant M as Match/ChatRoom entity
  A->>UI: Select cafe
  UI->>C: selectPlace(matchId, placeId)
  C->>P: Validate active place and replace old proposal
  C->>P: Create active CafeProposal
  C->>M: selectedBy=A, confirmedBy=[A], status=cafe_proposed
  C-->>B: cafe_proposal notification
  alt B confirms
    B->>UI: Confirm cafe
    UI->>C: confirmPlace(matchId)
    C->>P: Proposal status=accepted
    C->>M: Upsert active room and status=chat_opened
    C-->>A: match:updated
    C-->>B: match:updated
  else B rejects
    B->>UI: Reject cafe
    UI->>C: rejectPlace(matchId)
    C->>P: Proposal status=rejected
    C->>M: Clear selection and status=matched
    C-->>A: cafe_rejected notification
  end
""",
"12_seq_chat": r"""sequenceDiagram
  autonumber
  actor A as Sender
  actor B as Recipient
  participant UI as ChatRoomPage boundary
  participant C as ChatController/Socket control
  participant R as ChatRoom/Match entity
  participant M as Message entity
  A->>UI: Open room
  UI->>C: getRoom(roomId)
  C->>R: Verify membership and active states
  C->>M: Load latest 100 messages
  C-->>UI: Room, messages and blockState
  UI->>C: join_room
  A->>UI: Send text/file
  UI->>C: send_message
  C->>R: Require room active and match chat_opened
  alt invalid or empty
    C-->>UI: message_error
  else valid
    C->>M: Create message, readBy=[A]
    C->>R: Update lastMessage
    C-->>A: new_message
    C-->>B: new_message and notification
    B->>C: mark_read
    C->>M: Add B to readBy
    C-->>A: message_read
  end
""",
"13_seq_group": r"""sequenceDiagram
  autonumber
  actor O as Group owner
  actor M as Member
  participant UI as Group UI boundary
  participant C as GroupController control
  participant S as Group Socket control
  participant G as Group entity
  participant GM as GroupMessage entity
  O->>UI: Create group
  UI->>C: createGroup()
  C->>G: Create creator=O, members=[O]
  O->>UI: Add member by email
  UI->>C: addMember()
  C->>G: Verify owner, active state and capacity
  C->>G: Append M to members
  M->>UI: Open group chat
  UI->>S: join_group(groupId)
  S->>G: Verify membership
  M->>UI: Send message
  UI->>S: send_group_message
  S->>G: Verify active membership
  S->>GM: Create message
  S-->>UI: new_group_message
  S-->>O: group message notification
""",
"14_seq_safety_admin": r"""sequenceDiagram
  autonumber
  actor U as Reporter
  actor A as Admin
  participant UI as Safety/Admin UI boundary
  participant S as SafetyController control
  participant AC as AdminController control
  participant R as Report entity
  participant T as Reported User entity
  participant AA as AdminAction entity
  U->>UI: Submit report and evidence
  UI->>S: reportUser()
  S->>R: Create report
  S->>R: Mark priority if 3 unique reporters
  A->>UI: Review report and chat context
  UI->>AC: updateReport(action)
  AC->>R: Ensure report unresolved
  alt dismiss
    AC->>R: status=dismissed
  else warn
    AC->>T: Increment warningCount
    AC->>T: Apply escalation policy by warning count
  else suspend or ban
    AC->>T: Update account status
    AC-->>T: Moderation notification/disconnect
  end
  AC->>R: Save resolution
  AC->>AA: Write audit event
  AC-->>UI: Moderation result
""",
"15_seq_partner_voucher": r"""sequenceDiagram
  autonumber
  actor P as Cafe owner
  actor A as Admin
  actor U as User
  participant UI as Partner/Places UI boundary
  participant C as Places/Partner control
  participant AC as AdminController control
  participant E as PlaceCache/Voucher entity
  P->>UI: Submit cafe registration
  UI->>C: registerPartnerPlace()
  C->>E: Create partner place status=pending
  A->>UI: Approve place
  UI->>AC: setPlaceStatus(active)
  AC->>E: Place active and owner role=partner
  P->>UI: Create voucher
  UI->>C: createVoucher()
  C->>E: Validate ownership, active place and unique code
  C->>E: Create Voucher
  U->>UI: Save voucher
  UI->>C: saveVoucher()
  C->>E: Check active, expiry and quota
  C->>E: Add user to savedBy and increment usage
  C-->>UI: saved=true
""",
}

for name, source in DIAGRAMS.items():
    target = OUT / f"{name}.png"
    if target.exists() and target.stat().st_size > 1000:
        print(f"kept {target.name} ({target.stat().st_size} bytes)")
        continue
    last_error = None
    for attempt in range(3):
        try:
            req = Request(
                "https://kroki.io/mermaid/png",
                data=(THEME + source).encode("utf-8"),
                headers={"Content-Type": "text/plain", "User-Agent": "UNI-MATE-SDS-Builder/1.0"},
                method="POST",
            )
            with urlopen(req, timeout=180) as response:
                target.write_bytes(response.read())
            last_error = None
            break
        except Exception as exc:
            last_error = exc
            print(f"retry {attempt + 1} for {name}: {exc}")
    if last_error:
        raise last_error
    print(f"generated {target.name} ({target.stat().st_size} bytes)")
