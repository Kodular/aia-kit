import type { JSX } from "@solidjs/web";
import { ExternalLink } from "lucide";
import { Show } from "solid-js";
import { useApp } from "../state.ts";
import { Button, Dialog } from "./ui/index.ts";

/**
 * Asks what to do with a file chosen while another is open. The open file is
 * left alone until the user decides, and stays if they cancel.
 */
export function OpenFileDialog(): JSX.Element {
  const app = useApp();

  return (
    <Show when={app.pendingFile()}>
      {(pending) => (
        <Dialog
          title={`Open ${pending().name}?`}
          onDismiss={() => void app.resolvePending("cancel")}
          actions={
            <>
              <Button variant="ghost" onClick={() => void app.resolvePending("cancel")}>
                Cancel
              </Button>
              <Button icon={ExternalLink} onClick={() => void app.resolvePending("new-tab")}>
                Open in new tab
              </Button>
              <Button variant="primary" onClick={() => void app.resolvePending("replace")}>
                Replace current
              </Button>
            </>
          }
        >
          <p>
            {app.fileName()} is open. Replace it, or keep it and open the new file in another tab.
          </p>
          <Show when={app.busy()}>
            <p class="mt-2">Reading…</p>
          </Show>
          <Show when={app.error()}>
            {(message) => (
              <p class="mt-2 text-red-600 dark:text-red-400">Could not open it: {message()}</p>
            )}
          </Show>
        </Dialog>
      )}
    </Show>
  );
}
