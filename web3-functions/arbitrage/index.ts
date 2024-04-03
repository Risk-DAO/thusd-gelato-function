import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract } from "@ethersproject/contracts";
import { BigNumber, ethers } from 'ethers';

const configs = {
    "BTC": {
        token: "BTC", // this is just for display
        decimals: 8,
        arbContractAddress: "0x176F6373d69274Bc6420edBd6050eCC9430CFC00",
        profitReceiver: "0x7095F0B91A1010c11820B4E263927835A4CF52c9",
        bamm: "0x920623AcBa785ED9a70d33ACab53631e1e834675",
        amounts: [
            BigNumber.from(10).mul(BigNumber.from(10).pow(8)), // 10 WBTC
            BigNumber.from(1).mul(BigNumber.from(10).pow(8)), // 1 WBTC
            BigNumber.from(1).mul(BigNumber.from(10).pow(7)), // 0.1 WBTC
        ],
        abi: [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "bamm", "type": "address" }], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "btcQty", "type": "uint256" }, { "internalType": "address", "name": "bamm", "type": "address" }, { "internalType": "address", "name": "profitReceiver", "type": "address" }], "name": "swap", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "int256", "name": "amount0Delta", "type": "int256" }, { "internalType": "int256", "name": "amount1Delta", "type": "int256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "uniswapV3SwapCallback", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }]
    },
    "ETH": {
        token: "ETH", // this is just for display
        decimals: 18,
        arbContractAddress: "0xFBEA9aAA9a822AEDd429fDAB3099A2DBA942f196",
        profitReceiver: "0x7095F0B91A1010c11820B4E263927835A4CF52c9",
        bamm: "0x1f490764473eb1013461D6079F827DB95d8B4DC5",
        amounts: [
            BigNumber.from(100).mul(BigNumber.from(10).pow(18)), // 100 eth
            BigNumber.from(10).mul(BigNumber.from(10).pow(18)), // 10 eth
            BigNumber.from(1).mul(BigNumber.from(10).pow(18)), // 1 eth
            ],
        abi: [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "bamm", "type": "address" }], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "ethQty", "type": "uint256" }, { "internalType": "address", "name": "bamm", "type": "address" }, { "internalType": "address payable", "name": "profitReceiver", "type": "address" }], "name": "swap", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "int256", "name": "amount0Delta", "type": "int256" }, { "internalType": "int256", "name": "amount1Delta", "type": "int256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "uniswapV3SwapCallback", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }]
    }
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
    const { userArgs, multiChainProvider } = context;

    const token = userArgs.token as string;

    const cfg = configs[token];

    const contract = new Contract(cfg.arbContractAddress, cfg.abi, multiChainProvider.default());
    for (const amount of cfg.amounts) {
        const amountNorm = ethers.utils.formatUnits(amount.toString(), cfg.decimals);
        console.log(`[${cfg.token}] | Trying amount ${amountNorm} ${cfg.token}`);
        try {
            await contract.callStatic.swap(amount, cfg.bamm, cfg.profitReceiver);
        console.log(`[${cfg.token}] | Trying amount ${amountNorm} ${cfg.token} success`);
        // if no exception, return info for gelato to perform the swap
            return {
                canExec: true,
                callData: [
                    {
                        to: cfg.arbContractAddress,
                        data: contract.interface.encodeFunctionData("swap", [amount, cfg.bamm, cfg.profitReceiver])
                    }]
            }
        } catch (e) {
            console.log(`[${cfg.token}] | Swapping amount ${amountNorm} ${cfg.token} failed: `, { error: e.error.body });
            // this logs are usefull to simulate the tx in tenderly for example
            // console.log(e.transaction.to);
            // console.log(e.transaction.data);
        }
    }

    return {
        canExec: false,
        message: "Nothing to execute"
    }
});
