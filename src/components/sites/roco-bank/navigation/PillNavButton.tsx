import styles from "./navigation.module.css";

type Props = {
  label: string;
  href: string;
  variant: "outline" | "solid";
  theme: "light" | "dark";
  tabIndex?: number;
};

/** Header pill link ("Wallet" outline, "Register" solid). Inverts on the dark scene. */
export function PillNavButton({ label, href, variant, theme, tabIndex }: Props) {
  return (
    <a
      href={href}
      tabIndex={tabIndex}
      className={`${styles.pill} ${styles[variant]} ${theme === "dark" ? styles.onDark : ""}`}
      data-variant={variant}
    >
      {label}
    </a>
  );
}
