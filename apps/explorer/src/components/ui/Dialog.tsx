import type { JSX } from "@solidjs/web";
import { onSettled } from "solid-js";

/**
 * A modal dialog. Mount it only while it should be shown. Escape and a click
 * on the backdrop both call `onDismiss`.
 */
export function Dialog(props: {
  title: string;
  onDismiss: () => void;
  /** Buttons, laid out right-aligned under the content. */
  actions: JSX.Element;
  children: JSX.Element;
}): JSX.Element {
  let dialog: HTMLDialogElement | undefined;
  // The element is not attached yet when its ref runs, so open it afterwards.
  onSettled(() => {
    dialog?.showModal();
    return () => dialog?.close();
  });

  return (
    <dialog
      ref={(el) => (dialog = el)}
      aria-labelledby="dialog-title"
      class="m-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      onCancel={(event) => {
        event.preventDefault();
        props.onDismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onDismiss();
      }}
    >
      <h2 id="dialog-title" class="text-base font-medium">
        {props.title}
      </h2>
      <div class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{props.children}</div>
      <div class="mt-5 flex flex-wrap justify-end gap-2">{props.actions}</div>
    </dialog>
  );
}
