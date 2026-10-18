import type { SceneState, Style } from "./timeline";

/** Writes evaluated scene state straight to registered DOM nodes (no React re-render per frame).
 *  Single ownership: only the applier mutates animated properties. Values are diffed per node. */
export class StyleApplier {
  private nodes = new Map<string, HTMLElement>();
  private last = new Map<string, Style>();

  register(key: string, el: HTMLElement | null) {
    if (el) this.nodes.set(key, el);
    else this.nodes.delete(key);
    this.last.delete(key);
  }

  has(key: string) {
    return this.nodes.has(key);
  }

  apply(state: SceneState) {
    for (const key in state) {
      const el = this.nodes.get(key);
      if (!el) continue;
      const next = state[key];
      const prev = this.last.get(key) ?? {};
      const st = el.style;
      if (next.transform !== undefined && next.transform !== prev.transform) st.transform = next.transform;
      if (next.opacity !== undefined && next.opacity !== prev.opacity) st.opacity = String(next.opacity);
      if (next.filter !== undefined && next.filter !== prev.filter) st.filter = next.filter;
      if (next.clipPath !== undefined && next.clipPath !== prev.clipPath) st.clipPath = next.clipPath;
      if (next.color !== undefined && next.color !== prev.color) st.color = next.color;
      if (next.visibility !== undefined && next.visibility !== prev.visibility) st.visibility = next.visibility;
      if (next.left !== undefined && next.left !== prev.left) st.left = `${next.left}px`;
      if (next.top !== undefined && next.top !== prev.top) st.top = `${next.top}px`;
      if (next.width !== undefined && next.width !== prev.width) st.width = `${next.width}px`;
      if (next.height !== undefined && next.height !== prev.height) st.height = `${next.height}px`;
      this.last.set(key, next);
    }
  }
}
