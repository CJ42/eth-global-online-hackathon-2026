"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "@/lib/wallet";
import styles from "./Navbar.module.css";

const links = [
	{ href: "/", label: "Home" },
	{ href: "/investors", label: "For Investors" },
	{ href: "/traders", label: "For Traders" },
] as const;

export function Navbar() {
	const pathname = usePathname();
	const { address, isConnecting, error, connect, disconnect } = useWallet();

	async function handleWalletClick() {
		if (address) {
			disconnect();
			return;
		}

		try {
			await connect();
		} catch {
			/* error is stored on the wallet context */
		}
	}

	return (
		<header className={styles.bar}>
			<Link href="/" className={styles.logo}>
				💧 Aqua Funds Manager
			</Link>

			<nav className={styles.links} aria-label="Main">
				{links.map((link) => {
					const isActive =
						link.href === "/"
							? pathname === "/"
							: pathname.startsWith(link.href);

					return (
						<Link
							key={link.href}
							href={link.href}
							className={`${styles.link} ${isActive ? styles.active : ""}`}
							aria-current={isActive ? "page" : undefined}
						>
							{link.label}
						</Link>
					);
				})}
			</nav>

			<div className={styles.walletWrap}>
				<Button
					type="button"
					className={styles.wallet}
					disabled={isConnecting}
					title={address ? "Disconnect wallet" : "Connect MetaMask"}
					onClick={handleWalletClick}
				>
					{isConnecting
						? "Connecting…"
						: address
							? shortenAddress(address)
							: "Connect Wallet"}
				</Button>
				{error && !address ? (
					<p className={styles.walletError} role="alert">
						{error}
					</p>
				) : null}
			</div>
		</header>
	);
}
