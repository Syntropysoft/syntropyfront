// Minimal usage — two lines to get value
// 1. Import (auto-initializes)
import syntropyFront from '@syntropysoft/syntropyfront';

// 2. Use it
syntropyFront.addBreadcrumb('user', 'App loaded');
syntropyFront.sendError(new Error('Test error')); // optional: second arg is context

// Optional: send to your backend
// syntropyFront.configure({ endpoint: 'https://your-api.com/errors' });
