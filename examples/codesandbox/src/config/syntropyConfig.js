// Maximum configuration for SyntropyFront demo
export const syntropyConfig = {
  // Use debug preset for maximum features
  preset: 'debug',
  
  // Agent configuration with maximum features
  agent: {
    endpoint: 'https://httpbin.org/post', // Test endpoint
    batchTimeout: 3000, // Faster batching for demo
    batchSize: 10, // Smaller batches for more frequent updates
    maxRetries: 3,
    usePersistentBuffer: true,
    retryDelay: 1000
  },
  
  // Enable all proxy tracking features
  proxyTracking: {
    enabled: true,
    maxStates: 20, // Track more states
    trackNested: true,
    trackArrays: true,
    trackFunctions: true, // Track function calls
    trackTimestamps: true
  },
  
  // Enable worker for non-blocking operation
  useWorker: true,
  
  // Maximum breadcrumbs
  maxBreadcrumbs: 100,
  
  // Collect all possible context
  context: {
    device: true,
    window: true,
    session: true,
    ui: true,
    network: true,
    performance: true, // Performance metrics
    memory: true, // Memory usage
    errors: true, // Error context
    user: true // User interactions
  },
  
  // Advanced features
  features: {
    circularReferenceHandling: true,
    deepObjectTracking: true,
    realTimeUpdates: true,
    errorCorrelation: true,
    sessionReplay: true,
    performanceMonitoring: true
  },
  
  // Debug mode for development
  debug: {
    enabled: true,
    logLevel: 'verbose',
    showInternalLogs: true,
    trackInternalOperations: true
  }
};

// Mock endpoint interceptor for demo
export class MockEndpointInterceptor {
  constructor() {
    this.requests = [];
    this.responses = [];
    this.isEnabled = true;
  }

  // Intercept and log requests
  interceptRequest(payload) {
    if (!this.isEnabled) return;

    const request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      endpoint: 'https://httpbin.org/post',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SyntropyFront-Demo/1.0.0'
      },
      payload: payload,
      payloadSize: JSON.stringify(payload).length,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        requestId: this.generateRequestId()
      }
    };

    this.requests.push(request);

    // Log to console with detailed formatting
    console.group(`🚀 SYNTRONYFRONT REQUEST #${request.id}`);
    console.log('📅 Timestamp:', request.timestamp);
    console.log('🌐 Endpoint:', request.endpoint);
    console.log('📦 Payload Size:', request.payloadSize, 'bytes');
    console.log('📊 Payload:', request.payload);
    console.log('🔍 Metadata:', request.metadata);
    console.groupEnd();

    // Simulate response
    const response = this.simulateResponse(request);
    this.responses.push(response);

    return response;
  }

  // Simulate endpoint response
  simulateResponse(request) {
    const response = {
      requestId: request.id,
      timestamp: new Date().toISOString(),
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'server': 'httpbin.org'
      },
      data: {
        success: true,
        message: 'Data received successfully',
        requestId: request.id,
        processedAt: new Date().toISOString(),
        breadcrumbsProcessed: request.payload.breadcrumbs?.length || 0,
        errorsProcessed: request.payload.errors?.length || 0
      },
      processingTime: Math.random() * 100 + 50 // 50-150ms
    };

    // Log response
    console.group(`✅ SYNTRONYFRONT RESPONSE #${request.id}`);
    console.log('📅 Timestamp:', response.timestamp);
    console.log('📊 Status:', response.status, response.statusText);
    console.log('⏱️ Processing Time:', response.processingTime.toFixed(2), 'ms');
    console.log('📦 Response Data:', response.data);
    console.groupEnd();

    return response;
  }

  // Get session ID
  getSessionId() {
    if (!window.syntropySessionId) {
      window.syntropySessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return window.syntropySessionId;
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics
  getStats() {
    return {
      totalRequests: this.requests.length,
      totalResponses: this.responses.length,
      averagePayloadSize: this.requests.length > 0 
        ? this.requests.reduce((sum, req) => sum + req.payloadSize, 0) / this.requests.length 
        : 0,
      averageProcessingTime: this.responses.length > 0
        ? this.responses.reduce((sum, resp) => sum + resp.processingTime, 0) / this.responses.length
        : 0,
      lastRequest: this.requests[this.requests.length - 1],
      lastResponse: this.responses[this.responses.length - 1]
    };
  }

  // Clear history
  clear() {
    this.requests = [];
    this.responses = [];
  }
}

// Create global interceptor instance
export const endpointInterceptor = new MockEndpointInterceptor(); 