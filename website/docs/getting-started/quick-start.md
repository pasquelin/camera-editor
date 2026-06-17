---
title: Quick start
---

# Quick start

```tsx
import { MediaStudioProvider, MediaStudio, ExportProgress, useMediaStudio } from "@media-studio/ui";
import { createExportRenderer, createLicense } from "@media-studio/sdk";

const license = createLicense("pro");
const exportRenderer = createExportRenderer({ primary: nativeEncoder, license });

export default function App() {
  return (
    <MediaStudioProvider license={license} exportRenderer={exportRenderer}>
      <Home />
      <MediaStudio />
      <ExportProgress />
    </MediaStudioProvider>
  );
}

function Home() {
  const { open } = useMediaStudio();
  return <Button title="Ouvrir l'éditeur" onPress={open} />;
}
```

Mode **headless** (sans UI) :

```ts
import { createMediaStudio, createLicense } from "@media-studio/sdk";

const studio = createMediaStudio({ license: createLicense("pro"), exportRenderer });
studio.core.execute("text.create", { object: { content: "Bonjour" } });
studio.exportProject({ format: "mp4", resolution: "1080p", fps: 30, videoBitrate: 8000, audioBitrate: 128, codec: "h264", quality: 1 });
```
