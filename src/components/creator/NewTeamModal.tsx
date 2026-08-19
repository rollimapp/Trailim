import React, { useState } from 'react';
import { TeamInfo, RouteCollaborator, CollaboratorRole } from '../../types';
import { Users, Plus, Trash2, Shield, Check, X, UserPlus, Sparkles } from 'lucide-react';

interface NewTeamModalProps {
  initialTeamInfo?: TeamInfo;
  onSave: (teamInfo: TeamInfo) => void;
  onClose: () => void;
}

const AVAILABLE_ROLES: { id: CollaboratorRole; label: string; desc: string }[] = [
  { id: 'team_manager', label: 'Team Manager', desc: 'Coordinates tasks & submission' },
  { id: 'researcher', label: 'Researcher', desc: 'Finds historical sources & archives' },
  { id: 'writer', label: 'Writer', desc: 'Drafts station copy & narratives' },
  { id: 'photographer', label: 'Photographer', desc: 'Takes original field photos' },
  { id: 'video_editor', label: 'Video Creator', desc: 'Records & edits short video clips' },
  { id: 'narrator', label: 'Narrator', desc: 'Records audio stories & transcripts' },
  { id: 'station_designer', label: 'Station Designer', desc: 'Layouts station content blocks' },
  { id: 'question_designer', label: 'Question Designer', desc: 'Crafts MC & reflection prompts' },
  { id: 'route_planner', label: 'Route Planner', desc: 'Maps walk path & GPS triggers' },
  { id: 'team_manager', label: 'Team Manager', desc: 'Coordinates project progress & checklist' },
  { id: 'writer', label: 'Writer / Researcher', desc: 'Drafts primary text & historical citations' },
  { id: 'presenter', label: 'Presenter', desc: 'Pitches trail project to class & teacher' },
];

const MOCK_CLASSMATES = [
  { id: 'student-1', name: 'Maya Lin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { id: 'student-2', name: 'Liam Chen', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { id: 'student-3', name: 'Noa Levi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { id: 'student-4', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { id: 'student-5', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' },
  { id: 'student-6', name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
];

export const NewTeamModal: React.FC<NewTeamModalProps> = ({
  initialTeamInfo,
  onSave,
  onClose
}) => {
  const [teamName, setTeamName] = useState<string>(initialTeamInfo?.teamName || 'Market Storytellers');
  const [schoolName, setSchoolName] = useState<string>(initialTeamInfo?.schoolName || 'Greenwood High School');
  const [className, setClassName] = useState<string>(initialTeamInfo?.className || 'Class 9B History');

  const [members, setMembers] = useState<RouteCollaborator[]>(
    initialTeamInfo?.members || [
      {
        userId: 'student-1',
        userName: 'Maya Lin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        roles: ['team_manager', 'route_planner'],
        contributionsDescription: 'Project coordinator & route mapper',
        addedAt: new Date().toISOString()
      },
      {
        userId: 'student-2',
        userName: 'Liam Chen',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        roles: ['researcher', 'writer'],
        contributionsDescription: 'Municipal archives researcher',
        addedAt: new Date().toISOString()
      }
    ]
  );

  const [selectedClassmateId, setSelectedClassmateId] = useState<string>('student-3');
  const [memberRoleToAdd, setMemberRoleToAdd] = useState<CollaboratorRole>('photographer');

  const handleAddMember = () => {
    const classmate = MOCK_CLASSMATES.find(c => c.id === selectedClassmateId);
    if (!classmate) return;

    if (members.some(m => m.userId === classmate.id)) {
      alert(`${classmate.name} is already in the team.`);
      return;
    }

    const newCollaborator: RouteCollaborator = {
      userId: classmate.id,
      userName: classmate.name,
      avatar: classmate.avatar,
      roles: [memberRoleToAdd],
      contributionsDescription: `Assigned as ${memberRoleToAdd.replace(/_/g, ' ')}`,
      addedAt: new Date().toISOString()
    };

    setMembers([...members, newCollaborator]);
  };

  const handleToggleRole = (userId: string, role: CollaboratorRole) => {
    setMembers(members.map(m => {
      if (m.userId !== userId) return m;
      const hasRole = m.roles.includes(role);
      const updatedRoles = hasRole
        ? m.roles.filter(r => r !== role)
        : [...m.roles, role];
      return { ...m, roles: updatedRoles.length > 0 ? updatedRoles : [role] };
    }));
  };

  const handleRemoveMember = (userId: string) => {
    if (members.length <= 1) {
      alert('A team project must have at least one team member.');
      return;
    }
    setMembers(members.filter(m => m.userId !== userId));
  };

  const handleSave = () => {
    if (!teamName.trim()) {
      alert('Please enter a team name.');
      return;
    }

    onSave({
      teamName,
      schoolName,
      className,
      members
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 border border-slate-200 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">Student Team Setup</h3>
              <p className="text-[11px] text-slate-500">Collaborative route authoring & roles</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Team Details */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Market Storytellers"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">School / Org</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class / Group</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Add Classmate Section */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-700" /> Add Classmate to Team
          </label>
          <div className="flex gap-2">
            <select
              value={selectedClassmateId}
              onChange={(e) => setSelectedClassmateId(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            >
              {MOCK_CLASSMATES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={memberRoleToAdd}
              onChange={(e) => setMemberRoleToAdd(e.target.value as CollaboratorRole)}
              className="px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
            >
              {AVAILABLE_ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>

            <button
              onClick={handleAddMember}
              className="px-3 py-1.5 bg-[#1B4332] text-white rounded-xl font-bold text-xs hover:bg-[#2D6A4F] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Current Members List */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Team Members ({members.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Select roles for each student</span>
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {members.map(member => (
              <div key={member.userId} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={member.userName} className="w-7 h-7 rounded-full object-cover border border-slate-300" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{member.userName}</h5>
                      <p className="text-[10px] text-slate-500">{member.contributionsDescription || 'Team contributor'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Role Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {AVAILABLE_ROLES.map(roleObj => {
                    const isSelected = member.roles.includes(roleObj.id);
                    return (
                      <button
                        key={roleObj.id}
                        type="button"
                        onClick={() => handleToggleRole(member.userId, roleObj.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#1B4332] text-white border-[#1B4332]'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && '✓ '}{roleObj.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Save Team Setup
          </button>
        </div>

      </div>
    </div>
  );
};
