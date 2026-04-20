import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowCard } from "@/components/GlowCard";
import { NFTCard } from "@/components/NFTCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const NFTS = [
  { name: "Speed Demon", rarity: "Epic" as const, xp: 500, icon: "speedometer" as const, earned: true },
  { name: "Night Owl", rarity: "Rare" as const, xp: 250, icon: "moon-waning-crescent" as const, earned: true },
  { name: "Crypto King", rarity: "Legendary" as const, xp: 1000, icon: "crown" as const, earned: false },
  { name: "Iron Will", rarity: "Common" as const, xp: 100, icon: "dumbbell" as const, earned: false },
  { name: "Neural Node", rarity: "Epic" as const, xp: 500, icon: "brain" as const, earned: true },
  { name: "Grid Ghost", rarity: "Rare" as const, xp: 300, icon: "ghost" as const, earned: true },
];

const LEADERBOARD = [
  { rank: 1, name: "QuantumX", tokens: 48200, change: "+12%", icon: "crown" as const, color: "#ffb800" },
  { rank: 2, name: "CyberN8", tokens: 38400, change: "+8%", icon: "medal" as const, color: "#a0b4cc" },
  { rank: 3, name: "NovaStar", tokens: 31000, change: "+15%", icon: "medal-outline" as const, color: "#cd7f32" },
  { rank: 4, name: "ArcLight", tokens: 27800, change: "-2%", icon: "chevron-down-circle" as const, color: "#6a8aaa" },
  { rank: 5, name: "Neural Runner", tokens: 24680, change: "+4%", icon: "account-circle" as const, color: "#00d4ff" },
];

const MARKETPLACE = [
  { name: "AR City Map", price: 480, icon: "map" as const, seller: "QuantumX", rarity: "Rare" as const, timeLeft: "2h" },
  { name: "Neural Skin", price: 1200, icon: "robot-outline" as const, seller: "CyberN8", rarity: "Epic" as const, timeLeft: "4h" },
  { name: "Time Crystal", price: 3400, icon: "diamond-stone" as const, seller: "NovaStar", rarity: "Legendary" as const, timeLeft: "12h" },
  { name: "Geo Shield", price: 280, icon: "shield-star" as const, seller: "ArcLight", rarity: "Common" as const, timeLeft: "1d" },
];

const SEASONAL = [
  { name: "Spring Circuit", progress: 68, reward: "500 HV + Epic NFT", days: 12, color: "#00ff9d" },
  { name: "City Raid Season", progress: 42, reward: "Legendary NFT", days: 28, color: "#ffb800" },
];

export default function BlockchainScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, addXP } = useApp();
  const [staked, setStaked] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleStake = () => {
    if (!staked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStaked(true);
      setStakedAmount(500);
      addXP(200);
    }
  };

  const rarityColors: Record<string, string> = {
    Common: "#a0b4cc", Rare: "#00d4ff", Epic: "#7c3aed", Legendary: "#ffb800",
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
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>BLOCKCHAIN</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>Decentralized economy & identity</Text>

      {/* Token wallet */}
      <LinearGradient
        colors={["#16110a", "#0f0c18", "#080e18"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.walletCard, { borderColor: colors.warning + "33" }]}
      >
        <View style={[styles.walletGlow, { backgroundColor: colors.warning }]} />
        <View style={styles.walletTop}>
          <View>
            <Text style={[styles.walletLabel, { color: colors.mutedForeground }]}>HV TOKEN BALANCE</Text>
            <Text style={[styles.tokenBalance, { color: colors.foreground }]}>
              {user.tokens.toLocaleString()}
            </Text>
            <Text style={[styles.tokenUSD, { color: colors.mutedForeground }]}>≈ $8,241 USD</Text>
          </View>
          <View style={styles.walletBadge}>
            <MaterialCommunityIcons name="hexagon-outline" size={32} color={colors.warning} />
          </View>
        </View>

        {staked && (
          <View style={[styles.stakedBanner, { backgroundColor: colors.green + "15", borderColor: colors.green + "33" }]}>
            <MaterialCommunityIcons name="safe" size={14} color={colors.green} />
            <Text style={[styles.stakedText, { color: colors.green }]}>{stakedAmount} tokens staked · 8% APY</Text>
          </View>
        )}

        <View style={styles.tokenActions}>
          <TouchableOpacity
            onPress={handleStake}
            style={[styles.actionBtn, { backgroundColor: staked ? colors.green + "20" : colors.warning + "20", borderColor: staked ? colors.green : colors.warning }]}
          >
            <MaterialCommunityIcons name={staked ? "check-circle" : "safe"} size={15} color={staked ? colors.green : colors.warning} />
            <Text style={[styles.actionBtnText, { color: staked ? colors.green : colors.warning }]}>
              {staked ? "STAKED" : "STAKE"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={[styles.actionBtn, { backgroundColor: colors.cyan + "20", borderColor: colors.cyan }]}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={15} color={colors.cyan} />
            <Text style={[styles.actionBtnText, { color: colors.cyan }]}>SWAP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={[styles.actionBtn, { backgroundColor: colors.purple + "20", borderColor: colors.purple }]}
          >
            <MaterialCommunityIcons name="send" size={15} color={colors.purple} />
            <Text style={[styles.actionBtnText, { color: colors.purple }]}>SEND</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={[styles.actionBtn, { backgroundColor: colors.green + "20", borderColor: colors.green }]}
          >
            <MaterialCommunityIcons name="arrow-down" size={15} color={colors.green} />
            <Text style={[styles.actionBtnText, { color: colors.green }]}>RECEIVE</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* DID Identity */}
      <GlowCard glowColor={colors.cyan} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="fingerprint" size={16} color={colors.cyan} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>DECENTRALIZED IDENTITY</Text>
        </View>
        <View style={styles.didRow}>
          <View style={[styles.didAvatar, { backgroundColor: colors.cyan + "22", borderColor: colors.cyan }]}>
            <MaterialCommunityIcons name="account-circle" size={28} color={colors.cyan} />
          </View>
          <View style={styles.didInfo}>
            <Text style={[styles.didName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.didAddress, { color: colors.cyan }]}>did:hv:0x4f9a...c2b8</Text>
            <View style={[styles.didVerified, { backgroundColor: colors.green + "15" }]}>
              <MaterialCommunityIcons name="check-decagram" size={12} color={colors.green} />
              <Text style={[styles.didVerifiedText, { color: colors.green }]}>Verified Identity</Text>
            </View>
          </View>
        </View>
        <View style={styles.didStats}>
          {[
            { val: String(user.nfts), label: "NFTs Owned", color: colors.purple },
            { val: String(user.level), label: "Trust Level", color: colors.cyan },
            { val: "284d", label: "Age", color: colors.warning },
            { val: "A+", label: "Rep Score", color: colors.green },
          ].map((s, i) => (
            <View key={i} style={styles.didStat}>
              <Text style={[styles.didStatVal, { color: s.color }]}>{s.val}</Text>
              <Text style={[styles.didStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </GlowCard>

      {/* Seasonal challenges */}
      <GlowCard glowColor={colors.green} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="trophy-award" size={16} color={colors.green} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>SEASONAL CHALLENGES</Text>
        </View>
        {SEASONAL.map((ch, i) => (
          <View key={i} style={[styles.seasonItem, { borderBottomColor: colors.border, borderBottomWidth: i < SEASONAL.length - 1 ? 1 : 0 }]}>
            <View style={styles.seasonHeader}>
              <Text style={[styles.seasonName, { color: colors.foreground }]}>{ch.name}</Text>
              <Text style={[styles.seasonDays, { color: colors.mutedForeground }]}>{ch.days}d left</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { backgroundColor: ch.color, width: `${ch.progress}%` as any }, Platform.OS === "web" ? ({ boxShadow: `0 0 8px ${ch.color}88` } as any) : { shadowColor: ch.color, shadowOpacity: 0.6, shadowRadius: 6 }]} />
            </View>
            <View style={styles.seasonFooter}>
              <Text style={[styles.seasonProgress, { color: ch.color }]}>{ch.progress}%</Text>
              <Text style={[styles.seasonReward, { color: colors.mutedForeground }]}>🎁 {ch.reward}</Text>
            </View>
          </View>
        ))}
      </GlowCard>

      {/* NFT Collection */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NFT ACHIEVEMENTS</Text>
      <FlatList
        data={NFTS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        style={styles.nftList}
        renderItem={({ item }) => <NFTCard {...item} />}
      />

      {/* Marketplace */}
      <GlowCard glowColor={colors.pink} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="store" size={16} color={colors.pink} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>MARKETPLACE</Text>
          <Text style={[styles.liveTag, { color: colors.green, borderColor: colors.green + "44", backgroundColor: colors.green + "12" }]}>LIVE</Text>
        </View>
        {MARKETPLACE.map((item, i) => {
          const rc = rarityColors[item.rarity];
          return (
            <TouchableOpacity key={i} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <View style={[styles.marketRow, { borderBottomColor: colors.border, borderBottomWidth: i < MARKETPLACE.length - 1 ? 1 : 0 }]}>
                <View style={[styles.marketIcon, { backgroundColor: rc + "20" }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={rc} />
                </View>
                <View style={styles.marketInfo}>
                  <Text style={[styles.marketName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.marketSeller, { color: colors.mutedForeground }]}>by {item.seller} · {item.timeLeft} left</Text>
                </View>
                <View style={styles.marketRight}>
                  <View style={styles.priceRow}>
                    <MaterialCommunityIcons name="hexagon-outline" size={11} color={colors.warning} />
                    <Text style={[styles.marketPrice, { color: colors.warning }]}>{item.price}</Text>
                  </View>
                  <View style={[styles.rarityBadge, { backgroundColor: rc + "20" }]}>
                    <Text style={[styles.rarityText, { color: rc }]}>{item.rarity}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </GlowCard>

      {/* Leaderboard */}
      <GlowCard glowColor={colors.warning} style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="trophy" size={16} color={colors.warning} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>GLOBAL LEADERBOARD</Text>
        </View>
        {LEADERBOARD.map((entry, i) => {
          const rankColors = [colors.warning, "#a0b4cc", "#cd7f32", colors.mutedForeground, colors.cyan];
          const isMe = entry.name === "Neural Runner";
          return (
            <View
              key={i}
              style={[
                styles.leaderRow,
                {
                  backgroundColor: isMe ? colors.cyan + "12" : "transparent",
                  borderRadius: 10,
                  borderBottomColor: colors.border,
                  borderBottomWidth: i < LEADERBOARD.length - 1 ? 1 : 0,
                },
              ]}
            >
              <MaterialCommunityIcons name={entry.icon} size={18} color={rankColors[i]} />
              <Text style={[styles.leaderName, { color: isMe ? colors.cyan : colors.foreground, fontFamily: isMe ? "Inter_700Bold" : "Inter_500Medium" }]}>
                {entry.name}{isMe ? " (YOU)" : ""}
              </Text>
              <View style={styles.leaderRight}>
                <Text style={[styles.leaderTokens, { color: colors.warning }]}>
                  {entry.tokens.toLocaleString()}
                </Text>
                <Text style={[styles.leaderChange, { color: entry.change.startsWith("+") ? colors.green : colors.pink }]}>
                  {entry.change}
                </Text>
              </View>
            </View>
          );
        })}
      </GlowCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 2 },
  screenSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 16 },
  walletCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16, overflow: "hidden" },
  walletGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, top: -80, right: -40, opacity: 0.04 },
  walletTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  walletLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 4 },
  tokenBalance: { fontSize: 44, fontFamily: "Inter_700Bold" },
  tokenUSD: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  walletBadge: { opacity: 0.6 },
  stakedBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  stakedText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  tokenActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  actionBtnText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2, flex: 1 },
  liveTag: { fontSize: 10, fontFamily: "Inter_700Bold", borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  didRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  didAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  didInfo: { flex: 1, gap: 4 },
  didName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  didAddress: { fontSize: 12, fontFamily: "Inter_400Regular" },
  didVerified: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: "flex-start" },
  didVerifiedText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  didStats: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#1a2f4a" },
  didStat: { alignItems: "center" },
  didStatVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  didStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", marginTop: 2 },
  seasonItem: { paddingVertical: 14 },
  seasonHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  seasonName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  seasonDays: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", borderRadius: 4 },
  seasonFooter: { flexDirection: "row", justifyContent: "space-between" },
  seasonProgress: { fontSize: 13, fontFamily: "Inter_700Bold" },
  seasonReward: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 12 },
  nftList: { marginBottom: 20 },
  marketRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  marketIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  marketInfo: { flex: 1 },
  marketName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  marketSeller: { fontSize: 12, fontFamily: "Inter_400Regular" },
  marketRight: { alignItems: "flex-end", gap: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  marketPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  rarityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  leaderRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 8, marginBottom: 2 },
  leaderName: { flex: 1, fontSize: 14 },
  leaderRight: { alignItems: "flex-end" },
  leaderTokens: { fontSize: 14, fontFamily: "Inter_700Bold" },
  leaderChange: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
