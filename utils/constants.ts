export const networkRPC = {
    mainnet: 'https://rpc.ankr.com/eth',
    goerli: 'https://rpc.ankr.com/eth_goerli',
    maticmum: 'https://rpc.ankr.com/polygon_mumbai',
}

export type AllowedNetwork = keyof typeof networkRPC;