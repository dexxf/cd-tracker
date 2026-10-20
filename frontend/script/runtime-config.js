(function configureCodeTracker(globalScope) {
  "use strict";

  // Edit deployment URLs here. All pages load this file before their clients.
  // Keep secrets (Gemini keys, JWT keys, OAuth secrets) on the backend only.
  const defaults = {
    // Keep authentication same-origin in production so private browsers do
    // not have to accept a third-party cookie from the Railway backend.
    apiBaseUrl: "/api",
    // The former analyzer deployment returns Railway's "Application not found".
    // Set this to the replacement analyzer service's HTTPS origin when restored.
    analyzerBaseUrl: "https://anayzer-production-50e0.up.railway.app",
    features: {
      // These account APIs do not exist in the supplied backend yet.
      // Local theme selection and browser chat history remain available.
      accountTheme: false,
      remoteChatHistory: false
    }
  };

  const overrides = globalScope.CodeTrackerConfig || {};
  globalScope.CodeTrackerConfig = Object.freeze({
    ...defaults,
    ...overrides,
    features: Object.freeze({ ...defaults.features, ...overrides.features })
  });
})(window);
