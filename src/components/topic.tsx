import type { ReactNode } from "react";

/**
 * One topic of a list: a big row (icon, title, one-line hint) that folds open
 * in place. The id doubles as an anchor, e.g. /info#transport (see HashOpen).
 * A plain <details>, so it works as server-rendered HTML.
 */
export function Topic({
  id,
  icon,
  title,
  hint,
  flush,
  children,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  hint: string;
  /** No padding in the body, for lists that bring their own. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="topic" id={id}>
      <summary className="topic-head">
        <span className="topic-icon">{icon}</span>
        <span className="grow">
          <span className="topic-title">{title}</span>
          <span className="topic-hint">{hint}</span>
        </span>
      </summary>
      <div className={`topic-body${flush ? " is-flush" : ""}`}>{children}</div>
    </details>
  );
}
