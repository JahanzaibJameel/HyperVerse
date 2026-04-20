import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowCard } from "@/components/GlowCard";
import { useColors } from "@/hooks/useColors";

interface Post {
  user: string;
  color: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const USERS_ONLINE = [
  { name: "CyberN8", xp: 8402, color: "#00d4ff", status: "In AR" },
  { name: "NovaStar", xp: 7100, color: "#7c3aed", status: "Online" },
  { name: "QuantumX", xp: 9810, color: "#ff006e", status: "Raiding" },
  { name: "ArcLight", xp: 6540, color: "#ffb800", status: "Online" },
  { name: "ZeroVoid", xp: 5200, color: "#00ff9d", status: "Streaming" },
];

const VIDEO_ROOMS = [
  { name: "Cyber Arena", members: 12, active: true, color: "#00d4ff", type: "AR Battle" },
  { name: "Void Lounge", members: 7, active: true, color: "#7c3aed", type: "Social" },
  { name: "Nexus Hub", members: 24, active: true, color: "#ff006e", type: "Stream" },
  { name: "Quantum Lab", members: 3, active: false, color: "#ffb800", type: "Dev" },
];

const FEED_POSTS: Post[] = [
  { user: "CyberN8", color: "#00d4ff", content: "Just completed the 10K quantum run! AR leaderboard shows me at #3 globally. Who wants to challenge?", likes: 42, comments: 8, time: "2m ago", icon: "run-fast" },
  { user: "NovaStar", color: "#7c3aed", content: "My dynamic NFT just evolved to Legendary tier after hitting 500K XP. The generative art shift is insane.", likes: 128, comments: 31, time: "15m ago", icon: "star-shooting" },
  { user: "QuantumX", color: "#ff006e", content: "AR room raid in 30 mins in Nexus Hub. Bring your best avatars — winner takes 500 HV tokens.", likes: 87, comments: 19, time: "28m ago", icon: "virtual-reality" },
  { user: "ZeroVoid", color: "#00ff9d", content: "IoT home automation just triggered perfectly — coffee was ready exactly when I walked in. AI is incredible.", likes: 34, comments: 6, time: "1h ago", icon: "home-automation" },
];

export default function SocialScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState<Post[]>(FEED_POSTS);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [tab, setTab] = useState<"feed" | "rooms">("feed");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handleLike = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePost = () => {
    if (!postText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosts((prev) => [
      { user: "Neural Runner", color: colors.cyan, content: postText, likes: 0, comments: 0, time: "just now", icon: "lightning-bolt" as const },
      ...prev,
    ]);
    setPostText("");
  };

  const joinRoom = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActiveRoom((v) => (v === name ? null : name));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: Platform.OS === "web" ? 120 : 100,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>SOCIAL MESH</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>{USERS_ONLINE.length} nodes online</Text>
        </View>
        <View style={[styles.onlineBadge, { backgroundColor: colors.green + "15", borderColor: colors.green + "44" }]}>
          <View style={[styles.dot, { backgroundColor: colors.green }]} />
          <Text style={[styles.onlineText, { color: colors.green }]}>LIVE</Text>
        </View>
      </View>

      {/* Online avatars */}
      <FlatList
        data={USERS_ONLINE}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        style={styles.avatarList}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, { backgroundColor: item.color + "20", borderColor: item.color }]}>
                <Text style={[styles.avatarInitial, { color: item.color }]}>{item.name[0]}</Text>
              </View>
              <View style={[styles.onlineDot, { backgroundColor: item.status === "Raiding" ? colors.pink : item.status === "In AR" ? colors.purple : colors.green }]} />
              <Text style={[styles.avatarName, { color: colors.mutedForeground }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.avatarStatus, { color: item.color }]} numberOfLines={1}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Tab switcher */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        {(["feed", "rooms"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            style={[styles.tab, { backgroundColor: tab === t ? colors.cyan + "18" : "transparent", borderColor: tab === t ? colors.cyan : "transparent" }]}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.cyan : colors.mutedForeground }]}>
              {t === "feed" ? "LIVE FEED" : "AR ROOMS"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "rooms" && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VIDEO & AR ROOMS</Text>
          {VIDEO_ROOMS.map((room, i) => (
            <TouchableOpacity key={i} onPress={() => joinRoom(room.name)}>
              <GlowCard
                glowColor={room.active ? room.color : colors.border}
                style={[styles.roomCard, { opacity: room.active ? 1 : 0.5 }]}
              >
                <View style={styles.roomHeader}>
                  <View style={[styles.roomIconWrap, { backgroundColor: room.color + "20" }]}>
                    <MaterialCommunityIcons name="virtual-reality" size={22} color={room.color} />
                  </View>
                  <View style={styles.roomInfo}>
                    <Text style={[styles.roomName, { color: colors.foreground }]}>{room.name}</Text>
                    <Text style={[styles.roomType, { color: room.color }]}>{room.type}</Text>
                  </View>
                  <View style={styles.roomRight}>
                    <View style={styles.roomMembersRow}>
                      <MaterialCommunityIcons name="account-multiple" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.roomMembers, { color: colors.mutedForeground }]}>{room.members}</Text>
                    </View>
                    {room.active && <View style={[styles.liveDot, { backgroundColor: colors.green }]} />}
                  </View>
                </View>

                {activeRoom === room.name && (
                  <View style={[styles.videoPreview, { backgroundColor: room.color + "10", borderColor: room.color + "33" }]}>
                    <View style={styles.videoGrid}>
                      {Array(Math.min(room.members, 4)).fill(null).map((_, vi) => (
                        <View key={vi} style={[styles.videoTile, { backgroundColor: room.color + "20" }]}>
                          <MaterialCommunityIcons name="account-circle" size={20} color={room.color} />
                        </View>
                      ))}
                    </View>
                    <View style={styles.roomControls}>
                      {[
                        { icon: "microphone" as const, color: colors.green },
                        { icon: "video" as const, color: colors.cyan },
                        { icon: "chat" as const, color: colors.purple },
                        { icon: "close-circle" as const, color: colors.pink },
                      ].map((ctrl, ci) => (
                        <TouchableOpacity
                          key={ci}
                          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                          style={[styles.roomControl, { backgroundColor: ctrl.color + "20" }]}
                        >
                          <MaterialCommunityIcons name={ctrl.icon} size={18} color={ctrl.color} />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={[styles.joinedText, { color: room.color }]}>JOINED — You're live</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => joinRoom(room.name)}
                  style={[
                    styles.joinBtn,
                    {
                      backgroundColor: activeRoom === room.name ? colors.pink + "20" : room.color + "20",
                      borderColor: activeRoom === room.name ? colors.pink : room.color,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={activeRoom === room.name ? "exit-to-app" : "arrow-right-circle"}
                    size={16}
                    color={activeRoom === room.name ? colors.pink : room.color}
                  />
                  <Text style={[styles.joinBtnText, { color: activeRoom === room.name ? colors.pink : room.color }]}>
                    {activeRoom === room.name ? "LEAVE ROOM" : "JOIN ROOM"}
                  </Text>
                </TouchableOpacity>
              </GlowCard>
            </TouchableOpacity>
          ))}
        </>
      )}

      {tab === "feed" && (
        <>
          {/* Post composer */}
          <GlowCard glowColor={colors.cyan} style={styles.composerCard}>
            <TextInput
              value={postText}
              onChangeText={setPostText}
              placeholder="Broadcast to the mesh..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              multiline
            />
            <View style={styles.composerActions}>
              {[
                { icon: "image-outline" as const, color: colors.purple },
                { icon: "map-marker" as const, color: colors.orange },
                { icon: "virtual-reality" as const, color: colors.cyan },
              ].map((a, i) => (
                <TouchableOpacity key={i} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                  <MaterialCommunityIcons name={a.icon} size={20} color={a.color} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={handlePost}
                style={[styles.postBtn, { backgroundColor: postText.trim() ? colors.cyan : colors.muted }]}
              >
                <Ionicons name="send" size={14} color={postText.trim() ? colors.background : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </GlowCard>

          {/* Feed */}
          {posts.map((post, idx) => (
            <GlowCard key={idx} glowColor={post.color} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={[styles.postAvatar, { backgroundColor: post.color + "20", borderColor: post.color }]}>
                  <Text style={[styles.postAvatarInitial, { color: post.color }]}>{post.user[0]}</Text>
                </View>
                <View style={styles.postMeta}>
                  <Text style={[styles.postUser, { color: post.color }]}>{post.user}</Text>
                  <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{post.time}</Text>
                </View>
                <MaterialCommunityIcons name={post.icon} size={18} color={post.color + "88"} />
              </View>
              <Text style={[styles.postContent, { color: colors.foreground }]}>{post.content}</Text>
              <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity onPress={() => handleLike(idx)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name={likes[idx] ? "heart" : "heart-outline"} size={18} color={likes[idx] ? colors.pink : colors.mutedForeground} />
                  <Text style={[styles.actionCount, { color: likes[idx] ? colors.pink : colors.mutedForeground }]}>
                    {(post.likes || 0) + (likes[idx] ? 1 : 0)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="comment-outline" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{post.comments || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="cube-scan" size={18} color={colors.purple} />
                  <Text style={[styles.actionCount, { color: colors.purple }]}>AR</Text>
                </TouchableOpacity>
              </View>
            </GlowCard>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  avatarList: { marginBottom: 16 },
  avatarWrap: { alignItems: "center", marginRight: 14, width: 62 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 20, fontFamily: "Inter_700Bold" },
  onlineDot: { width: 10, height: 10, borderRadius: 5, position: "absolute", top: 0, right: 4 },
  avatarName: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 4, textAlign: "center" },
  avatarStatus: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16, padding: 4, borderRadius: 12, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 12 },
  roomCard: { marginBottom: 14 },
  roomHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  roomIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  roomType: { fontSize: 12, fontFamily: "Inter_500Medium" },
  roomRight: { alignItems: "flex-end", gap: 6 },
  roomMembersRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  roomMembers: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  videoPreview: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  videoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 },
  videoTile: { width: 60, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  roomControls: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 8 },
  roomControl: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  joinedText: { textAlign: "center", fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  joinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  joinBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  composerCard: { marginBottom: 16, gap: 10 },
  input: { fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 48, maxHeight: 120 },
  composerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  postBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginLeft: "auto" as any },
  postCard: { marginBottom: 14 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  postAvatarInitial: { fontSize: 16, fontFamily: "Inter_700Bold" },
  postMeta: { flex: 1 },
  postUser: { fontSize: 14, fontFamily: "Inter_700Bold" },
  postTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  postContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  postActions: { flexDirection: "row", gap: 20, paddingTop: 10, borderTopWidth: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
