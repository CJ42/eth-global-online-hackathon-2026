import type { ReactNode } from "react";
import styles from "./PageShell.module.css";

type PageShellProps = {
	eyebrow: string;
	title: string;
	subtitle: string;
	compact?: boolean;
	actions?: ReactNode;
	children: ReactNode;
};

export function PageShell({
	eyebrow,
	title,
	subtitle,
	compact = false,
	actions,
	children,
}: PageShellProps) {
	return (
		<main className={styles.main}>
			<section className={styles.dashboard}>
				<header className={`${styles.header} ${compact ? styles.compact : ""}`}>
					<div className={styles.copy}>
						<p className={styles.eyebrow}>{eyebrow}</p>
						<h1 className={styles.title}>{title}</h1>
						<p className={styles.subtitle}>{subtitle}</p>
					</div>
					{actions ? <div className={styles.actions}>{actions}</div> : null}
				</header>
				{children}
			</section>
		</main>
	);
}
