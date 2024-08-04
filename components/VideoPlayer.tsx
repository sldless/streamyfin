import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  getStreamUrl,
  getUserItemData,
  reportPlaybackProgress,
  reportPlaybackStopped,
} from "@/utils/jellyfin";
import { runtimeTicksToMinutes } from "@/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Video, {
  OnBufferData,
  OnPlaybackStateChangedData,
  OnProgressData,
  OnVideoErrorData,
  VideoRef,
} from "react-native-video";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Button } from "./Button";
import { Text } from "./common/Text";

type VideoPlayerProps = {
  itemId: string;
};

const BITRATES = [
  {
    key: "Max",
    value: undefined,
  },
  {
    key: "4 Mb/s",
    value: 4000000,
  },
  {
    key: "2 Mb/s",
    value: 2000000,
  },
  {
    key: "500 Kb/s",
    value: 500000,
  },
];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ itemId }) => {
  const videoRef = useRef<VideoRef | null>(null);
  const [maxBitrate, setMaxbitrate] = useState<number | undefined>(undefined);
  const [paused, setPaused] = useState(true);

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: item } = useQuery({
    queryKey: ["item", itemId],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId,
      }),
    enabled: !!itemId && !!api,
    staleTime: 60,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["sessionData", itemId],
    queryFn: async () => {
      const playbackData = await getMediaInfoApi(api!).getPlaybackInfo({
        itemId,
        userId: user?.Id,
      });

      return playbackData.data;
    },
    enabled: !!itemId && !!api && !!user?.Id,
    staleTime: 0,
  });

  const { data: playbackURL } = useQuery({
    queryKey: ["playbackUrl", itemId, maxBitrate],
    queryFn: async () => {
      if (!api || !user?.Id || !sessionData) return null;

      const url = await getStreamUrl({
        api,
        userId: user.Id,
        item,
        startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
        maxStreamingBitrate: maxBitrate,
        sessionData,
      });

      console.log("Transcode URL:", url);

      return url;
    },
    enabled: !!sessionData,
    staleTime: 0,
  });

  const [progress, setProgress] = useState(0);

  const onProgress = ({
    currentTime,
    playableDuration,
    seekableDuration,
  }: OnProgressData) => {
    setProgress(currentTime * 10000000);
    reportPlaybackProgress({
      api,
      itemId: itemId,
      positionTicks: currentTime * 10000000,
      sessionId: sessionData?.PlaySessionId,
    });
  };

  const onSeek = ({
    currentTime,
    seekTime,
  }: {
    currentTime: number;
    seekTime: number;
  }) => {
    // console.log("Seek to time: ", seekTime);
  };

  const onError = (error: OnVideoErrorData) => {
    console.log("Video Error: ", JSON.stringify(error.error));
  };

  const onBuffer = (error: OnBufferData) => {
    console.log("Video buffering: ", error.isBuffering);
  };

  const play = () => {
    if (videoRef.current) {
      videoRef.current.resume();
    }
  };

  const startPosition = useMemo(() => {
    return Math.round((item?.UserData?.PlaybackPositionTicks || 0) / 10000);
  }, [item]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const enableVideo = useMemo(() => {
    return (
      playbackURL !== undefined &&
      item !== undefined &&
      item !== null &&
      startPosition !== undefined &&
      sessionData !== undefined
    );
  }, [playbackURL, item, startPosition, sessionData]);

  return (
    <View>
      {enableVideo === true &&
      playbackURL !== null &&
      playbackURL !== undefined ? (
        <Video
          style={{ width: 0, height: 0 }}
          source={{
            uri: playbackURL,
            isNetwork: true,
            startPosition,
          }}
          debug={{
            enable: true,
            thread: true,
          }}
          ref={videoRef}
          onBuffer={onBuffer}
          onSeek={(t) => onSeek(t)}
          onError={onError}
          onProgress={(e) => onProgress(e)}
          onFullscreenPlayerDidDismiss={() => {
            videoRef.current?.pause();
            reportPlaybackStopped({
              api,
              itemId: item?.Id,
              positionTicks: progress,
              sessionId: sessionData?.PlaySessionId,
            });
          }}
          onFullscreenPlayerDidPresent={() => {
            play();
          }}
          paused={paused}
          onPlaybackStateChanged={(e: OnPlaybackStateChangedData) => {}}
          bufferConfig={{
            maxBufferMs: Infinity,
            minBufferMs: 1000 * 60 * 2,
            bufferForPlaybackMs: 1000,
            backBufferDurationMs: 30 * 1000,
          }}
        />
      ) : null}
      <View className="flex flex-row items-center justify-between">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <View className="flex flex-col mb-2">
              <Text className="opacity-50 mb-1 text-xs">Bitrate</Text>
              <View className="flex flex-row">
                <TouchableOpacity className="bg-neutral-900 rounded-2xl border-neutral-900 border px-3 py-2 flex flex-row items-center justify-between">
                  <Text>
                    {BITRATES.find((b) => b.value === maxBitrate)?.key}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            loop={true}
            side="bottom"
            align="start"
            alignOffset={0}
            avoidCollisions={true}
            collisionPadding={8}
            sideOffset={8}
          >
            <DropdownMenu.Label>Bitrates</DropdownMenu.Label>
            {BITRATES?.map((b: any, index: number) => (
              <DropdownMenu.Item
                key={index.toString()}
                onSelect={() => {
                  setMaxbitrate(b.value);
                }}
              >
                <DropdownMenu.ItemTitle>{b.key}</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </View>

      <View className="flex flex-col w-full">
        <Button
          disabled={!enableVideo}
          onPress={() => {
            if (videoRef.current) {
              videoRef.current.presentFullscreenPlayer();
            }
          }}
          iconRight={<Ionicons name="play-circle" size={24} color="white" />}
        >
          {runtimeTicksToMinutes(item?.RunTimeTicks)}
        </Button>
      </View>
    </View>
  );
};
