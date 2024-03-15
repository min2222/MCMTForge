package org.jmt.mcmt.mixin;

import java.util.Map;

import org.jmt.mcmt.asmdest.ConcurrentCollections;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;

import net.minecraft.world.entity.raid.Raid;
import net.minecraft.world.entity.raid.Raider;

@Mixin(Raid.class)
public class RaidMixin {

    @Mutable
    @Shadow
    @Final
    Map<Integer, Raider> groupToLeaderMap = ConcurrentCollections.newHashMap();
}
