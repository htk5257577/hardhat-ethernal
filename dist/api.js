"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = void 0;
// tslint:disable-next-line:no-var-requires
const axios = require('axios');
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
// tslint:disable-next-line:no-var-requires
const { FIREBASE_CONFIG } = require('./config');
const app = (0, app_1.initializeApp)(FIREBASE_CONFIG);
const auth = (0, auth_1.getAuth)(app);
class Api {
    constructor(apiRoot, webappRoot) {
        this.apiRoot = apiRoot;
        this.auth = auth;
        this.webappRoot = webappRoot;
    }
    get isLoggedIn() {
        return !!this.currentUser;
    }
    get hasWorkspace() {
        return !!this.currentWorkspace;
    }
    get currentWorkspaceName() {
        var _a;
        return (_a = this.currentWorkspace) === null || _a === void 0 ? void 0 : _a.name;
    }
    get isUsingApiToken() {
        return !!this.apiToken;
    }
    async getFirebaseAuthToken() {
        var _a;
        return !this.isUsingApiToken && ((_a = this.auth) === null || _a === void 0 ? void 0 : _a.currentUser) ? this.auth.currentUser.getIdToken() : null;
    }
    async setApiToken(apiToken) {
        try {
            this.apiToken = apiToken;
            axios.defaults.headers.common.authorization = `Bearer ${this.apiToken}`;
            return await this.fetchUser();
        }
        catch (error) {
            throw error;
        }
    }
    async fetchUser() {
        const firebaseAuthToken = await this.getFirebaseAuthToken();
        if (!firebaseAuthToken && !this.isUsingApiToken) {
            throw new Error('You need to authenticate first');
        }
        this.currentUser = (await axios.get(`${this.apiRoot}/api/users/me?firebaseAuthToken=${firebaseAuthToken}`)).data;
        if (!this.currentUser.workspaces.length) {
            throw new Error(`You need to create a new workspace on ${this.webappRoot} before using the plugin`);
        }
        if (this.currentUser.currentWorkspace) {
            this.currentWorkspace = this.currentUser.currentWorkspace;
        }
        else {
            await this.setWorkspace(this.currentUser.workspaces[0].name);
            await axios.post(`${this.apiRoot}/api/users/me/setCurrentWorkspace`, { firebaseAuthToken, data: { workspace: this.currentUser.workspaces[0].name } });
        }
        return this.currentWorkspace;
    }
    async login(email, password) {
        try {
            if (this.apiToken) {
                throw new Error('Authenticating with API token');
            }
            if (process.env.AUTH_HOST) {
                (0, auth_1.connectAuthEmulator)(auth, process.env.AUTH_HOST);
            }
            await (0, auth_1.signInWithEmailAndPassword)(this.auth, email, password);
            if (this.auth.currentUser) {
                this.firebaseUserId = this.auth.currentUser.uid;
                return this.fetchUser();
            }
            else {
                throw new Error(`Couldn't login with the specified email/password`);
            }
        }
        catch (error) {
            if (error.code === 'auth/wrong-password') {
                throw new Error(`Couldn't login with the specified email/password`);
            }
            throw error;
        }
    }
    async setWorkspace(workspace) {
        if (workspace && this.currentUser) {
            let foundWorkspace = false;
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.currentUser.workspaces.length; i++) {
                const loopedWorkspace = this.currentUser.workspaces[i];
                if (loopedWorkspace.name === workspace) {
                    this.currentWorkspace = loopedWorkspace;
                    foundWorkspace = true;
                    break;
                }
            }
            if (!foundWorkspace) {
                throw new Error(`Couldn't find workspace ${workspace}. Make sure you're logged in with the correct account`);
            }
            const firebaseAuthToken = await this.getFirebaseAuthToken();
            if (!firebaseAuthToken && !this.isUsingApiToken) {
                throw new Error('[setWorkspace] You need to be authenticated to set a workspace');
            }
        }
        return this.currentWorkspace;
    }
    async resetWorkspace(workspaceName) {
        if (!workspaceName) {
            throw new Error('[resetWorkspace] Missing workspace name');
        }
        const firebaseAuthToken = await this.getFirebaseAuthToken();
        if (!firebaseAuthToken && !this.isUsingApiToken) {
            throw new Error('[resetWorkspace] You need to be authenticated to reset a workspace');
        }
        return axios.post(`${this.apiRoot}/api/workspaces/reset`, { firebaseAuthToken, data: { workspace: workspaceName } });
    }
    async syncBlock(block, serverSync = false) {
        if (!block) {
            throw new Error('[syncBlock] Missing block');
        }
        const firebaseAuthToken = await this.getFirebaseAuthToken();
        if (!firebaseAuthToken && !this.isUsingApiToken) {
            throw new Error('[syncBlock] You need to be authenticated to reset a workspace');
        }
        if (!this.currentWorkspace) {
            throw new Error('[syncBlock] The workspace needs to be set to synchronize blocks.');
        }
        return axios.post(`${this.apiRoot}/api/blocks?serverSync=${serverSync}`, { firebaseAuthToken, data: { block, workspace: this.currentWorkspace.name } });
    }
    async syncTransaction(block, transaction, transactionReceipt) {
        if (!block || !transaction || !transactionReceipt) {
            throw new Error('[syncTransaction] Missing parameter');
        }
        const firebaseAuthToken = await this.getFirebaseAuthToken();
        if (!firebaseAuthToken && !this.isUsingApiToken) {
            throw new Error('[syncTransaction] You need to be authenticated to reset a workspace');
        }
        if (!this.currentWorkspace) {
            throw new Error('[syncTransaction] The workspace needs to be set to synchronize blocks');
        }
        return axios.post(`${this.apiRoot}/api/transactions`, {
            firebaseAuthToken,
            data: {
                block,
                transaction,
                transactionReceipt,
                workspace: this.currentWorkspace.name
            }
        });
    }
    async syncTrace(transactionHash, trace) {
        if (!transactionHash || !trace) {
            throw new Error('[syncTrace] Missing parameter');
        }
        const firebaseAuthToken = await this.getFirebaseAuthToken();
        if (!firebaseAuthToken && !this.isUsingApiToken) {
            throw new Error('[syncTrace] You need to be authenticated to reset a workspace');
        }
        if (!this.currentWorkspace) {
            throw new Error('[syncTrace] The workspace needs to be set to synchronize blocks');
        }
        return axios.post(`${this.apiRoot}/api/transactions/${transactionHash}/trace`, {
            firebaseAuthToken,
            data: {
                txHash: transactionHash,
                steps: trace,
                workspace: this.currentWorkspace.name
            }
        });
    }
    async syncContractData(name, address, abi, hashedBytecode) {
        if (!name || !address) {
            throw new Error('[syncContractData] Missing parameter');
        }
        const firebaseAuthToken = await this.getFirebaseAuthToken();
        if (!firebaseAuthToken && !this.isUsingApiToken) {
            throw new Error('[syncContractData] You need to be authenticated to reset a workspace');
        }
        if (!this.currentWorkspace) {
            throw new Error('[syncContractData] The workspace needs to be set to synchronize blocks');
        }
        return axios.post(`${this.apiRoot}/api/contracts/${address}`, {
            firebaseAuthToken,
            data: {
                name,
                address,
                abi,
                hashedBytecode,
                workspace: this.currentWorkspace.name
            }
        });
    }
    async syncContractAst(address, ast) {
        if (!address || !ast) {
            throw new Error('[syncContractAst] Missing parameter');
        }
        const firebaseAuthToken = await this.getFirebaseAuthToken();
        if (!firebaseAuthToken && !this.isUsingApiToken) {
            throw new Error('[syncContractData] You need to be authenticated to reset a workspace');
        }
        if (!this.currentWorkspace) {
            throw new Error('[syncContractAst] The workspace needs to be set to synchronize blocks');
        }
        return axios.post(`${this.apiRoot}/api/contracts/${address}`, {
            firebaseAuthToken,
            data: {
                ast,
                workspace: this.currentWorkspace.name
            }
        });
    }
}
exports.Api = Api;
//# sourceMappingURL=api.js.map