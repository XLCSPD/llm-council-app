import { Composition, Folder } from "remotion";
import { Main } from "./MyComp/Main";
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { NextLogo } from "./MyComp/NextLogo";
import { LLMCouncilPromo, TOTAL_DURATION } from "./LLMCouncilPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* LLM Council Marketing Video */}
      <Composition
        id="LLMCouncilPromo"
        component={LLMCouncilPromo}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Original template compositions */}
      <Folder name="Template">
        <Composition
          id={COMP_NAME}
          component={Main}
          durationInFrames={DURATION_IN_FRAMES}
          fps={VIDEO_FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          defaultProps={defaultMyCompProps}
        />
        <Composition
          id="NextLogo"
          component={NextLogo}
          durationInFrames={300}
          fps={30}
          width={140}
          height={140}
          defaultProps={{
            outProgress: 0,
          }}
        />
      </Folder>
    </>
  );
};
