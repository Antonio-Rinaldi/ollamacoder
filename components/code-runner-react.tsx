"use client";

import * as shadcnComponents from "@/lib/shadcn";
import {
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react/unstyled";
import dedent from "dedent";
import { ErrorBoundary } from "./error-boundary";
import { useEffect, useState } from "react";

function SandpackContent({ code }: { code: string }) {
  const { sandpack } = useSandpack();
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkConnection = () => {
      timeoutId = setTimeout(() => {
        setHasError(true);
      }, 10000); // 10 second timeout
    };

    checkConnection();
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (hasError) {
    return (
      <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
        <h2 className="text-lg font-semibold text-yellow-800">Connection Issue</h2>
        <p className="mt-2 text-sm text-yellow-600">
          Unable to connect to the sandbox environment. This could be due to network issues.
        </p>
        <button
          onClick={() => {
            setHasError(false);
            sandpack.resetAllFiles();
          }}
          className="mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <SandpackPreview
      showNavigator={false}
      showOpenInCodeSandbox={false}
      showRefreshButton={false}
      showRestartButton={false}
      showOpenNewtab={false}
      className="h-full w-full"
    />
  );
}

export default function ReactCodeRunner({ code }: { code: string }) {
  return (
    <ErrorBoundary>
      <SandpackProvider
        key={code}
        template="react-ts"
        className="h-full w-full [&_.sp-preview-container]:flex [&_.sp-preview-container]:h-full [&_.sp-preview-container]:w-full [&_.sp-preview-container]:grow [&_.sp-preview-container]:flex-col [&_.sp-preview-container]:justify-center [&_.sp-preview-iframe]:grow"
        files={{
          "App.tsx": code,
          ...shadcnFiles,
          "/tsconfig.json": {
            code: `{
              "include": [
                "./**/*"
              ],
              "compilerOptions": {
                "strict": true,
                "esModuleInterop": true,
                "lib": [ "dom", "es2015" ],
                "jsx": "react-jsx",
                "baseUrl": "./",
                "paths": {
                  "@/components/*": ["components/*"]
                }
              }
            }`,
          },
        }}
        options={{
          externalResources: [
            "https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css",
          ],
        }}
        customSetup={{
          dependencies: {
            "lucide-react": "latest",
            "recharts": "2.9.0",
            "react-router-dom": "latest",
            "@radix-ui/react-accordion": "^1.2.0",
            "@radix-ui/react-alert-dialog": "^1.1.1",
            "@radix-ui/react-aspect-ratio": "^1.1.0",
            "@radix-ui/react-avatar": "^1.1.0",
            "@radix-ui/react-checkbox": "^1.1.1",
            "@radix-ui/react-collapsible": "^1.1.0",
            "@radix-ui/react-dialog": "^1.1.1",
            "@radix-ui/react-dropdown-menu": "^2.1.1",
            "@radix-ui/react-hover-card": "^1.1.1",
            "@radix-ui/react-label": "^2.1.0",
            "@radix-ui/react-menubar": "^1.1.1",
            "@radix-ui/react-navigation-menu": "^1.2.0",
            "@radix-ui/react-popover": "^1.1.1",
            "@radix-ui/react-progress": "^1.1.0",
            "@radix-ui/react-radio-group": "^1.2.0",
            "@radix-ui/react-select": "^2.1.1",
            "@radix-ui/react-separator": "^1.1.0",
            "@radix-ui/react-slider": "^1.2.0",
            "@radix-ui/react-slot": "^1.1.0",
            "@radix-ui/react-switch": "^1.1.0",
            "@radix-ui/react-tabs": "^1.1.0",
            "@radix-ui/react-toast": "^1.2.1",
            "@radix-ui/react-toggle": "^1.1.0",
            "@radix-ui/react-toggle-group": "^1.1.0",
            "@radix-ui/react-tooltip": "^1.1.2",
            "class-variance-authority": "^0.7.0",
            "clsx": "^2.1.1",
            "date-fns": "^3.6.0",
            "embla-carousel-react": "^8.1.8",
            "react-day-picker": "^8.10.1",
            "tailwind-merge": "^2.4.0",
            "tailwindcss-animate": "^1.0.7",
            "framer-motion": "^11.15.0",
            "vaul": "^0.9.1"
          }
        }}
      >
        <SandpackContent code={code} />
      </SandpackProvider>
    </ErrorBoundary>
  );
}

const shadcnFiles = {
  "/lib/utils.ts": shadcnComponents.utils,
  "/components/ui/accordion.tsx": shadcnComponents.accordian,
  "/components/ui/alert-dialog.tsx": shadcnComponents.alertDialog,
  "/components/ui/alert.tsx": shadcnComponents.alert,
  "/components/ui/avatar.tsx": shadcnComponents.avatar,
  "/components/ui/badge.tsx": shadcnComponents.badge,
  "/components/ui/breadcrumb.tsx": shadcnComponents.breadcrumb,
  "/components/ui/button.tsx": shadcnComponents.button,
  "/components/ui/calendar.tsx": shadcnComponents.calendar,
  "/components/ui/card.tsx": shadcnComponents.card,
  "/components/ui/carousel.tsx": shadcnComponents.carousel,
  "/components/ui/checkbox.tsx": shadcnComponents.checkbox,
  "/components/ui/collapsible.tsx": shadcnComponents.collapsible,
  "/components/ui/dialog.tsx": shadcnComponents.dialog,
  "/components/ui/drawer.tsx": shadcnComponents.drawer,
  "/components/ui/dropdown-menu.tsx": shadcnComponents.dropdownMenu,
  "/components/ui/input.tsx": shadcnComponents.input,
  "/components/ui/label.tsx": shadcnComponents.label,
  "/components/ui/menubar.tsx": shadcnComponents.menuBar,
  "/components/ui/navigation-menu.tsx": shadcnComponents.navigationMenu,
  "/components/ui/pagination.tsx": shadcnComponents.pagination,
  "/components/ui/popover.tsx": shadcnComponents.popover,
  "/components/ui/progress.tsx": shadcnComponents.progress,
  "/components/ui/radio-group.tsx": shadcnComponents.radioGroup,
  "/components/ui/select.tsx": shadcnComponents.select,
  "/components/ui/separator.tsx": shadcnComponents.separator,
  "/components/ui/skeleton.tsx": shadcnComponents.skeleton,
  "/components/ui/slider.tsx": shadcnComponents.slider,
  "/components/ui/switch.tsx": shadcnComponents.switchComponent,
  "/components/ui/table.tsx": shadcnComponents.table,
  "/components/ui/tabs.tsx": shadcnComponents.tabs,
  "/components/ui/textarea.tsx": shadcnComponents.textarea,
  "/components/ui/toast.tsx": shadcnComponents.toast,
  "/components/ui/toaster.tsx": shadcnComponents.toaster,
  "/components/ui/toggle-group.tsx": shadcnComponents.toggleGroup,
  "/components/ui/toggle.tsx": shadcnComponents.toggle,
  "/components/ui/tooltip.tsx": shadcnComponents.tooltip,
  "/components/ui/use-toast.tsx": shadcnComponents.useToast,
  "/components/ui/index.tsx": `
    export * from "./button"
    export * from "./card"
    export * from "./input"
    export * from "./label"
    export * from "./select"
    export * from "./textarea"
    export * from "./avatar"
    export * from "./radio-group"
  `,
  "/public/index.html": dedent`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `
};
