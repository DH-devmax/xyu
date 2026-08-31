import type { BatchPhase } from '../types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// BatchPhaseIndicatorProps 描述批量流程指示器的当前步骤。
export interface BatchPhaseIndicatorProps {
  // phase 是当前批量流程步骤。
  phase: BatchPhase;
}

// BatchPhaseIndicator 展示上传、预检、发布和结果四个批量阶段。
export const BatchPhaseIndicator = ({ phase }: BatchPhaseIndicatorProps) => {
  // phases 是批量流程的固定步骤列表。
  const phases: Array<[BatchPhase, string]> = [
    ['upload', '1 上传'],
    ['preview', '2 预检'],
    ['running', '3 发布'],
    ['done', '4 结果'],
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
      {phases.map(
        // 阶段渲染器根据当前步骤切换高亮样式。
        ([phaseID, label]) => (
          <Typography
            key={phaseID}
            data-phase={phaseID}
            data-active={phase === phaseID ? 'true' : 'false'}
            variant="caption"
            sx={{
              px: 1.5,
              py: 1,
              textAlign: 'center',
              fontWeight: 750,
              border: 1,
              borderRadius: 1,
              borderColor: phase === phaseID ? 'primary.main' : 'divider',
              bgcolor: phase === phaseID ? 'primary.main' : 'action.hover',
              color: phase === phaseID ? 'primary.contrastText' : 'text.secondary',
            }}
          >
            {label}
          </Typography>
        ),
      )}
    </Box>
  );
};
