# Contributing

Thanks for helping make product demos easier to try. Open an issue with a reproducible bug or a specific product flow you want to demonstrate. For larger changes, discuss the design before implementing it.

Use Node 24 and `npm ci`. Run `npm run dev` for the site and example. Run `npm run check` before a pull request. For SDK behavior or interactive changes, install Chromium with `npx playwright install chromium` and run `npm run test:e2e`.

Keep fixtures fictional. Do not commit credentials, `.env` files, recordings containing private information, or production data. Add behavior-focused tests for bug fixes. Preserve keyboard access, mobile layouts, and the ability to reset the demo.

Pull requests should explain the user-visible problem, the resulting behavior, and relevant validation. Changes are contributed under the repository's MIT license. Please be considerate and constructive in issues and reviews.
