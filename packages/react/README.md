<div align="center">
   <img src="https://koroflow.com/logo-icon.png" alt="Koroflow Logo" width="64" height="64" />
  <h1>@c15t/react</h1>
  <p>Transform privacy consent from a compliance checkbox into a fully observable system</p>

  [![GitHub stars](https://img.shields.io/github/stars/koroflow/consent-management?style=flat-square)](https://github.com/koroflow/consent-management)
  [![CI](https://img.shields.io/github/actions/workflow/status/koroflow/consent-management/ci.yml?style=flat-square)](https://github.com/koroflow/consent-management/actions/workflows/ci.yml)
  [![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg?style=flat-square)](LICENSE)
  [![Discord](https://img.shields.io/discord/1312171102268690493?style=flat-square)](https://discord.gg/koroflow)
</div>

React components for building privacy-first user interfaces.

## Features

- 🎯 **Privacy-First Components**: Pre-built UI components for consent management
- 🎨 **Highly Customizable**: Flexible theming and styling system
- ♿ **Accessible**: WCAG compliant with full keyboard navigation
- 🌐 **Regulation Ready**: Built to meet GDPR, CCPA, and other privacy requirements
- 🔧 **Composable**: Uses compound component pattern for maximum flexibility

## Documentation

For detailed documentation and examples, visit:
[https://c15t.com/docs/framework/react](https://c15t.com/docs/framework/react)

## Installation

```bash
npm install @c15t/react
# or
yarn add @c15t/react
# or
pnpm add @c15t/react
```

## Quick Start

```tsx
import { ConsentManagerProvider, CookieBanner, ConsentManagerDialog } from "@c15t/react";

export default function App() {
  return (
    <ConsentManagerProvider>
      <CookieBanner />
      <ConsentManagerDialog/>
      {/* Your app content */}
    </ConsentManagerProvider>
  );
}
```

## License

[GNU General Public License v3.0](https://github.com/koroflow/consent-management/blob/main/LICENSE)
