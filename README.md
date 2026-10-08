# Orvulix

**Free online tools for developers, documents, images, and everyday tasks.**

Orvulix is a privacy-first, browser-based collection of utilities. Many tools process data locally in your browser. Check individual tools before using sensitive data.

Live site (until the Netlify project is renamed): https://toolora-web.netlify.app/

## Project information

- Frontend: React, TypeScript, Vite
- Hosting: Netlify (manual production deployment)
- Build: `npm run build` (output: `dist`)
- Origin: Forked from [iib0011/omni-tools](https://github.com/iib0011/omni-tools). Original authorship, copyright, and license notices remain attributed to the upstream project.

## Table of Contents

- [Features](#features)
- [Self-host](#self-hostrun)
- [Contribute](#contribute)
- [Contact](#contact)
- [License](#license)

## Features

We strive to offer a variety of tools, including:

### **Image/Video/Audio Tools**

- Image Resizer
- Image Converter
- Image Editor
- Video Trimmer
- Video Reverser
- And more...

### **PDF Tools**

- PDF Splitter
- PDF Merger
- PDF Editor
- And more...

### **Text/List Tools**

- Case Converters
- List Shuffler
- Text Formatters
- And more...

### **Date and Time Tools**

- Date Calculators
- Time Zone Converters
- And more...

### **Math Tools**

- Generate Prime Numbers
- Calculate voltage, current, or resistance
- And more...

### **Data Tools**

- JSON Tools
- CSV Tools
- XML Tools
- And more...

Stay tuned as we continue to expand and improve our collection!

## Self-host/Run

### Docker

```bash
docker run -d --name omni-tools --restart unless-stopped -p 8080:80 iib0011/omni-tools:latest
```

### Docker Compose

```yaml
services:
  omni-tools:
    image: iib0011/omni-tools:latest
    container_name: omni-tools
    restart: unless-stopped
    ports:
      - "8080:80"

```

## Contribute

This is a React Project with Typescript Material UI. We use icons from [Iconify](https://icon-sets.iconify.design)

### Project setup

```bash
git clone https://github.com/iib0011/omni-tools.git
cd omni-tools
npm i
npm run dev
```

### Create a new tool

```bash
npm run script:create:tool my-tool-name folder1 # npm run script:create:tool split pdf
```

For tools located under multiple nested directories, use:

```bash
npm run script:create:tool my-tool-name folder1/folder2 # npm run script:create:tool compress image/png
```

Use `folder1\folder2` on Windows.

### Run tests

```bash
npm run test
```

- For e2e tests

```bash
npm run test:e2e
```

### i18n (Translations)
The translation files are [here](public/locales). Only edit these if you are a developer. For non developers, use [Locize](https://www.locize.app/register?invitation=YOIH0Dyz3KHh3uQFCGYe9v1QOUoq8W5ySgmlwjX9cSypeJmt8F40brDtVbXb71fK).

<!-- I18N-COVERAGE:START -->
| Language | Translation status | Missing keys |
|----------|--------------------|--------------|
| uk - Ukrainian  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 97%` | 44 |
| zh - Chinese  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 70%` | 522 |
| hi - Hindi  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 69%` | 549 |
| ru - Russian  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 69%` | 537 |
| de - German  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ 68%` | 559 |
| es - Spanish  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ 68%` | 559 |
| fr - French  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ 68%` | 559 |
| ja - Japanese  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ 68%` | 559 |
| nl - Dutch  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ 68%` | 559 |
| pt - Portuguese  | `▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ 68%` | 559 |
<!-- I18N-COVERAGE:END -->

## ⭐ Star History

<img src="https://star-history.dera.page/svg?repos=iib0011/omni-tools&type=Date"/>

## 🤝 Looking to contribute?

We welcome contributions! You can help by:

- Reporting bugs
- Suggesting new features in GitHub issues or [here](https://tally.so/r/nrkkx2)
- Translating in [Locize project](https://www.locize.app/register?invitation=YOIH0Dyz3KHh3uQFCGYe9v1QOUoq8W5ySgmlwjX9cSypeJmt8F40brDtVbXb71fK).
- Improving documentation
- Submitting pull requests


You can also join our [Discord server](https://discord.gg/SDbbn3hT4b)
## 🧡 Sponsors
<div align="center">
  <a href="https://www.locize.com/" target="_blank">
    <img src="docs-images/locizeSponsor.svg" alt="Locize" width="200"/>
  </a>
</div>

Thanks to [Locize](https://www.locize.com) for sponsoring OmniTools and supporting localization efforts.
They make translation management simple and developer-friendly.

## Contributors

<a href="https://github.com/iib0011/omni-tools/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=iib0011/omni-tools" />
</a>

## Contact

For any questions or suggestions, feel free to open an issue or contact me at:
[ibracool99@gmail.com](mailto:ibracool99@gmail.com)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
