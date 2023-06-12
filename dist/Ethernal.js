"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ethernal = void 0;
const message_trace_1 = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const api_1 = require("./api");
const ETHERNAL_API_ROOT = process.env.ETHERNAL_API_ROOT || 'https://api.tryethernal.com';
const ETHERNAL_WEBAPP_ROOT = process.env.ETHERNAL_WEBAPP_ROOT || 'https://app.tryethernal.com';
const logger = (message) => {
    console.log(`[Ethernal] `, message);
};
const handleError = (baseMessage, error, verbose) => {
    var _a;
    try {
        const errorMessage = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || (error === null || error === void 0 ? void 0 : error.message) || `Can't find an error message. Try in verbose mode.`;
        logger(`${baseMessage}: ${errorMessage}`);
        if (verbose) {
            console.log(error);
        }
    }
    catch (_error) {
        logger(_error.message);
        if (verbose) {
            console.log(_error);
        }
    }
};
class Ethernal {
    constructor(hre) {
        this.env = hre;
        this.api = new api_1.Api(ETHERNAL_API_ROOT, ETHERNAL_WEBAPP_ROOT);
        this.syncNextBlock = false;
        this.traces = [];
        this.verbose = hre.config.ethernal.verbose || false;
        if (this.verbose) {
            console.log('### Verbose mode activated - Showing Ethernal plugin config ###');
            console.log(this.env.config.ethernal);
            console.log('### End of config ###');
        }
    }
    async startListening() {
        const envSet = await this.setLocalEnvironment();
        if (!envSet) {
            return;
        }
        if (this.env.config.ethernal.resetOnStart) {
            await this.resetWorkspace(this.env.config.ethernal.resetOnStart);
        }
        this.env.ethers.provider.on('block', (blockNumber, error) => {
            if (!!this.env.config.ethernal.skipFirstBlock && !this.syncNextBlock) {
                logger(`Skipping block ${blockNumber}`);
                this.syncNextBlock = true;
            }
            else {
                this.onData(blockNumber, error);
            }
        });
        this.env.ethers.provider.on('error', (error) => this.onError(error));
        this.env.ethers.provider.on('pending', () => this.onPending());
    }
    async push(targetContract) {
        if (this.env.config.ethernal.disabled) {
            return;
        }
        const envSet = await this.setLocalEnvironment();
        if (!envSet) {
            return;
        }
        this.targetContract = targetContract;
        if (!this.targetContract.name || !this.targetContract.address) {
            return logger('Contract name and address are mandatory');
        }
        const contract = await this.getFormattedArtifact(targetContract);
        if (!contract) {
            return;
        }
        try {
            await this.api.syncContractData(contract.name, contract.address, contract.abi);
        }
        catch (error) {
            handleError('Error syncing contract data', error, this.verbose);
        }
        if (this.env.config.ethernal.uploadAst) {
            logger('Uploading ASTs, this might take a while depending on the size of your contracts.');
            try {
                await this.api.syncContractAst(contract.address, {
                    artifact: contract.artifact,
                    dependencies: contract.dependencies
                });
            }
            catch (error) {
                handleError(`Couldn't sync dependencies`, error, this.verbose);
            }
        }
        const dependencies = Object.entries(contract.dependencies).map(art => art[0]);
        const dependenciesString = dependencies.length ? ` Dependencies: ${dependencies.join(', ')}` : '';
        logger(`Updated artifacts for contract ${contract.name} (${contract.address}).${dependenciesString}`);
    }
    async traceHandler(trace, isMessageTraceFromACall) {
        if (this.env.config.ethernal.disabled) {
            return;
        }
        if (this.env.config.ethernal.disableTrace) {
            return;
        }
        if (isMessageTraceFromACall) {
            return;
        }
        await this.setLocalEnvironment();
        const envSet = await this.setLocalEnvironment();
        if (!envSet) {
            return;
        }
        const parsedTrace = [];
        const stepper = async (step) => {
            if ((0, message_trace_1.isEvmStep)(step) || (0, message_trace_1.isPrecompileTrace)(step)) {
                return;
            }
            if ((0, message_trace_1.isCreateTrace)(step) && step.deployedContract) {
                const address = `0x${step.deployedContract.toString('hex')}`;
                const bytecode = await this.env.ethers.provider.getCode(address);
                parsedTrace.push({
                    op: 'CREATE2',
                    contractHashedBytecode: this.env.ethers.keccak256(bytecode),
                    address,
                    depth: step.depth
                });
            }
            if ((0, message_trace_1.isCallTrace)(step)) {
                const address = `0x${step.address.toString('hex')}`;
                const bytecode = await this.env.ethers.provider.getCode(address);
                parsedTrace.push({
                    op: 'CALL',
                    contractHashedBytecode: this.env.ethers.keccak256(bytecode),
                    address,
                    input: step.calldata.toString('hex'),
                    depth: step.depth,
                    returnData: step.returnData.toString('hex')
                });
            }
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < step.steps.length; i++) {
                await stepper(step.steps[i]);
            }
        };
        if (!(0, message_trace_1.isEvmStep)(trace) && !(0, message_trace_1.isPrecompileTrace)(trace)) {
            for (const step of trace.steps) {
                await stepper(step);
            }
        }
        this.traces.push(parsedTrace);
    }
    async resetWorkspace(workspace) {
        if (this.env.config.ethernal.disabled) {
            return;
        }
        const envSet = await this.setLocalEnvironment();
        if (!envSet) {
            return;
        }
        logger(`Resetting workspace "${workspace}"...`);
        try {
            await this.api.resetWorkspace(workspace);
            logger(`Workspace "${workspace}" has been reset!`);
        }
        catch (error) {
            handleError(`Error while resetting workspace "${workspace}"`, error, this.verbose);
        }
    }
    async onData(blockNumber, error) {
        if (error && error.reason) {
            return logger(`Error while receiving data: ${error.reason}`);
        }
        if (this.env.config.ethernal.serverSync) {
            try {
                logger(`Syncing block #${blockNumber}...`);
                await this.api.syncBlock({ number: blockNumber }, true);
            }
            catch (error) {
                handleError(`Couldn't sync block #${blockNumber}`, error, this.verbose);
            }
        }
        else {
            try {
                const block = await this.env.ethers.provider.getBlock(blockNumber, true);
                if (block) {
                    await this.syncBlock(block);
                }
            }
            catch (error) {
                handleError(`Couldn't sync block #${blockNumber}`, error, this.verbose);
            }
        }
    }
    onError(error) {
        if (error && error.reason) {
            handleError(`Could not connect to ${this.env.ethers.provider}`, error, this.verbose);
        }
        else {
            handleError(`Could not connect to ${this.env.ethers.provider}`, error, this.verbose);
        }
    }
    async setLocalEnvironment() {
        if (this.api.isLoggedIn && this.api.hasWorkspace) {
            return true;
        }
        if (!this.api.isLoggedIn) {
            const isLoggedIn = await this.login();
            if (!isLoggedIn) {
                return false;
            }
        }
        const isWorkspaceSet = await this.setWorkspace();
        if (!isWorkspaceSet) {
            return false;
        }
        return true;
    }
    onPending() {
        // TODO: to implement
    }
    async syncBlock(block) {
        if (block) {
            const trace = this.traces.shift();
            try {
                await this.api.syncBlock(block, false);
                logger(`Synced block #${block.number}`);
            }
            catch (error) {
                handleError(`Couldn't sync block #${block.number}`, error, this.verbose);
            }
            for (let i = 0; i < block.prefetchedTransactions.length; i++) {
                const transaction = block.prefetchedTransactions[i];
                try {
                    const receipt = await this.env.ethers.provider.getTransactionReceipt(transaction.hash);
                    if (!receipt) {
                        logger(`Couldn't get receipt for transaction ${transaction.hash}`);
                    }
                    else {
                        // We can't match a trace to a transaction, so we assume blocks with 1 transaction, and sync the trace only for the first one
                        await this.syncTransaction(block, transaction, receipt, i === 0 ? trace : null);
                    }
                }
                catch (error) {
                    handleError(`Couldn't sync transaction ${transaction.hash}`, error, this.verbose);
                }
            }
        }
    }
    stringifyBns(obj) {
        const res = {};
        for (const key in obj) {
            if (typeof obj[key] === 'bigint') {
                res[key] = obj[key].toString();
            }
            else {
                res[key] = obj[key];
            }
        }
        return res;
    }
    async syncTransaction(block, transaction, transactionReceipt, trace) {
        try {
            await this.api.syncTransaction(block, transaction, transactionReceipt);
            logger(`Synced transaction ${transaction.hash}`);
        }
        catch (error) {
            handleError(`Couldn't sync transaction ${transaction.hash}`, error, this.verbose);
        }
        if (trace && trace.length) {
            try {
                await this.api.syncTrace(transaction.hash, trace);
                logger(`Synced trace for transaction ${transaction.hash}`);
            }
            catch (error) {
                handleError(`Error while syncing trace for transaction ${transaction.hash}`, error, this.verbose);
            }
        }
    }
    async setWorkspace() {
        try {
            const workspace = await this.api.setWorkspace(this.env.config.ethernal.workspace);
            logger(`Using workspace "${workspace.name}"`);
            return true;
        }
        catch (error) {
            handleError(`Error while setting the workspace`, error, this.verbose);
            return false;
        }
    }
    async login() {
        try {
            if (this.env.config.ethernal.apiToken) {
                await this.api.setApiToken(this.env.config.ethernal.apiToken);
                logger(`Authenticated with API token.`);
            }
            else {
                let email;
                let password;
                email = this.env.config.ethernal.email;
                if (!email) {
                    return logger(`Missing email to authenticate. Make sure you've either set ETHERNAL_EMAIL in your environment or they key 'email' in your Ethernal config object & restart the node.`);
                }
                else {
                    password = this.env.config.ethernal.password;
                    if (!password) {
                        return logger(`Missing password to authenticate. Make sure you've either set ETHERNAL_PASSWORD in your environment or they key 'password' in your Ethernal config object & restart the node.`);
                    }
                }
                await this.api.login(email, password);
                logger(`Logged in with ${email}`);
            }
            return true;
        }
        catch (error) {
            handleError(`Login error`, error, this.verbose);
            return false;
        }
    }
    async getFormattedArtifact(targetContract) {
        const fullyQualifiedNames = await this.env.artifacts.getAllFullyQualifiedNames();
        const defaultBuildInfo = {
            output: {
                contracts: {},
                sources: {}
            }
        };
        const res = {
            name: '',
            address: '',
            abi: {},
            artifact: '',
            dependencies: {}
        };
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < fullyQualifiedNames.length; i++) {
            const buildInfo = await this.env.artifacts.getBuildInfo(fullyQualifiedNames[i]);
            if (!buildInfo) {
                continue;
            }
            const buildInfoContracts = buildInfo.output.contracts;
            const buildInfoOutputSources = buildInfo.output.sources;
            const buildInfoInputSources = buildInfo.input.sources;
            // tslint:disable-next-line:forin
            for (const contractFile in buildInfoContracts) {
                // tslint:disable-next-line:forin
                for (const contractName in buildInfoContracts[contractFile]) {
                    const artifact = JSON.stringify({
                        contractName,
                        abi: buildInfoContracts[contractFile][contractName].abi,
                        ast: buildInfoOutputSources[contractFile].ast,
                        source: buildInfoInputSources[contractFile].content
                    });
                    if (contractName === targetContract.name) {
                        res.abi = buildInfoContracts[contractFile][contractName].abi;
                        res.name = contractName;
                        res.artifact = artifact;
                        res.address = targetContract.address;
                    }
                    else {
                        res.dependencies[contractName] = artifact;
                    }
                }
            }
        }
        return res;
    }
    sanitize(obj) {
        let res = {};
        res = Object.fromEntries(Object.entries(obj)
            .filter(([_, v]) => v != null));
        return res;
    }
}
exports.Ethernal = Ethernal;
//# sourceMappingURL=Ethernal.js.map