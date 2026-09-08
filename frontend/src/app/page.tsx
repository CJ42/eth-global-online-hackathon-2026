import { ShipStrategy } from "@/feature/ShipStrategy";
import styles from "./page.module.css";

export default function HomePage() {
	return (
		<main className={styles.main}>
			<section className={styles.dashboard} aria-labelledby="strategies-title">
				<header className={styles.header}>
					<p className={styles.eyebrow}>Aqua Portfolio</p>
					<h1 id="strategies-title" className={styles.title}>
						Pre-built investment and rebalancing strategies adapted to your
						tolerance to risk
					</h1>
					<p className={styles.subtitle}>
						Choose how your liquidity is allocated across stable assets, crypto,
						and tokenized stocks.
					</p>
				</header>
				<ShipStrategy />
			</section>
		</main>
	);
}
