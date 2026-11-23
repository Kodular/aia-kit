import type { JSX } from "@solidjs/web";
import { Bug, Ellipsis, ExternalLink as ExternalLinkIcon, Info } from "lucide";
import { Show, createSignal } from "solid-js";
import { Button, Dialog, ExternalLink, KeyValue, KeyValueList, Menu } from "./ui/index.ts";

export const APP_NAME = "AIA Explorer";

/** Facts about this build, filled in by Vite. */
export const BUILD = {
  version: __AIA_KIT_VERSION__,
  commit: __COMMIT__,
  repository: __REPOSITORY__,
  builtAt: __BUILT_AT__,
} as const;

export const shortCommit = (): string => BUILD.commit.slice(0, 7);

/** Who makes it, and their page: the GitHub organisation that owns the repository. */
export const MAKER = {
  name: "Kodular",
  url: BUILD.repository.slice(0, BUILD.repository.lastIndexOf("/")),
} as const;

/** The three-dot menu: About, and links to the project. */
export function AppMenu(): JSX.Element {
  const [about, setAbout] = createSignal(false);

  return (
    <>
      <Menu
        icon={Ellipsis}
        label="More"
        items={[
          { label: `About ${APP_NAME}`, icon: Info, onSelect: () => setAbout(true) },
          { label: "Source on GitHub", icon: ExternalLinkIcon, href: BUILD.repository },
          { label: "Report a problem", icon: Bug, href: `${BUILD.repository}/issues` },
        ]}
      />
      <Show when={about()}>
        <AboutDialog onDismiss={() => setAbout(false)} />
      </Show>
    </>
  );
}

function AboutDialog(props: { onDismiss: () => void }): JSX.Element {
  const built = () =>
    new Date(BUILD.builtAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Dialog
      title={APP_NAME}
      onDismiss={props.onDismiss}
      actions={
        <Button variant="primary" onClick={props.onDismiss}>
          Close
        </Button>
      }
    >
      <p class="-mt-1 mb-3 text-xs">
        by <ExternalLink href={MAKER.url}>{MAKER.name}</ExternalLink>
      </p>
      <p>
        Browse App Inventor and Kodular projects and extensions. Files are read in your browser and
        never uploaded.
      </p>
      <p class="mt-2">
        Built on <ExternalLink href={BUILD.repository}>aia-kit</ExternalLink>, an open-source
        library for reading, editing and checking these files.
      </p>
      <div class="mt-4 text-zinc-900 dark:text-zinc-100">
        <KeyValueList>
          <KeyValue label="aia-kit" mono>
            {BUILD.version}
          </KeyValue>
          <KeyValue label="Commit" mono>
            <Show when={BUILD.commit !== ""} fallback="unknown">
              <ExternalLink href={`${BUILD.repository}/commit/${BUILD.commit}`}>
                {shortCommit()}
              </ExternalLink>
            </Show>
          </KeyValue>
          <KeyValue label="Built">{built()}</KeyValue>
          <KeyValue label="License">ISC</KeyValue>
        </KeyValueList>
      </div>
    </Dialog>
  );
}
