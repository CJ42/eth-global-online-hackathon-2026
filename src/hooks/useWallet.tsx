"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { Address } from "viem";
import {
	ensureRobinhoodNetwork,
	getEthereumProvider,
} from "@/lib/wallet";

type WalletContextValue = {
	address: Address | null;
	isConnecting: boolean;
	error: string | null;
	connect: () => Promise<void>;
	disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
	const [address, setAddress] = useState<Address | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!window.ethereum) return;

		const provider = window.ethereum;

		provider
			.request({ method: "eth_accounts" })
			.then((accounts) => {
				const list = accounts as string[];
				if (list[0]) setAddress(list[0] as Address);
			})
			.catch(() => {});

		function onAccountsChanged(accounts: unknown) {
			const list = accounts as string[];
			setAddress((list[0] as Address) ?? null);
		}

		provider.on?.("accountsChanged", onAccountsChanged);
		return () => provider.removeListener?.("accountsChanged", onAccountsChanged);
	}, []);

	const connect = useCallback(async () => {
		setError(null);
		setIsConnecting(true);

		try {
			const provider = getEthereumProvider();
			const accounts = (await provider.request({
				method: "eth_requestAccounts",
			})) as string[];
			const account = accounts[0] as Address | undefined;
			if (!account) throw new Error("No wallet account selected");
			setAddress(account);

			try {
				await ensureRobinhoodNetwork(provider);
			} catch (networkError) {
				setError(
					networkError instanceof Error
						? networkError.message
						: "Connected, but this wallet could not switch to the Robinhood fork.",
				);
			}
		} catch (connectError) {
			const message =
				connectError instanceof Error
					? connectError.message
					: "Failed to connect wallet";
			setError(message);
			throw connectError;
		} finally {
			setIsConnecting(false);
		}
	}, []);

	const disconnect = useCallback(() => {
		setAddress(null);
		setError(null);
	}, []);

	return (
		<WalletContext.Provider
			value={{ address, isConnecting, error, connect, disconnect }}
		>
			{children}
		</WalletContext.Provider>
	);
}

export function useWallet() {
	const context = useContext(WalletContext);
	if (!context) throw new Error("useWallet must be used within WalletProvider");
	return context;
}
