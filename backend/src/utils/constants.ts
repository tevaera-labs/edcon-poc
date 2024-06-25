export const chainRpcMap:any = {
    8453: "https://mainnet.base.org",
    300: "https://sepolia.era.zksync.dev",
    324: "https://mainnet.era.zksync.io",
    1: "https://eth-mainnet.public.blastapi.io"
}

export enum Reward{
    ERC20 = "erc20",
    ERC721 = "erc721",
    ERC1155 = "erc1155"
}

export enum ContractMethods{
    TRANSFER = "transfer",
    TRANSFER_FROM = "transferFrom",
    APPROVE = "approve",
    SAFE_BATCH_TRANSFER_FROM = "safeBatchTransferFrom",
    MINT = "mint"
}