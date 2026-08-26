import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { FloodReport } from '../types';

const COLLECTION_NAME = 'reports';

// In-memory / local storage fallback cache for demo mode
const LOCAL_STORAGE_KEY = 'floodprint_demo_reports';

function getLocalReports(): FloodReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: FloodReport[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

/**
 * Creates a new FloodReport in Firestore (or local demo store).
 */
export async function createReport(report: FloodReport): Promise<string> {
  if (!isFirebaseConfigured) {
    const local = getLocalReports();
    local.unshift(report);
    saveLocalReports(local);
    return report.id;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, report.id);
    await setDoc(docRef, report);
    return report.id;
  } catch (error) {
    console.error('Firestore createReport error:', error);
    throw new Error('Failed to save flood report to database. Please check connection.');
  }
}

export const saveReport = createReport;

/**
 * Fetches all reports submitted by a specific user.
 */
export async function getUserReports(userId: string): Promise<FloodReport[]> {
  if (!isFirebaseConfigured) {
    const local = getLocalReports();
    return local.filter(r => r.userId === userId || r.userId === 'demo_user_123');
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const reports: FloodReport[] = [];
    querySnapshot.forEach((docSnap) => {
      reports.push(docSnap.data() as FloodReport);
    });
    return reports;
  } catch (error) {
    console.error('Firestore getUserReports error:', error);
    throw new Error('Unable to retrieve user reports from database.');
  }
}

/**
 * Fetches a single report by ID.
 */
export async function getReportById(reportId: string): Promise<FloodReport | null> {
  if (!isFirebaseConfigured) {
    const local = getLocalReports();
    const found = local.find(r => r.id === reportId);
    return found || null;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as FloodReport;
    }
    return null;
  } catch (error) {
    console.error('Firestore getReportById error:', error);
    throw new Error(`Failed to load report ${reportId}`);
  }
}

/**
 * Updates a report in Firestore.
 */
export async function updateReport(reportId: string, updates: Partial<FloodReport>): Promise<void> {
  if (!isFirebaseConfigured) {
    const local = getLocalReports();
    const index = local.findIndex(r => r.id === reportId);
    if (index !== -1) {
      local[index] = { ...local[index], ...updates, updatedAt: new Date().toISOString() };
      saveLocalReports(local);
    }
    return;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firestore updateReport error:', error);
    throw new Error(`Failed to update report ${reportId}`);
  }
}
