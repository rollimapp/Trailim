import { 
  Place, 
  KnowledgeAsset, 
  RouteVersion, 
  VerificationRecord, 
  RouteHealthReport, 
  RouteHealthSummary, 
  RouteAdoption, 
  CommissionChallenge, 
  ChallengeSubmission 
} from '../types/domain';
import { 
  mockPlaces, 
  mockKnowledgeAssets, 
  mockRouteVersions, 
  mockVerificationRecords, 
  mockHealthReports, 
  mockHealthSummaries, 
  mockRouteAdoptions, 
  mockCommissionChallenges, 
  mockChallengeSubmissions 
} from '../data/domainMockData';

const STORAGE_KEYS = {
  PLACES: 'trailim_domain_places_v1',
  KNOWLEDGE_ASSETS: 'trailim_domain_knowledge_assets_v1',
  ROUTE_VERSIONS: 'trailim_domain_route_versions_v1',
  VERIFICATIONS: 'trailim_domain_verifications_v1',
  HEALTH_REPORTS: 'trailim_domain_health_reports_v1',
  ADOPTIONS: 'trailim_domain_adoptions_v1',
  CHALLENGES: 'trailim_domain_challenges_v1',
};

class DomainService {
  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.PLACES)) {
      localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(mockPlaces));
    }
    if (!localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_ASSETS)) {
      localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_ASSETS, JSON.stringify(mockKnowledgeAssets));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROUTE_VERSIONS)) {
      localStorage.setItem(STORAGE_KEYS.ROUTE_VERSIONS, JSON.stringify(mockRouteVersions));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VERIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(mockVerificationRecords));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HEALTH_REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.HEALTH_REPORTS, JSON.stringify(mockHealthReports));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADOPTIONS)) {
      localStorage.setItem(STORAGE_KEYS.ADOPTIONS, JSON.stringify(mockRouteAdoptions));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHALLENGES)) {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(mockCommissionChallenges));
    }
  }

  // --- PLACES ---
  public getPlaces(): Place[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLACES);
      return data ? JSON.parse(data) : mockPlaces;
    } catch (e) {
      return mockPlaces;
    }
  }

  public getPlaceById(id: string): Place | undefined {
    return this.getPlaces().find(p => p.id === id);
  }

  public savePlace(place: Place): Place {
    const list = this.getPlaces();
    const idx = list.findIndex(p => p.id === place.id);
    if (idx >= 0) {
      list[idx] = { ...place, updatedAt: new Date().toISOString() };
    } else {
      list.push(place);
    }
    localStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(list));
    return place;
  }

  // --- KNOWLEDGE ASSETS ---
  public getKnowledgeAssets(): KnowledgeAsset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_ASSETS);
      return data ? JSON.parse(data) : mockKnowledgeAssets;
    } catch (e) {
      return mockKnowledgeAssets;
    }
  }

  public getKnowledgeAssetsForPlace(placeId: string): KnowledgeAsset[] {
    return this.getKnowledgeAssets().filter(ka => ka.placeId === placeId);
  }

  public saveKnowledgeAsset(asset: KnowledgeAsset): KnowledgeAsset {
    const list = this.getKnowledgeAssets();
    const idx = list.findIndex(ka => ka.id === asset.id);
    if (idx >= 0) {
      list[idx] = { ...asset, updatedAt: new Date().toISOString() };
    } else {
      list.push(asset);
    }
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_ASSETS, JSON.stringify(list));
    return asset;
  }

  // --- ROUTE VERSIONS ---
  public getRouteVersions(routeId: string): RouteVersion[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTE_VERSIONS);
      const all: RouteVersion[] = data ? JSON.parse(data) : mockRouteVersions;
      return all.filter(rv => rv.routeId === routeId).sort((a, b) => b.versionNumber - a.versionNumber);
    } catch (e) {
      return mockRouteVersions.filter(rv => rv.routeId === routeId);
    }
  }

  public createRouteVersion(routeId: string, createdBy: string, changeSummary: string, stationIds: string[]): RouteVersion {
    const versions = this.getRouteVersions(routeId);
    const nextVer = (versions[0]?.versionNumber || 1) + 1;
    const newVer: RouteVersion = {
      id: `rv-${routeId}-v${nextVer}`,
      routeId,
      versionNumber: nextVer,
      createdFromVersionId: versions[0]?.id,
      createdBy,
      stationConfiguration: stationIds,
      changeSummary,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    const data = localStorage.getItem(STORAGE_KEYS.ROUTE_VERSIONS);
    const all: RouteVersion[] = data ? JSON.parse(data) : mockRouteVersions;
    all.unshift(newVer);
    localStorage.setItem(STORAGE_KEYS.ROUTE_VERSIONS, JSON.stringify(all));
    return newVer;
  }

  // --- VERIFICATION RECORDS ---
  public getVerificationRecords(routeId: string): VerificationRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
      const all: VerificationRecord[] = data ? JSON.parse(data) : mockVerificationRecords;
      return all.filter(v => v.routeId === routeId);
    } catch (e) {
      return mockVerificationRecords.filter(v => v.routeId === routeId);
    }
  }

  public addVerificationRecord(record: Omit<VerificationRecord, 'id' | 'verifiedAt'>): VerificationRecord {
    const full: VerificationRecord = {
      ...record,
      id: `verif-${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    };
    const data = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
    const all: VerificationRecord[] = data ? JSON.parse(data) : mockVerificationRecords;
    all.unshift(full);
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(all));
    return full;
  }

  // --- ROUTE HEALTH ---
  public getHealthSummary(routeId: string): RouteHealthSummary {
    return mockHealthSummaries[routeId] || {
      routeId,
      healthStatus: 'healthy',
      openIssueCount: 0,
    };
  }

  public getHealthReports(routeId: string): RouteHealthReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HEALTH_REPORTS);
      const all: RouteHealthReport[] = data ? JSON.parse(data) : mockHealthReports;
      return all.filter(hr => hr.routeId === routeId);
    } catch (e) {
      return mockHealthReports.filter(hr => hr.routeId === routeId);
    }
  }

  public reportRouteHealthIssue(routeId: string, type: any, severity: any, description: string, reportedBy: string): RouteHealthReport {
    const report: RouteHealthReport = {
      id: `health-${Date.now()}`,
      routeId,
      reportType: type,
      severity,
      description,
      reportedBy,
      createdAt: new Date().toISOString(),
      status: 'open',
    };
    const data = localStorage.getItem(STORAGE_KEYS.HEALTH_REPORTS);
    const all: RouteHealthReport[] = data ? JSON.parse(data) : mockHealthReports;
    all.unshift(report);
    localStorage.setItem(STORAGE_KEYS.HEALTH_REPORTS, JSON.stringify(all));
    return report;
  }

  // --- COMMISSIONED CHALLENGES ---
  public getCommissionChallenges(): CommissionChallenge[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return data ? JSON.parse(data) : mockCommissionChallenges;
    } catch (e) {
      return mockCommissionChallenges;
    }
  }

  public getChallengeSubmissions(challengeId: string): ChallengeSubmission[] {
    return mockChallengeSubmissions.filter(cs => cs.challengeId === challengeId);
  }

  // --- ROUTE ADOPTION ---
  public getAdoptions(): RouteAdoption[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADOPTIONS);
      return data ? JSON.parse(data) : mockRouteAdoptions;
    } catch (e) {
      return mockRouteAdoptions;
    }
  }

  public adoptRoute(originalRouteId: string, originalVersionId: string, adoptingTeamId: string, purpose: string): RouteAdoption {
    const adoption: RouteAdoption = {
      id: `adopt-${Date.now()}`,
      originalRouteId,
      originalVersionId,
      adoptingTeamId,
      status: 'adopted',
      adoptedAt: new Date().toISOString(),
      purpose,
    };
    const data = localStorage.getItem(STORAGE_KEYS.ADOPTIONS);
    const all: RouteAdoption[] = data ? JSON.parse(data) : mockRouteAdoptions;
    all.unshift(adoption);
    localStorage.setItem(STORAGE_KEYS.ADOPTIONS, JSON.stringify(all));
    return adoption;
  }
}

export const domainService = new DomainService();
