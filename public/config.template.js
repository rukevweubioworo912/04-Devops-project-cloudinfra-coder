
// This file is overwritten at runtime by docker-entrypoint.sh in Docker/K8s environments.
window.APP_CONFIG = {
  API_KEY: "$VITE_API_KEY"
};
