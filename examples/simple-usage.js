// SUPER SIMPLE USAGE - JUST 2 LINES

// 1. Import the library (it auto-initializes)
import syntropyFront from './syntropyfront.js';

// 2. Use when the app is ready
const isReady = useAppReady();
if (isReady) {
    // Ready! You can now use the library
    syntropyFront.addBreadcrumb('user', 'App loaded');
    syntropyFront.sendError(new Error('Test error'));
}

// THAT'S IT. No more config, no more complex setup.
