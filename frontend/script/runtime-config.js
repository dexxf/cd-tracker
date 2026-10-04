(function configureCodeTracker(globalScope) {
  "use strict";

  // Edit deployment URLs here. All pages load this file before their clients.
  // Keep secrets (Gemini keys, JWT keys, OAuth secrets) on the backend only.
  const defaults = {
    apiBaseUrl: "https://anayzer-production-7c72.up.railway.app/api",
    // No analyzer service is currently deployed. Do not point this at a stale
    // Railway hostname: the grading page uses this empty value to prevent an
    // analysis request that would fail with a misleading connection error.
    // Set this to the replacement analyzer service's HTTPS origin when restored.
    analyzerBaseUrl: "",
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
