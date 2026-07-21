# UNI-MATE — UML Sequence Diagrams for Authentication

These diagrams describe the behavior implemented by the current frontend and backend code.

## 1. Account registration

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as AuthPage<br/>«boundary»
    participant ST as AuthStore<br/>«control»
    participant API as authApi/Axios<br/>«boundary»
    participant R as AuthRouter + Zod<br/>«control»
    participant C as AuthController<br/>«control»
    participant S as AuthService<br/>«control»
    participant DB as User<br/>«entity»
    participant JWT as JWT Utility<br/>«control»

    U->>UI: Enter email, password, confirmation
    U->>UI: Submit registration form
    UI->>UI: Validate email, password strength,<br/>and matching confirmation

    alt Client-side validation fails
        UI-->>U: Display validation error
    else Client-side validation succeeds
        UI->>ST: register(email, password)
        ST->>API: register(email, password)
        API->>R: POST /api/auth/register
        R->>R: validate(registerSchema)

        alt Request validation fails
            R-->>API: 422 Validation failed
            API-->>ST: Reject request
            ST-->>UI: Throw HTTP error
            UI-->>U: Display error
        else Request is valid
            R->>C: registerController(req, res)
            C->>S: registerWithPassword(email, password)
            S->>DB: findOne({email})
            DB-->>S: Existing user or null

            alt Email already exists
                S-->>C: Throw 409 Email already exists
                C-->>API: Error middleware returns 409
                API-->>ST: Reject request
                ST-->>UI: Throw HTTP error
                UI-->>U: Display duplicate-email error
            else Email is available
                S->>S: bcrypt.hash(password, 10)
                S->>DB: create({email, passwordHash,<br/>emailVerified: true})
                DB-->>S: New user<br/>(role=user, onboardingCompleted=false)
                S->>JWT: signAccessToken(user)
                JWT-->>S: accessToken
                S->>JWT: signRefreshToken(user)
                JWT-->>S: refreshToken
                S->>S: bcrypt.hash(refreshToken, 10)
                S->>DB: save(refreshTokenHash)
                DB-->>S: Saved user
                S-->>C: publicUser + accessToken + refreshToken
                C->>C: Set HTTP-only refreshToken cookie<br/>(SameSite=Lax, max-age=30 days)
                C-->>API: 201 Created + user/tokens JSON
                API-->>ST: Authentication payload
                ST->>ST: Persist user and tokens<br/>in uni-mate-auth state
                ST-->>UI: New user
                UI-->>U: Navigate to /onboarding<br/>(or partner-register redirect)
            end
        end
    end

    Note over UI,S: The current registration flow does not send or verify an OTP.
```

## 2. Login

```mermaid
sequenceDiagram
    autonumber
    actor U as User / Partner / Admin
    participant UI as AuthPage<br/>«boundary»
    participant ST as AuthStore<br/>«control»
    participant API as authApi/Axios<br/>«boundary»
    participant R as AuthRouter + Zod<br/>«control»
    participant C as AuthController<br/>«control»
    participant S as AuthService<br/>«control»
    participant DB as User<br/>«entity»
    participant JWT as JWT Utility<br/>«control»

    U->>UI: Enter email and password
    U->>UI: Submit login form
    UI->>UI: Validate email and password format

    alt Client validation fails
        UI-->>U: Display validation error
    else Client validation succeeds
        UI->>ST: login(email, password)
        ST->>API: login(email, password)
        API->>R: POST /api/auth/login
        R->>R: validate(loginSchema)

        alt Request validation fails
            R-->>API: 422 Validation failed
            API-->>ST: Reject request
            ST-->>UI: Throw HTTP error
            UI-->>U: Display validation error
        else Request is valid
            R->>C: loginController(req, res)
            C->>S: loginWithPassword(email, password)
            S->>DB: findOne({email})
            DB-->>S: User or null

            alt User is missing or has no passwordHash
                S-->>C: Throw 401 Invalid email or password
                C-->>API: Error middleware returns 401
                API-->>ST: Reject request
                ST-->>UI: Throw HTTP error
                UI-->>U: Display login error
            else User exists
                S->>S: restoreExpiredSuspension(user)

                alt Account is banned, suspended, or inactive
                    S-->>C: Throw 403 Account is locked
                    C-->>API: Error middleware returns 403
                    API-->>ST: Reject request
                    ST-->>UI: Throw HTTP error
                    UI-->>U: Display locked-account error
                else Account is active
                    S->>S: bcrypt.compare(password, passwordHash)

                    alt Password is incorrect
                        S-->>C: Throw 401 Invalid email or password
                        C-->>API: Error middleware returns 401
                        API-->>ST: Reject request
                        ST-->>UI: Throw HTTP error
                        UI-->>U: Display login error
                    else Password is correct
                        S->>DB: Set lastLoginAt and lastSeenAt
                        S->>JWT: signAccessToken(user)
                        JWT-->>S: accessToken
                        S->>JWT: signRefreshToken(user)
                        JWT-->>S: refreshToken
                        S->>S: bcrypt.hash(refreshToken, 10)
                        S->>DB: save(refreshTokenHash)
                        DB-->>S: Saved user
                        S-->>C: publicUser + accessToken + refreshToken
                        C->>C: Set HTTP-only refreshToken cookie
                        C-->>API: 200 OK + user/tokens
                        API-->>ST: Authentication payload
                        ST->>ST: Persist authenticated session
                        ST-->>UI: Authenticated user

                        alt role == admin
                            UI-->>U: Navigate to /admin/dashboard
                        else role == partner
                            UI-->>U: Navigate to partner dashboard
                        else User completed onboarding
                            UI-->>U: Navigate to /app/discovery
                        else New/incomplete user
                            UI-->>U: Navigate to /onboarding
                        end
                    end
                end
            end
        end
    end

    Note over UI,S: Login authentication is identical for every role and never requests OTP.
```

## 3. Forgot password

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as ForgotPasswordPage<br/>«boundary»
    participant API as authApi/Axios<br/>«boundary»
    participant R as AuthRouter + Zod<br/>«control»
    participant C as AuthController<br/>«control»
    participant S as AuthService<br/>«control»
    participant DB as User<br/>«entity»
    participant OTP as EmailOtp<br/>«entity»
    participant MAIL as SMTP Email Service<br/>«external»
    participant JWT as JWT Utility<br/>«control»

    Note over U,JWT: Step 1 — Request password-reset OTP
    U->>UI: Enter registered email
    UI->>UI: Validate email format
    UI->>API: sendPasswordResetOtp(email)
    API->>R: POST /api/auth/forgot-password/send-otp
    R->>R: validate(forgotPasswordSendOtpSchema)
    R->>C: forgotPasswordSendOtpController
    C->>S: sendPasswordResetOtp(email)
    S->>DB: findOne({email})
    DB-->>S: User or null

    alt User is missing or has no passwordHash
        S-->>C: Throw 404
        C-->>API: Error middleware returns 404
        API-->>UI: Reject request
        UI-->>U: Display email/account error
    else Password account exists
        S->>OTP: Check resend cooldown and hourly quota
        alt Cooldown/quota reached or production SMTP missing
            S-->>C: Throw 429 or 500
            C-->>API: Error response
            API-->>UI: Reject request
            UI-->>U: Display OTP-send error
        else OTP may be sent
            S->>S: Generate six-digit OTP<br/>and bcrypt.hash(OTP, 10)
            S->>OTP: create({email, otpHash, expiresAt,<br/>attempts=0, consumed=false})
            S->>MAIL: sendOtpEmail(email, OTP)
            MAIL-->>S: Send result
            S-->>C: OTP sent
            C-->>API: 200 OK
            API-->>UI: Success
            UI->>UI: step = "otp"
            UI-->>U: Display OTP entry form
        end
    end

    Note over U,JWT: Step 2 — Verify OTP and obtain a short-lived reset token
    U->>UI: Enter six-digit OTP
    UI->>UI: Validate /^\d{6}$/
    UI->>API: verifyPasswordResetOtp(email, OTP)
    API->>R: POST /api/auth/forgot-password/verify-otp
    R->>R: validate(forgotPasswordVerifyOtpSchema)
    R->>C: forgotPasswordVerifyOtpController
    C->>S: verifyPasswordResetOtp(email, OTP)
    S->>OTP: Find newest unconsumed,<br/>unexpired EmailOtp
    OTP-->>S: OTP record or null

    alt OTP missing, expired, or attempts exhausted
        S-->>C: Throw 400 or 429
        C-->>API: Error response
        API-->>UI: Reject request
        UI-->>U: Display OTP error
    else OTP record is usable
        S->>S: bcrypt.compare(input, otpHash)
        alt OTP is incorrect
            S->>OTP: Increment attempts and save
            S-->>C: Throw 400
            C-->>API: Error response
            API-->>UI: Reject request
            UI-->>U: Display OTP error
        else OTP is correct
            S->>DB: findOne({email}) and recheck account state
            alt Account is missing, locked, or inactive
                S-->>C: Throw 404 or 403
                C-->>API: Error response
                API-->>UI: Reject request
                UI-->>U: Display account error
            else Account is eligible
                S->>OTP: Set consumed=true and save
                S->>JWT: signPasswordResetToken(user)<br/>purpose=password_reset, expires in 10m
                JWT-->>S: resetToken
                S-->>C: resetToken
                C-->>API: 200 OTP verified + resetToken
                API-->>UI: resetToken
                UI->>UI: Store token in component state<br/>and set step = "password"
                UI-->>U: Display new-password form
            end
        end
    end

    Note over U,JWT: Step 3 — Set the new password
    U->>UI: Enter and confirm new password
    UI->>UI: Validate strength and equality
    UI->>API: resetPassword(resetToken,<br/>newPassword, confirmPassword)
    API->>R: POST /api/auth/forgot-password/reset
    R->>R: validate(resetPasswordSchema)

    alt Request validation fails
        R-->>API: 422 Validation failed
        API-->>UI: Reject request
        UI-->>U: Display password error
    else Request is valid
        R->>C: resetPasswordController
        C->>S: resetPasswordWithToken(resetToken, newPassword)
        S->>JWT: verifyPasswordResetToken(resetToken)

        alt Token is invalid, expired, or has wrong purpose
            JWT-->>S: Verification error
            S-->>C: Throw 401
            C-->>API: Error response
            API-->>UI: Reject request
            UI-->>U: Ask for a new OTP
        else Token is valid
            JWT-->>S: {userId, email, purpose}
            S->>DB: findById(userId) and verify email/account state
            alt Account is missing, locked, or inactive
                S-->>C: Throw 404 or 403
                C-->>API: Error response
                API-->>UI: Reject request
                UI-->>U: Display account error
            else Account is eligible
                S->>S: bcrypt.compare(newPassword, old passwordHash)
                alt New password equals old password
                    S-->>C: Throw 400
                    C-->>API: Error response
                    API-->>UI: Reject request
                    UI-->>U: Ask for a different password
                else New password is different
                    S->>S: bcrypt.hash(newPassword, 10)
                    S->>DB: Set passwordHash, unset refreshTokenHash,<br/>and save
                    DB-->>S: Updated user
                    S-->>C: Password changed
                    C-->>API: 200 OK
                    API-->>UI: Success
                    UI-->>U: Show success message
                    UI-->>U: After 900 ms, navigate to /auth
                end
            end
        end
    end

    Note over UI,DB: Reset does not create a login session. Existing refresh token is invalidated in DB.
    Note over UI,DB: previously issued access tokens remain valid until their normal expiration.
```

## Implementation notes

- Registration creates `emailVerified: true` and issues tokens immediately; it does not use OTP.
- Every role logs in with the same email/password flow; login no longer uses OTP or 2FA.
- Password reset uses the shared `EmailOtp` collection and shared OTP email sender.
- A successful password reset clears `refreshTokenHash` and returns the user to `/auth`; it does not issue new tokens.
