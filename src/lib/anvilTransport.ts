import {
	type EIP1193RequestFn,
	http,
	type RpcTransactionRequest,
	type Transport,
} from "viem";

// Anvil >= 1.8 fills a missing `gas` on eth_sendTransaction with the block gas
// limit. Robinhood (Arbitrum Orbit) reports 2^50, so impersonated JSON-RPC
// accounts fail the balance pre-check regardless of how much ETH they hold.
// viem only fills gas for local (private key) accounts, so do it here.
const GAS_BUFFER_NUMERATOR = BigInt(12);
const GAS_BUFFER_DENOMINATOR = BigInt(10);

export function anvilHttp(url: string): Transport {
	return (config) => {
		const inner = http(url)(config);

		const request: EIP1193RequestFn = async (args) => {
			if (args.method !== "eth_sendTransaction") return inner.request(args);

			const [tx] = args.params as [RpcTransactionRequest];
			if (tx.gas) return inner.request(args);

			const estimated = (await inner.request({
				method: "eth_estimateGas",
				params: [tx],
			})) as `0x${string}`;

			const gas =
				(BigInt(estimated) * GAS_BUFFER_NUMERATOR) / GAS_BUFFER_DENOMINATOR;

			return inner.request({
				method: "eth_sendTransaction",
				params: [{ ...tx, gas: `0x${gas.toString(16)}` }],
			});
		};

		return { ...inner, request };
	};
}
