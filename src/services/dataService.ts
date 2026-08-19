import { 
  Route, 
  Station, 
  ReviewItem, 
  ParticipantProgress, 
  RouteSession, 
  TaskResponse, 
  RouteAnalytics, 
  NotificationItem, 
  PublishingStatus 
} from '../types';
import { 
  mockRoutes, 
  mockStations, 
  mockReviewQueue, 
  mockNotifications, 
  mockAnalytics, 
  mockRouteSessions 
} from '../data/mockData';

const STORAGE_KEYS = {
  ROUTES: 'trailim_routes_v1',
  STATIONS: 'trailim_stations_v1',
  REVIEWS: 'trailim_reviews_v1',
  PROGRESS: 'trailim_progress_v1',
  SESSIONS: 'trailim_sessions_v1',
  NOTIFICATIONS: 'trailim_notifications_v1',
};

class DataService {
  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.ROUTES)) {
      localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(mockRoutes));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STATIONS)) {
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(mockStations));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(mockReviewQueue));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(mockNotifications));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(mockRouteSessions));
    }
  }

  // --- ROUTES ---
  public getRoutes(): Route[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTES);
      return data ? JSON.parse(data) : mockRoutes;
    } catch (e) {
      console.error('Error loading routes', e);
      return mockRoutes;
    }
  }

  public getRouteById(id: string): Route | undefined {
    return this.getRoutes().find(r => r.id === id);
  }

  public saveRoute(route: Route): Route {
    const routes = this.getRoutes();
    const index = routes.findIndex(r => r.id === route.id);
    if (index >= 0) {
      routes[index] = { ...route, updatedAt: new Date().toISOString() };
    } else {
      routes.unshift(route);
    }
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
    return route;
  }

  public updateRouteStatus(routeId: string, status: PublishingStatus, approvedBy?: string): Route | undefined {
    const route = this.getRouteById(routeId);
    if (!route) return undefined;
    
    route.publishingStatus = status;
    if (status === 'published') {
      route.publishedAt = new Date().toISOString();
      if (approvedBy) {
        route.approvedBy = approvedBy;
        route.approvalDate = new Date().toISOString();
      }
    }
    return this.saveRoute(route);
  }

  // --- STATIONS ---
  public getStationsForRoute(routeId: string): Station[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATIONS);
      const allStations: Record<string, Station[]> = data ? JSON.parse(data) : mockStations;
      const stations = allStations[routeId] || [];
      return stations.sort((a, b) => a.position - b.position);
    } catch (e) {
      console.error('Error loading stations', e);
      return mockStations[routeId] || [];
    }
  }

  public saveStation(station: Station): Station {
    const data = localStorage.getItem(STORAGE_KEYS.STATIONS);
    const allStations: Record<string, Station[]> = data ? JSON.parse(data) : mockStations;
    
    const routeStations = allStations[station.routeId] || [];
    const index = routeStations.findIndex(s => s.id === station.id);
    
    if (index >= 0) {
      routeStations[index] = { ...station, updatedAt: new Date().toISOString() };
    } else {
      routeStations.push(station);
    }

    allStations[station.routeId] = routeStations;
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(allStations));

    // Update station IDs in parent route
    const route = this.getRouteById(station.routeId);
    if (route && !route.stationIds.includes(station.id)) {
      route.stationIds.push(station.id);
      this.saveRoute(route);
    }

    return station;
  }

  public deleteStation(routeId: string, stationId: string) {
    const data = localStorage.getItem(STORAGE_KEYS.STATIONS);
    const allStations: Record<string, Station[]> = data ? JSON.parse(data) : mockStations;
    
    if (allStations[routeId]) {
      allStations[routeId] = allStations[routeId].filter(s => s.id !== stationId);
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(allStations));
    }

    const route = this.getRouteById(routeId);
    if (route) {
      route.stationIds = route.stationIds.filter(id => id !== stationId);
      this.saveRoute(route);
    }
  }

  public reorderStations(routeId: string, orderedStations: Station[]): Station[] {
    const data = localStorage.getItem(STORAGE_KEYS.STATIONS);
    const allStations: Record<string, Station[]> = data ? JSON.parse(data) : mockStations;

    const reordered = orderedStations.map((s, index) => ({
      ...s,
      position: index + 1,
      updatedAt: new Date().toISOString()
    }));

    allStations[routeId] = reordered;
    localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(allStations));

    const route = this.getRouteById(routeId);
    if (route) {
      route.stationIds = reordered.map(s => s.id);
      this.saveRoute(route);
    }

    return reordered;
  }

  // --- REVIEWS & MODERATION ---
  public getReviewQueue(): ReviewItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return data ? JSON.parse(data) : mockReviewQueue;
    } catch (e) {
      return mockReviewQueue;
    }
  }

  public submitForReview(routeId: string, creatorName: string, creatorRole: any): ReviewItem {
    const route = this.getRouteById(routeId);
    const queue = this.getReviewQueue();

    const review: ReviewItem = {
      id: `rev-${Date.now()}`,
      routeId,
      routeTitle: route?.title || 'Untitled Route',
      creatorId: route?.creatorId || 'user-1',
      creatorName,
      creatorRole,
      schoolName: route?.schoolName || 'Greenwood High School',
      subject: route?.subject || 'General Studies',
      stationCount: route?.stationIds.length || 0,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };

    queue.unshift(review);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(queue));

    if (route) {
      this.updateRouteStatus(routeId, 'in_review');
    }

    return review;
  }

  public processReview(reviewId: string, action: 'approve' | 'request_changes' | 'reject', feedback?: string, reviewerName?: string) {
    const queue = this.getReviewQueue();
    const review = queue.find(r => r.id === reviewId);
    if (!review) return;

    if (action === 'approve') {
      review.status = 'approved';
      review.generalFeedback = feedback;
      review.reviewerName = reviewerName;
      this.updateRouteStatus(review.routeId, 'published', reviewerName);
    } else if (action === 'request_changes') {
      review.status = 'changes_requested';
      review.generalFeedback = feedback;
      review.reviewerName = reviewerName;
      this.updateRouteStatus(review.routeId, 'changes_requested');
    } else {
      review.status = 'rejected';
      review.generalFeedback = feedback;
      this.updateRouteStatus(review.routeId, 'archived');
    }

    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(queue));
  }

  // --- PARTICIPANT PROGRESS ---
  public getProgress(userId: string, routeId: string): ParticipantProgress | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const allProgress: Record<string, ParticipantProgress> = data ? JSON.parse(data) : {};
      const key = `${userId}_${routeId}`;
      return allProgress[key] || null;
    } catch (e) {
      return null;
    }
  }

  public saveProgress(progress: ParticipantProgress): ParticipantProgress {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    const allProgress: Record<string, ParticipantProgress> = data ? JSON.parse(data) : {};
    const key = `${progress.userId}_${progress.routeId}`;
    
    allProgress[key] = progress;
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
    return progress;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : mockNotifications;
    } catch (e) {
      return mockNotifications;
    }
  }

  public markNotificationAsRead(id: string) {
    const notifs = this.getNotifications();
    const item = notifs.find(n => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    }
  }

  // --- ANALYTICS ---
  public getAnalytics(routeId: string): RouteAnalytics {
    return mockAnalytics[routeId] || {
      routeId,
      launchesCount: 1,
      participantsCount: 1,
      completionRatePercent: 100,
      averageScore: 250,
      averageCompletionTimeMinutes: 20,
      uploadedSubmissionsCount: 1
    };
  }
  // --- SOCIAL SIGNALS & INTERACTION ---
  public toggleLikeRoute(routeId: string, userId: string = 'current_user'): { likesCount: number; userHasLiked: boolean } {
    const route = this.getRouteById(routeId);
    if (!route) return { likesCount: 0, userHasLiked: false };

    const likedKey = `liked_${userId}_${routeId}`;
    const currentlyLiked = localStorage.getItem(likedKey) === 'true';

    if (currentlyLiked) {
      route.likesCount = Math.max(0, (route.likesCount || 1) - 1);
      route.userHasLiked = false;
      localStorage.removeItem(likedKey);
    } else {
      route.likesCount = (route.likesCount || 0) + 1;
      route.userHasLiked = true;
      localStorage.setItem(likedKey, 'true');
    }

    this.saveRoute(route);
    return { likesCount: route.likesCount, userHasLiked: route.userHasLiked };
  }

  public toggleSaveRoute(routeId: string, userId: string = 'current_user'): { savesCount: number; userHasSaved: boolean } {
    const route = this.getRouteById(routeId);
    if (!route) return { savesCount: 0, userHasSaved: false };

    const savedKey = `saved_${userId}_${routeId}`;
    const currentlySaved = localStorage.getItem(savedKey) === 'true';

    if (currentlySaved) {
      route.savesCount = Math.max(0, (route.savesCount || 1) - 1);
      route.userHasSaved = false;
      localStorage.removeItem(savedKey);
    } else {
      route.savesCount = (route.savesCount || 0) + 1;
      route.userHasSaved = true;
      localStorage.setItem(savedKey, 'true');
    }

    this.saveRoute(route);
    return { savesCount: route.savesCount, userHasSaved: route.userHasSaved };
  }

  public addExpertLike(routeId: string, expertLike: any): Route | undefined {
    const route = this.getRouteById(routeId);
    if (!route) return undefined;

    if (!route.expertLikes) route.expertLikes = [];
    route.expertLikes.push(expertLike);
    route.expertLikesCount = route.expertLikes.length;
    return this.saveRoute(route);
  }

  // --- RECOMMENDATION & DISCOVERY SYSTEM ---
  public calculateRecommendationScore(route: Route, userLocation?: { latitude: number; longitude: number }): number {
    let score = 0;

    // Expert Likes & Quality Verification (High Authority Weight)
    score += (route.expertLikesCount || 0) * 25;
    if (route.teacherApproved) score += 30;
    if (route.institutionVerified) score += 20;

    // Ground Truth & Field Verification Signals
    if (route.fieldVerificationStatus === 'field_tested') score += 25;
    else if (route.fieldVerificationStatus === 'partially_tested') score += 10;
    if (route.safetyCheckStatus === 'approved') score += 15;
    if (route.accessibilityCheckStatus === 'accessible') score += 10;
    if ((route.originalEvidenceCount || 0) > 0) score += Math.min((route.originalEvidenceCount || 0) * 3, 15);

    // Social Signals
    score += (route.ratingAverage || 0) * 15;
    score += Math.min(route.likesCount || 0, 100) * 0.5;
    score += (route.completionRatePercent || 80) * 0.2;

    // Distance proximity bonus if location provided
    if (userLocation && route.startLocation?.latitude) {
      const dist = this.calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        route.startLocation.latitude,
        route.startLocation.longitude
      );
      if (dist < 5) score += 40;
      else if (dist < 15) score += 20;
      else if (dist < 30) score += 10;
    }

    // Freshness velocity
    const daysOld = (Date.now() - new Date(route.createdAt).getTime()) / (1000 * 3600 * 24);
    if (daysOld < 7) score += 15;

    return Math.round(score);
  }

  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 10) / 10;
  }

  public getFilteredAndRankedRoutes(
    filters: any = {},
    userLocation: { latitude: number; longitude: number } = { latitude: 32.0853, longitude: 34.7818 }
  ): Route[] {
    let routes = this.getRoutes();

    // Attach user local interaction state
    routes = routes.map(r => ({
      ...r,
      userHasLiked: localStorage.getItem(`liked_current_user_${r.id}`) === 'true',
      userHasSaved: localStorage.getItem(`saved_current_user_${r.id}`) === 'true',
    }));

    // Filter by Search Query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      routes = routes.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.shortDescription.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        (r.startLocation.city && r.startLocation.city.toLowerCase().includes(q)) ||
        r.creatorDisplayName.toLowerCase().includes(q) ||
        r.topics.some(t => t.toLowerCase().includes(q))
      );
    }

    // Filter by Discovery Category
    if (filters.category) {
      switch (filters.category) {
        case 'near_me':
          routes = routes.filter(r => {
            const dist = this.calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              r.startLocation.latitude,
              r.startLocation.longitude
            );
            return dist <= (filters.maxDistanceKm || 30);
          });
          break;
        case 'my_school':
          routes = routes.filter(r => r.schoolName === 'Greenwood High School');
          break;
        case 'my_city':
          routes = routes.filter(r => r.startLocation.city?.toLowerCase().includes('tel aviv'));
          break;
        case 'expert_recommended':
          routes = routes.filter(r => (r.expertLikesCount || 0) > 0 || r.publishingStatus === 'expert_recommended');
          break;
        case 'student_created':
          routes = routes.filter(r => r.creatorRole === 'student' || r.isTeamProject || r.tags.includes('Student Created'));
          break;
        case 'popular':
          routes = routes.filter(r => (r.likesCount || 0) > 50 || (r.completionsCount || 0) > 50);
          break;
        case 'nature':
          routes = routes.filter(r => r.routeType === 'nature_exploration' || r.subject.includes('Ecology') || r.subject.includes('Science'));
          break;
        case 'community_heritage':
          routes = routes.filter(r => r.routeType === 'community_heritage' || r.subject.includes('History'));
          break;
      }
    }

    // City / Region Filter
    if (filters.cityRegion && filters.cityRegion !== 'all') {
      routes = routes.filter(r => r.startLocation.city?.toLowerCase() === filters.cityRegion.toLowerCase());
    }

    // Subject Filter
    if (filters.subject && filters.subject !== 'all') {
      routes = routes.filter(r => r.subject.toLowerCase().includes(filters.subject.toLowerCase()));
    }

    // Teacher Approved Only
    if (filters.teacherApprovedOnly) {
      routes = routes.filter(r => r.teacherApproved);
    }

    // Expert Recommended Only
    if (filters.expertRecommendedOnly) {
      routes = routes.filter(r => (r.expertLikesCount || 0) > 0);
    }

    // Sort Order
    if (filters.sortBy === 'distance') {
      routes.sort((a, b) => {
        const distA = this.calculateDistanceKm(userLocation.latitude, userLocation.longitude, a.startLocation.latitude, a.startLocation.longitude);
        const distB = this.calculateDistanceKm(userLocation.latitude, userLocation.longitude, b.startLocation.latitude, b.startLocation.longitude);
        return distA - distB;
      });
    } else if (filters.sortBy === 'likes') {
      routes.sort((a, b) => b.likesCount - a.likesCount);
    } else if (filters.sortBy === 'expert_likes') {
      routes.sort((a, b) => b.expertLikesCount - a.expertLikesCount);
    } else if (filters.sortBy === 'rating') {
      routes.sort((a, b) => b.ratingAverage - a.ratingAverage);
    } else if (filters.sortBy === 'newest') {
      routes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Default: Intelligent Recommendation Score
      routes.sort((a, b) => this.calculateRecommendationScore(b, userLocation) - this.calculateRecommendationScore(a, userLocation));
    }

    return routes;
  }
}

export const dataService = new DataService();
