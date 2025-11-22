# Security Audit Checklist

Security audit checklist for PartyWave pre-launch.

## 🔐 Authentication & Authorization

- [ ] Password minimum length enforced (6+ characters)
- [ ] Passwords hashed with bcrypt (Supabase default)
- [ ] Session tokens properly secured
- [ ] Token expiration implemented
- [ ] Refresh token rotation enabled
- [ ] Rate limiting on auth endpoints
- [ ] Email verification required
- [ ] Password reset flow secure (no user enumeration)
- [ ] MFA option available (optional for v1)

## 🛡️ Data Protection

- [ ] All API calls over HTTPS only
- [ ] Sensitive data encrypted at rest (Supabase)
- [ ] PII properly handled (GDPR compliant)
- [ ] No sensitive data in logs
- [ ] No API keys in client code
- [ ] Environment variables properly secured
- [ ] Database credentials not exposed
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] User data isolated per user ID

## 🔒 Input Validation

- [ ] All user inputs sanitized
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React escaping)
- [ ] File upload validation (type, size)
- [ ] Image upload size limits (10MB max)
- [ ] No arbitrary code execution vectors
- [ ] Email validation on signup
- [ ] Phone number validation (if used)

## 🚫 Access Control

- [ ] Users can only access own data
- [ ] Crew owners can manage crew
- [ ] Party hosts can edit parties
- [ ] Admin roles properly scoped
- [ ] No privilege escalation possible
- [ ] API endpoints require authentication
- [ ] Private parties not publicly visible
- [ ] User blocking works correctly

## 📱 Client-Side Security

- [ ] No sensitive data in AsyncStorage
- [ ] Push tokens properly managed
- [ ] Deep links validated
- [ ] Clipboard data not leaked
- [ ] Screenshots disabled for sensitive screens (optional)
- [ ] Jailbreak/root detection (optional)
- [ ] Certificate pinning (optional for v1)

## 🌐 API Security

- [ ] Rate limiting on all endpoints
- [ ] CORS properly configured
- [ ] API versioning in place
- [ ] Error messages don't leak info
- [ ] No verbose stack traces in production
- [ ] Request size limits enforced
- [ ] Timeout configured (30s max)

## 🔍 Vulnerability Scanning

- [ ] Dependency audit passed (`npm audit`)
- [ ] No critical CVEs in dependencies
- [ ] Supabase security best practices followed
- [ ] Expo security guidelines followed
- [ ] OWASP Top 10 reviewed
- [ ] Penetration testing completed (optional)

## 📊 Monitoring & Logging

- [ ] Error tracking enabled (Sentry)
- [ ] Security events logged
- [ ] Suspicious activity alerts
- [ ] No PII in error logs
- [ ] Log retention policy defined
- [ ] Incident response plan documented

## ✅ Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (EU users)
- [ ] CCPA compliance (CA users)
- [ ] Age verification (17+)
- [ ] User data export available
- [ ] User data deletion available
- [ ] Cookie consent (if web version)

## 🎯 Quick Security Test

Run these commands before launch:

```bash
# Check for dependency vulnerabilities
npm audit --production

# Check for leaked secrets
git secrets --scan

# Check for hardcoded credentials
grep -r "password\|secret\|api_key" src/

# Verify HTTPS only
grep -r "http://" src/
```

**Security Champion**: [Assign team member]
**Last Audit**: [Date]
**Next Review**: [Date + 3 months]
