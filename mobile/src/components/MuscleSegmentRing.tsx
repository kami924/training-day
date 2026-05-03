import Svg, { Circle } from "react-native-svg";

import { defaultMuscleColors } from "@/theme/AppThemeProvider";
import { MuscleGroup } from "@/types/training";

type MuscleSegmentRingProps = {
  muscles: MuscleGroup[];
  muscleColors?: Record<MuscleGroup, string>;
  size?: number;
  strokeWidth?: number;
  trackColor: string;
};

export function MuscleSegmentRing({
  muscles,
  muscleColors = defaultMuscleColors,
  size = 36,
  strokeWidth = 6,
  trackColor,
}: MuscleSegmentRingProps) {
  const uniqueMuscles = Array.from(new Set(muscles));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = uniqueMuscles.length > 1 ? 4 : 0;
  const segmentLength = circumference / Math.max(uniqueMuscles.length, 1);

  return (
    <Svg height={size} width={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {uniqueMuscles.map((muscle, index) => {
        const visibleLength = Math.max(segmentLength - gap, 1);

        return (
          <Circle
            cx={size / 2}
            cy={size / 2}
            fill="none"
            key={muscle}
            originX={size / 2}
            originY={size / 2}
            r={radius}
            rotation="-90"
            stroke={muscleColors[muscle]}
            strokeDasharray={[visibleLength, circumference - visibleLength]}
            strokeDashoffset={-(segmentLength * index)}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        );
      })}
    </Svg>
  );
}
