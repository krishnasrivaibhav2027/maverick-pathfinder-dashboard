import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const font = { fontFamily: 'Inter, ui-rounded, system-ui, sans-serif' };

interface SkillGroup {
  skill: string;
  trainee_count: number;
  average_progress: number;
}

const SkillGroupList: React.FC = () => {
  const { phaseId, batchId } = useParams();
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!batchId) return;
    fetch(`http://localhost:8000/batches/${batchId}/skill-groups`)
      .then(res => res.json())
      .then((data: SkillGroup[]) => setSkillGroups(data))
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) return <div className="p-8 text-gray-400">Loading skill groups...</div>;
  if (!skillGroups.length) return <div className="p-8 text-gray-400">No skill groups available for this batch.</div>;

  return (
    <div className="w-full flex flex-col items-start justify-start pt-2 pb-8">
      <div className="flex flex-row items-center mb-8 mt-2 pl-0">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="rounded-full px-5 py-2 font-semibold border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600 bg-white/80 flex items-center gap-2"
          style={font}
        >
          <ArrowLeft className="h-5 w-5 text-orange-500" />
          Back
        </Button>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-500 ml-4" style={font}>
          Select a Skill Group
        </h2>
      </div>
      <div className="flex flex-row gap-8 flex-wrap">
        {skillGroups.map(group => (
          <div
            key={group.skill}
            className="rounded-3xl bg-white p-8 flex flex-col items-center justify-center shadow-xl transition-transform hover:scale-105 border border-orange-100 min-w-[220px] max-w-[260px] min-h-[180px] cursor-pointer group"
            style={{ boxShadow: '0 8px 32px 0 #ff7c2b22', ...font }}
            onClick={() => navigate(`/admin/active-batches/phase/${phaseId}/batch/${batchId}/skill/${group.skill}`)}
          >
            <Users className="h-8 w-8 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-extrabold text-orange-500 mb-2 tracking-tight group-hover:text-orange-600" style={{ letterSpacing: '-0.03em' }}>
              {group.skill && group.skill.trim() ? group.skill.charAt(0).toUpperCase() + group.skill.slice(1) : 'Unknown'}
            </span>
            <span className="text-base text-gray-500 font-semibold mb-1">{group.trainee_count} trainee{group.trainee_count !== 1 ? 's' : ''}</span>
            <span className="text-base text-gray-400 font-medium">Avg Progress: <span className="text-orange-500 font-bold">{Math.round(group.average_progress)}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillGroupList; 