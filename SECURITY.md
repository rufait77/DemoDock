# Security

DemoDock is a browser demo toolkit, not a security isolation layer. Every fixture and frontend module is public, roles are simulated, and visitors can modify their local state. Use dedicated demo builds with synthetic data and no production credentials.

The controller blocks unhandled API requests after startup, but permits same-origin page/static assets. Navigation, forms, pre-start requests, explicit passthrough handlers, and third-party SDKs need separate review. Do not expose a production API through the demo origin.

For a vulnerability, use [GitHub's private report form](https://github.com/rufait77/DemoDock/security/advisories/new). Include the version, reproduction, and expected impact. Do not include real credentials or customer data. If private reporting is unavailable, open a minimal issue requesting a private reporting channel without exploit details.

Only the latest 0.1.x release receives fixes. No response-time SLA is offered.
