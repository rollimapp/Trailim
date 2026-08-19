import React, { useState } from 'react';
import { Route, DiscoveryCategory } from '../../types';
import { dataService } from '../../services/dataService';
import { RouteCard } from './RouteCard';
import { SearchFilterModal } from './SearchFilterModal';
import { Search, SlidersHorizontal, Sparkles, MapPin, Compass, ShieldCheck, Users, GraduationCap, Flame, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';

interface ExploreViewProps {
  onSelectRoute: (route: Route) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onSelectRoute }) => {
  const { currentUser, language } = useAuth();
  const { locationStatus, requestLocationPermission, selectedCity, userLocation } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DiscoveryCategory>('for_you');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  const handleCategorySelect = (catId: DiscoveryCategory) => {
    if (catId === 'near_me') {
      if (locationStatus === 'granted') {
        setSelectedCategory('near_me');
      } else {
        requestLocationPermission(
          'find routes near your current physical position',
          () => setSelectedCategory('near_me'),
          () => setSelectedCategory('near_me')
        );
      }
    } else {
      setSelectedCategory(catId);
    }
  };

  // Use intelligence ranking and discovery filtering from dataService
  const filteredRoutes = dataService.getFilteredAndRankedRoutes(
    {
      ...activeFilters,
      searchQuery,
      category: selectedCategory,
    },
    userLocation || { latitude: 32.0853, longitude: 34.7818 }
  );

  const allRoutes = dataService.getRoutes();
  const featuredRoute = allRoutes.find(r => r.featuredStatus) || allRoutes[0];

  const categoryChips: { id: DiscoveryCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'for_you', label: 'For You', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'near_me', label: 'Near Me', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'student_created', label: 'Student Teams', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'expert_recommended', label: 'Expert Picks', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'my_school', label: 'My School', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'popular', label: 'Popular', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'community_heritage', label: 'Heritage', icon: <Compass className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      
      {/* Search Header & Quick Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'he' ? 'חפש מסלולי למידה, נושאים, ערים או צוותים...' : 'Search routes, cities (e.g. Tel Aviv), subjects, or teams...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332] shadow-xs"
            />
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-xs"
            aria-label="Filter Options"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#1B4332]" />
          </button>
        </div>

        {/* Category Pills Slider */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          {categoryChips.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Field-First Principle Compact Banner */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-xl p-3 text-white shadow-xs flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Field-Tested Ground Truth</span>
          </div>
          <p className="text-xs text-emerald-100 font-medium leading-snug">
            {language === 'he' 
              ? 'הבינה המלאכותית יכולה לעזור לתכנן את המסלול — אבל את הדרך עצמה חייבים לעבור.'
              : 'AI helps design the journey — but students must step into the field to experience it.'}
          </p>
        </div>
        <div className="bg-emerald-800/60 p-2 rounded-lg shrink-0 text-center text-[10px] font-bold text-emerald-200 border border-emerald-600/40">
          📍 100% On-Site
        </div>
      </div>

      {/* Featured Route Hero Banner (Shown on initial overview) */}
      {featuredRoute && searchQuery === '' && selectedCategory === 'for_you' && (
        <section className="relative rounded-2xl overflow-hidden bg-[#1B4332] text-white p-4 shadow-md group flex flex-col justify-end min-h-[230px]">
          <div className="absolute inset-0 opacity-45 mix-blend-overlay">
            <img src={featuredRoute.coverImageUrl} alt="Featured" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#081C15] via-[#081C15]/70 to-transparent" />
          
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-[#52B788] text-[#081C15] font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                <Sparkles className="w-3 h-3" /> Featured Student Project
              </span>
              {featuredRoute.teacherApproved && (
                <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  ✓ Teacher Approved
                </span>
              )}
            </div>

            <h2 className="font-display font-bold text-lg text-white leading-tight">
              {featuredRoute.title}
            </h2>

            <p className="text-xs text-emerald-100/90 line-clamp-2 leading-relaxed">
              {featuredRoute.shortDescription}
            </p>

            <div className="flex items-center gap-3 text-xs text-emerald-200 font-semibold pt-0.5">
              <span>{featuredRoute.startLocation?.city}</span>
              <span>•</span>
              <span>{featuredRoute.estimatedDurationMinutes} mins</span>
              <span>•</span>
              <span>{featuredRoute.expertLikesCount || 0} Expert Likes</span>
            </div>

            <button
              onClick={() => onSelectRoute(featuredRoute)}
              className="mt-1.5 w-full py-2.5 bg-[#52B788] hover:bg-[#74C69D] active:scale-95 text-[#081C15] rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore Route
            </button>
          </div>
        </section>
      )}

      {/* Main Route Cards List - Single Column Mobile Layout */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-700" />
            <span>Discover Learning Trails</span>
          </h2>
          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
            {filteredRoutes.length} routes
          </span>
        </div>

        {filteredRoutes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
            <Compass className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-700">No matching routes found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try adjusting your search query or switching discovery categories.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredRoutes.map(route => (
              <RouteCard key={route.id} route={route} onSelect={onSelectRoute} />
            ))}
          </div>
        )}
      </section>

      {/* Filter Modal */}
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={activeFilters}
        onApplyFilters={setActiveFilters}
      />

    </div>
  );
};
