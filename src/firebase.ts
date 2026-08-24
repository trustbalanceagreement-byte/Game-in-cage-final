import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore,
  initializeFirestore, 
  setLogLevel, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// Safe loading of firebase config from standard file
const firebaseConfig = {
  apiKey: "AIzaSyCxrTD97GKdUCI4S49XGCXrknxXh7DYiUg",
  authDomain: "gen-lang-client-0401830513.firebaseapp.com",
  projectId: "gen-lang-client-0401830513",
  storageBucket: "gen-lang-client-0401830513.firebasestorage.app",
  messagingSenderId: "988132760997",
  appId: "1:988132760997:web:c547895e941738322edc4c",
  firestoreDatabaseId: "ai-studio-0c7016e3-29c4-4b66-8674-227bb80478c2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // ONLY throw if it's a permission denied / security rule error, as mandated by the firebase skill guidelines.
  // This prevents other common runtime/network/quota errors from crashing the app.
  const isPermissionError = 
    errCode === 'permission-denied' || 
    errMsg.toLowerCase().includes('permission') || 
    errMsg.toLowerCase().includes('insufficient');

  if (isPermissionError) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Silence internal Firestore logs to fully suppress quota limit warning spam in the console
setLogLevel('silent');

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn("Firestore persistent local cache failed to initialize (possibly inside iframe sandbox). Falling back to memory cache.", e);
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;

