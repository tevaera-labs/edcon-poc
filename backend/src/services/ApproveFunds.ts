import { Wallet } from "ethers";
import { Provider, Contract } from "zksync-ethers";
import dotenv from "dotenv";
import { erc20abi } from "../utils/erc20abi";
import { erc721abi } from "../utils/erc721abi";
import { erc1155abi } from "../utils/erc1155abi";
import { Reward, chainRpcMap } from "../utils/constants";

dotenv.config();

const accPrivateKey = process.env.WALLET_PRIVATE_KEY as string;
const spenderAddress = process.env.SPENDER_ADDRESS as string;

export const approveFunds = async (data: any) => {
    const { chainId, contractAddress, reward, walletAddress, amount } = data;
    const provider = new Provider(chainRpcMap[chainId]);
    const wallet = new Wallet(accPrivateKey as string, provider);

    let contractAbi;
    if (reward === Reward.ERC20) {
        contractAbi = erc20abi;
        const contract = new Contract(contractAddress, contractAbi, wallet);
        const isApproved = await contract.approve(spenderAddress, amount);
        if (isApproved) {
            return "Approval succeeded";
        } else {
            return "Approval did not succeed";
        }
    } else if (reward === Reward.ERC721 || reward === Reward.ERC1155) {
        contractAbi = erc721abi;
        const contract = new Contract(contractAddress, contractAbi, wallet);
        const isApproved = await contract.isApprovedForAll(
            walletAddress,
            spenderAddress
        );

        if (!isApproved) {
            console.log(
                `Operator is not approved. Approving operator ${spenderAddress}...`
            );

            // Set approval for all tokens
            const approveTx = await contract.setApprovalForAll(
                spenderAddress,
                true
            );
            console.log("Approval transaction hash:", approveTx.hash);

            // Wait for the transaction to be mined
            await approveTx.wait();
            return "Operator is approved.."
        } else {
            return "Already Approved";
        }
    } else {
        throw new Error("Invalid Approval Funds request")
    }
}