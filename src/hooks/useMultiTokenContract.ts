import { useSuiClient } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { MULTI_TOKEN_CONTRACT, SUPPORTED_TOKENS, SupportedTokenSymbol } from '@/lib/multi-token-contract';

export function useMultiTokenContract() {
  const client = useSuiClient();

  // Create OFF_RAMP transaction (Token → Naira)
  const createOffRampTransaction = async (
    tokenType: SupportedTokenSymbol,
    amount: string,
    bankAccount: string,
    bankName: string,
    coinId: string
  ) => {
    const txb = new TransactionBlock();
    
    // Get token info
    const tokenInfo = SUPPORTED_TOKENS[tokenType];
    
    // Move call to create off-ramp transaction
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::create_off_ramp_transaction`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.contractId), // contract
        txb.object(MULTI_TOKEN_CONTRACT.treasuryId), // treasury
        txb.object(coinId), // payment coin
        txb.pure.string(tokenType), // token type
        txb.pure.string(bankAccount), // bank account
        txb.pure.string(bankName), // bank name
      ],
      typeArguments: [tokenInfo.address], // token type argument
    });

    return await client.signAndExecuteTransaction({
      transaction: txb,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
  };

  // Create ON_RAMP transaction (Naira → Token)
  const createOnRampTransaction = async (
    tokenType: SupportedTokenSymbol,
    nairaAmount: string,
    paymentReference: string,
    paymentSourceAccount: string,
    paymentSourceBank: string,
    paymentSourceName: string
  ) => {
    const txb = new TransactionBlock();
    
    // Move call to create on-ramp transaction
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::create_on_ramp_transaction`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.contractId), // contract
        txb.pure.string(tokenType), // token type
        txb.pure.u64(nairaAmount), // naira amount
        txb.pure.string(paymentReference), // payment reference
        txb.pure.string(paymentSourceAccount), // payment source account
        txb.pure.string(paymentSourceBank), // payment source bank
        txb.pure.string(paymentSourceName), // payment source name
      ],
    });

    return await client.signAndExecuteTransaction({
      transaction: txb,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
  };

  // Get exchange rate for a token
  const getExchangeRate = async (tokenType: SupportedTokenSymbol) => {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::get_exchange_rate`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.contractId), // contract
        txb.pure.string(tokenType), // token type
      ],
    });

    const result = await client.devInspectTransaction({
      transaction: txb,
      sender: MULTI_TOKEN_CONTRACT.contractId, // Use contract as sender for view calls
    });

    return result.results?.[0]?.returnValues?.[0]?.[0];
  };

  // Get amount limits for a token
  const getAmountLimits = async (tokenType: SupportedTokenSymbol) => {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::get_amount_limits`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.contractId), // contract
        txb.pure.string(tokenType), // token type
      ],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: MULTI_TOKEN_CONTRACT.contractId,
    });

    return {
      minAmount: result.results?.[0]?.returnValues?.[0]?.[0],
      maxAmount: result.results?.[0]?.returnValues?.[1]?.[0],
    };
  };

  // Check if token is supported
  const isTokenSupported = async (tokenType: SupportedTokenSymbol) => {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::is_token_supported`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.contractId), // contract
        txb.pure.string(tokenType), // token type
      ],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: MULTI_TOKEN_CONTRACT.contractId,
    });

    return result.results?.[0]?.returnValues?.[0]?.[0];
  };

  // Get contract information
  const getContractInfo = async () => {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::get_contract_info`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.contractId), // contract
      ],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: MULTI_TOKEN_CONTRACT.contractId,
    });

    return result.results?.[0]?.returnValues;
  };

  // Get treasury information
  const getTreasuryInfo = async () => {
    const txb = new TransactionBlock();
    
    txb.moveCall({
      target: `${MULTI_TOKEN_CONTRACT.packageId}::${MULTI_TOKEN_CONTRACT.moduleName}::get_treasury_info`,
      arguments: [
        txb.object(MULTI_TOKEN_CONTRACT.treasuryId), // treasury
      ],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: MULTI_TOKEN_CONTRACT.contractId,
    });

    return result.results?.[0]?.returnValues;
  };

  return {
    createOffRampTransaction,
    createOnRampTransaction,
    getExchangeRate,
    getAmountLimits,
    isTokenSupported,
    getContractInfo,
    getTreasuryInfo,
  };
}
