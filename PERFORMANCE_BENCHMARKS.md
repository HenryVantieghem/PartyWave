# Performance Benchmarks

Performance benchmarks and optimization guide for PartyWave.

## 🎯 Performance Targets

### App Launch
- **Cold Start**: <3 seconds (first launch)
- **Warm Start**: <1 second (returning user)
- **Target**: Instant feel (<500ms perceived)

### Screen Load Times
- **Party Radar**: <1s
- **Party Detail**: <800ms
- **Crew List**: <1s
- **Profile**: <500ms

### API Response Times
- **GET requests**: <300ms (p95)
- **POST requests**: <500ms (p95)
- **Image upload**: <3s for 5MB file
- **Real-time updates**: <100ms latency

### Bundle Size
- **iOS**: <50MB download
- **Android**: <40MB download
- **Initial JS bundle**: <2MB

### Memory Usage
- **Idle**: <100MB
- **Active use**: <200MB
- **Peak**: <300MB

### Battery Impact
- **Background**: <2% per hour
- **Active use**: <10% per hour

## 📊 Benchmarking Tools

### React Native Performance Monitor

```typescript
// Enable in development
if (__DEV__) {
  require('react-native').PerformanceLogger.setEnabled(true);
}

// Log performance
console.log(require('react-native').PerformanceLogger.getTimespans());
```

### Flipper Integration

```bash
# Install Flipper
brew install --cask flipper

# Enable in metro.config.js
module.exports = {
  ...config,
  server: {
    enhanceMiddleware: (middleware) => {
      return require('@react-native-community/cli-plugin-metro').withFlipperMiddleware(middleware);
    },
  },
};
```

**Flipper Plugins**:
- React DevTools
- Network Inspector
- Database Inspector (Supabase)
- Images
- Layout
- Performance Monitor

### Lighthouse (Web)

```bash
npx lighthouse https://partywave.app --view
```

Target scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

### Detox Performance

```typescript
// In e2e tests
await element(by.id('party-list')).tap();
const start = Date.now();
await waitFor(element(by.id('party-detail'))).toBeVisible().withTimeout(2000);
const loadTime = Date.now() - start;
expect(loadTime).toBeLessThan(1000);
```

## ⚡ Optimization Checklist

### JavaScript Bundle

- [ ] Code splitting enabled
- [ ] Lazy loading for heavy screens
- [ ] Tree shaking configured
- [ ] Minification enabled (production)
- [ ] Source maps disabled (production)
- [ ] Remove console.logs (production)
- [ ] Bundle analysis completed

```bash
# Analyze bundle
npx react-native-bundle-visualizer
```

### Images

- [ ] WebP format for photos
- [ ] Aggressive caching enabled
- [ ] Image compression (<100KB each)
- [ ] Lazy loading for off-screen images
- [ ] Placeholder images while loading
- [ ] CDN for image hosting
- [ ] Responsive image sizes

### Network

- [ ] API response caching
- [ ] Request deduplication
- [ ] Batch requests where possible
- [ ] Debounce search inputs (300ms)
- [ ] Pagination on long lists
- [ ] Infinite scroll instead of "Load More"
- [ ] Offline queue implemented

### Rendering

- [ ] FlatList for long lists (not ScrollView)
- [ ] windowSize optimized (FlatList)
- [ ] removeClippedSubviews enabled
- [ ] Memoization for expensive components
- [ ] useCallback for event handlers
- [ ] useMemo for expensive calculations
- [ ] Avoid inline functions in render

### State Management

- [ ] Zustand devtools disabled (production)
- [ ] Selector optimization
- [ ] Minimal re-renders
- [ ] Normalized state shape
- [ ] Immutable updates

### Database

- [ ] Indexes on frequently queried fields
- [ ] Limit results (LIMIT 50)
- [ ] Pagination instead of full scans
- [ ] Connection pooling
- [ ] Query optimization
- [ ] Avoid N+1 queries

### Real-time Subscriptions

- [ ] Subscribe only to needed channels
- [ ] Unsubscribe on unmount
- [ ] Batch subscription updates
- [ ] Throttle high-frequency updates
- [ ] Use centralized subscription manager

## 🧪 Performance Tests

### Load Test Scenarios

**Scenario 1: Concurrent Users**
```bash
# 100 concurrent users browsing parties
k6 run --vus 100 --duration 30s load-tests/browse-parties.js
```

Target: <500ms response time, <1% error rate

**Scenario 2: Image Upload Spike**
```bash
# 50 users uploading images simultaneously
k6 run --vus 50 --duration 60s load-tests/upload-images.js
```

Target: <5s upload time, <2% error rate

**Scenario 3: Real-time Updates**
```bash
# 200 users subscribed to party updates
k6 run --vus 200 --duration 120s load-tests/realtime-updates.js
```

Target: <200ms update latency

### Memory Leak Detection

```typescript
// Use React DevTools Profiler
import { Profiler } from 'react';

<Profiler id="PartyList" onRender={onRenderCallback}>
  <PartyList />
</Profiler>

function onRenderCallback(id, phase, actualDuration) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}
```

**Red Flags**:
- Memory usage increasing over time
- EventListeners not removed
- Subscriptions not cleaned up
- Large arrays never cleared

## 📈 Monitoring Dashboards

### Key Performance Indicators (KPIs)

**App Metrics**:
- Crash-free rate: >99%
- ANR rate (Android): <0.1%
- App load time: p50, p95, p99
- Screen load time: p50, p95, p99

**API Metrics**:
- Request success rate: >99.5%
- Response time: p50, p95, p99
- Error rate by endpoint
- Throughput (requests/second)

**Database Metrics**:
- Query execution time
- Connection pool usage
- Active connections
- Slow query log

**Real-time Metrics**:
- Concurrent connections
- Message delivery time
- Subscription count
- Channel message rate

### Alerting Rules

```yaml
alerts:
  - name: high_error_rate
    condition: error_rate > 1%
    window: 5m
    severity: critical

  - name: slow_api_response
    condition: p95_response_time > 1000ms
    window: 5m
    severity: warning

  - name: high_crash_rate
    condition: crash_rate > 1%
    window: 1h
    severity: critical

  - name: memory_leak
    condition: memory_usage_trend > 10MB/hour
    window: 6h
    severity: warning
```

## 🔧 Debugging Slow Performance

### Profiling Checklist

1. **Identify the Issue**:
   - Slow screen load?
   - Laggy scrolling?
   - High memory usage?
   - Battery drain?

2. **Use Profiling Tools**:
   - React DevTools Profiler
   - Flipper Performance Monitor
   - Chrome DevTools (for debugging)
   - Xcode Instruments (iOS)
   - Android Profiler (Android)

3. **Common Culprits**:
   - Large images not compressed
   - Too many re-renders
   - Expensive calculations in render
   - Memory leaks (subscriptions)
   - Unoptimized database queries
   - Network waterfalls

4. **Fix and Measure**:
   - Apply optimization
   - Re-run benchmarks
   - Verify improvement
   - Deploy to beta
   - Monitor in production

## ✅ Pre-Launch Performance Checklist

- [ ] All performance targets met
- [ ] Load testing passed
- [ ] Memory leak testing passed
- [ ] Battery impact acceptable
- [ ] Bundle size under limits
- [ ] All optimizations applied
- [ ] Monitoring dashboards configured
- [ ] Alerting rules active
- [ ] Performance regression tests added

**Performance Champion**: [Assign team member]
**Last Benchmark**: [Date]
**Next Review**: [Date + 2 weeks]
