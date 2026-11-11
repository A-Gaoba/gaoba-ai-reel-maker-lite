import { getAudioDurationInSeconds } from "@remotion/media-utils";
import React from "react";
import { Composition, staticFile } from "remotion";
import { Reel, type ReelProps } from "./Reel";
import { layout } from "./timing";

const FPS = 30;
const EMPTY: ReelProps = { reel: { title: "", scenes: [{ type: "hook", say: "…", text: "…" }] }, voice: null, exact: null, slots: [], total: 3 };

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={90}
    defaultProps={EMPTY}
    calculateMetadata={async ({ props }) => {
      const audio = props.voice ? await getAudioDurationInSeconds(staticFile(props.voice)) : null;
      const { slots, total } = layout(props.reel, audio, props.exact);
      return { durationInFrames: Math.ceil(total * FPS), props: { ...props, slots, total } };
    }}
  />
);
