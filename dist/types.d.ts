export interface EthernalConfig {
    disableSync: boolean;
    disableTrace: boolean;
    workspace?: string;
    uploadAst: boolean;
    disabled: boolean;
    resetOnStart?: string;
    email?: string;
    password?: string;
    serverSync?: boolean;
    apiToken?: string;
    skipFirstBlock?: boolean;
    verbose?: boolean;
}
export interface ContractInput {
    name: string;
    address: string;
    workspace?: string;
}
export declare type EthernalContract = {
    name: string;
    abi: any;
    address: string;
    artifact: string;
    dependencies: {
        [dependencyName: string]: string;
    };
};
export declare type Workspace = {
    id: number;
    name: string;
    chain: string;
    networkId: string;
    public: boolean;
    rpcServer: string;
    defaultAccount?: string;
    gasLimit?: string;
    gasPrice?: string;
    userId: number;
    apiEnabled: boolean;
    tracing?: string;
    alchemyIntegrationEnabled: boolean;
    isRemote?: boolean;
    createdAt: string;
    updatedAt: string;
};
export declare type User = {
    isPremium: boolean;
    id: number;
    firebaseUserId: string;
    email: string;
    apiKey: string;
    currentWorkspaceId: number;
    plan: string;
    stripeCustomerId: string;
    explorerSubscriptionId?: string;
    createdAt: string;
    updatedAt: string;
    workspaces: Workspace[];
};
export declare type SyncedBlock = {
    hash: string;
    parentHash: string;
    number: number;
    timestamp: string;
    nonce: string;
    difficulty: string;
    gasLimit: string;
    gasUsed: string;
    miner: string;
    extraData: string;
};
export declare type TraceStep = {
    op: string;
    contractHashedBytecode: string;
    address: string;
    input: string;
    depth: number;
    returnData?: string;
};
//# sourceMappingURL=types.d.ts.map